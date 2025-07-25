import { Vector3, FileLoader, Loader, LoadingManager, Quaternion, MathUtils } from 'three';
import { GaussianSplattingMesh } from '../GaussianSplattingMesh';
import { createYieldingScheduler, runCoroutineAsync } from '../../utils/coroutine';

// @internal
const unpackUnorm = (value: number, bits: number) => {
    const t = (1 << bits) - 1;
    return (value & t) / t;
};

// @internal
const unpack111011 = (value: number, result: Vector3) => {
    result.x = unpackUnorm(value >>> 21, 11);
    result.y = unpackUnorm(value >>> 11, 10);
    result.z = unpackUnorm(value, 11);
};

// @internal
const unpack8888 = (value: number, result: Uint8ClampedArray) => {
    result[0] = unpackUnorm(value >>> 24, 8) * 255;
    result[1] = unpackUnorm(value >>> 16, 8) * 255;
    result[2] = unpackUnorm(value >>> 8, 8) * 255;
    result[3] = unpackUnorm(value, 8) * 255;
};

// @internal
// unpack quaternion with 2,10,10,10 format (largest element, 3x10bit element)
const unpackRot = (value: number, result: Quaternion) => {
    const norm = 1.0 / (Math.sqrt(2) * 0.5);
    const a = (unpackUnorm(value >>> 20, 10) - 0.5) * norm;
    const b = (unpackUnorm(value >>> 10, 10) - 0.5) * norm;
    const c = (unpackUnorm(value, 10) - 0.5) * norm;
    const m = Math.sqrt(1.0 - (a * a + b * b + c * c));

    switch (value >>> 30) {
        case 0:
            result.set(m, a, b, c);
            break;
        case 1:
            result.set(a, m, b, c);
            break;
        case 2:
            result.set(a, b, m, c);
            break;
        case 3:
            result.set(a, b, c, m);
            break;
    }
};

// @internal
interface CompressedPLYChunk {
    min: Vector3;
    max: Vector3;
    minScale: Vector3;
    maxScale: Vector3;
}

/**
 * Representation of the types
 */
const enum PLYType {
    FLOAT,
    INT,
    UINT,
    DOUBLE,
    UCHAR,
    UNDEFINED,
}

/**
 * Usage types of the PLY values
 */
const enum PLYValue {
    MIN_X,
    MIN_Y,
    MIN_Z,
    MAX_X,
    MAX_Y,
    MAX_Z,

    MIN_SCALE_X,
    MIN_SCALE_Y,
    MIN_SCALE_Z,

    MAX_SCALE_X,
    MAX_SCALE_Y,
    MAX_SCALE_Z,

    PACKED_POSITION,
    PACKED_ROTATION,
    PACKED_SCALE,
    PACKED_COLOR,
    X,
    Y,
    Z,
    SCALE_0,
    SCALE_1,
    SCALE_2,

    DIFFUSE_RED,
    DIFFUSE_GREEN,
    DIFFUSE_BLUE,
    OPACITY,

    F_DC_0,
    F_DC_1,
    F_DC_2,
    F_DC_3,

    ROT_0,
    ROT_1,
    ROT_2,
    ROT_3,

    UNDEFINED,
}

/**
 * Property field found in PLY header
 */
export type PlyProperty = {
    /**
     * Value usage
     */
    value: PLYValue;
    /**
     * Value type
     */
    type: PLYType;
    /**
     * offset in byte from te beginning of the splat
     */
    offset: number;
};

/**
 * meta info on Splat file
 */
export interface PLYHeader {
    /**
     * number of splats
     */
    vertexCount: number;
    /**
     * number of spatial chunks for compressed ply
     */
    chunkCount: number;
    /**
     * length in bytes of the vertex info
     */
    rowVertexLength: number;
    /**
     * length in bytes of the chunk
     */
    rowChunkLength: number;
    /**
     * array listing properties per vertex
     */
    vertexProperties: PlyProperty[];
    /**
     * array listing properties per chunk
     */
    chunkProperties: PlyProperty[];
    /**
     * data view for parsing chunks and vertices
     */
    dataView: DataView;
    /**
     * buffer for the data view
     */
    buffer: ArrayBuffer;
}

