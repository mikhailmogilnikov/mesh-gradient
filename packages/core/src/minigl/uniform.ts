import type { MiniGlUniform as MiniGlUniformIface, UniformConfig } from '../types';

export class MiniGlUniform implements MiniGlUniformIface {
  private readonly gl: WebGLRenderingContext;
  type: string;
  value: unknown;
  transpose?: boolean;
  excludeFrom?: 'vertex' | 'fragment';
  typeFn: string;

  constructor(gl: WebGLRenderingContext, config: UniformConfig) {
    this.gl = gl;
    this.type = 'float';
    Object.assign(this, config);
    this.typeFn =
      (
        {
          float: '1f',
          int: '1i',
          vec2: '2fv',
          vec3: '3fv',
          vec4: '4fv',
          mat4: 'Matrix4fv',
        } as Record<string, string>
      )[this.type] || '1f';
  }

  update(location?: WebGLUniformLocation | null): void {
    if (typeof this.value === 'undefined') return;

    const ctx = this.gl;

    if (this.typeFn.startsWith('Matrix')) {
      const fn = (ctx as unknown as Record<string, (...args: unknown[]) => void>)['uniform' + this.typeFn];

      if (typeof fn === 'function') {
        fn.call(ctx, location, this.transpose ?? false, this.value);
      }

      return;
    }

    const fn = (ctx as unknown as Record<string, (...args: unknown[]) => void>)['uniform' + this.typeFn];

    if (typeof fn === 'function') {
      fn.call(ctx, location, this.value);
    }
  }

  getDeclaration(name: string, type: 'vertex' | 'fragment', length: number = 0): string {
    if (this.excludeFrom === type) return '';

    if (this.type === 'array') {
      const arr = this.value as MiniGlUniformIface[];
      const first = arr[0];
      const innerDecl = first.getDeclaration(name, type, arr.length);

      return innerDecl + `\nconst int ${name}_length = ${arr.length};`;
    }

    if (this.type === 'struct') {
      let nameNoPrefix = name.replace(/^u_/, '');

      nameNoPrefix = nameNoPrefix.charAt(0).toUpperCase() + nameNoPrefix.slice(1);
      const members = Object.entries(this.value as Record<string, MiniGlUniformIface>)
        .map(([memberName, memberUniform]) => memberUniform.getDeclaration(memberName, type).replace(/^uniform\s*/, ''))
        .join('\n');
      const lenSuffix = length > 0 ? `[${length}]` : '';

      return `struct ${nameNoPrefix} {\n${members}\n};\nuniform ${nameNoPrefix} ${name}${lenSuffix};`;
    }

    const lenSuffix = length > 0 ? `[${length}]` : '';

    return `uniform ${this.type} ${name}${lenSuffix};`;
  }
}
