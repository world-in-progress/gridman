import { ColorShader } from './ColorShader';
import { HeightShader } from './HeightShader'

// 着色器材质
const TerrainVertexShader = HeightShader +
`

precision highp float;
uniform highp sampler2D terrainMap;
uniform vec2 terrainMapSize;
uniform float minTerrainHeight;
uniform float maxTerrainHeight;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vec4 position = vec4(position, 1.0);
    float terrainHeight = getHeight(uv, terrainMap, terrainMapSize, minTerrainHeight, maxTerrainHeight);

    // 调整顶点高度
    position.z += terrainHeight;

    vUv = uv;
    vPosition = position.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * position;
}
`;

const TerrainFragmentShader =
ColorShader +
HeightShader +
`

precision highp float;
uniform highp sampler2D terrainMap;
uniform vec2 terrainMapSize;
uniform float terrainNormalY;
uniform float minTerrainHeight;
uniform float maxTerrainHeight;
uniform float normalScale;

uniform vec3 terrainColor;
uniform vec3 lightColor;
uniform vec3 lightDirection;

varying vec2 vUv;
varying vec3 vPosition;


void main() {
    vec3 normalHeight = getNormalHeight(vUv, terrainMap, terrainMapSize, minTerrainHeight, maxTerrainHeight);
    vec3 vNormal = normalize(vec3(normalHeight.x, terrainNormalY, normalHeight.z));
    float NdotL = dot(vNormal, lightDirection);
    float halfLambert = 0.5 * NdotL + 0.5;
    vec3 color = terrainColor * lightColor * halfLambert;

    color = LinearToSRGB(color);
    gl_FragColor = vec4(color, 1.0);
}
`;


export { TerrainVertexShader,  TerrainFragmentShader}