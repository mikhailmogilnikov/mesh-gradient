import type {
  MiniGlUniform,
  MiniGlAttribute,
  MiniGlPlaneGeometry,
  MiniGlMaterial,
  MiniGlMesh,
  MiniGlUniformConstructor,
  MiniGlAttributeConstructor,
  MiniGlPlaneGeometryConstructor,
  MiniGlMaterialConstructor,
  MiniGlMeshConstructor,
  UniformConfig,
  AttributeConfig,
} from './types';

/**
 * Essential WebGL functionality wrapper
 * Provides simplified interface for creating and managing WebGL meshes
 */
export class MiniGl {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  meshes: MiniGlMesh[];
  lastDebugMsg?: Date;
  debug: (...args: string[]) => void;
  commonUniforms!: Record<string, MiniGlUniform>;

  // Constructors for inner classes
  Uniform!: MiniGlUniformConstructor;
  Attribute!: MiniGlAttributeConstructor;
  PlaneGeometry!: MiniGlPlaneGeometryConstructor;
  Material!: MiniGlMaterialConstructor;
  Mesh!: MiniGlMeshConstructor;

  /**
   * Creates new MiniGL instance
   * @param canvas - HTML Canvas element
   * @param width - Canvas width
   * @param height - Canvas height
   * @param debug - Enable debug mode
   */
  constructor(canvas: HTMLCanvasElement, width?: number | null, height?: number | null, debug: boolean = false) {
    const _miniGl = this;
    const isDebugEnabled = document.location.search.toLowerCase().indexOf('debug=webgl') !== -1;

    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { antialias: true });

    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    this.meshes = [];

    const context = this.gl;

    if (width && height) {
      this.setSize(width, height);
    }

    this.lastDebugMsg = undefined;
    // Setup debug function
    this.debug =
      debug && isDebugEnabled
        ? function (...args: string[]) {
            const message = args[0] || '';
            const currentTime = new Date();

            // Add separator if more than a second has passed
            if (!_miniGl.lastDebugMsg || currentTime.getTime() - _miniGl.lastDebugMsg.getTime() > 1000) {
              // eslint-disable-next-line no-console
              console.log('---');
            }

            // Format message with alignment
            const timestamp = currentTime.toLocaleTimeString();
            const padding = Array(Math.max(0, 32 - message.length)).join(' ');

            // eslint-disable-next-line no-console
            console.log(timestamp + padding + message + ': ', ...args.slice(1));

            _miniGl.lastDebugMsg = currentTime;
          }
        : () => {};

