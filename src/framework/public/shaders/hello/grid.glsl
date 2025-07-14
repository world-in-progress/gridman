#ifdef VERTEX_SHADER

precision highp float;

out vec2 v_uv;

// X, Y, U, V
vec4[] hardCodedCanvasPosition = vec4[4](
    vec4(-1.0, -1.0, 0.0, 0.0),     // Bottom left
    vec4(-1.0, 1.0, 0.0, 1.0),      // Top left
    vec4(1.0, -1.0, 1.0, 0.0),      // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)        // Top right
);

void main() {
    vec2 position = hardCodedCanvasPosition[gl_VertexID].xy;
    gl_Position = vec4(position, 0.0, 1.0);
    v_uv = hardCodedCanvasPosition[gl_VertexID].zw;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp int;
precision highp float;

in vec2 v_uv;

uniform vec2 uResolution;
uniform int uGridDimFactor;
uniform int uGridResolution;

uniform float uTime;
uniform float uPulseRadius;
uniform vec2 uPulseCenter;

uniform sampler2D uHello;
uniform sampler2D uCooperation;

out vec4 fragColor;

void main() {
    // Calculate dynamic grid factor based on pulse history
    int dynamicGridFactor = uGridDimFactor;

    // Check if this area has been hit by pulse
    float pulsePhase = uTime;
    float pulseDistance = pulsePhase * uPulseRadius;
    float distanceFromCenter = length(v_uv * uResolution - uPulseCenter * uResolution);

    // If this pixel has been swept by the pulse
    if (distanceFromCenter <= pulseDistance) {
        dynamicGridFactor += 1;
    }

    // Self Grid Index
    ivec2 pixelCoord = ivec2(v_uv * uResolution);
    int gridSize = uGridResolution / (1 << dynamicGridFactor);
    ivec2 gridId = pixelCoord / gridSize;
    ivec2 pixelInGrid = ivec2(pixelCoord) % gridSize;

    // Check if pixel is on grid edge
    bool isOnEdge = (pixelInGrid.x <= 1 || pixelInGrid.x >= (gridSize - 2) ||
                    pixelInGrid.y <= 1 || pixelInGrid.y >= (gridSize - 2));

    vec4 color = vec4(0.0);
    if (gridSize > 1) {
        color = texture(uHello, v_uv);

        if (isOnEdge) {
            if (color.a > 0.0) {
                vec4 edgeColor = vec4(0.71, 0.17, 0.06, 0.5);
                fragColor = mix(edgeColor, color, 0.5);
            } else {
                vec4 edgeColor = vec4(0.5);
                fragColor = edgeColor;
            }
        }

    } else {
        fragColor = texture(uCooperation, v_uv);
    }
}

#endif