class PlySplatLoader extends Loader {
    private static _RowOutputLength = 3 * 4 + 3 * 4 + 4 + 4; // Vector3 position, Vector3 scale, 1 u8 quaternion, 1 color with alpha
    private static _SH_C0 = 0.28209479177387814;
    // batch size between 2 yield calls. This value is a tradeoff between updates overhead and framerate hiccups
    // This step is faster the PLY conversion. So batch size can be bigger
    private static _SplatBatchSize = 327680;
    // batch size between 2 yield calls during the PLY to splat conversion.
    private static _PlyConversionBatchSize = 32768;

    constructor(manager?: LoadingManager) {
        super(manager);
    }

    override load(url: string, onLoad: (data: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void {
        const loader = new FileLoader(this.manager);

        loader.setPath(this.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(this.requestHeader);
        loader.setWithCredentials(this.withCredentials);

        loader.load(
            url,
            (buffer) => {
                this.parse(buffer, onLoad, onError);
            },
            onProgress,
            onError,
        );
    }

    parse(plyBuffer, onLoad, onError) {
        PlySplatLoader.ConvertPLYToSplatAsync(plyBuffer)
            .then((splatsData: ArrayBuffer) => {
                const gaussianSplattingMesh = new GaussianSplattingMesh();
                gaussianSplattingMesh.loadDataAsync(splatsData).then(() => {
                    onLoad(gaussianSplattingMesh);
                });
            })
            .catch((error) => {
                if (onError) {
                    onError(error);
                } else {
                    console.error(error);
                }
            });
    }

    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @returns the loaded splat buffer
     */
    public static async ConvertPLYToSplatAsync(data: ArrayBuffer) {
        return runCoroutineAsync(PlySplatLoader.ConvertPLYToSplat(data, true), createYieldingScheduler());
    }

    /**
     * Converts a .ply data array buffer to splat
     * if data array buffer is not ply, returns the original buffer
     * @param data the .ply data to load
     * @param useCoroutine use coroutine and yield
     * @returns the loaded splat buffer
     */
    public static *ConvertPLYToSplat(data: ArrayBuffer, useCoroutine = false) {
        const header = PlySplatLoader.ParseHeader(data);
        if (!header) {
            return data;
        }

        const offset = { value: 0 };
        const compressedChunks = PlySplatLoader._GetCompressedChunks(header, offset);

        for (let i = 0; i < header.vertexCount; i++) {
            PlySplatLoader._GetSplat(header, i, compressedChunks, offset);
            if (i % PlySplatLoader._PlyConversionBatchSize === 0 && useCoroutine) {
                yield;
            }
        }

        return header.buffer;
    }

    private static _GetCompressedChunks(header: PLYHeader, offset: { value: number }): Array<CompressedPLYChunk> | null {
        if (!header.chunkCount) {
            return null;
        }
        const dataView = header.dataView;
        const compressedChunks = new Array<CompressedPLYChunk>(header.chunkCount);
        for (let i = 0; i < header.chunkCount; i++) {
            const currentChunk = {
                min: new Vector3(),
                max: new Vector3(),
                minScale: new Vector3(),
                maxScale: new Vector3(),
            };
            compressedChunks[i] = currentChunk;
            for (let propertyIndex = 0; propertyIndex < header.chunkProperties.length; propertyIndex++) {
                const property = header.chunkProperties[propertyIndex];
                let value;
                switch (property.type) {
                    case PLYType.FLOAT:
                        value = dataView.getFloat32(property.offset + offset.value, true);
                        break;
                    default:
                        continue;
                }

                switch (property.value) {
                    case PLYValue.MIN_X:
                        currentChunk.min.x = value;
                        break;
                    case PLYValue.MIN_Y:
                        currentChunk.min.y = value;
                        break;
                    case PLYValue.MIN_Z:
                        currentChunk.min.z = value;
                        break;
                    case PLYValue.MAX_X:
                        currentChunk.max.x = value;
                        break;
                    case PLYValue.MAX_Y:
                        currentChunk.max.y = value;
                        break;
                    case PLYValue.MAX_Z:
                        currentChunk.max.z = value;
                        break;
                    case PLYValue.MIN_SCALE_X:
                        currentChunk.minScale.x = value;
                        break;
                    case PLYValue.MIN_SCALE_Y:
                        currentChunk.minScale.y = value;
                        break;
                    case PLYValue.MIN_SCALE_Z:
                        currentChunk.minScale.z = value;
                        break;
                    case PLYValue.MAX_SCALE_X:
                        currentChunk.maxScale.x = value;
                        break;
                    case PLYValue.MAX_SCALE_Y:
                        currentChunk.maxScale.y = value;
                        break;
                    case PLYValue.MAX_SCALE_Z:
                        currentChunk.maxScale.z = value;
                        break;
                }
            }
            offset.value += header.rowChunkLength;
        }
        return compressedChunks;
    }

    private static _GetSplat(header: PLYHeader, index: number, compressedChunks: Array<CompressedPLYChunk> | null, offset: { value: number }): void {
        const q = new Quaternion();
        const temp3 = new Vector3();

        const rowOutputLength = PlySplatLoader._RowOutputLength;
        const buffer = header.buffer;
        const dataView = header.dataView;
        const position = new Float32Array(buffer, index * rowOutputLength, 3);
        const scale = new Float32Array(buffer, index * rowOutputLength + 12, 3);
        const rgba = new Uint8ClampedArray(buffer, index * rowOutputLength + 24, 4);
        const rot = new Uint8ClampedArray(buffer, index * rowOutputLength + 28, 4);
        const chunkIndex = index >> 8;
        let r0: number = 255;
        let r1: number = 0;
        let r2: number = 0;
        let r3: number = 0;

        for (let propertyIndex = 0; propertyIndex < header.vertexProperties.length; propertyIndex++) {
            const property = header.vertexProperties[propertyIndex];
            let value;
            switch (property.type) {
                case PLYType.FLOAT:
                    value = dataView.getFloat32(offset.value + property.offset, true);
                    break;
                case PLYType.INT:
                    value = dataView.getInt32(offset.value + property.offset, true);
                    break;
                case PLYType.UINT:
                    value = dataView.getUint32(offset.value + property.offset, true);
                    break;
                case PLYType.DOUBLE:
                    value = dataView.getFloat64(offset.value + property.offset, true);
                    break;
                case PLYType.UCHAR:
                    value = dataView.getUint8(offset.value + property.offset);
                    break;
                default:
                    continue;
            }

            switch (property.value) {
                case PLYValue.PACKED_POSITION:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        unpack111011(value, temp3);
                        position[0] = MathUtils.lerp(compressedChunk.min.x, compressedChunk.max.x, temp3.x);
                        position[1] = -MathUtils.lerp(compressedChunk.min.y, compressedChunk.max.y, temp3.y);
                        position[2] = MathUtils.lerp(compressedChunk.min.z, compressedChunk.max.z, temp3.z);
                    }
                    break;
                case PLYValue.PACKED_ROTATION:
                    {
                        unpackRot(value, q);
                        r0 = q.w;
                        r1 = q.z;
                        r2 = q.y;
                        r3 = q.x;
                    }
                    break;
                case PLYValue.PACKED_SCALE:
                    {
                        const compressedChunk = compressedChunks![chunkIndex];
                        unpack111011(value, temp3);
                        scale[0] = Math.exp(MathUtils.lerp(compressedChunk.minScale.x, compressedChunk.maxScale.x, temp3.x));
                        scale[1] = Math.exp(MathUtils.lerp(compressedChunk.minScale.y, compressedChunk.maxScale.y, temp3.y));
                        scale[2] = Math.exp(MathUtils.lerp(compressedChunk.minScale.z, compressedChunk.maxScale.z, temp3.z));
                    }
                    break;
                case PLYValue.PACKED_COLOR:
                    unpack8888(value, rgba);
                    break;
                case PLYValue.X:
                    position[0] = value;
                    break;
                case PLYValue.Y:
                    position[1] = value;
                    break;
                case PLYValue.Z:
                    position[2] = value;
                    break;
                case PLYValue.SCALE_0:
                    scale[0] = Math.exp(value);
                    break;
                case PLYValue.SCALE_1:
                    scale[1] = Math.exp(value);
                    break;
                case PLYValue.SCALE_2:
                    scale[2] = Math.exp(value);
                    break;
                case PLYValue.DIFFUSE_RED:
                    rgba[0] = value;
                    break;
                case PLYValue.DIFFUSE_GREEN:
                    rgba[1] = value;
                    break;
                case PLYValue.DIFFUSE_BLUE:
                    rgba[2] = value;
                    break;
                case PLYValue.F_DC_0:
                    rgba[0] = (0.5 + PlySplatLoader._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_1:
                    rgba[1] = (0.5 + PlySplatLoader._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_2:
                    rgba[2] = (0.5 + PlySplatLoader._SH_C0 * value) * 255;
                    break;
                case PLYValue.F_DC_3:
                    rgba[3] = (0.5 + PlySplatLoader._SH_C0 * value) * 255;
                    break;
                case PLYValue.OPACITY:
                    rgba[3] = (1 / (1 + Math.exp(-value))) * 255;
                    break;
                case PLYValue.ROT_0:
                    r0 = value;
                    break;
                case PLYValue.ROT_1:
                    r1 = value;
                    break;
                case PLYValue.ROT_2:
                    r2 = value;
                    break;
                case PLYValue.ROT_3:
                    r3 = value;
                    break;
            }
        }

        q.set(r1, r2, r3, r0);
        q.normalize();
        rot[0] = q.w * 128 + 128;
        rot[1] = q.x * 128 + 128;
        rot[2] = q.y * 128 + 128;
        rot[3] = q.z * 128 + 128;
        offset.value += header.rowVertexLength;
    }

    private static _TypeNameToEnum(name: string): PLYType {
        switch (name) {
            case 'float':
                return PLYType.FLOAT;
            case 'int':
                return PLYType.INT;
                break;
            case 'uint':
                return PLYType.UINT;
            case 'double':
                return PLYType.DOUBLE;
            case 'uchar':
                return PLYType.UCHAR;
        }
        return PLYType.UNDEFINED;
    }

    private static _ValueNameToEnum(name: string): PLYValue {
        switch (name) {
            case 'min_x':
                return PLYValue.MIN_X;
            case 'min_y':
                return PLYValue.MIN_Y;
            case 'min_z':
                return PLYValue.MIN_Z;
            case 'max_x':
                return PLYValue.MAX_X;
            case 'max_y':
                return PLYValue.MAX_Y;
            case 'max_z':
                return PLYValue.MAX_Z;
            case 'min_scale_x':
                return PLYValue.MIN_SCALE_X;
            case 'min_scale_y':
                return PLYValue.MIN_SCALE_Y;
            case 'min_scale_z':
                return PLYValue.MIN_SCALE_Z;
            case 'max_scale_x':
                return PLYValue.MAX_SCALE_X;
            case 'max_scale_y':
                return PLYValue.MAX_SCALE_Y;
            case 'max_scale_z':
                return PLYValue.MAX_SCALE_Z;
            case 'packed_position':
                return PLYValue.PACKED_POSITION;
            case 'packed_rotation':
                return PLYValue.PACKED_ROTATION;
            case 'packed_scale':
                return PLYValue.PACKED_SCALE;
            case 'packed_color':
                return PLYValue.PACKED_COLOR;
            case 'x':
                return PLYValue.X;
            case 'y':
                return PLYValue.Y;
            case 'z':
                return PLYValue.Z;
            case 'scale_0':
                return PLYValue.SCALE_0;
            case 'scale_1':
                return PLYValue.SCALE_1;
            case 'scale_2':
                return PLYValue.SCALE_2;
            case 'diffuse_red':
            case 'red':
                return PLYValue.DIFFUSE_RED;
            case 'diffuse_green':
            case 'green':
                return PLYValue.DIFFUSE_GREEN;
            case 'diffuse_blue':
            case 'blue':
                return PLYValue.DIFFUSE_BLUE;
            case 'f_dc_0':
                return PLYValue.F_DC_0;
            case 'f_dc_1':
                return PLYValue.F_DC_1;
            case 'f_dc_2':
                return PLYValue.F_DC_2;
            case 'f_dc_3':
                return PLYValue.F_DC_3;
            case 'opacity':
                return PLYValue.OPACITY;
            case 'rot_0':
                return PLYValue.ROT_0;
            case 'rot_1':
                return PLYValue.ROT_1;
            case 'rot_2':
                return PLYValue.ROT_2;
            case 'rot_3':
                return PLYValue.ROT_3;
        }

        return PLYValue.UNDEFINED;
    }
    /**
     * Parse a PLY file header and returns metas infos on splats and chunks
     * @param data the loaded buffer
     * @returns a PLYHeader
     */
    static ParseHeader(data: ArrayBuffer): PLYHeader | null {
        const ubuf = new Uint8Array(data);
        const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
        const headerEnd = 'end_header\n';
        const headerEndIndex = header.indexOf(headerEnd);
        if (headerEndIndex < 0 || !header) {
            // standard splat
            return null;
        }
        const vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)![1]);
        const chunkElement = /element chunk (\d+)\n/.exec(header);
        let chunkCount = 0;
        if (chunkElement) {
            chunkCount = parseInt(chunkElement[1]);
        }
        let rowVertexOffset = 0;
        let rowChunkOffset = 0;
        const offsets: Record<string, number> = {
            double: 8,
            int: 4,
            uint: 4,
            float: 4,
            short: 2,
            ushort: 2,
            uchar: 1,
            list: 0,
        };

        const enum ElementMode {
            Vertex = 0,
            Chunk = 1,
        }
        let chunkMode = ElementMode.Chunk;
        const vertexProperties: PlyProperty[] = [];
        const chunkProperties: PlyProperty[] = [];
        const filtered = header.slice(0, headerEndIndex).split('\n');
        for (const prop of filtered) {
            if (prop.startsWith('property ')) {
                const [, typeName, name] = prop.split(' ');

                const value = PlySplatLoader._ValueNameToEnum(name);
                const type = PlySplatLoader._TypeNameToEnum(typeName);
                if (chunkMode == ElementMode.Chunk) {
                    chunkProperties.push({
                        value,
                        type,
                        offset: rowChunkOffset,
                    });
                    rowChunkOffset += offsets[typeName];
                } else if (chunkMode == ElementMode.Vertex) {
                    vertexProperties.push({
                        value,
                        type,
                        offset: rowVertexOffset,
                    });
                    rowVertexOffset += offsets[typeName];
                }

                if (!offsets[typeName]) {
                    // Logger.Warn(`Unsupported property type: ${typeName}.`);
                }
            } else if (prop.startsWith('element ')) {
                const [, type] = prop.split(' ');
                if (type == 'chunk') {
                    chunkMode = ElementMode.Chunk;
                } else if (type == 'vertex') {
                    chunkMode = ElementMode.Vertex;
                }
            }
        }

        const dataView = new DataView(data, headerEndIndex + headerEnd.length);
        const buffer = new ArrayBuffer(PlySplatLoader._RowOutputLength * vertexCount);

        return {
            vertexCount: vertexCount,
            chunkCount: chunkCount,
            rowVertexLength: rowVertexOffset,
            rowChunkLength: rowChunkOffset,
            vertexProperties: vertexProperties,
            chunkProperties: chunkProperties,
            dataView: dataView,
            buffer: buffer,
        };
    }
}

export { PlySplatLoader };
