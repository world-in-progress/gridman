/**
 * @param {WebGL2RenderingContext} gl 
 */
export function enableAllExtensions(gl) {

    const extensions = gl.getSupportedExtensions()
    extensions.forEach(ext => {
        gl.getExtension(ext)
        // console.log('Enabled extensions: ', ext)
    })
}

export function createVBO(gl, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    if (data instanceof Array)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    else
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

export function createIBO(gl, data, offset) {
    if (offset === void 0) { offset = 0; }
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    if (data instanceof Array)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW, offset, data.length - offset);
    else
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW, offset, data.length - offset);
    return indexBuffer;
}

/** 
 * @param {WebGL2RenderingContext} gl  
 * @param {string} url 
 */
export async function createShader(gl, url) {

    let shaderCode = ''
    await fetch(url)
        .then(response => response.text())
        .then(text => shaderCode += text)
    const vertexShaderStage = compileShader(gl, shaderCode, gl.VERTEX_SHADER)
    const fragmentShaderStage = compileShader(gl, shaderCode, gl.FRAGMENT_SHADER)

    const shader = gl.createProgram()
    gl.attachShader(shader, vertexShaderStage)
    gl.attachShader(shader, fragmentShaderStage)
    gl.linkProgram(shader)
    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {

        console.error('An error occurred linking shader stages: ' + gl.getProgramInfoLog(shader))
    }

    return shader

    function compileShader(gl, source, type) {

        const versionDefinition = '#version 300 es\n'
        const module = gl.createShader(type)
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

export function createShaderFromCode(gl, code) {

    let shaderCode = code
    const vertexShaderStage = compileShader(gl, shaderCode, gl.VERTEX_SHADER)
    const fragmentShaderStage = compileShader(gl, shaderCode, gl.FRAGMENT_SHADER)

    const shader = gl.createProgram()
    gl.attachShader(shader, vertexShaderStage)
    gl.attachShader(shader, fragmentShaderStage)
    gl.linkProgram(shader)
    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {

        console.error('An error occurred linking shader stages: ' + gl.getProgramInfoLog(shader))
    }

    return shader

    function compileShader(gl, source, type) {

        const versionDefinition = '#version 300 es\n'
        const module = gl.createShader(type)
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


/**
 * @param { WebGL2RenderingContext } gl 
 * @param { WebGLTexture[] } [ textures ] 
 * @param { WebGLRenderbuffer } [ depthTexture ] 
 * @param { WebGLRenderbuffer } [ renderBuffer ] 
 * @returns { WebGLFramebuffer }
 */
export function createFrameBuffer(gl, textures, depthTexture, renderBuffer) {

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

/**
 * @param { WebGL2RenderingContext } gl 
 * @param { number } width 
 * @param { number } height 
 * @param { number } internalFormat 
 * @param { number } format 
 * @param { number } type 
 * @param { ArrayBufferTypes | ImageBitmap } [ resource ]
 */
export function createTexture2D(gl, width, height, internalFormat, format, type, resource, filter = gl.NEAREST, generateMips = false, repeat = false) {

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Set texture parameters
    if (repeat) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, generateMips ? gl.LINEAR_MIPMAP_LINEAR : filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)

    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, resource ? resource : null)

    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
}
/**
 * @param { WebGL2RenderingContext } gl 
 * @param { number } width 
 * @param { number } height 
 * @param { number } internalFormat 
 * @param { number } format 
 * @param { number } type 
 * @param { ArrayBufferTypes | ImageBitmap } [ resource ]
 */
export function createCustomMipmapTexture2D(gl, width, height, internalFormat, format, type, resource, filter = gl.NEAREST) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER,  gl.NEAREST);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,  gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    // gl.NEAREST_MIPMAP_NEAREST | gl.LINEAR_MIPMAP_NEAREST |  gl.NEAREST_MIPMAP_LINEAR | gl.LINEAR_MIPMAP_LINEAR
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    gl.texStorage2D(gl.TEXTURE_2D, calculateMipmapLevels(width, height), internalFormat, width, height);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, resource ? resource : null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}
/**
 * return a fbo Array, whose element`s index is miplevel
 * @param {WebGL2RenderingContext} gl 
 * @param {WebGLTexture} tex 
 * @param {number} width 
 * @param {number} height 
 * @returns 
 */
export function createFboPoolforMipmapTexture(gl, tex, width, height) {
    const levels = calculateMipmapLevels(width, height);
    const fbs = [];
    for (let level = 0; level < levels; ++level) {
        const fb = gl.createFramebuffer();
        fbs.push(fb);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, level);
    }
    return fbs;
}

// mipmap helper
export function calculateMipmapLevels(width, height) {
    let levels = 1;
    while (width > 1 || height > 1) {
        width = Math.max(1, width >> 1);
        height = Math.max(1, height >> 1);
        levels++;
    }
    return levels;
}


export function createProgramFromSource(gl, vertexShaderCode, fragmentShaderCode) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderCode);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('VERTEX_SHADER ERROR:', gl.getShaderInfoLog(vertexShader));
        return null;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderCode);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('FRAGMENT_SHADER ERROR:', gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('PROGRAM ERROR:', gl.getProgramInfoLog(program));
        return null;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
}


/**
 * @param { WebGL2RenderingContext } gl 
 * @param { number } width 
 * @param { number } height 
 * @param { number } internalFormat 
 * @param { number } format 
 * @param { number } type 
 * @param { ArrayBufferTypes } array
 */
export function fillTexture2DByArray(gl, texture, width, height, internalFormat, format, type, array) {

    // Bind the texture
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    // Upload texture data
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, array);

    // Unbind the texture
    gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * @param { WebGL2RenderingContext } gl 
 * @param { number } [ width ] 
 * @param { number } [ height ] 
 * @returns { WebGLRenderbuffer }
 */
export function createRenderBuffer(gl, width, height) {

    const bufferWidth = width || gl.canvas.width * window.devicePixelRatio
    const bufferHeight = height || gl.canvas.height * window.devicePixelRatio

    const renderBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, bufferWidth, bufferHeight)
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)

    return renderBuffer
}

// Helper function to get WebGL error messages
export function getWebGLErrorMessage(gl, error) {
    switch (error) {
        case gl.NO_ERROR:
            return 'NO_ERROR';
        case gl.INVALID_ENUM:
            return 'INVALID_ENUM';
        case gl.INVALID_VALUE:
            return 'INVALID_VALUE';
        case gl.INVALID_OPERATION:
            return 'INVALID_OPERATION';
        case gl.OUT_OF_MEMORY:
            return 'OUT_OF_MEMORY';
        case gl.CONTEXT_LOST_WEBGL:
            return 'CONTEXT_LOST_WEBGL';
        default:
            return 'UNKNOWN_ERROR';
    }
}

export async function loadImage(url) {
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

export function getMaxMipLevel(width, height) {
    return Math.floor(Math.log2(Math.max(width, height)));
}

export async function loadF32Image(url) {

    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob, { imageOrientation: "flipY", premultiplyAlpha: "none", colorSpaceConversion: "default" })

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const gl = canvas.getContext("webgl2");
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