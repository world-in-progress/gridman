import { HeightShader } from './HeightShader'
import { FlowShader } from './FlowShader'
import { ColorShader } from './ColorShader';

const WaterVertexShader =
HeightShader +
`
// 顶点着色器代码

uniform float timeStep;
uniform float minWaterHeightBefore;
uniform float maxWaterHeightBefore;
uniform float minWaterHeightAfter;
uniform float maxWaterHeightAfter;
uniform float minTerrainHeight;
uniform float maxTerrainHeight;
uniform sampler2D huvMapBefore;
uniform sampler2D huvMapAfter;
uniform sampler2D terrainMap;
uniform vec2 huvMapSize;
uniform vec2 terrainMapSize;

varying float waterDepth;
varying float waterHeight;
varying vec2 vUv;

void main() {
    vUv = uv;
    float terrainHeight = getHeight(uv, terrainMap, terrainMapSize, minTerrainHeight, maxTerrainHeight);

    float waterHeight0 = getHeight(uv, huvMapBefore, huvMapSize, minWaterHeightBefore, maxWaterHeightBefore);
    if(waterHeight0 < 0.001)  waterHeight0 = 0.0;

    float waterHeight1 = getHeight(uv, huvMapAfter, huvMapSize, minWaterHeightAfter, maxWaterHeightAfter);
    if(waterHeight1 < 0.001)  waterHeight1 = 0.0;
    
    
    waterHeight = mix(waterHeight0, waterHeight1, timeStep);
    waterDepth = waterHeight - terrainHeight;

    vec3 position = position.xyz + vec3(0, 0, waterHeight);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    gl_Position.z -= 0.002;
}
`;

