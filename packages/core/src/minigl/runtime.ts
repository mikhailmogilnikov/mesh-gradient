import type { MiniGlMesh, MiniGlUniform } from '../types';

/** Shared surface passed to MiniGl sub-objects (avoids circular imports with MiniGl). */
export interface MiniGlRuntime {
  readonly gl: WebGLRenderingContext;
  commonUniforms: Record<string, MiniGlUniform>;
  debug: (...args: string[]) => void;
  meshes: MiniGlMesh[];
}
