#ifdef VERTEX_SHADER
precision highp float;

// 4个顶点用于矩形
attribute vec2 aPosition;

// 矩形的坐标信息
uniform mat4 uMatrix;
uniform vec4 uBounds; // [minLng, minLat, maxLng, maxLat]
uniform vec2 centerLow;
uniform vec2 centerHigh;
uniform vec2 relativeCenter;

// 传递到片段着色器的变量
varying vec2 vPosition;
varying vec4 vBounds;

// 计算相对于视图中心的坐标变换
vec2 translateRelativeToEye(vec2 high, vec2 low) {
    vec2 highDiff = high - centerHigh;
    vec2 lowDiff = low - centerLow;
    return highDiff + lowDiff;
}

void main() {
    // 由于矩形的四个顶点是根据 gl_VertexID 来确定的
    // 0: 左下 [uBounds.x, uBounds.y]
    // 1: 左上 [uBounds.x, uBounds.w]
    // 2: 右上 [uBounds.z, uBounds.w]
    // 3: 右下 [uBounds.z, uBounds.y]
    
    vec2 position;
    if (gl_VertexID == 0) {
        position = vec2(uBounds.x, uBounds.y); // 左下
    } else if (gl_VertexID == 1) {
        position = vec2(uBounds.x, uBounds.w); // 左上
    } else if (gl_VertexID == 2) {
        position = vec2(uBounds.z, uBounds.w); // 右上
    } else {
        position = vec2(uBounds.z, uBounds.y); // 右下
    }
    
    vPosition = position;
    vBounds = uBounds;
    
    // 应用坐标变换并传递到转换后的顶点
    gl_Position = uMatrix * vec4(translateRelativeToEye(relativeCenter, position), 0.0, 1.0);
}
#endif

#ifdef FRAGMENT_SHADER
precision highp float;

// 从顶点着色器传递的变量
varying vec2 vPosition;
varying vec4 vBounds;

// 项目矩形颜色和边框设置
uniform vec4 uFillColor;     // 填充颜色
uniform vec4 uBorderColor;   // 边框颜色
uniform float uBorderWidth;  // 边框宽度 (单位: 经纬度)
uniform int uSelected;       // 是否选中

void main() {
    // 检查当前点是否在边框内
    bool isOnBorder = 
        vPosition.x <= vBounds.x + uBorderWidth || 
        vPosition.x >= vBounds.z - uBorderWidth ||
        vPosition.y <= vBounds.y + uBorderWidth || 
        vPosition.y >= vBounds.w - uBorderWidth;
    
    // 根据是否在边框内设置不同的颜色
    if (isOnBorder) {
        gl_FragColor = uBorderColor;
    } else {
        // 选中时高亮
        if (uSelected == 1) {
            gl_FragColor = vec4(uFillColor.rgb * 1.5, uFillColor.a);
        } else {
            gl_FragColor = uFillColor;
        }
    }
}
#endif 