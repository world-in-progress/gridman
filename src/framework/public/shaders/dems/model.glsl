
#ifdef VERTEX_SHADER

layout(location = 0) in vec4 aPosition;
layout(location = 1) in vec4 aNormal;
layout(location = 2) in vec2 aUV;

uniform mat4 uMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;

void main() {
    gl_Position = uMatrix * uModelMatrix * aPosition;
    vPosition = (uModelMatrix * aPosition).rgb; // in world space
    // vNormal = normalize(vec3(uNormalMatrix * aNormal));
    // vNormal = normalize(vec3(uModelMatrix * aNormal));
    vNormal = normalize(vec3(aNormal));
    vUV = aUV;
}

#endif

#ifdef FRAGMENT_SHADER
precision mediump float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;

uniform vec3 uLightPosition;
uniform sampler2D uImage;

out vec4 fragColor;

const vec3 lightColor = vec3(1.0, 1.0, 1.0);
const vec3 ambientLight = vec3(0.2, 0.2, 0.2);

void main() {
    vec4 color = texture(uImage, vUV);
    // fragColor = color;
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(uLightPosition - vPosition);
    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse = lightColor * color.rgb * nDotL;
    // fragColor = vec4(diffuse, color.a);
    vec3 ambient = ambientLight * color.rgb;
    fragColor = vec4(diffuse + ambient, color.a);
    // fragColor = vec4(1.0,0.0,0.0,0.5);
}

#endif