const WaterFragmentShader =
ColorShader +
HeightShader +
FlowShader +
`
// 片段着色器代码
uniform vec3 lightDirection;
uniform vec2 huvMapSize;
uniform vec2 terrainMapSize;

uniform float minWaterHeightBefore;
uniform float maxWaterHeightBefore;
uniform float minWaterHeightAfter;
uniform float maxWaterHeightAfter;
uniform vec3 lightColor;
uniform float waterAlpha;

uniform vec3 waterShallowColor;
uniform vec3 waterDeepColor;
uniform float waterShallowAlpha;
uniform float waterDeepAlpha;
uniform float depthDensity;
uniform float minWaterDepth;
uniform float maxWaterDepth;
uniform float minWaterDepthAlpha;
uniform float maxWaterDepthAlpha;
uniform float time;
uniform float timeStep;
uniform float swapTimeMinRange;
uniform float swapTimeMaxRange;
uniform float normalStrength;
uniform float waterNormalY;
uniform sampler2D foamMap;
uniform sampler2D normalMap;
uniform sampler2D displacementMap;
uniform sampler2D heightNoiseMap;
uniform sampler2D heightNoiseNormalMap;
uniform sampler2D huvMapBefore;
uniform sampler2D huvMapAfter;
uniform sampler2D rampMap;              
uniform float minVelocityUBefore;
uniform float maxVelocityUBefore;
uniform float minVelocityVBefore;
uniform float maxVelocityVBefore;
uniform float minVelocityUAfter;
uniform float maxVelocityUAfter;
uniform float minVelocityVAfter;
uniform float maxVelocityVAfter;
uniform float gridResolutionA;
uniform float wavePeriodA;
uniform float flowVelocityStrengthA;
uniform float gridResolutionB;
uniform float wavePeriodB;
uniform float flowVelocityStrengthB;
uniform float gridResolutionC;
uniform float wavePeriodC;
uniform float flowVelocityStrengthC;
uniform float gridResolutionD;
uniform float wavePeriodD;
uniform float flowVelocityStrengthD;
uniform float foamMinEdge;
uniform float foamMaxEdge;
uniform float foamVelocityMaskMinEdge;
uniform float foamVelocityMaskMaxEdge;

varying float waterDepth;
varying float waterHeight;
varying vec2 vUv;

float remap(float value, vec2 fromRange, vec2 toRange) 
{
    return ((value - fromRange.x) / (fromRange.y - fromRange.x)) * (toRange.y - toRange.x) + toRange.x;
}

void FlowStrength()
{
    float waterRemap = remap(waterDepth, vec2(minWaterDepth, maxWaterDepth), vec2(0.0, 1.0));
    vec2 rampUV = vec2(clamp(waterRemap, 0.0, 1.0), 0.5);
    vec3 waterDepthStrength = texture2D(rampMap, rampUV).rgb;

    float alpha = waterAlpha;

    gl_FragColor = vec4(waterDepthStrength, alpha);
}

void DirectionalFlow() 
{
    // SwapTime用于两个时间段的水面的平滑切换
    float lerpValue = smoothstep(swapTimeMinRange, swapTimeMaxRange, timeStep);

    vec3 currNormal, nextNormal;
    float currDisplacement, nextDisplacement;
    vec2 currVelocity, nextVelocity;
    GetDirectionalFlow(vUv, huvMapBefore, minVelocityUBefore, maxVelocityUBefore, minVelocityVBefore, maxVelocityVBefore, 
                        normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap,
                        gridResolutionA, flowVelocityStrengthA, wavePeriodA,
                        gridResolutionB, flowVelocityStrengthB, wavePeriodB,
                        gridResolutionC, flowVelocityStrengthC, wavePeriodC,
                        gridResolutionD, flowVelocityStrengthD, wavePeriodD,
                        time, normalStrength,
                        currNormal, currDisplacement, currVelocity);

    GetDirectionalFlow(vUv, huvMapAfter, minVelocityUAfter, maxVelocityUAfter, minVelocityVAfter, maxVelocityVAfter, 
                        normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap,
                        gridResolutionA, flowVelocityStrengthA, wavePeriodA,
                        gridResolutionB, flowVelocityStrengthB, wavePeriodB,
                        gridResolutionC, flowVelocityStrengthC, wavePeriodC,
                        gridResolutionD, flowVelocityStrengthD, wavePeriodD,
                        time, normalStrength,
                        nextNormal, nextDisplacement, nextVelocity);


    vec3 finalNormal = mix(currNormal, nextNormal, lerpValue);
    finalNormal = NormalStrength(finalNormal , normalStrength);
    
    // 获取速度场显示的遮罩
    float currVelocityMask = smoothstep(foamVelocityMaskMinEdge, foamVelocityMaskMaxEdge, length(currVelocity));
    float nextVelocityMask = smoothstep(foamVelocityMaskMinEdge, foamVelocityMaskMaxEdge, length(nextVelocity));


    // 计算法线
    vec3 normalBefore = getNormalHeight(vUv, huvMapBefore, huvMapSize, minWaterHeightBefore, maxWaterHeightBefore);
    vec3 normalAfter = getNormalHeight(vUv, huvMapAfter, huvMapSize, minWaterHeightAfter, maxWaterHeightAfter);
    vec3 normalHeight = mix(normalBefore, normalAfter, lerpValue);
    vec3 normal = normalize(vec3(normalHeight.x, waterNormalY, normalHeight.z));
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 bitangent = cross(normal, tangent);
    tangent = cross(bitangent, normal);
    // vec3 tangent = normalize(vec3(1.0, normalHeight.x, 0.0));
    // vec3 bitangent = normalize(vec3(0.0, normalHeight.z, 1.0));
    mat3 tbnMatrix = mat3(tangent, bitangent, normal);
    vec3 normalWS = normalize(tbnMatrix * finalNormal);


    // 深浅水颜色
    float waterHeight = waterDepth;
    waterHeight /= depthDensity;
    waterHeight = clamp(waterHeight, 0.0, 1.0);
    vec3 waterColor = mix(waterShallowColor, waterDeepColor, waterHeight);
    float waterColorAlpha = mix(waterShallowAlpha, waterDeepAlpha, waterHeight);
    // float alpha = waterColorAlpha * smoothstep(minWaterDepthAlpha, maxWaterDepthAlpha, waterDepth);
    float alpha = waterAlpha * mix(waterShallowAlpha, waterDeepAlpha, waterHeight);

    // 法线光照
    float NdotL = dot(normalWS, lightDirection);
    float halfLambert = 0.5 * NdotL + 0.5;
    vec3 diffuseColor = waterColor * lightColor * halfLambert;

    vec3 finalColor = diffuseColor.rgb;

    // 浪尖泡沫
    float foamValue = texture2D(foamMap, vUv * 500.).r;
    foamValue = remap(foamValue, vec2(0.0,1.0), vec2(0.2, 1.0));
    float currFoamValue = foamValue * smoothstep(foamMinEdge, foamMaxEdge, currDisplacement);
    float nextFoamValue = foamValue * smoothstep(foamMinEdge, foamMaxEdge, nextDisplacement);
    vec3 currFoamColor = vec3(currFoamValue) * currVelocityMask;
    vec3 nextFoamColor = vec3(nextFoamValue) * nextVelocityMask;
    
    vec3 foamColor = mix(currFoamColor, nextFoamColor, lerpValue);

    finalColor = finalColor + foamColor;
    finalColor = LinearToSRGB(finalColor);
    gl_FragColor = vec4(finalColor, alpha);
}
    
void main() 
{
    if(waterDepth < -0.001)
        discard;
    DirectionalFlow();
    // FlowStrength();
}
`;


export { WaterVertexShader,  WaterFragmentShader}