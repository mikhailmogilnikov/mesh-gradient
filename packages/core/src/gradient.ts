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
  MouseEventHandler,
  AnimationFrameHandler,
  MeshGradientOptions,
  MeshGradientFadeTransitionConfig,
} from './types';

import { normalizeColor, setProperty, parseHexColor } from './utils';
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
  public init!: (selector?: string | HTMLCanvasElement, options?: MeshGradientOptions) => MeshGradient;

  private el?: HTMLCanvasElement | null;
  private amp = CONSTANTS.DEFAULT_AMP;
  private seed = CONSTANTS.DEFAULT_SEED;
  private freqX = CONSTANTS.DEFAULT_FREQ_X;
  private freqY = CONSTANTS.DEFAULT_FREQ_Y;
  // @ts-ignore
  private freqDelta = CONSTANTS.DEFAULT_FREQ_DELTA;
  private activeColors: Vec4 = CONSTANTS.DEFAULT_ACTIVE_COLORS;
  private isStatic = false;
  private autoPauseOnInvisible = true; // Auto pause when gradient goes out of viewport

  private minigl?: MiniGl;
  private cssVarRetries: number = 0;
  private maxCssVarRetries: number = CONSTANTS.MAX_CSS_VAR_RETRIES;
  private angle: number = 0;
  private isLoadedClass: boolean = false;
  // @ts-ignore
  private isScrolling: boolean = false;
  private scrollingTimeout?: number;
  private scrollingRefreshDelay: number = CONSTANTS.SCROLLING_REFRESH_DELAY;
  private resizeTimeout?: number;
  private resizeDelay: number = 300;
  private isIntersecting: boolean = false;
  private isMetaKey = false;
  private wasPlayingBeforeInvisible = false; // Animation state before going out of viewport
  private intersectionObserver?: IntersectionObserver; // Observer for tracking visibility
  // @ts-ignore
  private pauseObserverOptions: IntersectionObserverInit = CONSTANTS.DEFAULT_PAUSE_OBSERVER_OPTIONS;
  private width?: number;
  private height?: number;

  private isMouseDown = false;
  private shaderFiles?: ShaderFiles;
  private vertexShader?: string;
  private sectionColors?: Vec3[];
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
  private scrollObserver?: IntersectionObserver;

  private handleScroll!: EventHandler;
  private handleScrollEnd!: EventHandler;
  private handleMouseDown!: MouseEventHandler;
  private handleMouseUp!: EventHandler;
  private resize!: EventHandler;

  private animate!: AnimationFrameHandler;
  private addIsLoadedClass!: EventHandler;

  constructor() {
    this.initializeProperties();
    this.setupEventHandlers();
  }

  /**
   * Completely destroys the gradient and cleans up all resources
   * This method should be called when the gradient is no longer needed
   */
  public destroy(): void {
    // Stop animation and clear timeouts
    this.pause();
    if (this.scrollingTimeout) {
      clearTimeout(this.scrollingTimeout);
      this.scrollingTimeout = undefined;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = undefined;
    }

    // Remove all event listeners
    this.disconnect();

    // Remove CSS classes
    if (this.el) {
      this.el.classList.remove('isLoaded');
      if (this.el.parentElement) {
        this.el.parentElement.classList.remove('isLoaded');
      }
    }

    // Clean up WebGL resources
    if (this.mesh) {
      this.mesh.remove();
      this.mesh = undefined;
    }

    if (this.minigl) {
      // Clear all meshes from minigl
      this.minigl.meshes.forEach((mesh) => {
        if (mesh.remove) mesh.remove();
      });
      this.minigl.meshes = [];

      // Clear WebGL context if possible
      if (this.minigl.gl) {
        const gl = this.minigl.gl;

        // Clear the canvas completely
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Delete buffers and shaders if material exists
        if (this.material) {
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

        // Delete geometry buffers
        if (this.geometry && this.geometry.attributes) {
          Object.values(this.geometry.attributes).forEach((attribute) => {
            if (attribute.buffer) {
              gl.deleteBuffer(attribute.buffer);
            }
          });
        }
      }

      // Additionally clear canvas using 2D context as fallback
      if (this.minigl.canvas) {
        const canvas = this.minigl.canvas;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    // Clear all object references
    this.el = null;
    this.minigl = undefined;
    this.mesh = undefined;
    this.material = undefined;
    this.geometry = undefined;
    this.uniforms = undefined;
    this.shaderFiles = undefined;
    this.vertexShader = undefined;
    this.sectionColors = undefined;
    this.computedCanvasStyle = undefined;
    this.conf = undefined;
    this.scrollObserver = undefined;
  }

  /**
   * Updates the gradient with new configuration. Supports fade transition if enabled.
   * @param config - New configuration options
   */
  public update(config: MeshGradientOptions & MeshGradientFadeTransitionConfig) {
    if (!this.el) return;

    if (config.transition) {
      this.updateWithFadeTransition(config);
    } else {
      this.destroy();
      this.init(this.el as HTMLCanvasElement, config);
    }
  }

  /**
   * Updates gradient with smooth fade transition
   * @param config - New configuration options
   */
  private updateWithFadeTransition(config: MeshGradientOptions & MeshGradientFadeTransitionConfig) {
    if (!this.el) return;

    const duration = config.transitionDuration || 250;
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
   * Initialize all gradient properties with default values
   */
  private initializeProperties(): void {
    // Core properties
    setProperty(this, 'el', undefined);
    setProperty(this, 'minigl', undefined);

    // State properties
    setProperty(this, 'cssVarRetries', 0);
    setProperty(this, 'maxCssVarRetries', CONSTANTS.MAX_CSS_VAR_RETRIES);
    setProperty(this, 'angle', 0);
    setProperty(this, 'isLoadedClass', false);
    setProperty(this, 'isScrolling', false);
    setProperty(this, 'scrollingTimeout', undefined);
    setProperty(this, 'scrollingRefreshDelay', CONSTANTS.SCROLLING_REFRESH_DELAY);
    setProperty(this, 'resizeTimeout', undefined);
    setProperty(this, 'resizeDelay', 300);
    setProperty(this, 'isIntersecting', false);
    setProperty(this, 'isMetaKey', false);

    setProperty(this, 'isMouseDown', false);

    // Rendering properties
    setProperty(this, 'shaderFiles', undefined);
    setProperty(this, 'vertexShader', undefined);
    setProperty(this, 'sectionColors', undefined);
    setProperty(this, 'computedCanvasStyle', undefined);
    setProperty(this, 'conf', undefined);
    setProperty(this, 'uniforms', undefined);
    setProperty(this, 'mesh', undefined);
    setProperty(this, 'material', undefined);
    setProperty(this, 'geometry', undefined);

    // Animation properties
    setProperty(this, 't', CONSTANTS.DEFAULT_TIME_VALUE);
    setProperty(this, 'last', 0);
    setProperty(this, 'frame', 0);

    // Dimension properties
    setProperty(this, 'width', undefined);

    setProperty(this, 'height', undefined);
    setProperty(this, 'xSegCount', undefined);
    setProperty(this, 'ySegCount', undefined);

    // Effects properties
    setProperty(this, 'scrollObserver', undefined);
    setProperty(this, 'amp', CONSTANTS.DEFAULT_AMP);
    setProperty(this, 'seed', CONSTANTS.DEFAULT_SEED);
    setProperty(this, 'freqX', CONSTANTS.DEFAULT_FREQ_X);
    setProperty(this, 'freqY', CONSTANTS.DEFAULT_FREQ_Y);
    setProperty(this, 'freqDelta', CONSTANTS.DEFAULT_FREQ_DELTA);
    setProperty(this, 'activeColors', [...CONSTANTS.DEFAULT_ACTIVE_COLORS]);
    setProperty(this, 'autoPauseOnInvisible', true);
  }

  /**
   * Set up all event handlers
   */
  private setupEventHandlers(): void {
    // Scroll handler
    setProperty(this, 'handleScroll', () => {
      if (typeof this.scrollingTimeout !== 'undefined') {
        clearTimeout(this.scrollingTimeout);
      }
      // @ts-ignore setTimeout returns number in browser
      this.scrollingTimeout = window.setTimeout(this.handleScrollEnd, this.scrollingRefreshDelay);

      if (this.conf && this.conf.playing) {
        this.isScrolling = true;
        this.pause();
      }
    });

    setProperty(this, 'handleScrollEnd', () => {
      this.isScrolling = false;
      if (this.isIntersecting) this.play();
    });

    setProperty(this, 'resize', () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // @ts-ignore setTimeout returns number in browser
      this.resizeTimeout = window.setTimeout(() => {
        this.performResize();
      }, this.resizeDelay);
    });

    setProperty(this, 'handleMouseDown', () => {});

    setProperty(this, 'handleMouseUp', () => {
      this.isMouseDown = false;
    });

    setProperty(this, 'animate', (e: number) => {
      if (!this.shouldSkipFrame(e) || this.isMouseDown) {
        this.t += Math.min(e - this.last, CONSTANTS.MAX_FRAME_DELTA);
        this.last = e;
        if (this.isMouseDown) {
          const delta = this.isMetaKey ? CONSTANTS.ANIMATION_DELTA_SLOW : CONSTANTS.ANIMATION_DELTA_FAST;

          this.t += delta;
        }
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
      if ((this.conf && this.conf.playing) || this.isMouseDown) {
        requestAnimationFrame(this.animate);
      }
    });

    setProperty(this, 'addIsLoadedClass', () => {
      if (!this.isLoadedClass) {
        this.isLoadedClass = true;
        if (this.el) this.el.classList.add('isLoaded');
        setTimeout(() => {
          if (this.el && this.el.parentElement) this.el.parentElement.classList.add('isLoaded');
        }, CONSTANTS.LOADED_CLASS_DELAY);
      }
    });

    setProperty(this, 'init', (selector: string | HTMLCanvasElement, options?: MeshGradientOptions) => {
      this.seed = options?.seed || Math.random() * 100;
      this.isStatic = options?.isStatic || false;
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
        playing: !this.isStatic,
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

        this.minigl = new MiniGl(this.el, null, null, true);

        // Initialize intersection observer for auto-pause functionality
        this.initIntersectionObserver();

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
    if (this.scrollObserver) {
      window.removeEventListener('scroll', this.handleScroll);
      window.removeEventListener('mousedown', this.handleMouseDown);
      window.removeEventListener('mouseup', this.handleMouseUp);
      window.removeEventListener('keydown', (this as unknown as { handleKeyDown: (event: KeyboardEvent) => void }).handleKeyDown);
      this.scrollObserver.disconnect();
    }

    // Disconnect intersection observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = undefined;
    }

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

    // Create typed reference for cleaner code
    const minigl = this.minigl as unknown as {
      Uniform: MiniGlUniformConstructor;
    };

    this.uniforms = {
      u_time: new minigl.Uniform({ value: 0 }),
      u_shadow_power: new minigl.Uniform({ value: 5 }),
      u_darken_top: new minigl.Uniform({
        value: this.el && this.el.dataset && this.el.dataset.jsDarkenTop === '' ? 1 : 0,
      }),
      u_active_colors: new minigl.Uniform({
        value: this.activeColors,
        type: 'vec4',
      }),
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

    for (let e = 1; e < (this.sectionColors ? this.sectionColors.length : 1); e += 1) {
      (this.uniforms!.u_waveLayers.value as MiniGlUniform[]).push(
        new minigl.Uniform({
          type: 'struct',
          value: {
            color: new minigl.Uniform({
              value: this.sectionColors ? this.sectionColors[e] : [1, 1, 1],
              type: 'vec3',
            }),
            noiseFreq: new minigl.Uniform({
              value: [
                2 + e / (this.sectionColors ? this.sectionColors.length : 1),
                3 + e / (this.sectionColors ? this.sectionColors.length : 1),
              ],
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

    this.vertexShader = [this.shaderFiles!.noise, this.shaderFiles!.blend, this.shaderFiles!.vertex].join('\n\n');

    return new (this.minigl as unknown as { Material: MiniGlMaterialConstructor }).Material(
      this.vertexShader,
      this.shaderFiles!.fragment,
      this.uniforms,
    );
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
   */
  private waitForCssVars() {
    if (this.computedCanvasStyle && this.computedCanvasStyle.getPropertyValue(CONSTANTS.CSS_GRADIENT_VARS[0]).indexOf('#') !== -1) {
      this.initSystem();
      this.addIsLoadedClass();
    } else {
      this.cssVarRetries += 1;
      if (this.cssVarRetries > this.maxCssVarRetries) {
        // Use fallback colors if CSS vars not available
        this.sectionColors = CONSTANTS.DEFAULT_FALLBACK_COLORS.map((n) => normalizeColor(n));
        this.initSystem();

        return;
      }
      requestAnimationFrame(() => this.waitForCssVars());
    }
  }

  /**
   * Initialize gradient colors from CSS variables
   */
  private initGradientColors() {
    const cssVars = CONSTANTS.CSS_GRADIENT_VARS;

    this.sectionColors = cssVars
      .map((cssPropertyName) => {
        const hexValue = this.computedCanvasStyle ? this.computedCanvasStyle.getPropertyValue(cssPropertyName) : '';

        return parseHexColor(hexValue);
      })
      .filter((color): color is number => color !== null)
      .map((colorValue) => normalizeColor(colorValue));
  }

  /**
   * Updates noise frequency over time for animation
   * @param e - Frequency delta
   */
  // public updateFrequency(e: number) {
  //   this.freqX += e;
  //   this.freqY += e;
  // }

  // public toggleColor(index: number) {
  //   this.activeColors[index] = this.activeColors[index] === 0 ? 1 : 0;
  // }

  /**
   * Enable or disable auto-pause when gradient goes out of viewport
   * @param enabled - Whether to enable auto-pause functionality
   */
  // public setAutoPause(enabled: boolean): void {
  //   this.autoPauseOnInvisible = enabled;

  //   if (!enabled && this.intersectionObserver) {
  //     this.intersectionObserver.disconnect();
  //     this.intersectionObserver = undefined;
  //     if (!this.isIntersecting && this.wasPlayingBeforeInvisible) {
  //       this.play();
  //       this.wasPlayingBeforeInvisible = false;
  //     }
  //   } else if (enabled && this.el && !this.intersectionObserver) {
  //     this.initIntersectionObserver();
  //   }
  // }
}
