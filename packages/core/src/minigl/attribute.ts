import type { MiniGlAttribute as MiniGlAttributeIface, AttributeConfig } from '../types';

export class MiniGlAttribute implements MiniGlAttributeIface {
  private readonly gl: WebGLRenderingContext;
  type: number;
  normalized: boolean;
  buffer: WebGLBuffer | null;
  target: number;
  size: number;
  values?: Float32Array | Uint16Array;

  constructor(gl: WebGLRenderingContext, config: AttributeConfig) {
    this.gl = gl;
    this.type = gl.FLOAT;
    this.normalized = false;
    this.buffer = gl.createBuffer();
    this.target = config.target ?? gl.ARRAY_BUFFER;
    this.size = config.size ?? 1;
    if (config.type !== undefined) {
      this.type = config.type;
    }
    this.update();
  }

  update(): void {
    if (typeof this.values !== 'undefined') {
      const gl = this.gl;

      gl.bindBuffer(this.target, this.buffer);
      gl.bufferData(this.target, this.values, gl.STATIC_DRAW);
    }
  }

  attach(name: string, program: WebGLProgram): number {
    const gl = this.gl;
    const location = gl.getAttribLocation(program, name);

    if (this.target === gl.ARRAY_BUFFER) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, this.size, this.type, this.normalized, 0, 0);
    }

    return location;
  }

  use(location: number): void {
    const gl = this.gl;

    gl.bindBuffer(this.target, this.buffer);
    if (this.target === gl.ARRAY_BUFFER) {
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, this.size, this.type, this.normalized, 0, 0);
    }
  }
}
