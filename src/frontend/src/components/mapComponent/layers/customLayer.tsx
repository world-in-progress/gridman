import mapboxgl from 'mapbox-gl';

interface CustomLayer {
  id: string;
  type: 'custom';
  onAdd: (map: mapboxgl.Map, gl: WebGLRenderingContext) => void;
  render: (gl: WebGLRenderingContext, matrix: number[]) => void;
  program?: WebGLProgram;
  aPos?: number;
  buffer?: WebGLBuffer;
}

interface RectangleOptions {
  center: { lng: number; lat: number };
  width: number; // Mercator
  height: number; // Mercator
}

export const CustomLayer = (options: RectangleOptions): CustomLayer => {
  const { center, width, height } = options;

  return {
    id: 'highlight',
    type: 'custom',

    onAdd: function (map: mapboxgl.Map, gl: WebGLRenderingContext): void {
      const vertexSource: string = `
        uniform mat4 u_matrix;
        attribute vec2 a_pos;
        void main() {
          gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
        }`;

      const fragmentSource: string = `
        void main() {
          gl_FragColor = vec4(1.0, 0.85, 0, 0.5);
        }`;

      const vertexShader: WebGLShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);

      const fragmentShader: WebGLShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);

      this.program = gl.createProgram()!;
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);

      this.aPos = gl.getAttribLocation(this.program, 'a_pos');

      const centerCoord: mapboxgl.MercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat({
        lng: center.lng,
        lat: center.lat,
      });

      const vertices: number[] = [
        centerCoord.x - width / 2, centerCoord.y - height / 2, // LB
        centerCoord.x - width / 2, centerCoord.y + height / 2, // LT
        centerCoord.x + width / 2, centerCoord.y - height / 2, // RB
        centerCoord.x + width / 2, centerCoord.y + height / 2, // RT
      ];

      this.buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    },

    render: function ( gl: WebGLRenderingContext, matrix: number[]): void {
      gl.useProgram(this.program!);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.program!, 'u_matrix'), false, matrix);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!);
      gl.enableVertexAttribArray(this.aPos!);
      gl.vertexAttribPointer(this.aPos!, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
    },
  };
};