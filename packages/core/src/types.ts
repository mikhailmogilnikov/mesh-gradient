export type Vec3 = [number, number, number];
export type Vec4 = [0 | 1, 0 | 1, 0 | 1, 0 | 1];

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

/**
 * Active colors for the gradient.
 */
export interface MeshGradientToggleColorsConfig {
  1?: boolean;
  2?: boolean;
  3?: boolean;
  4?: boolean;
}

/**
 * Colors in hex format.
 * @example ['#ff0080', '#0080ff', '#80ff00', '#ff8000']
 */
export type MeshGradientColorsConfig = [string, string, string, string];

export interface MeshGradientFrequencyConfig {
  x?: number;
  y?: number;
  delta?: number;
}

export interface MeshGradientUpdateOptions {
  /**
   * Enable fade transition when updating gradient.
   * @default true
   */
  transition?: boolean;

  /**
   * Duration of fade transition in milliseconds.
   * @default 300
   */
  transitionDuration?: number;
}

export interface MeshGradientInitOptions {
  /**
   * Appearance mode. `smooth` enables smooth appearance transition when gradient is initialized.
   * @default 'smooth'
   */
  appearance?: 'smooth' | 'default';

  /**
   * Duration of appearance transition in milliseconds.
   * @default 300
   */
  appearanceDuration?: number;
}

export interface MeshGradientOptions {
  /**
   * Seed for the gradient. It needs to generate the same gradient pattern on every page load.
   * @default random value
   */
  seed?: number;

  /**
   * Animation speed multiplier. Higher values make animation faster, lower values make it slower. Performance remains constant regardless of speed value.
   * @default 1.0
   */
  animationSpeed?: number;

  /**
   * Frequency for the gradient. Can be a single number or an object with x, y, and delta properties.
   * @default { x:  0.00014, y: 0.00029, delta: 0.0001 }
   */
  frequency?: number | MeshGradientFrequencyConfig;

  /**
   * Active colors for the gradient.
   * @default { 1: true, 2: true, 3: true, 4: true }
   */
  activeColors?: MeshGradientToggleColorsConfig;

  /**
   * Static mode. If true, the gradient will not animate. Optimized for performance.
   * @default false
   */
  isStatic?: boolean;

  /**
   * Auto pause when gradient goes out of viewport. Powered by `Intersection Observer` API.
   * @default true
   */
  pauseOnOutsideViewport?: boolean;

  /**
   * Intersection observer options for pause on outside viewport option.
   * @default { root: document.body, rootMargin: '0px', threshold: 0.05 }
   */
  pauseObserverOptions?: IntersectionObserverInit;

  /**
   * Resize delay after canvas is resized. Helps to optimize performance.
   * @default 300 ms
   */
  resizeDelay?: number;

  /**
   * Colors in hex format. Should be an array of 4 colors in hex format.
   * @example ['#ff0080', '#0080ff', '#80ff00', '#ff8000']
   */
  colors?: MeshGradientColorsConfig;

  /**
   * Fallback to CSS variables instead of random colors if colors are not provided.
   * @example
   * ```css
   * :root {
   *   --mesh-gradient-color-1: #ff0080;
   *   --mesh-gradient-color-2: #0080ff;
   *   --mesh-gradient-color-3: #80ff00;
   *   --mesh-gradient-color-4: #ff8000;
   * }
   * ```
   * @default false
   */
  cssVariablesFallback?: boolean;
}
