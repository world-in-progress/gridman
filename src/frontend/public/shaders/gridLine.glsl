#ifdef VERTEX_SHADER

precision highp float;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;

layout(location = 0) in vec2 tl;
layout(location = 1) in vec2 tr;
layout(location = 2) in vec2 bl;
layout(location = 3) in vec2 br;
layout(location = 4) in vec2 tlLow;
layout(location = 5) in vec2 trLow;
layout(location = 6) in vec2 blLow;
layout(location = 7) in vec2 brLow;
layout(location = 8) in uint level;
layout(location = 9) in uint assignment;


uniform mat4 uMatrix;
uniform vec2 centerLow;
uniform vec2 centerHigh;
uniform vec4 relativeCenter;

const float PI = 3.141592653;

vec2 calcWebMercatorCoord(vec2 coord) {
    float lon = (180.0 + coord.x) / 360.0;
    float lat = (180.0 - (180.0 / PI * log(tan(PI / 4.0 + coord.y * PI / 360.0)))) / 360.0;
    return vec2(lon, lat);
}

vec2 uvCorrection(vec2 uv, vec2 dim) {
    return clamp(uv, vec2(0.0), dim - vec2(1.0));
}

vec4 linearSampling(sampler2D texture, vec2 uv, vec2 dim) {
    vec4 tl = textureLod(texture, uv / dim, 0.0);
    vec4 tr = textureLod(texture, uvCorrection(uv + vec2(1.0, 0.0), dim) / dim, 0.0);
    vec4 bl = textureLod(texture, uvCorrection(uv + vec2(0.0, 1.0), dim) / dim, 0.0);
    vec4 br = textureLod(texture, uvCorrection(uv + vec2(1.0, 1.0), dim) / dim, 0.0);
    float mix_x = fract(uv.x);
    float mix_y = fract(uv.y);
    vec4 top = mix(tl, tr, mix_x);
    vec4 bottom = mix(bl, br, mix_x);
    return mix(top, bottom, mix_y);
}

float nan() {
    float a = 0.0;
    float b = 0.0;
    return a / b;
}

vec2 translateRelativeToEye(vec2 high, vec2 low) {
    vec2 relativeCenterHigh = relativeCenter.xz;
    vec2 relativeCenterLow = relativeCenter.yw;

    vec2 highDiff = high + relativeCenterHigh - centerHigh;
    vec2 lowDiff = low + relativeCenterLow - centerLow;
    return highDiff + lowDiff;
}

float altitude2Mercator(float lat, float alt) {
    const float earthRadius = 6371008.8;
    const float earthCircumference = 2.0 * PI * earthRadius;
    return alt / earthCircumference * cos(lat * PI / 180.0);
}

ivec2 indexToUV(sampler2D texture, int index) {

    int dim = textureSize(texture, 0).x;
    int x = index % dim;
    int y = index / dim;

    return ivec2(x, y);
}

float stitching(float coord, float minVal, float delta, float edge) {
    float order = mod(floor((coord - minVal) / delta), pow(2.0, edge));
    return -order * delta;
}

void main() {

    vec2 layerMap[4] = vec2[4](tl, tr, br, bl);
    vec2 layerMapLow[4] = vec2[4](tlLow, trLow, brLow, blLow);

    vec2 xy = layerMap[gl_VertexID];
    vec2 xyLow = layerMapLow[gl_VertexID];
    
    vec2 translated = translateRelativeToEye(xy, xyLow);
    gl_Position = uMatrix * vec4(translated.xy, 0.0, 1.0);
}

#endif

#ifdef FRAGMENT_SHADER

precision highp float;

out vec4 fragColor;

void main() {
    float lineAlpha = 0.3;
    vec3 lineColor = vec3(1.0);
    fragColor = vec4(lineColor * lineAlpha, lineAlpha);

}

#endif