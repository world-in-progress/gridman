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
layout(location = 9) in uint hit;
layout(location = 10) in uint deleted;

uniform mat4 uMatrix;
uniform vec2 centerLow;
uniform vec2 centerHigh;
uniform vec4 relativeCenter;
uniform sampler2D paletteTexture;

out vec2 uv;
out float u_hit;
out vec3 v_color;
out float u_deleted;

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

    // vec2 layerMap[4] = vec2[4](vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0), vec2(1.0, 1.0));

    vec2 layerMap[4] = vec2[4](tl, tr, bl, br);
    vec2 layerMapLow[4] = vec2[4](tlLow, trLow, blLow, brLow);
    vec2 uvs[4] = vec2[4](vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(0.0, 0.0), vec2(1.0, 0.0));

    vec2 xy = layerMap[gl_VertexID];
    vec2 xyLow = layerMapLow[gl_VertexID];

    u_hit = float(hit);
    u_deleted = float(deleted);

    uv = uvs[gl_VertexID] * 2.0 - 1.0;
    v_color = texelFetch(paletteTexture, ivec2(level, 0), 0).rgb;

    vec2 translated = translateRelativeToEye(xy, xyLow);
    gl_Position = uMatrix * vec4(translated.xy, 0.0, 1.0);
}

#endif

#ifdef FRAGMENT_SHADER

precision highp int;
precision highp float;

uniform int hit;
uniform float mode;

in vec2 uv;
in float u_hit;
in vec3 v_color;
in float u_deleted;

out vec4 fragColor;

float epsilon(float x) {
    return 0.00001 * x;
}

bool isHit() {
    float tolerence = epsilon(1.0);
    return abs(float(hit) - u_hit) <= tolerence;
}

bool isDeleted() {
    float tolerence = epsilon(1.0);
    return abs(1.0 - u_deleted) <= tolerence;
}

float awayFromKlkStar(float factor, float range) {
    float deltaDis = abs(uv.x * uv .x - uv.y * uv.y);
    if (deltaDis <= factor && abs(uv.x) <= range && abs(uv.y) <= range) {
        // return 1.0;
        return deltaDis / factor;
    } else {
        // return deltaDis / factor;
        return 1.0;
    }
}

void main() {

    // Shading in topology editor
    // if(mode == 0.0) {
    //     if(isHit) {
    //         float distance = uv.x * uv.x + uv.y * uv.y;

    //         if(distance <= 0.25) {
    //             fillAlpha = 0.8;
    //             fillColor = v_color;
    //         } else {
    //             fillAlpha = 0.1;
    //             fillColor = vec3(0.1);
    //         }
    //     } else {
    //         fillAlpha = 0.1;
    //         fillColor = vec3(0.1);
    //     }
    // }
    // // Shading in attribute editor
    // else {

    //     float distance = uv.x * uv.x + uv.y * uv.y;

    //     if(distance <= 0.25 && distance >= 0.2) {
    //         if(isHit){
    //             fillAlpha = 0.2;
    //             fillColor = vec3(1.0);
    //         }
    //         else {
    //             fillAlpha = 0.8;
    //             fillColor = vec3(0.64, 0.09, 0.09);
    //         }
    //     } else {
    //         if(isHit) {
    //             fillAlpha = 0.8;
    //             fillColor = vec3(0.64, 0.09, 0.09);
    //         }
    //         else {
    //             fillAlpha = 0.2;
    //             fillColor = vec3(1.0);
    //         }
    //     }
    // }


    bool isHit = isHit();
    bool isDeleted = isDeleted();
    float fillAlpha = 1.0;
    vec3 fillColor = vec3(1.0);
    
    if(isDeleted) {
        float factor = 0.035;
        float range = 0.6;
        float dis = uv.x * uv.x + uv.y * uv.y;
        float deltaDis = abs(uv.x * uv.x - uv.y * uv.y);
        if (awayFromKlkStar(factor, 0.8) < 1.0) {
            fillColor = vec3(1.0, 0.0, 0.0);
            fillAlpha = 0.6;
            float centerFactor = 0.6;
            float centerAway = awayFromKlkStar(centerFactor * factor, centerFactor * range);
            if (centerAway < 1.0) {
                float mixFactor = clamp(centerAway * 3.0, 0.0, 1.0);
                fillColor = mix(vec3(1.0), vec3(1.0, 0.0, 0.0), mixFactor);
            }

            if (isHit) {
                fillColor = 1.0 - fillColor;
            }
        } else {
            // fillColor = vec3(0.2);
            // fillAlpha = 0.2;
            discard;
        }
    } else {

        if(isHit) {
            float distance = uv.x * uv.x + uv.y * uv.y;

            if(distance <= 0.25) {
                fillAlpha = 0.8;
                fillColor = v_color;
                fragColor = vec4(fillColor * fillAlpha, fillAlpha);
            } else {
                discard;
            }
        } else {
            discard;
        }
    }

    if (isHit || isDeleted) {
        fragColor = vec4(fillColor * fillAlpha, fillAlpha);
    } else {
        discard;
    }
}

#endif