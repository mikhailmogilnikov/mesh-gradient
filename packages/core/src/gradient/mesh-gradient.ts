import type {
  Vec3,
  Vec4,
  MiniGlUniform,
  MiniGlMesh,
  MiniGlMaterial,
  MiniGlPlaneGeometry,
  GradientConfig,
  ShaderFiles,
  MeshGradientOptions,
  MeshGradientUpdateOptions,
  MeshGradientColorsConfig,
  MeshGradientInitOptions,
  MeshGradientCallbacks,
  MeshGradientReducedMotion,
} from '../types';

import { normalizeColor, parseHexColor, genRandomColors } from '../utils';
import { MiniGl } from '../minigl';
import { SHADERS } from '../shaders';
import * as CONSTANTS from '../constants';

import { InstanceTimers } from './instance-timers';
import { probeWebGLSupport } from './webgl-context';

type InitOptions = MeshGradientOptions & MeshGradientInitOptions;

const U_TIME_WRAP = 1e7;

/**
 * Gradient class for creating animated mesh gradients
 * Manages WebGL rendering of animated gradient effects
 */
export class MeshGradient {
  public static isSupported(contextAttributes?: WebGLContextAttributes): boolean {
    return probeWebGLSupport(contextAttributes);
  }

  /**
   * Whether the gradient is been initialized by calling `init` method.
   * @default false
   */
  public isInitialized = false;
  private destroyed = false;
  private instanceTimers = new InstanceTimers();

  /** Serializes chained fade transitions from `update` */
  private fadeGeneration = 0;
  private pollCssVarsCanceled = false;
  private animationRafId: number | null = null;

  private resizeObserver?: ResizeObserver;

  /** Backing-store scale for `MiniGl#setSize(cssW, cssH, pr)`. */
  private pixelRatioBacking = 1;
  /** Optional FPS cap (`targetFps` option). */
  private targetFpsCap?: number;
  private skipEveryOtherFrame = true;
  private lastFpsGateTime = 0;

  /** Last successful `init` / merged options snapshot for context restore */
  private lastInitOptions: InitOptions = {};

  /** Runtime hooks */
  private callbacks?: MeshGradientCallbacks;
  private allowDocumentFallback = false;
  private darkenTopFromOptions?: boolean;

  /** @see MeshGradientOptions['webglContextAttributes'] — stored per init */
  private webGlUserAttributes?: WebGLContextAttributes;
  /** @see MeshGradientOptions['useLegacyLoadedClassBehavior'] */
  private useLegacyLoadedClass = true;
  /** @see MeshGradientOptions['maxSegments'] */
  private maxSegments?: number;

  private reducedMotion: MeshGradientReducedMotion = 'auto';

  private el?: HTMLCanvasElement | null;
  private amp = CONSTANTS.DEFAULT_AMP;
  private seed = CONSTANTS.DEFAULT_SEED;
  private freqX = CONSTANTS.DEFAULT_FREQ_X;
  private freqY = CONSTANTS.DEFAULT_FREQ_Y;
  /** Offset added to `freqY` in the `noiseFreq` uniform when `frequency` is an object with `delta` (0 by default). */
  private freqDelta = 0;
  private activeColors: Vec4 = CONSTANTS.DEFAULT_ACTIVE_COLORS;
  private isStatic = false;
  private animationSpeed = CONSTANTS.DEFAULT_ANIMATION_SPEED;
  private autoPauseOnInvisible = true; // Auto pause when gradient goes out of viewport

  private minigl?: MiniGl;

  private angle: number = 0;
  private isLoadedClass: boolean = false;

  private resizeTimeout?: number;
  private resizeDelay: number = CONSTANTS.RESIZE_THROTTLE_DELAY;
  private isIntersecting: boolean = false;

  private wasPlayingBeforeInvisible = false; // Animation state before going out of viewport
  private intersectionObserver?: IntersectionObserver; // Observer for tracking visibility
  // @ts-ignore
  private pauseObserverOptions: IntersectionObserverInit = CONSTANTS.DEFAULT_PAUSE_OBSERVER_OPTIONS;
  private width?: number;
  private height?: number;

  private shaderFiles?: ShaderFiles;
  private vertexShader?: string;
  private sectionColors?: Vec3[];
  private configColors?: MeshGradientColorsConfig; // Colors from configuration with priority over CSS vars
  private appearanceMode: 'smooth' | 'default' = CONSTANTS.DEFAULT_APPEARANCE_MODE;
  private appearanceDuration = CONSTANTS.DEFAULT_APPEARANCE_DURATION;
  private computedCanvasStyle?: CSSStyleDeclaration;
  private conf?: GradientConfig;
  private uniforms?: Record<string, MiniGlUniform>;
  private mesh?: MiniGlMesh;
  private material?: MiniGlMaterial;
  private geometry?: MiniGlPlaneGeometry;
  private t = CONSTANTS.DEFAULT_TIME_VALUE;
  private last = 0;
  private frame = 0;

  private xSegCount?: number;
  private ySegCount?: number;

  constructor() {
    this.animateFrame = this.animateFrame.bind(this);
    this.onResizeDebounced = this.onResizeDebounced.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.handleContextLost = this.handleContextLost.bind(this);
    this.handleContextRestored = this.handleContextRestored.bind(this);
    this.initializeProperties();
  }

