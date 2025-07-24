#ifdef VERTEX_SHADER

precision highp float;

const float SKIRT_HEIGHT_FLAG = 24575.0;

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

const float SKIRT_HEIGHT_FLAG = 24575.0;

in vec2 texcoords;

uniform sampler2D meshTexture;
uniform sampler2D paletteTexture;
uniform sampler2D maskTexture;

uniform vec2 e;
uniform float interval;
uniform float withContour;
uniform float withLighting;
uniform vec3 LightPos;
uniform float diffPower;
uniform vec3 shallowColor;
uniform vec3 deepColor;
uniform float u_threshold;

out vec4 fragColor;

const vec3 LightColor = vec3(1.0, 1.0, 1.0);
const vec3 specularColor = vec3(1.0, 1.0, 1.0);
// const vec3 shallowColor = vec3(122, 52, 22);
// const vec3 deepColor = vec3(130.0);

vec2 decomposeHeight(float heightValue) {
    float skirt = float(heightValue >= SKIRT_HEIGHT_FLAG);
    float realHeight = heightValue - skirt * SKIRT_HEIGHT_FLAG;
    return vec2(realHeight, skirt);
}

vec4 loadTerrainInfo(vec2 uv, vec2 offset) {

    vec2 dim = vec2(textureSize(meshTexture, 0)) - 1.0;
    // return texelFetch(meshTexture, ivec2(uv * dim + offset), 0);
    vec4 texel = texelFetch(meshTexture, ivec2(uv * dim + offset), 0);
    vec2 height_skirt = decomposeHeight(texel.r);
    // return vec3(height_skirt.x, texel.g, height_skirt.y);//realheight , hillshade, skirt
    // return vec4(height_skirt.x, texel.yzw);
    return texel;
}

vec3 colorMapping(float elevation) {

    // vec2 uv = vec2(1.0 - 0.6 * sin((elevation - e.x) / (e.y - e.x)), 0.5);
    // return texture(paletteTexture, uv).rgb;
    // return color / 255.0;

    float normalizedElevation = (elevation - e.x) / (e.y - e.x);
    // vec3 color = normalizedElevation * vec3(122, 52, 22);
    // return color / 255.0;

    // return mix(deepColor, shallowColor, normalizedElevation) / 255.0;
    normalizedElevation = clamp(normalizedElevation, 0.0, 1.0);

    vec2 paletteUV = vec2(normalizedElevation, 0.5);
    return texture(paletteTexture, paletteUV).rgb;

}

float epsilon(float x) {
    return 0.00001 * x;
}

int withinInterval(float elevation) {
    // float f_interval = elevation * ep; 
    // return int(f_interval / (interval * ep));
    return int(elevation / interval);
}

float validFragment(vec2 uv) {
    return texture(maskTexture, uv).r;
}

float sigmoid(float x) {
    return 1.0 / (1.0 + exp(-x));
}
void main() {

    if(validFragment(texcoords) == 0.0) {
        return;
    }

    float factor = 1.0;
    vec4 M = loadTerrainInfo(texcoords, vec2(0.0, 0.0));
    vec4 N = loadTerrainInfo(texcoords, vec2(0.0, factor));
    vec4 E = loadTerrainInfo(texcoords, vec2(factor, 0.0));
    vec4 S = loadTerrainInfo(texcoords, vec2(0.0, -factor));
    vec4 W = loadTerrainInfo(texcoords, vec2(-factor, 0.0));

    int intervalM = withinInterval(M.r);
    int intervalN = withinInterval(N.r);
    int intervalE = withinInterval(E.r);
    int intervalS = withinInterval(S.r);
    int intervalW = withinInterval(W.r);

    float diff = 1.0;
    if(withLighting == 1.0) {
        // float hillshade = M.g;
        // // hillshade = 1.0 - 1.0 / exp(5.0 * hillshade);
        // // hillshade = pow(hillshade, 5.0);
        // // hillshade = clamp(pow(hillshade, 3.0) - 0.1 , 0.0, 1.0);
        // // hillshade = sigmoid(hillshade);
        // diff = hillshade;
        // vec3 lightPosition = vec3(-1.36, 0.77, 0.79);
        vec3 lightDir = normalize(LightPos - vec3(0.0));
        vec3 norm = M.gba;
        diff = clamp(dot(norm, lightDir), 0.0, 1.0);
        // diff = pow(diff, diffPower);
        // diff = pow(exp(diff) - 1.0, 1.0);
        // diff = sigmoid(diff);
        // diff = smoothstep(0.0, 1.0, diff);
        // diff = clamp(diff, 0.0, 1.0);
    }

    // vec3 outColor = colorMapping(M.r) * diff;
    vec3 outColor = colorMapping(M.r) * diff;

    vec3 intervalColor = outColor;
    int flag = 0;
    // vec3 intervalColor = vec3(0.27);
    // Countours
    if(withContour == 1.0)
        if(intervalN > intervalM || intervalE > intervalM || intervalS > intervalM || intervalW > intervalM) {

            //outColor = intervalColor * 0.8;
            if(abs(float(intervalM) + 0.0) < 1e-5) {
                outColor = vec3(1.0);
                flag = 1;
            } else if(abs(float(intervalM) + 6.0) < 1e-5) {
                outColor = vec3(0.84, 0.21, 0.21);
                flag = 1;
            } else if(abs(float(intervalM) + 10.0) < 1e-5) {
                outColor = vec3(0.17, 0.17, 0.89);
                flag = 1;
            }

            
        }

    float alpha = M.r < 9999.0 ? 1.0 : 0.0;
    float originalElevation = M.r;
    float normalizedElevation = (M.r - e.x) / (e.y - e.x);
    // alpha = alpha * (1.0 - normalizedElevation);// 越高越透明
    alpha = 0.2;
    if(originalElevation > u_threshold) {
        alpha = 0.0;
    }

    fragColor = vec4(outColor, flag == 0 ? alpha : 1.0);


    // fragColor = vec4(vec3(diff * 0.8), 1.0);
    // fragColor = vec4(normalizedElevation,0.3,0.5, alpha);
    // fragColor = vec4((M.r + 60.0) / 70.0, 0.5, 0.6, 1.0);
}

#endif