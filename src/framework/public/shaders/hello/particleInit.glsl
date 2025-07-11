#ifdef VERTEX_SHADER

precision highp float;

out vec2 v_uv;

// X, Y, U, V
vec4[] hardCodedRectanglePosition = vec4[4](
    vec4(-1.0, -1.0, 0.0, 0.0),   // Bottom left
    vec4(-1.0, 1.0, 0.0, 1.0),    // Top left
    vec4(1.0, -1.0, 1.0, 0.0),    // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)     // Top right
);

void main() {
    vec2 position = hardCodedRectanglePosition[gl_VertexID].xy;
    gl_Position = vec4(position, 0.0, 1.0);
    v_uv = hardCodedRectanglePosition[gl_VertexID].zw;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp float;

in vec2 v_uv;

uniform float uSamplingStep;
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    vec2 pixelStep = uSamplingStep / vec2(textureSize(uTexture, 0));
    vec2 uv = v_uv + pixelStep * (v_uv - 0.0);

    vec4 color = texture(uTexture, uv);
    if (color.a != 0.0) {
        fragColor = vec4(v_uv * 2.0 - 1.0 , 0.0, 0.0);
    } else {
        fragColor = vec4(-2.0, -2.0, 0.0, 0.0);
    }
}

#endif