  public init(selector: string | HTMLCanvasElement, options?: InitOptions): MeshGradient {
    const opt = options ?? {};

    this.destroyed = false;
    this.pollCssVarsCanceled = false;
    this.lastInitOptions = { ...this.lastInitOptions, ...opt };

    this.allowDocumentFallback = opt.allowDocumentCanvasFallback ?? false;

    const forcedPr = opt.pixelRatio;

    this.pixelRatioBacking =
      forcedPr !== undefined && forcedPr > 0
        ? forcedPr
        : typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
          ? Math.min(window.devicePixelRatio, 2)
          : 1;

    this.targetFpsCap = typeof opt.targetFps === 'number' && opt.targetFps > 0 ? opt.targetFps : undefined;
    this.skipEveryOtherFrame = this.targetFpsCap === undefined;
    this.lastFpsGateTime = 0;

    this.reducedMotion = opt.reducedMotion ?? 'auto';
    this.callbacks = opt.callbacks;
    this.darkenTopFromOptions = opt.darkenTop;
    this.webGlUserAttributes = opt.webglContextAttributes;
    this.useLegacyLoadedClass = opt.useLegacyLoadedClassBehavior ?? true;
    this.maxSegments = opt.maxSegments;

    this.seed = opt.seed ?? Math.random() * 100;
    this.isStatic = opt.isStatic ?? false;
    this.animationSpeed = opt.animationSpeed ?? CONSTANTS.DEFAULT_ANIMATION_SPEED;
    this.resizeDelay = opt.resizeDelay ?? CONSTANTS.RESIZE_THROTTLE_DELAY;

    if (typeof opt.frequency === 'number') {
      this.freqX = opt.frequency;
      this.freqY = opt.frequency;
      this.freqDelta = 0;
    } else {
      this.freqX = opt.frequency?.x ?? CONSTANTS.DEFAULT_FREQ_X;
      this.freqY = opt.frequency?.y ?? CONSTANTS.DEFAULT_FREQ_Y;
      this.freqDelta = opt.frequency?.delta ?? 0;
    }

    const toggleColors = {
      ...CONSTANTS.DEFAULT_ACTIVE_TOGGLE_COLORS,
      ...opt.activeColors,
    };

    this.activeColors = [toggleColors[1] ? 1 : 0, toggleColors[2] ? 1 : 0, toggleColors[3] ? 1 : 0, toggleColors[4] ? 1 : 0];

    this.configColors = opt.colors ?? (opt.cssVariablesFallback ? undefined : genRandomColors());

    this.appearanceMode = opt.appearance ?? CONSTANTS.DEFAULT_APPEARANCE_MODE;
    this.appearanceDuration = opt.appearanceDuration ?? CONSTANTS.DEFAULT_APPEARANCE_DURATION;

    this.pauseObserverOptions = {
      ...CONSTANTS.DEFAULT_PAUSE_OBSERVER_OPTIONS,
      ...opt.pauseObserverOptions,
    };

    this.autoPauseOnInvisible = opt.pauseOnOutsideViewport ?? true;

    this.conf = {
      presetName: opt.presetName ?? CONSTANTS.DEFAULT_PRESET_NAME,
      wireframe: opt.wireframe ?? CONSTANTS.DEFAULT_WIREFRAME,
      zoom: opt.zoom ?? CONSTANTS.DEFAULT_ZOOM,
      rotation: opt.rotation ?? CONSTANTS.DEFAULT_ROTATION,
      density: opt.density ? ([...opt.density] as [number, number]) : ([...CONSTANTS.DEFAULT_DENSITY] as [number, number]),
      playing: true,
    };

    this.el = typeof selector === 'string' ? (document.querySelector(selector) as HTMLCanvasElement | null) : selector;

    void this.connect();

    return this;
  }

  /**
   * Completely destroys the gradient and cleans up all resources.
   * This method should be called when the gradient is no longer needed
   */
  public destroy(): void {
    this.pollCssVarsCanceled = true;
    this.fadeGeneration++;

    this.instanceTimers.clearAll();

    if (this.animationRafId !== null) {
      cancelAnimationFrame(this.animationRafId);
      this.animationRafId = null;
    }

    this.stopAnimationAndTimers();
    this.disconnect();
    this.removeCssClasses();
    this.cleanupWebGLResources();
    this.clearObjectReferences();
    this.initializeProperties();

    this.isInitialized = false;
    this.destroyed = true;
  }

  /**
   * Updates the gradient with new configuration. Supports fade transition if enabled.
   * @param config - New configuration options
   */
  public update(config?: MeshGradientOptions & MeshGradientUpdateOptions) {
    if (!this.el) return;
    const transition = config?.transition ?? true;

    if (!transition && config && this.isInitialized && this.tryApplyHotPatch(config)) {
      Object.assign(this.lastInitOptions, config);

      return;
    }

    if (transition) {
      void this.updateWithFadeTransition(Object.assign({}, this.lastInitOptions, config ?? {}));
    } else {
      const canvas = this.el as HTMLCanvasElement;

      this.destroy();
      this.init(canvas, { ...config, appearance: 'default' });
    }
  }

