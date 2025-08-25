import type {
  Vec3,
  Vec4,
  MiniGlUniform,
  MiniGlMesh,
  MiniGlMaterial,
  MiniGlPlaneGeometry,
  MiniGlMeshConstructor,
  MiniGlPlaneGeometryConstructor,
  MiniGlMaterialConstructor,
  MiniGlUniformConstructor,
  GradientConfig,
  ShaderFiles,
  EventHandler,
  AnimationFrameHandler,
  MeshGradientOptions,
  MeshGradientUpdateOptions,
  MeshGradientColorsConfig,
  MeshGradientInitOptions,
} from './types';

import { normalizeColor, setProperty, parseHexColor, genRandomColors } from './utils';
import { MiniGl } from './minigl';
import { SHADERS } from './shaders';
import * as CONSTANTS from './constants';

/**
 * Gradient class for creating animated mesh gradients
 * Manages WebGL rendering of animated gradient effects
 */
export class MeshGradient {
  /**
   * Initialize the gradient
   * @param selector - The selector for the canvas element or the canvas element itself
   * @param options - The options for the gradient
   * @returns The gradient instance
   */
  public init!: (selector: string | HTMLCanvasElement, options?: MeshGradientOptions & MeshGradientInitOptions) => MeshGradient;

  /**
   * Whether the gradient is been initialized by calling `init` method.
   * @default false
   */
  public isInitialized = false;
  private el?: HTMLCanvasElement | null;
  private amp = CONSTANTS.DEFAULT_AMP;
  private seed = CONSTANTS.DEFAULT_SEED;
  private freqX = CONSTANTS.DEFAULT_FREQ_X;
  private freqY = CONSTANTS.DEFAULT_FREQ_Y;
  // @ts-ignore
  private freqDelta = CONSTANTS.DEFAULT_FREQ_DELTA;
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

  private resize!: EventHandler;

  private animate!: AnimationFrameHandler;
  private addIsLoadedClass!: EventHandler;

  constructor() {
    this.initializeProperties();
    this.setupEventHandlers();
  }

  /**
   * Completely destroys the gradient and cleans up all resources.
   * This method should be called when the gradient is no longer needed
   */
  public destroy(): void {
    this.stopAnimationAndTimers();
    this.disconnect();
    this.removeCssClasses();
    this.cleanupWebGLResources();
    this.clearObjectReferences();
    this.isInitialized = false;
  }

  /**
   * Updates the gradient with new configuration. Supports fade transition if enabled.
   * @param config - New configuration options
   */
  public update(config?: MeshGradientOptions & MeshGradientUpdateOptions) {
    if (!this.el) return;
    const transition = config?.transition ?? true;

    if (transition) {
      this.updateWithFadeTransition(config || {});
    } else {
      this.destroy();
      this.init(this.el as HTMLCanvasElement, { ...config, appearance: 'default' });
    }
  }

