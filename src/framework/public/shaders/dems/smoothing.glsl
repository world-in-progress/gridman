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
uniform sampler2D u_texture;
uniform vec2 u_textureSize;
uniform float u_kernel[9]; // 3x3 高斯核

out vec4 fragColor;

void main() {
    vec2 texelSize = vec2(1.0 / u_textureSize.x, 1.0 / u_textureSize.y);
    vec4 color = vec4(0.0);

    if(abs((texture(u_texture, texcoords).r - 9999.0)) < 1e-5) {
        fragColor = color;
        return;
    }

    // 3x3 高斯核采样
    for(int i = -1; i <= 1; ++i) {
        for(int j = -1; j <= 1; ++j) {
            vec2 offset = vec2(float(i), float(j)) * texelSize;
            vec4 texel = texture(u_texture, texcoords + offset) * u_kernel[(i + 1) * 3 + (j + 1)];
            if(abs((texel.r - 9999.0)) < 1e-5) {
                fragColor = color;
                return;
            }
            color += texel;
        }
    }

    fragColor = color;
}
#endif