  /**
   * Fast path — colors / booleans / animation seed without tearing down GL.
   * Returns false when shader rebuild or sizing changes are needed.
   */
  private tryApplyHotPatch(patch: MeshGradientOptions & MeshGradientUpdateOptions): boolean {
    if (!this.mesh || !this.uniforms) return false;

    const entries = Object.entries(patch).filter(([key]) => key !== 'transition' && key !== 'transitionDuration');

    if (entries.length === 0) {
      return true;
    }

    const cold = new Set([
      'webglContextAttributes',
      'callbacks',
      'useLegacyLoadedClassBehavior',
      'allowDocumentCanvasFallback',
      'appearance',
      'appearanceDuration',
      'cssVariablesFallback',
    ]);

    if (entries.some(([key]) => cold.has(key))) {
      return false;
    }

    let touched = false;
    let resizeNeeded = false;

    if (patch.colors) {
      this.configColors = patch.colors;
      this.initGradientColors();
      this.patchUniformColors();
      touched = true;
    }

    if (patch.activeColors) {
      const toggle = {
        ...CONSTANTS.DEFAULT_ACTIVE_TOGGLE_COLORS,
        ...patch.activeColors,
      };

      this.activeColors = [toggle[1] ? 1 : 0, toggle[2] ? 1 : 0, toggle[3] ? 1 : 0, toggle[4] ? 1 : 0] as Vec4;
      const u = this.uniforms.u_active_colors;

      if (u) u.value = this.activeColors;
      touched = true;
    }

    if (patch.frequency !== undefined) {
      if (typeof patch.frequency === 'number') {
        this.freqX = patch.frequency;
        this.freqY = patch.frequency;
        this.freqDelta = 0;
      } else {
        this.freqX = patch.frequency?.x ?? CONSTANTS.DEFAULT_FREQ_X;
        this.freqY = patch.frequency?.y ?? CONSTANTS.DEFAULT_FREQ_Y;
        this.freqDelta = patch.frequency?.delta ?? 0;
      }
      this.patchGlobalNoiseFreq();
      touched = true;
    }

    if (patch.seed !== undefined) {
      this.seed = patch.seed ?? Math.random() * 100;
      this.patchNoiseSeedUniforms();
      touched = true;
    }

    if (patch.animationSpeed !== undefined) {
      this.animationSpeed = patch.animationSpeed;
      touched = true;
    }

    if (patch.resizeDelay !== undefined) {
      this.resizeDelay = patch.resizeDelay;
      touched = true;
    }

    if (patch.targetFps !== undefined) {
      this.targetFpsCap = patch.targetFps && patch.targetFps > 0 ? patch.targetFps : undefined;
      this.skipEveryOtherFrame = this.targetFpsCap === undefined;
      this.lastFpsGateTime = 0;
      touched = true;
    }

    if (patch.reducedMotion !== undefined) {
      this.reducedMotion = patch.reducedMotion;
      touched = true;
    }

    if (patch.darkenTop !== undefined) {
      this.darkenTopFromOptions = patch.darkenTop;
      const u = this.uniforms.u_darken_top;

      if (u) u.value = patch.darkenTop ? 1 : 0;
      touched = true;
    }

    if (patch.maxSegments !== undefined) {
      this.maxSegments = patch.maxSegments;
      resizeNeeded = true;
      touched = true;
    }

    if (patch.pixelRatio !== undefined) {
      const pr = patch.pixelRatio;

      this.pixelRatioBacking =
        pr !== undefined && pr > 0
          ? pr
          : typeof window !== 'undefined' && typeof window.devicePixelRatio === 'number'
            ? Math.min(window.devicePixelRatio, 2)
            : 1;
      resizeNeeded = true;
      touched = true;
    }

    if (patch.density) {
      if (this.conf) {
        this.conf.density = [...patch.density];
      }
      resizeNeeded = true;
      touched = true;
    }

    if (patch.wireframe !== undefined && this.conf) {
      this.conf.wireframe = patch.wireframe;
      touched = true;
    }

    if (patch.zoom !== undefined && this.conf) {
      this.conf.zoom = patch.zoom;
      touched = true;
    }

    if (patch.rotation !== undefined && this.conf) {
      this.conf.rotation = patch.rotation;
      touched = true;
    }

    if (patch.presetName !== undefined && this.conf) {
      this.conf.presetName = patch.presetName;
      touched = true;
    }

    if (patch.pauseOnOutsideViewport !== undefined && patch.pauseOnOutsideViewport !== this.autoPauseOnInvisible) {
      this.toggleAutoPause(patch.pauseOnOutsideViewport);
      touched = true;
    }

    if (patch.isStatic !== undefined) {
      this.isStatic = patch.isStatic;
      touched = true;
    }

    if (!touched) return false;

    if (resizeNeeded) {
      void this.performResize();
    }

    return true;
  }

  public setColors(colors: MeshGradientColorsConfig): void {
    this.configColors = colors;
    this.initGradientColors();
    this.patchUniformColors();
    this.minigl?.render();
  }

  public setActiveColors(cfg: MeshGradientOptions['activeColors']): void {
    if (!cfg) return;
    const merged = {
      ...CONSTANTS.DEFAULT_ACTIVE_TOGGLE_COLORS,
      ...cfg,
    };

    this.activeColors = [merged[1] ? 1 : 0, merged[2] ? 1 : 0, merged[3] ? 1 : 0, merged[4] ? 1 : 0] as Vec4;

    const u = this.uniforms?.u_active_colors;

    if (u) {
      u.value = this.activeColors;
    }

    this.minigl?.render();
  }

  public setFrequency(freq: MeshGradientOptions['frequency']): void {
    if (typeof freq === 'number') {
      this.freqX = freq;
      this.freqY = freq;
      this.freqDelta = 0;
    } else {
      this.freqX = freq?.x ?? CONSTANTS.DEFAULT_FREQ_X;
      this.freqY = freq?.y ?? CONSTANTS.DEFAULT_FREQ_Y;
      this.freqDelta = freq?.delta ?? 0;
    }

    this.patchGlobalNoiseFreq();
    this.minigl?.render();
  }

  public setSeed(value: number | undefined): void {
    this.seed = value ?? Math.random() * 100;
    this.patchNoiseSeedUniforms();
    this.minigl?.render();
  }

  private patchUniformColors(): void {
    if (!this.uniforms || !this.sectionColors?.length) return;

    const base = this.uniforms.u_baseColor;
    const first = this.sectionColors[0];

    if (base && first) {
      base.value = first;
    }

    const stack = this.uniforms.u_waveLayers.value as MiniGlUniform[];

    for (let idx = 0; idx + 1 < this.sectionColors.length; idx++) {
      const wrapper = stack[idx]?.value;

      if (wrapper && typeof wrapper === 'object' && 'color' in wrapper) {
        ((wrapper as { color: MiniGlUniform }).color as MiniGlUniform).value = this.sectionColors[idx + 1];
      }
    }
  }