  /**
   * Updates gradient with smooth fade transition
   * @param config - New configuration options
   */
  private updateWithFadeTransition(config: MeshGradientOptions & MeshGradientUpdateOptions) {
    if (!this.el) return;

    const duration = config.transitionDuration || CONSTANTS.DEFAULT_TRANSITION_DURATION;
    const canvas = this.el;

    const originalCanvas = canvas;

    canvas.style.transition = `opacity ${duration}ms ease-in-out`;
    canvas.style.opacity = '1';

    requestAnimationFrame(() => {
      canvas.style.opacity = '0';
    });

    setTimeout(() => {
      this.destroy();

      this.init(originalCanvas, config);

      if (this.el) {
        this.el.style.opacity = '0';
        this.el.style.transition = `opacity ${duration}ms ease-in-out`;

        requestAnimationFrame(() => {
          if (this.el) {
            this.el.style.opacity = '';
          }
        });

        setTimeout(() => {
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
    requestAnimationFrame(this.animate);
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
  private cleanupWebGLResources(): void {
    if (this.mesh) {
      this.mesh.remove();
      this.mesh = undefined;
    }

    if (!this.minigl) return;

    this.cleanupMiniGlMeshes();
    this.cleanupWebGLContext();
    this.clearCanvasAsFallback();
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
   * Initialize all gradient properties with default values
   * Uses Object.assign for better performance than multiple setProperty calls
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
      freqDelta: CONSTANTS.DEFAULT_FREQ_DELTA,
      activeColors: [...CONSTANTS.DEFAULT_ACTIVE_COLORS] as Vec4,
      animationSpeed: CONSTANTS.DEFAULT_ANIMATION_SPEED,
      autoPauseOnInvisible: true,
    };

    Object.assign(this, defaultProperties);
  }

  /**
   * Set up all event handlers
   */
  private setupEventHandlers(): void {
    setProperty(this, 'resize', () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // @ts-ignore setTimeout returns number in browser
      this.resizeTimeout = window.setTimeout(() => {
        this.performResize();
      }, this.resizeDelay);
    });

    setProperty(this, 'animate', (e: number) => {
      if (!this.shouldSkipFrame(e)) {
        this.t += Math.min(e - this.last, CONSTANTS.MAX_FRAME_DELTA) * this.animationSpeed;
        this.last = e;

        if (this.mesh && this.mesh.material && this.mesh.material.uniforms && this.mesh.material.uniforms.u_time) {
          this.mesh.material.uniforms.u_time.value = this.t;
        }
        if (this.minigl) this.minigl.render();
      }
      if (this.last !== 0 && this.isStatic) {
        if (this.minigl) this.minigl.render();
        this.disconnect();

        return;
      }
      this.frame += 1;
      if (this.conf && this.conf.playing) {
        requestAnimationFrame(this.animate);
      }
    });

    setProperty(this, 'addIsLoadedClass', () => {
      if (!this.isLoadedClass) {
        this.isLoadedClass = true;

        if (this.el) {
          // Apply smooth appearance if enabled
          if (this.appearanceMode === 'smooth') {
            this.el.style.opacity = '0';
            this.el.style.transition = `opacity ${this.appearanceDuration}ms ease-in-out`;

            // Trigger smooth appearance
            requestAnimationFrame(() => {
              if (this.el) {
                this.el.style.opacity = '1';
              }
            });

            // Clean up transition after animation completes
            setTimeout(() => {
              if (this.el) {
                this.el.style.transition = '';
                this.el.style.opacity = '';
              }
            }, this.appearanceDuration);
          }

          this.el.classList.add('isLoaded');
        }

        setTimeout(() => {
          if (this.el && this.el.parentElement) {
            this.el.parentElement.classList.add('isLoaded');
          }
        }, CONSTANTS.LOADED_CLASS_DELAY);
      }
    });

    setProperty(this, 'init', (selector: string | HTMLCanvasElement, options?: MeshGradientOptions & MeshGradientInitOptions) => {
      this.seed = options?.seed || Math.random() * 100;
      this.isStatic = options?.isStatic || false;
      this.animationSpeed = options?.animationSpeed || CONSTANTS.DEFAULT_ANIMATION_SPEED;
      this.resizeDelay = options?.resizeDelay || CONSTANTS.RESIZE_THROTTLE_DELAY;

      if (typeof options?.frequency === 'number') {
        this.freqX = options.frequency;
        this.freqY = options.frequency;
        this.freqDelta = options.frequency;
      } else {
        this.freqX = options?.frequency?.x || CONSTANTS.DEFAULT_FREQ_X;
        this.freqY = options?.frequency?.y || CONSTANTS.DEFAULT_FREQ_Y;
        this.freqDelta = options?.frequency?.delta || CONSTANTS.DEFAULT_FREQ_DELTA;
      }

      const activeColors = {
        ...CONSTANTS.DEFAULT_ACTIVE_TOGGLE_COLORS,
        ...options?.activeColors,
      };

      this.activeColors = [activeColors[1] ? 1 : 0, activeColors[2] ? 1 : 0, activeColors[3] ? 1 : 0, activeColors[4] ? 1 : 0];

      this.configColors = options?.colors ?? (options?.cssVariablesFallback ? undefined : genRandomColors());

      // Store appearance settings
      this.appearanceMode = options?.appearance || CONSTANTS.DEFAULT_APPEARANCE_MODE;
      this.appearanceDuration = options?.appearanceDuration || CONSTANTS.DEFAULT_APPEARANCE_DURATION;

      this.pauseObserverOptions = {
        ...CONSTANTS.DEFAULT_PAUSE_OBSERVER_OPTIONS,
        ...options?.pauseObserverOptions,
      };

      this.autoPauseOnInvisible = options?.pauseOnOutsideViewport ?? true;

      this.conf = {
        presetName: CONSTANTS.DEFAULT_PRESET_NAME,
        wireframe: CONSTANTS.DEFAULT_WIREFRAME,
        zoom: CONSTANTS.DEFAULT_ZOOM,
        rotation: CONSTANTS.DEFAULT_ROTATION,
        density: CONSTANTS.DEFAULT_DENSITY,
        playing: true,
      };

      this.el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      this.connect();

      return this;
    });
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
      this.minigl.setSize(this.width, this.height);
      this.minigl.setOrthographicCamera();
    }
    this.xSegCount = Math.ceil((this.width as number) * (this.conf ? this.conf.density[0] : CONSTANTS.DEFAULT_DENSITY[0]));
    this.ySegCount = Math.ceil((this.height || 0) * (this.conf ? this.conf.density[1] : CONSTANTS.DEFAULT_DENSITY[1]));
    if (this.mesh && this.mesh.geometry) {
      this.mesh.geometry.setTopology(this.xSegCount as number, this.ySegCount as number);
      this.mesh.geometry.setSize(this.width as number, this.height || 0);
    }
    if (this.mesh && this.mesh.material && this.mesh.material.uniforms && this.mesh.material.uniforms.u_shadow_power) {
      this.mesh.material.uniforms.u_shadow_power.value =
        this.width! < CONSTANTS.SMALL_SCREEN_WIDTH_THRESHOLD ? CONSTANTS.SMALL_SCREEN_SHADOW_POWER : CONSTANTS.LARGE_SCREEN_SHADOW_POWER;
    }
  }

  /**
   * Establishes WebGL connection and initializes shaders
   */
  private async connect(): Promise<void> {
    this.shaderFiles = SHADERS;

    // Find canvas element
    if (document.querySelectorAll('canvas').length < 1) {
      // eslint-disable-next-line no-console
      console.log('DID NOT LOAD CANVAS');
    } else {
      // choose first canvas if el not yet set
      if (!this.el) {
        this.el = document.querySelector('canvas') as HTMLCanvasElement;
      }
      if (this.el) {
        // Initialize canvas dimensions
        const rect = this.el.getBoundingClientRect();

        this.width = rect.width;
        this.height = rect.height;

        // Set initial opacity for smooth appearance
        if (this.appearanceMode === 'smooth') {
          this.el.style.opacity = '0';
        }

        this.minigl = new MiniGl(this.el, null, null, true);

        // Initialize intersection observer for auto-pause functionality
        this.initIntersectionObserver();

        this.isInitialized = true;

        requestAnimationFrame(() => {
          if (this.el) {
            this.computedCanvasStyle = getComputedStyle(this.el);
            this.waitForCssVars();
          }
        });
      }
    }
  }

  private disconnect() {
    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }

    // Remove resize listener
    window.removeEventListener('resize', this.resize);
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

  private initMaterial(): InstanceType<MiniGl['Material']> {
    if (!this.minigl) throw new Error('MiniGl not initialized');

    const minigl = this.minigl as unknown as { Uniform: MiniGlUniformConstructor };

    this.uniforms = {
      ...this.createBasicUniforms(minigl),
      ...this.createGlobalUniform(minigl),
      ...this.createVertexDeformUniform(minigl),
      ...this.createColorUniforms(minigl),
    };

    this.createWaveLayersUniforms(minigl);
    this.buildVertexShader();

    return new (this.minigl as unknown as { Material: MiniGlMaterialConstructor }).Material(
      this.vertexShader!,
      this.shaderFiles!.fragment,
      this.uniforms,
    );
  }

  /**
   * Creates basic uniforms (time, shadow, darken, active colors)
   */
  private createBasicUniforms(minigl: { Uniform: MiniGlUniformConstructor }) {
    return {
      u_time: new minigl.Uniform({ value: 0 }),
      u_shadow_power: new minigl.Uniform({ value: 5 }),
      u_darken_top: new minigl.Uniform({
        value: this.el && this.el.dataset && this.el.dataset.jsDarkenTop === '' ? 1 : 0,
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
  private createGlobalUniform(minigl: { Uniform: MiniGlUniformConstructor }) {
    return {
      u_global: new minigl.Uniform({
        value: {
          noiseFreq: new minigl.Uniform({
            value: [this.freqX, this.freqY],
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
  private createVertexDeformUniform(minigl: { Uniform: MiniGlUniformConstructor }) {
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
  private createColorUniforms(minigl: { Uniform: MiniGlUniformConstructor }) {
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
  private createWaveLayersUniforms(minigl: { Uniform: MiniGlUniformConstructor }): void {
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
    this.material = this.initMaterial();
    // Create geometry and mesh
    this.geometry = new (
      this.minigl as unknown as {
        PlaneGeometry: MiniGlPlaneGeometryConstructor;
      }
    ).PlaneGeometry();
    this.mesh = new (this.minigl as unknown as { Mesh: MiniGlMeshConstructor }).Mesh(this.geometry, this.material);
  }

  /**
   * Determines if current frame should be skipped for performance
   * @param e - Current time
   * @returns true if frame should be skipped
   */
  private shouldSkipFrame(_e: number) {
    return (
      !!window.document.hidden || // Tab is hidden
      !(this.conf && this.conf.playing) || // Animation paused
      this.frame % 2 === 0 || // Skip every other frame
      undefined
    );
  }

  /**
   * Initialize gradient system - colors, mesh, and animation
   */
  private initSystem() {
    this.initGradientColors();
    this.initMesh();
    this.performResize(); // Call directly without debounce during initialization
    requestAnimationFrame(this.animate);
    window.addEventListener('resize', this.resize);
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
      const maxWaitTime = 3000; // 3 seconds timeout
      const checkInterval = 50; // Start with 50ms intervals
      const startTime = Date.now();

      const checkCssVars = () => {
        if (this.areCssVarsLoaded()) {
          resolve();

          return;
        }

        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('CSS variables timeout'));

          return;
        }

        // Exponential backoff: increase interval gradually
        const elapsed = Date.now() - startTime;
        const interval = Math.min(checkInterval + elapsed / 20, 200);

        setTimeout(checkCssVars, interval);
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
