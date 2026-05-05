import type {
  MiniGlUniform,
  MiniGlMesh,
  MiniGlPlaneGeometry,
  MiniGlMaterial,
  MiniGlUniformConstructor,
  MiniGlAttributeConstructor,
  MiniGlPlaneGeometryConstructor,
  MiniGlMaterialConstructor,
  MiniGlMeshConstructor,
  UniformConfig,
  AttributeConfig,
} from '../types';
import type { MiniGlRuntime } from './runtime';

import * as CORE_CONSTANTS from '../constants';
import { acquireWebGLContext } from '../gradient/webgl-context';

import { MiniGlAttribute as MiniGlAttributeBase } from './attribute';
import { MiniGlMesh as MiniGlMeshBase } from './mesh';
import { MiniGlMaterial as MiniGlMaterialBase } from './material';
import { MiniGlPlaneGeometry as MiniGlPlaneGeometryBase } from './plane-geometry';
import { MiniGlUniform as MiniGlUniformBase } from './uniform';

export interface MiniGlInitOptions {
  debug?: boolean;
  contextAttributes?: WebGLContextAttributes;
}

/** Essential WebGL functionality wrapper — meshes, shaders, uniforms. */
export class MiniGl implements MiniGlRuntime {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGLRenderingContext;
  meshes: MiniGlMesh[] = [];

  lastDebugMsg?: Date;
  debug: (...args: string[]) => void;

  commonUniforms!: Record<string, MiniGlUniform>;

  Uniform!: MiniGlUniformConstructor;
  Attribute!: MiniGlAttributeConstructor;
  PlaneGeometry!: MiniGlPlaneGeometryConstructor;
  Material!: MiniGlMaterialConstructor;
  Mesh!: MiniGlMeshConstructor;

  /** Logical (CSS-pixel) extents for projection; buffer may be larger when DPR > 1. */
  logicalWidth = 640;
  logicalHeight = 480;

  constructor(canvas: HTMLCanvasElement, options?: MiniGlInitOptions) {
    const isDebugEnabled = document.location.search.toLowerCase().includes(CORE_CONSTANTS.DEBUG_QUERY_STRING);

    this.canvas = canvas;
    const gl = acquireWebGLContext(canvas, options?.contextAttributes);

    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    const self = this;

    this.lastDebugMsg = undefined;

    this.debug =
      options?.debug && isDebugEnabled
        ? function debugLog(...args: string[]) {
            const message = args[0] || '';
            const currentTime = new Date();

            if (!self.lastDebugMsg || currentTime.getTime() - self.lastDebugMsg.getTime() > 1000) {
              // eslint-disable-next-line no-console
              console.log('---');
            }

            const timestamp = currentTime.toLocaleTimeString();
            const padding = Array(Math.max(0, 32 - message.length)).join(' ');

            // eslint-disable-next-line no-console
            console.log(timestamp + padding + message + ': ', ...args.slice(1));

            self.lastDebugMsg = currentTime;
          }
        : () => {};

    const boundGl = this.gl;
    const runtime: MiniGlRuntime = this;

    this.Uniform = class extends MiniGlUniformBase {
      constructor(config: UniformConfig) {
        super(boundGl, config);
      }
    } as unknown as MiniGlUniformConstructor;

    this.Attribute = class extends MiniGlAttributeBase {
      constructor(config: AttributeConfig) {
        super(boundGl, config);
      }
    } as unknown as MiniGlAttributeConstructor;

    this.Material = class extends MiniGlMaterialBase {
      constructor(vertexShader: string, fragmentShader: string, uniforms?: Record<string, MiniGlUniform>) {
        super(runtime, vertexShader, fragmentShader, uniforms);
      }
    } as unknown as MiniGlMaterialConstructor;

    this.PlaneGeometry = class extends MiniGlPlaneGeometryBase {
      constructor(width = 1, height = 1, n = 1, i = 1, orientation = 'xz') {
        super(runtime, width, height, n, i, orientation);
      }
    } as unknown as MiniGlPlaneGeometryConstructor;

    this.Mesh = class extends MiniGlMeshBase {
      constructor(geometry: MiniGlPlaneGeometry, material: MiniGlMaterial) {
        super(runtime, geometry, material);
      }
    } as unknown as MiniGlMeshConstructor;

    const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    this.commonUniforms = {
      projectionMatrix: new this.Uniform({ type: 'mat4', value: identityMatrix }),
      modelViewMatrix: new this.Uniform({ type: 'mat4', value: identityMatrix }),
      resolution: new this.Uniform({ type: 'vec2', value: [1, 1] }),
      bufferResolution: new this.Uniform({ type: 'vec2', value: [1, 1] }),
      aspectRatio: new this.Uniform({ type: 'float', value: 1 }),
    };
  }

  /**
   * @param cssWidth - Layout width in CSS pixels (orthographic mesh space)
   * @param cssHeight - Layout height in CSS pixels
   * @param pixelRatio - Backing-store scale for HiDPI (does not affect logical mesh extents)
   */
  setSize(cssWidth: number = 640, cssHeight: number = 480, pixelRatio: number = 1): void {
    const safePr = pixelRatio > 0 ? pixelRatio : 1;
    const bufW = Math.max(1, Math.round(cssWidth * safePr));
    const bufH = Math.max(1, Math.round(cssHeight * safePr));

    this.logicalWidth = cssWidth;
    this.logicalHeight = cssHeight;

    this.canvas.width = bufW;
    this.canvas.height = bufH;

    // Do not set canvas.style width/height: pixel sizes override author CSS (e.g. `width: 100%`) and
    // prevent responsive layout + ResizeObserver updates. Logical size must come from layout/CSS;
    // backing-store size is bufW/bufH only.

    this.gl.viewport(0, 0, bufW, bufH);

    this.commonUniforms.resolution.value = [cssWidth, cssHeight];
    this.commonUniforms.bufferResolution.value = [bufW, bufH];
    this.commonUniforms.aspectRatio.value = cssWidth / cssHeight;

    this.debug('MiniGL.setSize');
  }

  setOrthographicCamera(x = 0, y = 0, z = 0, near = -2000, far = 2000): void {
    const width = this.logicalWidth;
    const height = this.logicalHeight;

    this.commonUniforms.projectionMatrix.value = [2 / width, 0, 0, 0, 0, 2 / height, 0, 0, 0, 0, 2 / (near - far), 0, x, y, z, 1];

    this.debug('setOrthographicCamera');
  }

  render(): void {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((mesh) => mesh.draw());
  }
}
