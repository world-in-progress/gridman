#ifdef VERTEX_SHADER
#define PI 3.1415926535897932384626433832795
#define RAD_TO_DEG 180.0 / PI
#define DEG_TO_RAD PI / 180.0
#define MAPBOX_TILE_EXTENT = 8192.0

precision highp float;

uniform mat4 u_posMatrix;
uniform mat4 u_tileMatrix;
uniform vec3 u_cameraPos;
uniform vec2 u_screenSize;

out vec2 v_uv;
out vec3 v_positionWS;
out vec4 v_positionCS;

const vec4[] vertices = vec4[4](vec4(-1.0, -1.0, 0.0, 0.0), vec4(1.0, -1.0, 1.0, 0.0), vec4(-1.0, 1.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0));

void main() {
    vec4 attributes = vertices[gl_VertexID];

    // vec2 posinWS = vec2(attributes.zw) * 8192.0;
    // vec4 posinCS = u_tileMatrix * vec4(posinWS, 0.0, 1.0);
    vec4 posinTile = vec4(vec2(attributes.zw) * 8192.0, 0.0, 1.0);
    vec4 posInWS = u_posMatrix * posinTile;
    vec4 posInCS = u_tileMatrix * posinTile;
    // vec2 posinWS = vec2(attributes.zw) * 8192.0;
    // vec4 posinCS = u_tileMatrix * vec4(posinWS, 0.0, 1.0);

    v_uv = attributes.zw;
    v_positionWS = vec3(posInWS.xy, 0.0);
    v_positionCS = posInCS;

    gl_Position = posInCS;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp int;
precision highp float;
precision highp usampler2D;

uniform sampler2D u_depethTexture;
uniform sampler2D u_maskTexture;
uniform sampler2D u_surfaceNormalTexture;
uniform vec3 u_cameraPos;
uniform vec2 u_screenSize;
uniform vec2 u_dem_tl;
uniform float u_dem_size;
uniform float u_dem_scale;
uniform float u_time;
uniform vec2 u_elevationRange;

uniform vec3 shallowColor;
uniform vec3 deepColor;
uniform vec4 SamplerParams;
uniform vec3 LightPos;
uniform float specularPower;

const vec3 NormalWS = vec3(0.0, 0.0, 1.0);
const vec3 TangentWS = vec3(1.0, 0.0, 0.0);
const vec3 BitangentWS = vec3(0.0, 1.0, 0.0);

in vec2 v_uv;
in vec3 v_positionWS;
in vec4 v_positionCS;

out vec4 FragColor;

//////////// CONST ////////////
// const vec3 shallowColor = vec3(0.0, 0.6, 0.9);
// const vec3 deepColor = vec3(0.0, 0.13, 1.0);
// const float _FirstNormalSpeedInverse = 20.0;
// const float _SecondNormalSpeedInverse = -15.0;
// const vec3 LightPos = vec3(100.0, 20.0, 200.0);
const vec3 LightColor = vec3(1.0, 1.0, 1.0);
const vec3 specularColor = vec3(1.0, 1.0, 1.0);
// const float specularPower = 512.0;

////////////////////////////////////////////
/////////// Sampler for height 
////////////////////////////////////////////
float samplerHeight(vec2 uv) {
    vec2 pos = (u_dem_size * (uv * u_dem_scale + u_dem_tl) + 1.0) / (u_dem_size + 2.0);
    float m = texture(u_depethTexture, pos).r;
    float normlizeHeight = (m - u_elevationRange.x) / (u_elevationRange.y - u_elevationRange.x);

    return smoothstep(0.0, 1.0, normlizeHeight);
}

////////////////////////////////////////////
/////////// Sampler for normal 
////////////////////////////////////////////

vec3 getNormalFromMap2(vec2 uv) {

    return texture(u_surfaceNormalTexture, uv).xyz;
}
float validFragment(vec2 uv) {
    return texture(u_maskTexture, uv).r;
}

void main() {
    // vec2 screenUV = (v_positionCS / v_positionCS.w).xy * 0.5 + 0.5;
    vec2 screenUV = gl_FragCoord.xy / u_screenSize;
    /*
        01  11
        00  10
    */
    if(validFragment(screenUV) == 0.0) {
        return;
    }

    /////////// waterDepth ///////////
    vec3 viewVector = v_positionWS - u_cameraPos.xyz;

    float waterDepth = samplerHeight(v_uv);

    vec3 waterColor = vec3(0.0);
    waterColor = mix(shallowColor, deepColor, waterDepth) / 255.0;

    /////////// noraml and Blinn-Phong ///////////
    // vec3 normalWS = getNormalFromMap(v_uv);
    vec3 normalWS = getNormalFromMap2(screenUV);

    vec3 lightDir = normalize(LightPos - vec3(0.0));
    vec3 viewDir = normalize(-1.0 * viewVector);

    vec3 halfwayDir = normalize(lightDir + viewDir);
    float NdotH = clamp(dot(normalWS, halfwayDir), 0.0, 1.0);
    vec3 specular = LightColor * specularColor * pow(NdotH, specularPower);

    waterColor += specular;


    float alpha = 0.5;
    FragColor = vec4(waterColor, alpha);

    // FragColor = vec4(waterDepth, 0.5 ,0.5, 1.0);

}

#endif