  private patchGlobalNoiseFreq(): void {
    const global = this.uniforms?.u_global?.value;

    if (global && typeof global === 'object' && 'noiseFreq' in global) {
      ((global as { noiseFreq: MiniGlUniform }).noiseFreq as MiniGlUniform).value = [this.freqX, this.freqY + this.freqDelta];
    }
  }

  private patchNoiseSeedUniforms(): void {
    const vert = this.uniforms?.u_vertDeform?.value;

    if (vert && typeof vert === 'object' && 'noiseSeed' in vert) {
      ((vert as { noiseSeed: MiniGlUniform }).noiseSeed as MiniGlUniform).value = this.seed;
    }

    const stack = this.uniforms?.u_waveLayers?.value as MiniGlUniform[] | undefined;

    if (!stack) return;

    for (let e = 1; e < (this.sectionColors?.length ?? 0); e++) {
      const layer = stack[e - 1]?.value;

      if (layer && typeof layer === 'object' && 'noiseSeed' in layer) {
        ((layer as { noiseSeed: MiniGlUniform }).noiseSeed as MiniGlUniform).value = this.seed + 10 * e;
      }
    }
  }

  /**
   * Updates gradient with smooth fade transition
   * @param config - New configuration options
   */
  private updateWithFadeTransition(config: MeshGradientOptions & MeshGradientUpdateOptions) {
    if (!this.el) return;

    const gen = ++this.fadeGeneration;
    const duration = config.transitionDuration ?? CONSTANTS.DEFAULT_TRANSITION_DURATION;
    const canvas = this.el;

    canvas.style.transition = `opacity ${duration}ms ease-in-out`;
    canvas.style.opacity = '1';

    requestAnimationFrame(() => {
      if (gen === this.fadeGeneration) {
        canvas.style.opacity = '0';
      }
    });

    this.instanceTimers.setTimeoutMs(() => {
      if (gen !== this.fadeGeneration) return;

      this.destroy();
      this.init(canvas, config);

      if (this.el) {
        this.el.style.opacity = '0';
        this.el.style.transition = `opacity ${duration}ms ease-in-out`;

        requestAnimationFrame(() => {
          if (this.el) {
            this.el.style.opacity = '';
          }
        });

        this.instanceTimers.setTimeoutMs(() => {
          if (this.el) {
            this.el.style.transition = '';
            this.el.style.opacity = '';
          }
        }, duration);
      }
    }, duration);
  }

  /**
   * Manually start gradient animation
   */
  public play(): void {
    if (!this.conf) return;

    this.conf.playing = true;
    this.scheduleAnimate();
  }

  private scheduleAnimate(): void {
    if (this.animationRafId !== null) {
      cancelAnimationFrame(this.animationRafId);
      this.animationRafId = null;
    }
    this.animationRafId = requestAnimationFrame(this.animateFrame);
  }

  /**
   * Manually pause gradient animation
   */
  public pause(): void {
    if (!this.conf) return;

    this.conf.playing = false;
  }

  /**
   * Set animation speed multiplier
   * @param speed - Speed multiplier (1.0 is normal speed, 0.5 is half speed, 2.0 is double speed)
   */
  public setAnimationSpeed(speed: number): void {
    if (speed <= 0) {
      throw new Error('Animation speed must be greater than 0');
    }
    this.animationSpeed = speed;
  }

  /**
   * Get current animation speed multiplier
   * @returns Current animation speed
   */
  public getAnimationSpeed(): number {
    return this.animationSpeed;
  }

  /**
   * Enable or disable auto-pause when gradient goes out of viewport
   * @param enabled - Whether to enable auto-pause functionality
   */
  public toggleAutoPause(enabled: boolean): void {
    this.autoPauseOnInvisible = enabled;

    if (!enabled && this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
      if (!this.isIntersecting && this.wasPlayingBeforeInvisible) {
        this.play();
        this.wasPlayingBeforeInvisible = false;
      }
    } else if (enabled && this.el && !this.intersectionObserver) {
      this.initIntersectionObserver();
    }
  }

