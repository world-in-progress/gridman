#ifdef VERTEX_SHADER

precision highp float;

out vec2 v_uv;

// X, Y, U, V
vec4[] hardCodedRectanglePosition = vec4[4](
    vec4(-1.0, -1.0, 0.0, 0.0),   // Bottom left
    vec4(-1.0, 1.0, 0.0, 1.0),    // Top left
    vec4(1.0, -1.0, 1.0, 0.0),    // Bottom right
    vec4(1.0, 1.0, 1.0, 1.0)      // Top right
);

void main() {
    vec2 position = hardCodedRectanglePosition[gl_VertexID].xy;
    gl_Position = vec4(position, 0.0, 1.0);
    v_uv = hardCodedRectanglePosition[gl_VertexID].zw;
}

#endif

#ifdef FRAGMENT_SHADER

precision highp float;

in vec2 v_uv;

uniform vec2 uForce;
uniform vec4 uAction;
uniform vec2 uResolution;
uniform sampler2D uTexture;

out vec4 fragColor;

void main() {
    vec2 resolution = uResolution - 1.0;
    float repulsionForce = uAction.x;
    float repulsionRadius = uAction.y;
    float friction = uAction.z;
    float returnSpeed = uAction.w;

    vec4 particle = texture(uTexture, v_uv);
    float x = particle.x;
    float y = particle.y;
    float vx = particle.z;
    float vy = particle.w;
    vec2 originPos = v_uv * resolution;
    bool isActive = particle.x >= 0.0 && particle.y >= 0.0;

    float dx = x - uForce.x * resolution.x;
    float dy = y - uForce.y * resolution.y;
    float dis = sqrt(dx * dx + dy * dy);

    if (dis < repulsionRadius) {
        float angle = atan(dy, dx);
        float ratio = (repulsionRadius - dis) / repulsionRadius;
        float force = ratio * ratio * repulsionForce;

        vx += cos(angle) * force;
        vy += sin(angle) * force;
    }

    float returnX = (originPos.x - x) * returnSpeed;
    float returnY = (originPos.y - y) * returnSpeed;
    vx += returnX;
    vy += returnY;

    vx *= (1.0 - friction);
    vy *= (1.0 - friction);

    x += vx;
    y += vy;
    
    if (isActive) {
        x = clamp(x, 0.0, resolution.x);
        y = clamp(y, 0.0, resolution.y);
        fragColor = vec4(x, y, vx, vy);
    } else {
        fragColor = particle; // inactive particles
    }
}

#endif