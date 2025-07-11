#ifdef VERTEX_SHADER

precision highp float;
precision highp sampler2D;
precision highp usampler2D;
precision highp sampler2DArray;

layout(location = 0) in vec4 pos;

uniform mat4 uMatrix;
uniform vec2 centerLow;
uniform vec2 centerHigh;
uniform float lineWidth;
uniform vec2 viewport;
uniform vec2 relativeCenter;

vec2 translateRelativeToEye(vec2 high, vec2 low) {
    vec2 highDiff = high - centerHigh;
    vec2 lowDiff = low - centerLow;
    return highDiff + lowDiff;
}

vec2 get_vector(vec2 beginVertex, vec2 endVertex) {
    return normalize(endVertex - beginVertex);
}

void main() {
    vec2 xy = vec2(0.0);
    vec4 xy_CS = vec4(0.0);
    vec2 xy_SS = vec2(0.0);
    vec2 p1 = pos.xy;
    vec2 p2 = pos.zw;
    float parity = float(gl_VertexID % 2);
    bool isPositive = gl_VertexID / 2 == 0;

    vec4 p1_CS = uMatrix * vec4(translateRelativeToEye(relativeCenter, p1), 0.0, 1.0);
    vec4 p2_CS = uMatrix * vec4(translateRelativeToEye(relativeCenter, p2), 0.0, 1.0);
    vec2 p1_SS = p1_CS.xy / p1_CS.w;
    vec2 p2_SS = p2_CS.xy / p2_CS.w;

    if(isPositive) {
        xy = p1;
        xy_CS = p1_CS;
        xy_SS = p1_SS;
    } else {
        xy = p2;
        xy_CS = p2_CS;
        xy_SS = p2_SS;
    }

    vec2 cn_vector = get_vector(p1_SS, p2_SS);
    float screenOffset = lineWidth / 2.0;

    vec3 view = vec3(0.0, 0.0, 1.0);
    vec2 v_offset = normalize(cross(view, vec3(cn_vector, 0.0))).xy * mix(-1.0, 1.0, parity);

    vec2 offseted_pos = xy_SS + v_offset * screenOffset / viewport;
    gl_Position = vec4(offseted_pos, 0.0, 1.0) * xy_CS.w;

}

#endif

#ifdef FRAGMENT_SHADER

precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 0.64, 0.36, 0.4);
}

#endif