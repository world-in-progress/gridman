
const FlowShader = `
// 定义常量
#define PI 3.14159265359

// 获取水流方向
vec2 GetFlowDirection(sampler2D flowMap, vec2 uv, vec2 offset, float gridResolution) {
    uv *= gridResolution;
    vec2 offset1 = offset * 0.5;
    vec2 offset2 = (1.0 - offset) * 0.5;
    uv = floor(uv + offset1);
    uv += offset2;
    uv /= gridResolution;
    vec2 direction = texture2D(flowMap, uv).rg;
    return direction;
}
            
vec2 GetFlowDirection(sampler2D huvMap, float minVelocityU, float maxVelocityU, float minVelocityV, float maxVelocityV, 
                        vec2 uv, vec2 offset, float gridResolution)
{
    uv *= gridResolution;
    vec2 offset1 = offset * 0.5;
    vec2 offset2 = (1.0 - offset) * 0.5;
    uv = floor(uv + offset1);
    uv += offset2;
    uv /= gridResolution;
    vec4 huv = texture2D(huvMap, uv);

    // huv.b = huv.b / huv.a

    float velocityU = mix(minVelocityU, maxVelocityU, huv.b);
    float velocityV = mix(minVelocityV, maxVelocityV, huv.a);
    vec2 direction = vec2(velocityU, velocityV);
    return direction;
}

// 旋转 UV 坐标
vec2 RotateUV(vec2 direction, vec2 uv, float gridResolution, float flowVelocityStrength, float wavePeriod, float time) {
    vec2 unitDir = normalize(direction);
    mat2 rotationMatrix = mat2(unitDir.y, unitDir.x, -unitDir.x, unitDir.y);
    // mat2 rotationMatrix = mat2(unitDir.y, -unitDir.x, unitDir.x, unitDir.y);
    vec2 newUV = rotationMatrix * uv;

    float timeY = time * 0.001 * 2.0;
    float dirLength = length(direction);
    dirLength *= flowVelocityStrength;
    float strength = timeY * dirLength;

    newUV = newUV * (gridResolution * wavePeriod) - vec2(0, strength);
    return newUV;
}

// 解包法线
vec3 UnpackNormal(vec4 packedNormal)
{
    return normalize(packedNormal.xyz * 2.0 - 1.0);
}

// 计算水流单元
void FlowCellByDir(vec2 dir1, vec2 dir2, vec2 dir3, vec2 dir4, 
                sampler2D normalMap, sampler2D displacementMap, sampler2D heightNoiseMap, sampler2D heightNoiseNormalMap,
                float lerpValue, vec2 uv, float gridResolution, float flowVelocityStrength, float wavePeriod, float time,
                out vec3 finalNormal, out float finalDisplacement, out vec2 finalVelocity) 
{

    vec2 newUV1 = RotateUV(dir1, uv, gridResolution, flowVelocityStrength, wavePeriod, time);
    vec2 newUV2 = RotateUV(dir2, uv, gridResolution, flowVelocityStrength, wavePeriod, time);
    vec2 newUV3 = RotateUV(dir3, uv, gridResolution, flowVelocityStrength, wavePeriod, time);
    vec2 newUV4 = RotateUV(dir4, uv, gridResolution, flowVelocityStrength, wavePeriod, time);

    float displacement1 = texture2D(displacementMap, newUV1).r;
    float displacement2 = texture2D(displacementMap, newUV2).r;
    float displacement3 = texture2D(displacementMap, newUV3).r;
    float displacement4 = texture2D(displacementMap, newUV4).r;

    vec3 normal1 = UnpackNormal(texture2D(normalMap, newUV1));
    vec3 normal2 = UnpackNormal(texture2D(normalMap, newUV2));
    vec3 normal3 = UnpackNormal(texture2D(normalMap, newUV3));
    vec3 normal4 = UnpackNormal(texture2D(normalMap, newUV4));

    float noise1 = texture2D(heightNoiseMap, newUV1).r;
    float noise2 = texture2D(heightNoiseMap, newUV2).r;
    float noise3 = texture2D(heightNoiseMap, newUV3).r;
    float noise4 = texture2D(heightNoiseMap, newUV4).r;

    vec3 noiseNormal1 = UnpackNormal(texture2D(heightNoiseNormalMap, newUV1));
    vec3 noiseNormal2 = UnpackNormal(texture2D(heightNoiseNormalMap, newUV2));
    vec3 noiseNormal3 = UnpackNormal(texture2D(heightNoiseNormalMap, newUV3));
    vec3 noiseNormal4 = UnpackNormal(texture2D(heightNoiseNormalMap, newUV4));

    displacement1 = (displacement1 + noise1) * 0.5;
    displacement2 = (displacement2 + noise2) * 0.5;
    displacement3 = (displacement3 + noise3) * 0.5;
    displacement4 = (displacement4 + noise4) * 0.5;

    normal1 = normalize(normal1 + noiseNormal1);
    normal2 = normalize(normal2 + noiseNormal2);
    normal3 = normalize(normal3 + noiseNormal3);
    normal4 = normalize(normal4 + noiseNormal4);

    vec2 uvFrac = fract(uv * gridResolution);
    uvFrac *= 2.0 * PI;
    uvFrac = cos(uvFrac) * 0.5 + 0.5;

    float w1 = (1.0 - uvFrac.r) * (1.0 - uvFrac.g);
    float w2 = uvFrac.r * (1.0 - uvFrac.g);
    float w3 = (1.0 - uvFrac.r) * uvFrac.g;
    float w4 = uvFrac.r * uvFrac.g;

    finalNormal = normalize(w1 * normal1 + w2 * normal2 + w3 * normal3 + w4 * normal4);
    finalDisplacement = w1 * displacement1 + w2 * displacement2 + w3 * displacement3 + w4 * displacement4;
    finalVelocity = w1 * dir1 + w2 * dir2 + w3 * dir3 + w4 * dir4;
}

// 计算水流单元
void FlowCell(sampler2D flowMap, sampler2D normalMap, sampler2D displacementMap, sampler2D heightNoiseMap, sampler2D heightNoiseNormalMap,
                float lerpValue, vec2 uv, float gridResolution, float flowVelocityStrength, float wavePeriod, float time,
                out vec3 finalNormal, out float finalDisplacement, out vec2 finalVelocity) 
{
    vec2 dir1 = GetFlowDirection(flowMap, uv, vec2(0.0, 0.0), gridResolution);
    vec2 dir2 = GetFlowDirection(flowMap, uv, vec2(1.0, 0.0), gridResolution);
    vec2 dir3 = GetFlowDirection(flowMap, uv, vec2(0.0, 1.0), gridResolution);
    vec2 dir4 = GetFlowDirection(flowMap, uv, vec2(1.0, 1.0), gridResolution);

    FlowCellByDir(dir1, dir2, dir3, dir4, normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap,
                    lerpValue, uv, gridResolution, flowVelocityStrength, wavePeriod, time,
                    finalNormal, finalDisplacement, finalVelocity);
}

void FlowCell(sampler2D huvMap, float minVelocityU, float maxVelocityU, float minVelocityV, float maxVelocityV, 
                sampler2D normalMap, sampler2D displacementMap, sampler2D heightNoiseMap, sampler2D heightNoiseNormalMap,
                float lerpValue, vec2 uv, float gridResolution, float flowVelocityStrength, float wavePeriod, float time,
                out vec3 finalNormal, out float finalDisplacement, out vec2 finalVelocity)
{
    vec2 dir1 = GetFlowDirection(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, uv, vec2(0.0, 0.0), gridResolution);
    vec2 dir2 = GetFlowDirection(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, uv, vec2(1.0, 0.0), gridResolution);
    vec2 dir3 = GetFlowDirection(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, uv, vec2(0.0, 1.0), gridResolution);
    vec2 dir4 = GetFlowDirection(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, uv, vec2(1.0, 1.0), gridResolution);

    FlowCellByDir(dir1, dir2, dir3, dir4, normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap,
                    lerpValue, uv, gridResolution, flowVelocityStrength, wavePeriod, time,
                    finalNormal, finalDisplacement, finalVelocity);
}
        
vec3 NormalStrength(vec3 normal, float strength) {
    return normalize(vec3(normal.x, normal.y, normal.z * strength));
}

// 获取方向性水流
void GetDirectionalFlow(vec2 uv, sampler2D huvMap, float minVelocityU, float maxVelocityU, float minVelocityV, float maxVelocityV, 
                        sampler2D normalMap, sampler2D displacementMap, sampler2D heightNoiseMap, sampler2D heightNoiseNormalMap,
                        float gridResolutionA, float flowVelocityStrengthA, float wavePeriodA,
                        float gridResolutionB, float flowVelocityStrengthB, float wavePeriodB,
                        float gridResolutionC, float flowVelocityStrengthC, float wavePeriodC,
                        float gridResolutionD, float flowVelocityStrengthD, float wavePeriodD,
                        float time, float normalStrength,
                        out vec3 finalNormal, out float finalDisplacement, out vec2 finalVelocity) {
    vec3 curNormal;
    float curDisplacement;
    vec2 curVelocity;

    FlowCell(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap, 0.0, uv, gridResolutionA, flowVelocityStrengthA, wavePeriodA, time, curNormal, curDisplacement, curVelocity);
    finalNormal = curNormal;
    finalDisplacement = curDisplacement;
    finalVelocity = curVelocity;

    FlowCell(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap, 0.0, uv, gridResolutionB, flowVelocityStrengthB, wavePeriodB, time, curNormal, curDisplacement, curVelocity);
    finalNormal += curNormal;
    finalDisplacement += curDisplacement;
    finalVelocity += curVelocity;

    FlowCell(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap, 0.0, uv, gridResolutionC, flowVelocityStrengthC, wavePeriodC, time, curNormal, curDisplacement, curVelocity);
    finalNormal += curNormal;
    finalDisplacement += curDisplacement;
    finalVelocity += curVelocity;

    FlowCell(huvMap, minVelocityU, maxVelocityU, minVelocityV, maxVelocityV, normalMap, displacementMap, heightNoiseMap, heightNoiseNormalMap, 0.0, uv, gridResolutionD, flowVelocityStrengthD, wavePeriodD, time, curNormal, curDisplacement, curVelocity);
    finalNormal += curNormal;
    finalDisplacement += curDisplacement;
    finalVelocity += curVelocity;

    finalNormal = normalize(finalNormal);
    finalDisplacement *= 0.25;
    finalVelocity *= 0.25;
}
`;

export { FlowShader }