#ifdef VERTEX_SHADER

precision highp float;

out vec2 texcoords;

vec4[] vertices = vec4[4](vec4(-1.0, -1.0, 0.0, 0.0), vec4(1.0, -1.0, 1.0, 0.0), vec4(-1.0, 1.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0));

void main() {

    vec4 attributes = vertices[gl_VertexID];

    gl_Position = vec4(attributes.xy, 0.0, 1.0);
    texcoords = attributes.zw;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp int;
precision highp float;
precision highp usampler2D;

in vec2 texcoords;

uniform sampler2D showTexture1;
uniform sampler2D showTexture2;
uniform float mixAlpha;

out vec4 fragColor;

bool almostEqual(float a, float b) {
    return abs(a - b) < 0.0001 ? true : false;
}

void main() {

    fragColor = vec4(0.0, 0.0, 0.0, 0.5);
}

#endif