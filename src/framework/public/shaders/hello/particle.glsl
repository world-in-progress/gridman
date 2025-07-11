#ifdef VERTEX_SHADER

precision highp float;

uniform vec2 uResolution;
uniform float uParticleSize;
uniform sampler2D uTexture;

out vec2 v_uv;

// X, Y, U, V
vec4[] hardCodedCanvasPosition = vec4[4](
    vec4(-1.0, -1.0, 0.0, 0.0),     // Bottom left
    vec4(-1.0, 1.0, 0.0, 1.0),      // Top left
    vec4(1.0, -1.0, 1.0, 0.0),      // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)        // Top right
);

void main() {
    ivec2 dim = textureSize(uTexture, 0);
    ivec2 uv = ivec2(gl_InstanceID % dim.x, gl_InstanceID / dim.x);

    vec2 currentPos = texelFetch(uTexture, uv, 0).xy;

    vec2 pixelOffset = hardCodedCanvasPosition[gl_VertexID].xy * uParticleSize / uResolution / 2.0;

    gl_Position = vec4(currentPos + pixelOffset, 0.0, 1.0);
    v_uv = hardCodedCanvasPosition[gl_VertexID].zw * 2.0 - 1.0;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp int;
precision highp float;

in vec2 v_uv;

out vec4 fragColor;

void main() {
    float distance = v_uv.x * v_uv.x + v_uv.y * v_uv.y;
    if (distance < 0.5) {
        fragColor = vec4(0.91, 0.94, 0.93, 1.0);
    } else {
        discard;
    }
}

#endif