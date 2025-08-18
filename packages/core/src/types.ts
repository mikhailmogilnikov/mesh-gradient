export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

// Types for MiniGl inner classes
export interface UniformConfig {
  type?: string;
  value?: unknown;
  transpose?: boolean;
  excludeFrom?: 'vertex' | 'fragment';
}

export interface AttributeConfig {
  target?: number;
  size?: number;
  type?: number;
}

export interface MiniGlUniform {
  type: string;
  value: unknown;
  transpose?: boolean;
  excludeFrom?: 'vertex' | 'fragment';
  typeFn: string;
  update(location?: WebGLUniformLocation | null): void;
  getDeclaration(name: string, type: 'vertex' | 'fragment', length?: number): string;
}

export interface MiniGlAttribute {
  type: number;
  normalized: boolean;
  buffer: WebGLBuffer | null;
  target: number;
  size: number;
  values?: Float32Array | Uint16Array;
  update(): void;
  attach(name: string, program: WebGLProgram): number;
  use(location: number): void;
}

export interface MiniGlPlaneGeometry {
  attributes: {
    position: MiniGlAttribute;
    uv: MiniGlAttribute;
    uvNorm: MiniGlAttribute;
    index: MiniGlAttribute;
    [k: string]: MiniGlAttribute;
  };
  xSegCount: number;
  ySegCount: number;
  vertexCount: number;
  quadCount: number;
  width: number;
  height: number;
  orientation: string;
  setTopology(xSegCount: number, ySegCount: number): void;
  setSize(width: number, height: number, orientation?: string): void;
}

export interface MiniGlMaterial {
  vertexSource: string;
  Source: string;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  program: WebGLProgram;
  uniforms: Record<string, MiniGlUniform>;
  uniformInstances: Array<{
    uniform: MiniGlUniform;
    location: WebGLUniformLocation | null;
  }>;
  attachUniforms(name: string | undefined, uniforms: MiniGlUniform | Record<string, MiniGlUniform>): void;
}

export interface MiniGlMesh {
  geometry: MiniGlPlaneGeometry;
  material: MiniGlMaterial;
  wireframe: boolean;
  attributeInstances: Array<{
    attribute: MiniGlAttribute;
    location: number;
  }>;
  draw(): void;
  remove(): void;
}

export type MiniGlUniformConstructor = new (config: UniformConfig) => MiniGlUniform;
export type MiniGlAttributeConstructor = new (config: AttributeConfig) => MiniGlAttribute;
export type MiniGlPlaneGeometryConstructor = new (
  width?: number,
  height?: number,
  xSegCount?: number,
  ySegCount?: number,
  orientation?: string,
) => MiniGlPlaneGeometry;
export type MiniGlMaterialConstructor = new (
  vertexShader: string,
  fragmentShader: string,
  uniforms?: Record<string, MiniGlUniform>,
) => MiniGlMaterial;
export type MiniGlMeshConstructor = new (geometry: MiniGlPlaneGeometry, material: MiniGlMaterial) => MiniGlMesh;

// Configuration interfaces for MeshGradient
export interface GradientConfig {
  presetName: string;
  wireframe: boolean;
  density: [number, number];
  zoom: number;
  rotation: number;
  playing: boolean;
}

export interface ShaderFiles {
  vertex: string;
  noise: string;
  blend: string;
  fragment: string;
}

export interface GradientConstructorOptions {
  canvas?: HTMLCanvasElement;
  debug?: boolean;
  autoInit?: boolean;
}

// Event handler types
export type EventHandler = () => void;
export type MouseEventHandler = (event: MouseEvent) => void;
export type AnimationFrameHandler = (time: number) => void;
