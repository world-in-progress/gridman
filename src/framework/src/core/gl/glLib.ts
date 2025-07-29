function errorCheck(gl: WebGL2RenderingContext) {
    const error = gl.getError()
    if (error !== gl.NO_ERROR) {
        console.error('Error happened: ', getWebGLErrorMessage(gl, error))
    }
}

function enableAllExtensions(gl: WebGL2RenderingContext) {

    const extensions = gl.getSupportedExtensions()!
    extensions.forEach(ext => {
        gl.getExtension(ext)
        console.log('Enabled extensions: ', ext)
    })
}

async function createShader(gl: WebGL2RenderingContext, url: string) {
    let shaderCode = ''
    await fetch(url)
        .then(response => response.text())
        .then(data => shaderCode += data)

    const vertexShaderStage = compileShader(gl, shaderCode, gl.VERTEX_SHADER)!
    const fragmentShaderStage = compileShader(gl, shaderCode, gl.FRAGMENT_SHADER)!

    const shader = gl.createProgram()!
    gl.attachShader(shader, vertexShaderStage)
    gl.attachShader(shader, fragmentShaderStage)
    gl.linkProgram(shader)
    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {

        console.error('An error occurred linking shader stages: ' + gl.getProgramInfoLog(shader))
    }

    return shader

    function compileShader(gl: WebGL2RenderingContext, source: string, type: number) {

        const versionDefinition = '#version 300 es\n'
        const module = gl.createShader(type)!
        if (type === gl.VERTEX_SHADER) source = versionDefinition + '#define VERTEX_SHADER\n' + source
        else if (type === gl.FRAGMENT_SHADER) source = versionDefinition + '#define FRAGMENT_SHADER\n' + source

        gl.shaderSource(module, source)
        gl.compileShader(module)
        if (!gl.getShaderParameter(module, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shader module: ' + gl.getShaderInfoLog(module))
            gl.deleteShader(module)
            return null
        }

        return module
    }
}

function createArrayBuffer(gl: WebGL2RenderingContext, dataOrSize: ArrayBuffer | ArrayBufferView | number, usage: number = gl.STATIC_DRAW) {

    const buffer = gl.createBuffer()
    if (!buffer) {
        console.error('Failed to create buffer')
        return null
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    if (typeof dataOrSize === 'number')
        gl.bufferData(gl.ARRAY_BUFFER, dataOrSize, usage)
    else
        gl.bufferData(gl.ARRAY_BUFFER, dataOrSize, usage)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return buffer
}

function createIndexBuffer(gl: WebGL2RenderingContext, indexArray: ArrayBufferView, usage: number = gl.STATIC_DRAW, offset: number = 0) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, usage, offset, indexArray.byteLength / 2 - offset);
    return indexBuffer;
}

function updateArrayBufferByArray(gl: WebGL2RenderingContext, buffer: WebGLBuffer, array: ArrayBufferView, bufferOffset: number = 0, arrayOffset: number = 0, length?: number) {

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    gl.bufferSubData(gl.ARRAY_BUFFER, bufferOffset, array, arrayOffset, length ? length : array.byteLength - arrayOffset)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
}

function createFrameBuffer(gl: WebGL2RenderingContext, textures: WebGLTexture[], depthTexture?: WebGLTexture, renderBuffer?: WebGLRenderbuffer) {

    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

    textures?.forEach((texture, index) => {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + index, gl.TEXTURE_2D, texture, 0)
    })

    if (depthTexture) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0)
    }

    if (renderBuffer) {

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderBuffer)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {

        console.error('Framebuffer is not complete')
    }

    return frameBuffer
}

function createTexture2D(gl: WebGL2RenderingContext, level: number, width: number, height: number, internalFormat: number, format: number, type: number, resource?: ArrayBufferView | ImageBitmap, generateMips = false): WebGLTexture {

    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, generateMips ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    if (resource) {
        resource instanceof ImageBitmap
            ? gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, 0, format!, type!, resource)
            : gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, 0, format!, type!, resource)
    }
    else {
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, 0, format, type, null)
    }

    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
}

function createTexture2DArray(gl: WebGL2RenderingContext, level: number, layers: number, width: number, height: number, internalFormat: number): WebGLTexture {

    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture)
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, level, internalFormat, width, height, layers)

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    return texture
}

