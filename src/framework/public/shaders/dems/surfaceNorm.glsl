#ifdef VERTEX_SHADER
#define PI 3.1415926535897932384626433832795
#define RAD_TO_DEG 180.0 / PI
#define DEG_TO_RAD PI / 180.0

precision highp float;

layout(location = 0) in vec2 i_pos;//lnglat
uniform mat4 u_matrix;

out vec2 v_uv;

const vec4[] vertices = vec4[4](vec4(-1.0, -1.0, 0.0, 0.0), vec4(1.0, -1.0, 1.0, 0.0), vec4(-1.0, 1.0, 0.0, 1.0), vec4(1.0, 1.0, 1.0, 1.0));

//////// functions ///////////
float mercatorXfromLng(float lng) {
    return (180.0 + lng) / 360.0;
}
float mercatorYfromLat(float lat) {
    return (180.0 - (RAD_TO_DEG * log(tan(PI / 4.0 + lat / 2.0 * DEG_TO_RAD)))) / 360.0;
}

void main() {

    vec2 posinWS = vec2(mercatorXfromLng(i_pos.x), mercatorYfromLat(i_pos.y));
    vec4 posinCS = u_matrix * vec4(posinWS, 0.0, 1.0);

    v_uv = vertices[gl_VertexID].zw;
    gl_Position = posinCS;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp int;
precision highp float;
precision highp usampler2D;

uniform sampler2D u_normalTexture1;
uniform sampler2D u_normalTexture2;
uniform float u_time;
uniform vec4 SamplerParams;

const vec3 v_normalWS = vec3(0.0, 0.0, 1.0);
const vec3 v_tangentWS = vec3(1.0, 0.0, 0.0);
const vec3 v_bitangentWS = vec3(0.0, 1.0, 0.0);

in vec2 v_uv;

out vec3 FragColor;

vec3 unPack(vec3 norm) {
    return vec3(norm * 2.0 - 1.0);
}

vec3 getNormalFromMap(vec2 uv) {

    mat3 TBN = mat3(v_tangentWS, v_bitangentWS, v_normalWS);// tiling
    vec2 dim = vec2(textureSize(u_normalTexture1, 0));
    vec3 firstNormalTS = texture(u_normalTexture1, uv * SamplerParams.x * 5.0+ vec2(u_time / SamplerParams.y, 0.0) / dim).rgb;
    vec3 secondNormalTS = texture(u_normalTexture2, uv * SamplerParams.z * 5.0 + vec2(u_time / SamplerParams.w, 0.0) / dim).rgb;
    firstNormalTS = unPack(firstNormalTS);
    secondNormalTS = unPack(secondNormalTS);
    vec3 normalTS = normalize(firstNormalTS + secondNormalTS);
    vec3 normalWS = normalize(TBN * normalTS);
    return normalWS;
}


void main() {
    /////////// noraml and Blinn-Phong ///////////
    vec3 normalWS = getNormalFromMap(v_uv);

    FragColor = vec3(normalWS);

}

#endif