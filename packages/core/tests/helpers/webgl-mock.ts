import { vi } from 'vitest';

/** Minimal WebGL1-like constants for the mock context. */
export const GL_CONSTANTS = {
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  STATIC_DRAW: 35044,
  FLOAT: 5126,
  UNSIGNED_SHORT: 5123,
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  TRIANGLES: 4,
  LINES: 1,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
} as const;

export type MockGL = ReturnType<typeof createMockWebGLContext>;

let attrLocation = 0;

/**
 * WebGL mock sufficient for MiniGl + MeshGradient init/draw/destroy.
 */
export function createMockWebGLContext(canvas: HTMLCanvasElement) {
  let id = 0;
  const nextId = () => ++id;

  const nextHandle = () =>
    ({
      _id: nextId(),
    }) as unknown as WebGLShader & WebGLProgram & WebGLBuffer & WebGLUniformLocation;

  const gl = {
    ...GL_CONSTANTS,
    canvas,
    drawingBufferWidth: 300,
    drawingBufferHeight: 150,
    viewport: vi.fn(),
    createShader: vi.fn(() => nextHandle() as WebGLShader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    createProgram: vi.fn(() => nextHandle() as WebGLProgram),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    useProgram: vi.fn(),
    getUniformLocation: vi.fn(() => nextHandle() as WebGLUniformLocation | null),
    getAttribLocation: vi.fn(() => {
      attrLocation += 1;

      return attrLocation - 1;
    }),
    createBuffer: vi.fn(() => nextHandle() as WebGLBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawElements: vi.fn(),
    clearColor: vi.fn(),
    clearDepth: vi.fn(),
    clear: vi.fn(),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform2fv: vi.fn(),
    uniform3fv: vi.fn(),
    uniform4fv: vi.fn(),
    uniformMatrix4fv: vi.fn(),
  };

  return gl as unknown as WebGLRenderingContext;
}

export type GetContextSpy = ReturnType<typeof installWebGLGetContextMock>;

/**
 * Intercepts only WebGL context names; lets `2d` fall through (null in tests).
 */
export function installWebGLGetContextMock() {
  const store: { ctx: MockGL | null; canvas: HTMLCanvasElement | null; contextType: string | null } = {
    ctx: null,
    canvas: null,
    contextType: null,
  };

  const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function mockGetContext(
    this: HTMLCanvasElement,
    type,
    _attrs,
  ) {
    const t = String(type);

    if (t === 'webgl2' || t === 'webgl' || t === 'experimental-webgl') {
      store.canvas = this;
      store.contextType = t;
      store.ctx = createMockWebGLContext(this);

      return store.ctx as unknown as RenderingContext;
    }

    return null;
  });

  return {
    spy,
    get lastContext(): MockGL | null {
      return store.ctx;
    },
    get lastCanvas(): HTMLCanvasElement | null {
      return store.canvas;
    },
    get lastContextType(): string | null {
      return store.contextType;
    },
    reset() {
      store.ctx = null;
      store.canvas = null;
      store.contextType = null;
      attrLocation = 0;
    },
  };
}