function fillSubTexture2DByArray(gl: WebGL2RenderingContext, texture: WebGLTexture, level: number, xOffset: number, yOffset: number, width: number, height: number, format: number, type: number, array: ArrayBufferView, srcOffset = 0): void {

    // Bind the texture
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Upload texture data
    gl.texSubImage2D(gl.TEXTURE_2D, level, xOffset, yOffset, width, height, format, type, array, srcOffset)

    // Unbind the texture
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function fillSubTexture2DArrayByArray(gl: WebGL2RenderingContext, texture: WebGLTexture, level: number, xOffset: number, yOffset: number, zOffset: number, width: number, height: number, depth: number, format: number, type: number, array: ArrayBufferView, srcOffset = 0): void {

    // Bind the texture
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture)

    // Upload texture data
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, level, xOffset, yOffset, zOffset, width, height, depth, format, type, array, srcOffset)

    // Unbind the texture
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
}

function fillTexture2DByArray(gl: WebGL2RenderingContext, texture: WebGLTexture, width: number, height: number, internalFormat: number, format: number, type: number, array: ArrayBufferView): void {

    // Bind the texture
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Upload texture data
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, array)

    // Unbind the texture
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function createRenderBuffer(gl: WebGL2RenderingContext, width: number, height: number): WebGLRenderbuffer {

    const bufferWidth = width || gl.canvas.width * window.devicePixelRatio
    const bufferHeight = height || gl.canvas.height * window.devicePixelRatio

    const renderBuffer = gl.createRenderbuffer()!
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, bufferWidth, bufferHeight)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)

    return renderBuffer
}

// Helper function to get WebGL error messages
function getWebGLErrorMessage(gl: WebGL2RenderingContext, error: number) {
    switch (error) {
        case gl.NO_ERROR:
            return 'NO_ERROR'
        case gl.INVALID_ENUM:
            return 'INVALID_ENUM'
        case gl.INVALID_VALUE:
            return 'INVALID_VALUE'
        case gl.INVALID_OPERATION:
            return 'INVALID_OPERATION'
        case gl.OUT_OF_MEMORY:
            return 'OUT_OF_MEMORY'
        case gl.CONTEXT_LOST_WEBGL:
            return 'CONTEXT_LOST_WEBGL'
        default:
            return 'UNKNOWN_ERROR'
    }
}

async function loadImage(url: string) {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const blob = await response.blob()
        const imageBitmap = await createImageBitmap(blob, { imageOrientation: "flipY", premultiplyAlpha: "none", colorSpaceConversion: "default" })
        return imageBitmap

    } catch (error) {
        console.error(`Error loading image (url: ${url})`, error)
        throw error
    }
}

function getMaxMipLevel(width: number, height: number) {
    return Math.floor(Math.log2(Math.max(width, height)));
}

async function loadF32Image(url: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob, { imageOrientation: "flipY", premultiplyAlpha: "none", colorSpaceConversion: "default" })
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const gl = canvas.getContext("webgl2")!
    const pixelData = new Uint8Array(bitmap.width * bitmap.height * 4)

    // Create texture
    const oTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, oTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, bitmap.width, bitmap.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, bitmap)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

    // Create framebuffer
    const FBO = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, oTexture, 0)

    // Read pixels
    gl.readPixels(0, 0, bitmap.width, bitmap.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)

    // Release objects
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.deleteFramebuffer(FBO)
    gl.deleteTexture(oTexture)
    gl.finish()

    return {
        width: bitmap.width,
        height: bitmap.height,
        buffer: new Float32Array(pixelData.buffer)
    }
}

const gll = {
    loadImage,
    errorCheck,
    loadF32Image,
    createShader,
    getMaxMipLevel,
    createTexture2D,
    createArrayBuffer,
    createIndexBuffer,
    createFrameBuffer,
    createRenderBuffer,
    enableAllExtensions,
    createTexture2DArray,
    getWebGLErrorMessage,
    fillTexture2DByArray,
    fillSubTexture2DByArray,
    updateArrayBufferByArray,
    fillSubTexture2DArrayByArray
}

export default gll
