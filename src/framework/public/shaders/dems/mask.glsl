#ifdef VERTEX_SHADER

#define PI 3.141592653589793
#define RAD_TO_DEG 180.0/PI
#define DEG_TO_RAD PI/180.0

layout(location = 0) in vec4 aPosition;


out vec2 SSpos;

float mercatorXfromLng(float lng) {
    return (180.0 + lng) / 360.0;
}
float mercatorYfromLat(float lat) {
    return (180.0 - (RAD_TO_DEG * log(tan(PI / 4.0 + lat / 2.0 * DEG_TO_RAD)))) / 360.0;
}
vec2 mercatorFromLngLat(vec2 lngLat) {
    return vec2(mercatorXfromLng(lngLat.x), mercatorYfromLat(lngLat.y));
}

uniform mat4 u_matrix;

void main() {
    vec4 CSpos = u_matrix * vec4(mercatorFromLngLat(aPosition.xy), 0.0, 1.0);
    gl_Position = CSpos;
    SSpos = CSpos.xy / CSpos.w * 0.5 + 0.5;
}

#endif
#ifdef FRAGMENT_SHADER
precision lowp float;

uniform sampler2D depth_texture;
in vec2 SSpos;

out float FragColor;
void main() {

    FragColor = 1.0;

    // float meshDepth = texture(depth_texture, SSpos).r;
    // float fragDepth = gl_FragCoord.z;

    // if( fragDepth - meshDepth > 0.001) {
    //     FragColor = 0.0;
    //     return;
    // }
    // FragColor = 1.0;
    // FragColor = meshDepth;

}

#endif