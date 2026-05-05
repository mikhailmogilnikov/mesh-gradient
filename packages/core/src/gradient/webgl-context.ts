/** Default WebGL context attributes merged with user overrides. */
const DEFAULT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
};

/**
 * Returns a usable WebGL1-compatible rendering context (`webgl2` first — same shaders work on compliant browsers — then legacy).
 */
export function acquireWebGLContext(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes): WebGLRenderingContext | null {
  const attrs = { ...DEFAULT_ATTRIBUTES, ...contextAttributes };

  return (
    (canvas.getContext('webgl2', attrs) as WebGLRenderingContext | null) ??
    (canvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ??
    (canvas.getContext('experimental-webgl', attrs) as WebGLRenderingContext | null)
  );
}

/** Feature-detect without throwing (SSR-safe when guarded by caller). */
export function probeWebGLSupport(contextAttributes?: WebGLContextAttributes): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = acquireWebGLContext(canvas, {
      ...contextAttributes,
      failIfMajorPerformanceCaveat: false,
    });

    return ctx !== null;
  } catch {
    return false;
  }
}
