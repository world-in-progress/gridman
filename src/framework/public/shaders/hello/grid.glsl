#ifdef VERTEX_SHADER

precision highp float;

uniform vec2 uGridDim;

out vec2 v_uv;
out vec2 v_global_uv;

// X, Y, U, V
vec4[] hardCodedGridPosition = vec4[4](
    vec4(0.0, 0.0, 0.0, 0.0),   // Bottom left
    vec4(0.0, 1.0, 0.0, 1.0),    // Top left
    vec4(1.0, 0.0, 1.0, 0.0),    // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)     // Top right
);

void main() {
    vec2 gridBL = vec2(gl_InstanceID % int(uGridDim.x), gl_InstanceID / int(uGridDim.x));
    vec2 gridTR = vec2(gl_InstanceID % int(uGridDim.x) + 1, gl_InstanceID / int(uGridDim.x) + 1);

    vec2 position = hardCodedGridPosition[gl_VertexID].xy;
    position.x = mix(gridBL.x, gridTR.x, position.x);
    position.y = mix(gridBL.y, gridTR.y, position.y);

    gl_Position = vec4(position / uGridDim * 2.0 - 1.0, 0.0, 1.0);
    v_uv = hardCodedGridPosition[gl_VertexID].zw * 2.0 - 1.0;
    v_global_uv = position / uGridDim;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp float;

in vec2 v_uv;
in vec2 v_global_uv;

uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    vec4 color = texture(uTexture, v_global_uv);
    if (color.a == 0.0) {
        discard;
    }

    if (abs(v_uv.x) > 0.90 || abs(v_uv.y) > 0.90) {
        vec4 gridColor = vec4(0.71, 0.17, 0.06, 0.1);
        fragColor = mix(gridColor, color, 0.4);
        
    } else {
        fragColor = color;
    }
}

#endif