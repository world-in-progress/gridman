#ifdef VERTEX_SHADER

precision highp float;

uniform sampler2D uTexture;
uniform vec2 uResolution;

out vec2 v_uv;

// X, Y, U, V
vec4[] hardCodedRectanglePosition = vec4[4](
    vec4(-1.0, -1.0, 0.0, 0.0),   // Bottom left
    vec4(-1.0, 1.0, 0.0, 1.0),    // Top left
    vec4(1.0, -1.0, 1.0, 0.0),    // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)      // Top right
);

void main() {
    vec2 textureDim = vec2(textureSize(uTexture, 0));
    float textureAspect = textureDim.x / textureDim.y;
    float screenAspect = uResolution.x / uResolution.y;

    vec2 scale = vec2(1.0);
    if (screenAspect > textureAspect) {
        scale.x = textureAspect / screenAspect;
    } else {
        scale.y = screenAspect / textureAspect;
    }

    vec2 position = hardCodedRectanglePosition[gl_VertexID].xy;
    gl_Position = vec4(position * scale, 0.0, 1.0);
    v_uv = hardCodedRectanglePosition[gl_VertexID].zw;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp float;

in vec2 v_uv;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    fragColor = texture(uTexture, v_uv);
}

#endif