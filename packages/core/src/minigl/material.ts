import type { MiniGlMaterial as MiniGlMaterialIface, MiniGlUniform as MiniGlUniformIface } from '../types';
import type { MiniGlRuntime } from './runtime';

export class MiniGlMaterial implements MiniGlMaterialIface {
  vertexSource: string;
  Source: string;
  vertexShader!: WebGLShader;
  fragmentShader!: WebGLShader;
  program!: WebGLProgram;
  uniforms: Record<string, MiniGlUniformIface>;
  uniformInstances: Array<{
    uniform: MiniGlUniformIface;
    location: WebGLUniformLocation | null;
  }>;

  private readonly gl: WebGLRenderingContext;
  private readonly debugFn: (...args: string[]) => void;

  constructor(host: MiniGlRuntime, vertexShaders: string, fragments: string, uniforms: Record<string, MiniGlUniformIface> = {}) {
    this.gl = host.gl;
    this.debugFn = host.debug;
    const gl = this.gl;

    this.uniforms = uniforms;
    this.uniformInstances = [];

    const getShaderByType = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type);

      if (!shader) throw new Error('Cannot create shader');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // eslint-disable-next-line no-console
        console.error(gl.getShaderInfoLog(shader));
      }
      this.debugFn('Material.compileShaderSource', source);

      return shader;
    };

    const getUniformVariableDeclarations = (u: Record<string, MiniGlUniformIface>, shaderKind: 'vertex' | 'fragment') =>
      Object.entries(u)
        .map(([uniform, value]) => value.getDeclaration(uniform, shaderKind))
        .join('\n');

    const prefix = `
              precision highp float;
            `;

    this.vertexSource = `${prefix}
              attribute vec4 position;
              attribute vec2 uv;
              attribute vec2 uvNorm;
              ${getUniformVariableDeclarations(host.commonUniforms, 'vertex')}
              ${getUniformVariableDeclarations(uniforms, 'vertex')}
              ${vertexShaders}
            `;

    this.Source = `${prefix}
              ${getUniformVariableDeclarations(host.commonUniforms, 'fragment')}
              ${getUniformVariableDeclarations(uniforms, 'fragment')}
              ${fragments}
            `;

    this.vertexShader = getShaderByType(gl.VERTEX_SHADER, this.vertexSource);
    this.fragmentShader = getShaderByType(gl.FRAGMENT_SHADER, this.Source);

    const program = gl.createProgram();

    if (!program) throw new Error('Cannot create program');
    this.program = program;
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      // eslint-disable-next-line no-console
      console.error(gl.getProgramInfoLog(this.program));
    }
    gl.useProgram(this.program);

    this.attachUniforms(undefined, host.commonUniforms);
    this.attachUniforms(undefined, this.uniforms);
  }

  attachUniforms(name: string | undefined, uniforms: MiniGlUniformIface | Record<string, MiniGlUniformIface>): void {
    const material = this;
    const context = this.gl;

    if (typeof name === 'undefined') {
      if (uniforms && typeof uniforms === 'object' && !('type' in uniforms)) {
        Object.entries(uniforms as Record<string, MiniGlUniformIface>).forEach(([n, uniform]) => {
          material.attachUniforms(n, uniform);
        });

        return;
      }
    }

    const uniform = uniforms as MiniGlUniformIface;

    if (uniform.type === 'array') {
      (uniform.value as MiniGlUniformIface[]).forEach((u: MiniGlUniformIface, i: number) => {
        material.attachUniforms(`${name}[${i}]`, u);
      });

      return;
    }

    if (uniform.type === 'struct') {
      Object.entries(uniform.value as Record<string, MiniGlUniformIface>).forEach(([k, v]) => {
        material.attachUniforms(`${name}.${k}`, v);
      });

      return;
    }

    this.debugFn('Material.attachUniforms', name || '', uniform.type);
    material.uniformInstances.push({
      uniform,
      location: context.getUniformLocation(material.program, name!),
    });
  }
}