  /**
   * Stops animation and clears all active timers
   */
  private stopAnimationAndTimers(): void {
    this.pause();
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = undefined;
    }
  }

  /**
   * Removes CSS classes from canvas and its parent
   */
  private removeCssClasses(): void {
    if (this.el) {
      this.el.classList.remove('isLoaded');
      if (this.el.parentElement) {
        this.el.parentElement.classList.remove('isLoaded');
      }
    }
  }

  /**
   * Cleans up all WebGL resources including shaders, buffers, and context
   */
  private cleanupWebGLResources(contextLost = false): void {
    if (this.mesh && !contextLost) {
      this.mesh.remove();
    }
    this.mesh = undefined;

    if (!this.minigl || contextLost) {
      this.material = undefined;
      this.geometry = undefined;
      this.uniforms = undefined;
      this.minigl = undefined;

      return;
    }

    this.cleanupMiniGlMeshes();
    this.cleanupWebGLContext();
    this.clearCanvasAsFallback();

    this.material = undefined;
    this.geometry = undefined;
    this.uniforms = undefined;
    this.minigl = undefined;
  }

  /**
   * Cleans up all meshes from MiniGL
   */
  private cleanupMiniGlMeshes(): void {
    if (!this.minigl) return;

    this.minigl.meshes.forEach((mesh) => {
      if (mesh.remove) mesh.remove();
    });
    this.minigl.meshes = [];
  }

  /**
   * Cleans up WebGL context, shaders and buffers
   */
  private cleanupWebGLContext(): void {
    if (!this.minigl?.gl) return;

    const gl = this.minigl.gl;

    // Clear the canvas completely
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.deleteShaders(gl);
    this.deleteBuffers(gl);
  }

  /**
   * Deletes shaders and program from WebGL context
   */
  private deleteShaders(gl: WebGLRenderingContext): void {
    if (!this.material) return;

    if (this.material.vertexShader) {
      gl.deleteShader(this.material.vertexShader);
    }
    if (this.material.fragmentShader) {
      gl.deleteShader(this.material.fragmentShader);
    }
    if (this.material.program) {
      gl.deleteProgram(this.material.program);
    }
  }

  /**
   * Deletes geometry buffers from WebGL context
   */
  private deleteBuffers(gl: WebGLRenderingContext): void {
    if (!this.geometry?.attributes) return;

    Object.values(this.geometry.attributes).forEach((attribute) => {
      if (attribute.buffer) {
        gl.deleteBuffer(attribute.buffer);
      }
    });
  }

  /**
   * Clears canvas using 2D context as fallback
   */
  private clearCanvasAsFallback(): void {
    if (!this.minigl?.canvas) return;

    const canvas = this.minigl.canvas;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Clears all object references to prevent memory leaks
   */
  private clearObjectReferences(): void {
    this.el = null;
    this.minigl = undefined;
    this.mesh = undefined;
    this.material = undefined;
    this.geometry = undefined;
    this.uniforms = undefined;
    this.shaderFiles = undefined;
    this.vertexShader = undefined;
    this.sectionColors = undefined;
    this.configColors = undefined;
    this.computedCanvasStyle = undefined;
    this.conf = undefined;
  }

  /**
   * Initialize all gradient properties with default values via `Object.assign`.
   */
  private initializeProperties(): void {
    const defaultProperties = {
      // Core properties
      el: undefined as HTMLCanvasElement | null | undefined,
      minigl: undefined as MiniGl | undefined,

      // State properties
      angle: 0,
      isLoadedClass: false,
      isInitialized: false,
      resizeTimeout: undefined as number | undefined,
      resizeDelay: CONSTANTS.RESIZE_THROTTLE_DELAY,
      isIntersecting: false,

      // Rendering properties
      shaderFiles: undefined as ShaderFiles | undefined,
      vertexShader: undefined as string | undefined,
      sectionColors: undefined as Vec3[] | undefined,
      configColors: undefined as MeshGradientColorsConfig | undefined,
      appearanceMode: CONSTANTS.DEFAULT_APPEARANCE_MODE as 'smooth' | 'default',
      appearanceDuration: CONSTANTS.DEFAULT_APPEARANCE_DURATION,
      computedCanvasStyle: undefined as CSSStyleDeclaration | undefined,
      conf: undefined as GradientConfig | undefined,
      uniforms: undefined as Record<string, MiniGlUniform> | undefined,
      mesh: undefined as MiniGlMesh | undefined,
      material: undefined as MiniGlMaterial | undefined,
      geometry: undefined as MiniGlPlaneGeometry | undefined,

      // Animation properties
      t: CONSTANTS.DEFAULT_TIME_VALUE,
      last: 0,
      frame: 0,

      // Dimension properties
      width: undefined as number | undefined,
      height: undefined as number | undefined,
      xSegCount: undefined as number | undefined,
      ySegCount: undefined as number | undefined,

      // Effects properties
      amp: CONSTANTS.DEFAULT_AMP,
      seed: CONSTANTS.DEFAULT_SEED,
      freqX: CONSTANTS.DEFAULT_FREQ_X,
      freqY: CONSTANTS.DEFAULT_FREQ_Y,
      freqDelta: 0,
      activeColors: [...CONSTANTS.DEFAULT_ACTIVE_COLORS] as Vec4,
      animationSpeed: CONSTANTS.DEFAULT_ANIMATION_SPEED,
      autoPauseOnInvisible: true,

      destroyed: false,
      pollCssVarsCanceled: false,
      fadeGeneration: 0,
      animationRafId: null as number | null,
      lastInitOptions: {} as InitOptions,
      pixelRatioBacking: 1,
      targetFpsCap: undefined as number | undefined,
      skipEveryOtherFrame: true,
      lastFpsGateTime: 0,
      callbacks: undefined as MeshGradientCallbacks | undefined,
      allowDocumentFallback: false,
      darkenTopFromOptions: undefined as boolean | undefined,
      webGlUserAttributes: undefined as WebGLContextAttributes | undefined,
      useLegacyLoadedClass: true,
      maxSegments: undefined as number | undefined,
      reducedMotion: 'auto' as MeshGradientReducedMotion,
    };

    this.instanceTimers.clearAll();
    Object.assign(this, defaultProperties);
  }

  private onResizeDebounced(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = window.setTimeout(() => {
      this.performResize();
    }, this.resizeDelay) as unknown as number;
  }

  private motionIsStaticEffective(): boolean {
    if (this.reducedMotion === 'ignore') {
      return this.isStatic;
    }

    if (this.reducedMotion === 'force-static') {
      return true;
    }

    try {
      return (
        this.isStatic ||
        (typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      );
    } catch {
      return this.isStatic;
    }
  }

  private animateFrame(e: number): void {
    this.animationRafId = null;

    if (!this.shouldSkipFrame(e)) {
      const delta = Math.min(e - this.last, CONSTANTS.MAX_FRAME_DELTA) * this.animationSpeed;

      this.t = (((this.t + delta) % U_TIME_WRAP) + U_TIME_WRAP) % U_TIME_WRAP;
      this.last = e;

      if (this.mesh?.material?.uniforms?.u_time) {
        this.mesh.material.uniforms.u_time.value = this.t;
      }
      if (this.minigl) {
        this.minigl.render();
      }
    }

    if (this.last !== 0 && this.motionIsStaticEffective()) {
      if (this.minigl) {
        this.minigl.render();
      }
      this.disconnect();

      return;
    }

    this.frame += 1;

    if (this.conf?.playing) {
      this.scheduleAnimate();
    }
  }

  private addIsLoadedClass(): void {
    if (!this.isLoadedClass) {
      this.isLoadedClass = true;

      if (this.el) {
        if (this.appearanceMode === 'smooth') {
          this.el.style.opacity = '0';
          this.el.style.transition = `opacity ${this.appearanceDuration}ms ease-in-out`;

          requestAnimationFrame(() => {
            if (this.el) {
              this.el.style.opacity = '1';
            }
          });

          this.instanceTimers.setTimeoutMs(() => {
            if (this.el) {
              this.el.style.transition = '';
              this.el.style.opacity = '';
            }
          }, this.appearanceDuration);
        }

        if (this.useLegacyLoadedClass) {
          this.el.classList.add('isLoaded');
        }
      }

      if (this.useLegacyLoadedClass) {
        this.instanceTimers.setTimeoutMs(() => {
          if (this.el?.parentElement) {
            this.el.parentElement.classList.add('isLoaded');
          }
        }, CONSTANTS.LOADED_CLASS_DELAY);
      }
    }

    try {
      this.callbacks?.onReady?.();
    } catch {
      /** user callback */
    }
  }

  private onVisibility(): void {
    if (!document.hidden) {
      this.last = 0;
      this.lastFpsGateTime = 0;
    }
    if (!document.hidden && this.conf?.playing && this.animationRafId === null) {
      this.scheduleAnimate();
    }
  }

  private handleContextLost(event: Event): void {
    event.preventDefault?.();
    this.pause();

    if (this.animationRafId !== null) {
      cancelAnimationFrame(this.animationRafId);
      this.animationRafId = null;
    }

    this.cleanupWebGLResources(true);

    try {
      this.callbacks?.onError?.(new Error('WebGL context lost'));
    } catch {
      /** user callback */
    }
  }

  private handleContextRestored(): void {
    if (this.destroyed || !this.el) return;

    try {
      this.detachLayoutListeners();
      this.mountMiniGl();
      this.initMesh();
      this.performResize();
      this.attachLayoutListeners();
      this.play();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.callbacks?.onError?.(error);
    }
  }

  private mountMiniGl(): void {
    if (!this.el) throw new Error('MeshGradient: canvas missing');

    this.minigl = new MiniGl(this.el, {
      debug: true,
      contextAttributes: this.webGlUserAttributes,
    });
  }

  private attachLayoutListeners(): void {
    window.addEventListener('resize', this.onResizeDebounced);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }

    if (this.el && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(() => this.onResizeDebounced());
      this.resizeObserver.observe(this.el);
    }
  }

  private detachLayoutListeners(): void {
    window.removeEventListener('resize', this.onResizeDebounced);

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }

    if (this.resizeObserver && this.el) {
      try {
        this.resizeObserver.unobserve(this.el);
      } catch {
        /** ignore */
      }
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }

  /**
   * Performs actual resize operations (used by debounced resize handler)
   */
  private performResize(): void {
    if (this.el) {
      const rect = this.el.getBoundingClientRect();

      this.width = rect.width;
      this.height = rect.height;
    }
    if (this.minigl && this.width && this.height) {
      this.minigl.setSize(this.width, this.height, this.pixelRatioBacking);
      this.minigl.setOrthographicCamera();
    }

    let xc = Math.ceil((this.width as number) * (this.conf ? this.conf.density[0] : CONSTANTS.DEFAULT_DENSITY[0]));
    let yc = Math.ceil((this.height || 0) * (this.conf ? this.conf.density[1] : CONSTANTS.DEFAULT_DENSITY[1]));

    const cap = this.maxSegments;

    if (typeof cap === 'number' && cap > 0) {
      xc = Math.min(xc, cap);
      yc = Math.min(yc, cap);
    }

    this.xSegCount = Math.max(xc, 1);
    this.ySegCount = Math.max(yc, 1);

    if (this.mesh && this.mesh.geometry) {
      this.mesh.geometry.setTopology(this.xSegCount as number, this.ySegCount as number);
      this.mesh.geometry.setSize(this.width as number, this.height || 0);
    }
    if (this.mesh && this.mesh.material && this.mesh.material.uniforms && this.mesh.material.uniforms.u_shadow_power) {
      this.mesh.material.uniforms.u_shadow_power.value =
        this.width! < CONSTANTS.SMALL_SCREEN_WIDTH_THRESHOLD ? CONSTANTS.SMALL_SCREEN_SHADOW_POWER : CONSTANTS.LARGE_SCREEN_SHADOW_POWER;
    }

    try {
      this.callbacks?.onResize?.({ cssWidth: this.width ?? 0, cssHeight: this.height ?? 0 });
    } catch {
      /** user callback */
    }
  }

  /**
   * Establishes WebGL connection and initializes shaders
   */
  private async connect(): Promise<void> {
    this.shaderFiles = SHADERS;

    if (!this.el && this.allowDocumentFallback) {
      const fallback = document.querySelector('canvas');

      if (fallback) {
        this.el = fallback as HTMLCanvasElement;
      }
    }

    if (!this.el) {
      try {
        this.callbacks?.onError?.(new Error('MeshGradient: canvas element not found'));
      } catch {
        /** noop */
      }

      return;
    }

    const rect = this.el.getBoundingClientRect();

    this.width = rect.width;
    this.height = rect.height;

    if (this.appearanceMode === 'smooth') {
      this.el.style.opacity = '0';
    }

    this.mountMiniGl();

    this.el.addEventListener('webglcontextlost', this.handleContextLost as EventListener, false);
    this.el.addEventListener('webglcontextrestored', this.handleContextRestored as EventListener, false);

    this.initIntersectionObserver();
    this.isInitialized = true;

    requestAnimationFrame(() => {
      if (this.el) {
        this.computedCanvasStyle = getComputedStyle(this.el);
        void this.waitForCssVars();
      }
    });
  }

  private disconnect() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }

    this.detachLayoutListeners();

    if (this.el) {
      this.el.removeEventListener('webglcontextlost', this.handleContextLost as EventListener);
      this.el.removeEventListener('webglcontextrestored', this.handleContextRestored as EventListener);
    }
  }

  /**
   * Initialize intersection observer for auto-pause functionality
   */
  private initIntersectionObserver(): void {
    if (!this.el || !this.autoPauseOnInvisible) return;

    const options = this.pauseObserverOptions;

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isIntersecting = entry.isIntersecting;

        if (this.isIntersecting !== isIntersecting) {
          this.isIntersecting = isIntersecting;

          if (this.autoPauseOnInvisible && this.conf) {
            if (isIntersecting) {
              // Element became visible - resume if was playing before
              if (this.wasPlayingBeforeInvisible) {
                this.play();
                this.wasPlayingBeforeInvisible = false;
              }
            } else {
              // Element became invisible - pause if currently playing
              if (this.conf.playing) {
                this.wasPlayingBeforeInvisible = true;
                this.pause();
              }
            }
          }
        }
      });
    }, options);

    this.intersectionObserver.observe(this.el);
  }

  private initMaterial(): MiniGlMaterial {
    if (!this.minigl) throw new Error('MiniGl not initialized');

    const minigl = this.minigl;

    this.uniforms = {
      ...this.createBasicUniforms(minigl),
      ...this.createGlobalUniform(minigl),
      ...this.createVertexDeformUniform(minigl),
      ...this.createColorUniforms(minigl),
    };

    this.createWaveLayersUniforms(minigl);
    this.buildVertexShader();

    return new this.minigl.Material(this.vertexShader!, this.shaderFiles!.fragment, this.uniforms);
  }

  /**
   * Creates basic uniforms (time, shadow, darken, active colors)
   */
  private createBasicUniforms(minigl: Pick<MiniGl, 'Uniform'>) {
    return {
      u_time: new minigl.Uniform({ value: 0 }),
      u_shadow_power: new minigl.Uniform({ value: 5 }),
      u_darken_top: new minigl.Uniform({
        value: !!(this.darkenTopFromOptions || this.el?.dataset?.jsDarkenTop === '') ? 1 : 0,
      }),
      u_active_colors: new minigl.Uniform({
        value: this.activeColors,
        type: 'vec4',
      }),
    };
  }

  /**
   * Creates global uniform with noise frequency and speed settings
   */
  private createGlobalUniform(minigl: Pick<MiniGl, 'Uniform'>) {
    return {
      u_global: new minigl.Uniform({
        value: {
          noiseFreq: new minigl.Uniform({
            value: [this.freqX, this.freqY + this.freqDelta],
            type: 'vec2',
          }),
          noiseSpeed: new minigl.Uniform({ value: 5e-6 }),
        },
        type: 'struct',
      }),
    };
  }

  /**
   * Creates vertex deformation uniform for geometry animation
   */
  private createVertexDeformUniform(minigl: Pick<MiniGl, 'Uniform'>) {
    return {
      u_vertDeform: new minigl.Uniform({
        value: {
          incline: new minigl.Uniform({
            value: Math.sin(this.angle) / Math.cos(this.angle),
          }),
          offsetTop: new minigl.Uniform({ value: -0.5 }),
          offsetBottom: new minigl.Uniform({ value: -0.5 }),
          noiseFreq: new minigl.Uniform({
            value: [3, 4],
            type: 'vec2',
          }),
          noiseAmp: new minigl.Uniform({ value: this.amp }),
          noiseSpeed: new minigl.Uniform({ value: 10 }),
          noiseFlow: new minigl.Uniform({ value: 3 }),
          noiseSeed: new minigl.Uniform({ value: this.seed }),
        },
        type: 'struct',
        excludeFrom: 'fragment',
      }),
    };
  }

  /**
   * Creates color uniforms for base color and wave layers
   */
  private createColorUniforms(minigl: Pick<MiniGl, 'Uniform'>) {
    return {
      u_baseColor: new minigl.Uniform({
        value: (this.sectionColors && this.sectionColors[0]) || [1, 0, 0],
        type: 'vec3',
        excludeFrom: 'fragment',
      }),
      u_waveLayers: new minigl.Uniform({
        value: [],
        excludeFrom: 'fragment',
        type: 'array',
      }),
    };
  }

  /**
   * Creates wave layers uniforms for multi-color gradient effects
   */
  private createWaveLayersUniforms(minigl: Pick<MiniGl, 'Uniform'>): void {
    if (!this.uniforms || !this.sectionColors) return;

    for (let e = 1; e < this.sectionColors.length; e += 1) {
      (this.uniforms.u_waveLayers.value as MiniGlUniform[]).push(
        new minigl.Uniform({
          type: 'struct',
          value: {
            color: new minigl.Uniform({
              value: this.sectionColors[e],
              type: 'vec3',
            }),
            noiseFreq: new minigl.Uniform({
              value: [2 + e / this.sectionColors.length, 3 + e / this.sectionColors.length],
              type: 'vec2',
            }),
            noiseSpeed: new minigl.Uniform({
              value: 11 + 0.3 * e,
            }),
            noiseFlow: new minigl.Uniform({
              value: 6.5 + 0.3 * e,
            }),
            noiseSeed: new minigl.Uniform({
              value: this.seed + 10 * e,
            }),
            noiseFloor: new minigl.Uniform({ value: 0.1 }),
            noiseCeil: new minigl.Uniform({
              value: 0.63 + 0.07 * e,
            }),
          },
        }),
      );
    }
  }

  /**
   * Builds vertex shader by combining noise, blend, and vertex shader files
   */
  private buildVertexShader(): void {
    this.vertexShader = [this.shaderFiles!.noise, this.shaderFiles!.blend, this.shaderFiles!.vertex].join('\n\n');
  }

  /**
   * Initialize mesh with material and geometry
   */
  private initMesh() {
    const minigl = this.minigl;

    if (!minigl) throw new Error('MiniGl not initialized');

    this.material = this.initMaterial();
    this.geometry = new minigl.PlaneGeometry();
    this.mesh = new minigl.Mesh(this.geometry, this.material);
    if (this.conf) {
      this.mesh.wireframe = this.conf.wireframe;
    }
  }

  /**
   * Determines if current frame should be skipped for performance
   * @param e - Current time
   * @returns true if frame should be skipped
   */
  private shouldSkipFrame(e: number): boolean {
    if (!!window.document.hidden || !(this.conf && this.conf.playing)) {
      return true;
    }

    if (this.skipEveryOtherFrame && this.frame % 2 === 0) {
      return true;
    }

    const cap = this.targetFpsCap;

    if (typeof cap === 'number' && cap > 0) {
      const minInterval = 1000 / cap;

      if (this.lastFpsGateTime !== 0 && e - this.lastFpsGateTime < minInterval) {
        return true;
      }
      this.lastFpsGateTime = e;
    }

    return false;
  }

  /**
   * Initialize gradient system - colors, mesh, and animation
   */
  private initSystem() {
    this.initGradientColors();
    this.initMesh();
    this.performResize();
    this.attachLayoutListeners();
    this.scheduleAnimate();
  }

  /**
   * Waits for CSS variables to be loaded before initializing
   * Uses Promise-based approach with timeout instead of recursive retries
   */
  private async waitForCssVars(): Promise<void> {
    // If colors are provided in config, skip CSS variable waiting
    if (this.configColors) {
      this.initSystem();
      this.addIsLoadedClass();

      return;
    }

    // Check if CSS vars are already available
    if (this.areCssVarsLoaded()) {
      this.initSystem();
      this.addIsLoadedClass();

      return;
    }

    // Wait for CSS vars with timeout
    try {
      await this.pollForCssVars();
      this.initSystem();
      this.addIsLoadedClass();
    } catch {
      // Fallback to default colors if timeout
      this.useFallbackColors();
      this.initSystem();
    }
  }

  /**
   * Checks if CSS variables are loaded and contain valid color values
   */
  private areCssVarsLoaded(): boolean {
    return Boolean(
      this.computedCanvasStyle && this.computedCanvasStyle.getPropertyValue(CONSTANTS.CSS_GRADIENT_VARS[0]).indexOf('#') !== -1,
    );
  }

  /**
   * Polls for CSS variables with exponential backoff and timeout
   */
  private pollForCssVars(): Promise<void> {
    return new Promise((resolve, reject) => {
      const maxWaitTime = 3000;
      const checkInterval = 50;
      const startTime = Date.now();

      const checkCssVars = () => {
        if (this.pollCssVarsCanceled) {
          reject(new Error('MeshGradient: poll canceled'));

          return;
        }

        if (this.areCssVarsLoaded()) {
          resolve();

          return;
        }

        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('CSS variables timeout'));

          return;
        }

        const elapsed = Date.now() - startTime;
        const interval = Math.min(checkInterval + elapsed / 20, 200);

        this.instanceTimers.setTimeoutMs(checkCssVars, interval);
      };

      checkCssVars();
    });
  }

  /**
   * Uses fallback colors when CSS variables are not available
   */
  private useFallbackColors(): void {
    this.sectionColors = CONSTANTS.DEFAULT_FALLBACK_COLORS.map((n) => normalizeColor(n));
  }

  /**
   * Initialize gradient colors with fallback priority:
   * 1. Colors from configuration (highest priority)
   * 2. Colors from CSS variables
   * 3. Random generated colors (fallback if neither above are available)
   */
  private initGradientColors() {
    // If colors are provided in config, use them with priority
    if (this.configColors) {
      this.sectionColors = this.configColors
        .map((hexValue) => parseHexColor(hexValue))
        .filter((color): color is number => color !== null)
        .map((colorValue) => normalizeColor(colorValue));

      return;
    }

    // Fallback to CSS variables
    const cssVars = CONSTANTS.CSS_GRADIENT_VARS;

    this.sectionColors = cssVars
      .map((cssPropertyName) => {
        const hexValue = this.computedCanvasStyle ? this.computedCanvasStyle.getPropertyValue(cssPropertyName) : '';

        return parseHexColor(hexValue);
      })
      .filter((color): color is number => color !== null)
      .map((colorValue) => normalizeColor(colorValue));

    // Final fallback to random colors if no colors were found
    if (!this.sectionColors || this.sectionColors.length === 0) {
      const randomColors = genRandomColors();

      this.sectionColors = randomColors
        .map((hexValue) => parseHexColor(hexValue))
        .filter((color): color is number => color !== null)
        .map((colorValue) => normalizeColor(colorValue));
    }
  }
}