    Object.defineProperties(_miniGl, {
      Material: {
        enumerable: false,
        value: class implements MiniGlMaterial {
          vertexSource: string;
          Source: string;
          vertexShader!: WebGLShader;
          fragmentShader!: WebGLShader;
          program!: WebGLProgram;
          uniforms: Record<string, MiniGlUniform>;
          uniformInstances: Array<{
            uniform: MiniGlUniform;
            location: WebGLUniformLocation | null;
          }>;

          constructor(vertexShaders: string, fragments: string, uniforms: Record<string, MiniGlUniform> = {}) {
            function getShaderByType(type: number, source: string): WebGLShader {
              const shader = context.createShader(type);

              if (!shader) throw new Error('Cannot create shader');
              context.shaderSource(shader, source);
              context.compileShader(shader);
              if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
                // eslint-disable-next-line no-console
                console.error(context.getShaderInfoLog(shader));
              }
              _miniGl.debug('Material.compileShaderSource', source);

              return shader;
            }

            function getUniformVariableDeclarations(uniforms: Record<string, MiniGlUniform>, type: 'vertex' | 'fragment') {
              return Object.entries(uniforms)
                .map(([uniform, value]) => value.getDeclaration(uniform, type))
                .join('\n');
            }

            this.uniforms = uniforms;
            this.uniformInstances = [];

            const prefix = `
              precision highp float;
            `;

            this.vertexSource = `${prefix}
              attribute vec4 position;
              attribute vec2 uv;
              attribute vec2 uvNorm;
              ${getUniformVariableDeclarations(_miniGl.commonUniforms, 'vertex')}
              ${getUniformVariableDeclarations(uniforms, 'vertex')}
              ${vertexShaders}
            `;

            this.Source = `${prefix}
              ${getUniformVariableDeclarations(_miniGl.commonUniforms, 'fragment')}
              ${getUniformVariableDeclarations(uniforms, 'fragment')}
              ${fragments}
            `;

            this.vertexShader = getShaderByType(context.VERTEX_SHADER, this.vertexSource);
            this.fragmentShader = getShaderByType(context.FRAGMENT_SHADER, this.Source);

            const program = context.createProgram();

            if (!program) throw new Error('Cannot create program');
            this.program = program;
            context.attachShader(this.program, this.vertexShader);
            context.attachShader(this.program, this.fragmentShader);
            context.linkProgram(this.program);
            if (!context.getProgramParameter(this.program, context.LINK_STATUS)) {
              // eslint-disable-next-line no-console
              console.error(context.getProgramInfoLog(this.program));
            }
            context.useProgram(this.program);

            this.attachUniforms(undefined, _miniGl.commonUniforms);
            this.attachUniforms(undefined, this.uniforms);
          }

          attachUniforms(name: string | undefined, uniforms: MiniGlUniform | Record<string, MiniGlUniform>) {
            const material = this;

            if (typeof name === 'undefined') {
              if (uniforms && typeof uniforms === 'object' && !('type' in uniforms)) {
                Object.entries(uniforms as Record<string, MiniGlUniform>).forEach(([n, uniform]) => {
                  material.attachUniforms(n, uniform);
                });

                return;
              }
            }

            const uniform = uniforms as MiniGlUniform;

            if (uniform.type === 'array') {
              (uniform.value as MiniGlUniform[]).forEach((u: MiniGlUniform, i: number) => {
                material.attachUniforms(`${name}[${i}]`, u);
              });

              return;
            }

            if (uniform.type === 'struct') {
              Object.entries(uniform.value as Record<string, MiniGlUniform>).forEach(([k, v]) => {
                material.attachUniforms(`${name}.${k}`, v);
              });

              return;
            }

            _miniGl.debug('Material.attachUniforms', name || '', uniform.type);
            material.uniformInstances.push({
              uniform,
              location: context.getUniformLocation(material.program, name!),
            });
          }
        },
      },
      Uniform: {
        enumerable: false,
        value: class implements MiniGlUniform {
          type: string;
          value: unknown;
          transpose?: boolean;
          excludeFrom?: 'vertex' | 'fragment';
          typeFn: string;

          constructor(config: UniformConfig) {
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

          update(location?: WebGLUniformLocation | null) {
            if (typeof this.value === 'undefined') return;

            if (this.typeFn.startsWith('Matrix')) {
              const fn = (context as unknown as Record<string, Function>)['uniform' + this.typeFn];

              if (typeof fn === 'function') {
                fn.call(context, location, this.transpose ?? false, this.value);
              }

              return;
            }

            const fn = (context as unknown as Record<string, Function>)['uniform' + this.typeFn];

            if (typeof fn === 'function') {
              if (this.typeFn.endsWith('v')) {
                fn.call(context, location, this.value);
              } else {
                fn.call(context, location, this.value);
              }
            }
          }

          getDeclaration(name: string, type: 'vertex' | 'fragment', length: number = 0): string {
            const uniform = this;

            if (uniform.excludeFrom === type) return '';

            if (uniform.type === 'array') {
              const first = (uniform.value as MiniGlUniform[])[0];
              const innerDecl = first.getDeclaration(name, type, (uniform.value as MiniGlUniform[]).length);

              return innerDecl + `\nconst int ${name}_length = ${(uniform.value as MiniGlUniform[]).length};`;
            }

            if (uniform.type === 'struct') {
              let name_no_prefix = name.replace(/^u_/, '');

              name_no_prefix = name_no_prefix.charAt(0).toUpperCase() + name_no_prefix.slice(1);
              const members = Object.entries(uniform.value as Record<string, MiniGlUniform>)
                .map(([memberName, memberUniform]) => memberUniform.getDeclaration(memberName, type).replace(/^uniform\s*/, ''))
                .join('\n');
              const lenSuffix = length > 0 ? `[${length}]` : '';

              return `struct ${name_no_prefix} {\n${members}\n};\nuniform ${name_no_prefix} ${name}${lenSuffix};`;
            }

            const lenSuffix = length > 0 ? `[${length}]` : '';

            return `uniform ${uniform.type} ${name}${lenSuffix};`;
          }
        },
      },
      PlaneGeometry: {
        enumerable: false,
        value: class implements MiniGlPlaneGeometry {
          attributes: {
            position: MiniGlAttribute;
            uv: MiniGlAttribute;
            uvNorm: MiniGlAttribute;
            index: MiniGlAttribute;
            [k: string]: MiniGlAttribute;
          };
          xSegCount!: number;
          ySegCount!: number;
          vertexCount!: number;
          quadCount!: number;
          width!: number;
          height!: number;
          orientation!: string;

          constructor(width: number = 1, height: number = 1, n: number = 1, i: number = 1, orientation: string = 'xz') {
            context.createBuffer();
            this.attributes = {
              position: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 3,
              }),
              uv: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 2,
              }),
              uvNorm: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 2,
              }),
              index: new _miniGl.Attribute({
                target: context.ELEMENT_ARRAY_BUFFER,
                size: 3,
                type: context.UNSIGNED_SHORT,
              }),
            };
            this.setTopology(n, i);
            this.setSize(width, height, orientation);
          }

          setTopology(e: number = 1, t: number = 1) {
            const nthis: any = this;

            nthis.xSegCount = e;
            nthis.ySegCount = t;
            nthis.vertexCount = (nthis.xSegCount + 1) * (nthis.ySegCount + 1);
            nthis.quadCount = nthis.xSegCount * nthis.ySegCount * 2;
            nthis.attributes.uv.values = new Float32Array(2 * nthis.vertexCount);
            nthis.attributes.uvNorm.values = new Float32Array(2 * nthis.vertexCount);
            nthis.attributes.index.values = new Uint16Array(3 * nthis.quadCount);

            // Generate mesh vertices and UV coordinates
            for (let yy = 0; yy <= nthis.ySegCount; yy++) {
              for (let xx = 0; xx <= nthis.xSegCount; xx++) {
                const i = yy * (nthis.xSegCount + 1) + xx;

                // UV coordinates (0-1)
                nthis.attributes.uv.values[2 * i] = xx / nthis.xSegCount;
                nthis.attributes.uv.values[2 * i + 1] = 1 - yy / nthis.ySegCount;

                // Normalized UV coordinates (-1 to 1)
                nthis.attributes.uvNorm.values[2 * i] = (xx / nthis.xSegCount) * 2 - 1;
                nthis.attributes.uvNorm.values[2 * i + 1] = 1 - (yy / nthis.ySegCount) * 2;

                // Create triangle indices (2 triangles per quad)
                if (xx < nthis.xSegCount && yy < nthis.ySegCount) {
                  const s = yy * nthis.xSegCount + xx;

                  // First triangle
                  nthis.attributes.index.values[6 * s] = i;
                  nthis.attributes.index.values[6 * s + 1] = i + 1 + nthis.xSegCount;
                  nthis.attributes.index.values[6 * s + 2] = i + 1;
                  // Second triangle
                  nthis.attributes.index.values[6 * s + 3] = i + 1;
                  nthis.attributes.index.values[6 * s + 4] = i + 1 + nthis.xSegCount;
                  nthis.attributes.index.values[6 * s + 5] = i + 2 + nthis.xSegCount;
                }
              }
            }

            nthis.attributes.uv.update();
            nthis.attributes.uvNorm.update();
            nthis.attributes.index.update();
            _miniGl.debug('Geometry.setTopology');
          }

          /**
           * Sets plane size and orientation
           * @param width - Plane width
           * @param height - Plane height
           * @param orientation - Plane orientation ("xz", "xy", etc.)
           */
          setSize(width: number = 1, height: number = 1, orientation: string = 'xz') {
            const geometry: any = this;

            geometry.width = width;
            geometry.height = height;
            geometry.orientation = orientation;

            // Check if we need to recreate position buffer
            if (!(geometry.attributes.position.values && geometry.attributes.position.values.length === 3 * geometry.vertexCount)) {
              geometry.attributes.position.values = new Float32Array(3 * geometry.vertexCount);
            }

            // Offsets for centering plane
            const o = width / -2;
            const r = height / -2;
            const segment_width = width / geometry.xSegCount;
            const segment_height = height / geometry.ySegCount;

            // Generate vertex positions on grid
            for (let yIndex = 0; yIndex <= geometry.ySegCount; yIndex++) {
              const ty = r + yIndex * segment_height;

              for (let xIndex = 0; xIndex <= geometry.xSegCount; xIndex++) {
                const rx = o + xIndex * segment_width;
                const l = yIndex * (geometry.xSegCount + 1) + xIndex;

                // Set coordinates according to orientation
                geometry.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[0])] = rx;
                geometry.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[1])] = -ty;
              }
            }

            geometry.attributes.position.update();
            _miniGl.debug('Geometry.setSize');
          }
        },
      },
      Mesh: {
        enumerable: false,
        value: class implements MiniGlMesh {
          geometry!: MiniGlPlaneGeometry;
          material!: MiniGlMaterial;
          wireframe: boolean = false;
          attributeInstances: Array<{
            attribute: MiniGlAttribute;
            location: number;
          }> = [];

          constructor(geometry: MiniGlPlaneGeometry, material: MiniGlMaterial) {
            const mesh: any = this;

            mesh.geometry = geometry;
            mesh.material = material;
            mesh.wireframe = false;
            mesh.attributeInstances = [];

            Object.entries(mesh.geometry.attributes).forEach(([e, attribute]) => {
              const attr = attribute as MiniGlAttribute;

              mesh.attributeInstances.push({
                attribute: attr,
                location: attr.attach(e, mesh.material.program),
              });
            });

            _miniGl.meshes.push(mesh);
            _miniGl.debug('Mesh.constructor');
          }

          draw() {
            context.useProgram(this.material.program);
            this.material.uniformInstances.forEach((item: { uniform: MiniGlUniform; location: WebGLUniformLocation | null }) =>
              item.uniform.update(item.location),
            );
            this.attributeInstances.forEach(({ attribute, location }) => attribute.use(location));
            context.drawElements(
              this.wireframe ? context.LINES : context.TRIANGLES,
              this.geometry.attributes.index.values?.length || 0,
              context.UNSIGNED_SHORT,
              0,
            );
          }

          remove() {
            _miniGl.meshes = _miniGl.meshes.filter((m) => m !== this);
          }
        },
      },
      Attribute: {
        enumerable: false,
        value: class implements MiniGlAttribute {
          type: number;
          normalized: boolean;
          buffer: WebGLBuffer | null;
          target: number;
          size: number;
          values?: Float32Array | Uint16Array;
          constructor(config: AttributeConfig) {
            this.type = context.FLOAT;
            this.normalized = false;
            this.buffer = context.createBuffer();
            this.target = config.target || context.ARRAY_BUFFER;
            this.size = config.size || 1;
            if (config.type !== undefined) {
              this.type = config.type;
            }
            this.update();
          }

          update() {
            if (typeof this.values !== 'undefined') {
              context.bindBuffer(this.target, this.buffer);
              context.bufferData(this.target, this.values, context.STATIC_DRAW);
            }
          }

          attach(name: string, program: WebGLProgram): number {
            const location = context.getAttribLocation(program, name);

            if (this.target === context.ARRAY_BUFFER) {
              context.enableVertexAttribArray(location);
              context.vertexAttribPointer(location, this.size, this.type, this.normalized, 0, 0);
            }

            return location;
          }

          use(location: number): void {
            context.bindBuffer(this.target, this.buffer);
            if (this.target === context.ARRAY_BUFFER) {
              context.enableVertexAttribArray(location);
              context.vertexAttribPointer(location, this.size, this.type, this.normalized, 0, 0);
            }
          }
        },
      },
    });

    // 4x4 identity matrix
    const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    // Common uniforms for all meshes
    this.commonUniforms = {
      projectionMatrix: new (this as unknown as { Uniform: MiniGlUniformConstructor }).Uniform({
        type: 'mat4',
        value: identityMatrix,
      }),
      modelViewMatrix: new (this as unknown as { Uniform: MiniGlUniformConstructor }).Uniform({
        type: 'mat4',
        value: identityMatrix,
      }),
      resolution: new (this as unknown as { Uniform: MiniGlUniformConstructor }).Uniform({ type: 'vec2', value: [1, 1] }),
      aspectRatio: new (this as unknown as { Uniform: MiniGlUniformConstructor }).Uniform({ type: 'float', value: 1 }),
    };
  }

  /**
   * Sets canvas and viewport size
   * @param width - Canvas width
   * @param height - Canvas height
   */
  setSize(width: number = 640, height: number = 480) {
    // Store dimensions in object
    (this as unknown as { width: number; height: number }).width = width;
    (this as unknown as { width: number; height: number }).height = height;

    // Update canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Update WebGL viewport
    this.gl.viewport(0, 0, width, height);

    // Update uniforms
    this.commonUniforms.resolution.value = [width, height];
    this.commonUniforms.aspectRatio.value = width / height;

    this.debug('MiniGL.setSize');
  }

  /**
   * Sets up orthographic camera
   * @param x - X offset
   * @param y - Y offset
   * @param z - Z offset
   * @param near - Near clipping plane
   * @param far - Far clipping plane
   */
  setOrthographicCamera(x = 0, y = 0, z = 0, near = -2000, far = 2000) {
    const width = (this as unknown as { width: number }).width;
    const height = (this as unknown as { height: number }).height;

    // Orthographic projection matrix
    this.commonUniforms.projectionMatrix.value = [
      2 / width, // scaleX
      0,
      0,
      0,
      0,
      2 / height, // scaleY
      0,
      0,
      0,
      0,
      2 / (near - far), // scaleZ
      0,
      x, // translateX
      y, // translateY
      z, // translateZ
      1,
    ];

    this.debug('setOrthographicCamera');
  }

  /**
   * Renders all meshes to canvas
   */
  render() {
    // Clear screen with transparent background
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);

    // Draw all meshes
    this.meshes.forEach((mesh) => mesh.draw());
  }

  // dynamic fields
  width!: number;
  height!: number;

  // declare static placeholders for TypeScript (they are assigned via defineProperties on instances)
  static Uniform: any;
  static Attribute: any;
  static PlaneGeometry: any;
  static Material: any;
  static Mesh: any;
}
