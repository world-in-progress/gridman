interface MultiGridRenderInfo {
  levels: Uint8Array;
  globalIds: Uint32Array;
  vertices: Float32Array;
}

export class MultiGridInfo {
  constructor(public levels: Uint8Array, public globalIds: Uint32Array) {
    this.levels = levels;
    this.globalIds = globalIds;
  }

  static fromBuffer(buffer: ArrayBuffer): MultiGridInfo {
    const prefixView = new DataView(buffer, 0, 4);
    const uint8Length = prefixView.getUint32(0, true);
    const alignedOffset = 4 + uint8Length + ((4 - (uint8Length % 4 || 4)) % 4);

    const uint8Array = new Uint8Array(buffer, 4, uint8Length);
    const uint32Array = new Uint32Array(buffer, alignedOffset);

    return new MultiGridInfo(uint8Array, uint32Array);
  }

static async fromGetUrl(url: string): Promise<MultiGridInfo> {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 4) {
        return new MultiGridInfo(new Uint8Array(0), new Uint32Array(0));
    }
    const prefixView = new DataView(buffer, 0, 4);
    const gridNum = prefixView.getUint32(0, true);

    const alignedOffset =
    4 + gridNum + ((4 - (gridNum % 4 || 4)) % 4);

    const uint8Array = new Uint8Array(buffer, 4, gridNum);
    const uint32Array = new Uint32Array(buffer, alignedOffset);

    return new MultiGridInfo(uint8Array, uint32Array);
}

  static async fromPostUrl(url: string, data: any): Promise<MultiGridInfo> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();

      const prefixView = new DataView(buffer, 0, 4);
      const uint8Length = prefixView.getUint32(0, true);
      const alignedOffset =
        4 + uint8Length + ((4 - (uint8Length % 4 || 4)) % 4);

      const uint8Array = new Uint8Array(buffer, 4, uint8Length);
      const uint32Array = new Uint32Array(buffer, alignedOffset);

      return new MultiGridInfo(uint8Array, uint32Array);
    } catch (error) {
      console.error("Failed to fetch MultiGridInfo:", error);
      throw error;
    }
  }
}
