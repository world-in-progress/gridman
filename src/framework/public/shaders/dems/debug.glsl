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

uniform sampler2D debugTexture;
uniform sampler2D paletteTexture;
uniform float mipmap;
uniform float debugLevel;
uniform vec2 u_screenSize;

out vec4 fragColor;

vec3 colorMapping(float elevation) {
    vec2 e = vec2(-66.5, 4.4);
    vec2 uv = vec2(1.0 - 0.6 * sin((elevation - e.x) / (e.y - e.x)), 0.5);
    return texture(paletteTexture, uv).rgb;
}

void main() {
    // if(mipmap == 0.0) {
    //     vec4 M = texture(debugTexture, texcoords);

    //     fragColor = vec4(vec3(M), 0.5);
    //     // for mask texture
    //     // vec3 outColor = vec3(M.r);
    //     // fragColor = vec4(outColor, 0.5);

    //     // for HHS texture
    //     // vec2 e = vec2(-66.5, 4.4);
    //     // fragColor = vec4(vec3((M.r - e.r) / length(e) * 0.7), 0.4);

    // } else {
    //     vec4 M = textureLod(debugTexture, texcoords, debugLevel);

    //     // for mipmap Dem texture
    //     vec2 e = vec2(-66.5, 4.4);
    //     fragColor = vec4(vec3((M.r - e.r) / length(e)), 0.4);

    //     // for mipmap Hs texture
    //     fragColor = vec4(vec3(M.r), 0.5);

    // }
    vec2 screenUV = gl_FragCoord.xy / u_screenSize;
    // fragColor = vec4(screenUV, 0.0, 0.8);
    vec4 M = texture(debugTexture, screenUV);
    // fragColor = vec4(M.rgb, 0.5);
    vec2 e = vec2(-15.513999999999996, 4.3745000000000003);
    fragColor = vec4(vec3((M.r - e.r) / length(e)), 1.0);
    // fragColor = vec4(0.5, 0.0, 0.0, 1.0);
    // fragColor = vec4(M.r,0.0,0.0,1.0);
    // float alpha = M.r == 9999.0? 0.0 : 0.5;

    // vec2 e = vec2(-66.5, 4.4);
    // float normHeight = (M.r - e.r) / length(e);
    // fragColor = vec4(normHeight, 0.3, 0.3, 0.8);
    // fragColor = vec4((M.r + 60.0) / 70.0, 0.4, 0.45, 1.0);
    // fragColor = vec4(M.r, 0.0, 0.0, 0.5);

    // for dem texture
    // vec2 e = vec2(-66.5, 4.4);
    // fragColor = vec4(vec3(abs(M.r) / length(e)), 0.6);

    // for hillshade texture
    // fragColor = vec4(vec3(M.r), 0.2);

    // for final hs texture
    // fragColor = vec4(vec3(M.r), 0.6);
}   

#endif