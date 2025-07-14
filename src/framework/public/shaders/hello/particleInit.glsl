#ifdef VERTEX_SHADER

precision highp float;

out vec2 v_uv;

// X, Y, U, V
vec4[] hardCodedRectanglePosition = vec4[4](
    vec4(-1.0, -1.0, 0.0, 0.0),   // Bottom left
    vec4(-1.0, 1.0, 0.0, 1.0),    // Top left
    vec4(1.0, -1.0, 1.0, 0.0),    // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)      // Top right
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
uniform float uRandomSeed;
uniform vec2 uResolution;
uniform int uIsRandom;

layout(location = 0) out vec4 fragColor0;
layout(location = 1) out vec4 fragColor1;

float rand(const vec2 co) {
    const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
    float t = dot(rand_constants.xy, co);
    return abs(fract(sin(t) * (rand_constants.z + t)));
}


void main() {
    vec2 pixelSize = 1.0 / vec2(textureSize(uTexture, 0));
    vec4 totalColor = vec4(0.0);
    int sampleCount = 0;
    vec2 resolution = uResolution - 1.0;

    for (int i = 0; i < int(uSamplingStep); i++) {
        for (int j = 0; j < int(uSamplingStep); j++) {
            vec2 offset = vec2(i, j) * pixelSize;
            vec2 sampleUV = v_uv + offset;

            totalColor += texture(uTexture, sampleUV);
            sampleCount++;
        }
    }
    vec4 color = totalColor / float(sampleCount);
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    if (color.a != 0.0 && luminance > 0.6) {
        float x = v_uv.x;
        float y = v_uv.y;
        vec2 birthPos = v_uv * resolution;
        if (uIsRandom == 1) {
            vec2 seed = uRandomSeed + vec2(x, y);
            birthPos = vec2(rand(seed + 1.3), rand(seed + 2.1)) * resolution;
        }
        fragColor0 = vec4(birthPos, 0.0, 0.0);
        fragColor1 = vec4(birthPos, 0.0, 0.0);
    } else {
        fragColor0 = vec4(-999.0, -999.0, 0.0, 0.0);
        fragColor1 = vec4(-999.0, -999.0, 0.0, 0.0);
    }
}

#endif