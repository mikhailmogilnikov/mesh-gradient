import type { GradientConfig, MeshGradientColorsConfig, MeshGradientInitOptions, MeshGradientOptions, MiniGlUniform } from '../src/types';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeshGradient } from '../src/gradient';
import * as CONSTANTS from '../src/constants';

import { createSizedCanvas, drainRaf, installCssVarsComputedStyleMock, installMinimalBrowserEnv } from './helpers/test-env';

const COLORS: MeshGradientColorsConfig = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];

/** Internal test-facing state (no intersection with `MeshGradient` — private fields collapse to `never`). */
interface TestMeshGradientState {
  conf?: GradientConfig;
  freqX: number;
  freqY: number;
  pixelRatioBacking: number;
  maxSegments?: number;
  uniforms?: Record<string, MiniGlUniform>;
  resizeDelay: number;
  minigl?: { canvas: HTMLCanvasElement };
  animationSpeed: number;
  reducedMotion: string;
  configColors?: MeshGradientColorsConfig;
}

function expose(mg: MeshGradient): TestMeshGradientState {
  return mg as unknown as TestMeshGradientState;
}

function bootstrap(options?: MeshGradientOptions & MeshGradientInitOptions & { pauseOnOutsideViewport?: boolean }) {
  const mg = new MeshGradient();
  const canvas = createSizedCanvas(640, 420);
  const merged: MeshGradientOptions & MeshGradientInitOptions = {
    colors: COLORS,
    pauseOnOutsideViewport: false,
    isStatic: true,
    appearance: 'default',
    seed: 7,
    ...options,
  };

  mg.init(canvas, merged);
  drainRaf();

  return { mg, canvas };
}

describe('MeshGradient — options and public API', () => {
  let env: ReturnType<typeof installMinimalBrowserEnv>;

  beforeEach(() => {
    env = installMinimalBrowserEnv();
  });

  afterEach(() => {
    env.dispose();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  function assertInitialized(mg: MeshGradient): void {
    expect(mg.isInitialized).toBe(true);
    expect(expose(mg).minigl).toBeTruthy();
    expect(expose(mg).uniforms?.u_global).toBeTruthy();
  }

  it('initializes with colors, IO pause and static mode — mesh and uniforms are set', () => {
    const { mg } = bootstrap();

    assertInitialized(mg);
    drainRaf(30);
    const uGlobal = expose(mg).uniforms?.u_global?.value as {
      noiseFreq: { value: number[] };
    };

    expect(uGlobal.noiseFreq.value[0]).toBeCloseTo(CONSTANTS.DEFAULT_FREQ_X);
    expect(uGlobal.noiseFreq.value[1]).toBeCloseTo(CONSTANTS.DEFAULT_FREQ_Y);
    mg.destroy();
  });

  it('allowDocumentCanvasFallback selects the first canvas in the document', () => {
    const first = createSizedCanvas(320, 240);
    const second = createSizedCanvas(100, 100);

    document.body.append(first, second);

    const mg = new MeshGradient();

    mg.init('#does-not-exist', {
      allowDocumentCanvasFallback: true,
      colors: COLORS,
      pauseOnOutsideViewport: false,
      isStatic: true,
      appearance: 'default',
    });
    drainRaf();
    assertInitialized(mg);
    expect(env.webgl.lastCanvas).toBe(first);
    mg.destroy();
  });

  it('calls onError with no canvas and no fallback', () => {
    const onError = vi.fn();

    const mg = new MeshGradient();

    mg.init('#missing-canvas-node', {
      colors: COLORS,
      pauseOnOutsideViewport: false,
      callbacks: { onError },
    });
    drainRaf();
    expect(onError).toHaveBeenCalled();
    expect(mg.isInitialized).toBe(false);
    mg.destroy();
  });

  it('pixelRatio controls canvas buffer size and pixelRatioBacking', () => {
    const { mg, canvas } = bootstrap({
      pixelRatio: 2,
      pauseOnOutsideViewport: false,
    });

    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(840);
    expect(expose(mg).pixelRatioBacking).toBe(2);
    mg.destroy();
  });

  it('maxSegments caps mesh segments when resize updates geometry', () => {
    const { mg } = bootstrap({ maxSegments: 12, pauseOnOutsideViewport: false });

    assertInitialized(mg);
    const geom = (mg as unknown as { geometry?: { xSegCount: number; ySegCount: number } }).geometry;

    expect(geom?.xSegCount).toBeLessThanOrEqual(12);
    expect(geom?.ySegCount).toBeLessThanOrEqual(12);
    mg.destroy();
  });

  it('density / wireframe / zoom / rotation / presetName end up in conf and mesh wireframe', () => {
    const { mg } = bootstrap({
      density: [0.1, 0.2],
      wireframe: true,
      zoom: 1.4,
      rotation: 2,
      presetName: 'test-preset',
    });

    const x = expose(mg);

    expect(x.conf?.density).toEqual([0.1, 0.2]);
    expect(x.conf?.wireframe).toBe(true);
    expect(x.conf?.zoom).toBe(1.4);
    expect(x.conf?.rotation).toBe(2);
    expect(x.conf?.presetName).toBe('test-preset');
    expect((mg as unknown as { mesh?: { wireframe: boolean } }).mesh?.wireframe).toBe(true);
    mg.destroy();
  });

  it('frequency: scalar and object set noiseFreq', () => {
    const { mg: a } = bootstrap({ frequency: 0.05, pauseOnOutsideViewport: false });
    let g = expose(a).uniforms?.u_global?.value as { noiseFreq: { value: number[] } };

    expect(g.noiseFreq.value).toEqual([0.05, 0.05]);
    a.destroy();

    const { mg: b } = bootstrap({
      frequency: { x: 1e-3, y: 2e-3 },
      pauseOnOutsideViewport: false,
    });

    g = expose(b).uniforms?.u_global?.value as { noiseFreq: { value: number[] } };
    expect(g.noiseFreq.value[0]).toBeCloseTo(1e-3);
    expect(g.noiseFreq.value[1]).toBeCloseTo(2e-3);
    b.destroy();

    const { mg: c } = bootstrap({
      frequency: { x: 1e-3, y: 2e-3, delta: 5e-4 },
      pauseOnOutsideViewport: false,
    });

    g = expose(c).uniforms?.u_global?.value as { noiseFreq: { value: number[] } };
    expect(g.noiseFreq.value[0]).toBeCloseTo(1e-3);
    expect(g.noiseFreq.value[1]).toBeCloseTo(2e-3 + 5e-4);
    c.destroy();
  });

  it('activeColors toggles u_active_colors', () => {
    const { mg } = bootstrap({
      activeColors: { 1: false, 2: true, 3: false, 4: true },
    });

    expect(expose(mg).uniforms?.u_active_colors?.value).toEqual([0, 1, 0, 1]);
    mg.destroy();
  });

  it('darkenTop via option and data-js-darken-top both set the uniform', () => {
    const c1 = createSizedCanvas(100, 100);

    c1.dataset.jsDarkenTop = '';

    const mg1 = new MeshGradient();

    mg1.init(c1, {
      colors: COLORS,
      pauseOnOutsideViewport: false,
      isStatic: true,
      appearance: 'default',
    });
    drainRaf();
    expect(expose(mg1).uniforms?.u_darken_top?.value).toBe(1);
    mg1.destroy();

    const { mg: mg2 } = bootstrap({ darkenTop: true });

    expect(expose(mg2).uniforms?.u_darken_top?.value).toBe(1);
    mg2.destroy();

    const { mg: mg3 } = bootstrap({ darkenTop: false });

    expect(expose(mg3).uniforms?.u_darken_top?.value).toBe(0);
    mg3.destroy();
  });

  it('callbacks: onReady after init and onResize after debounced window.resize', async () => {
    const onReady = vi.fn();
    const onResize = vi.fn();

    const { mg } = bootstrap({
      callbacks: { onReady, onResize },
      resizeDelay: 5,
      pauseOnOutsideViewport: false,
    });

    drainRaf(40);
    expect(onReady).toHaveBeenCalled();

    window.dispatchEvent(new Event('resize'));
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(onResize).toHaveBeenCalled();
    expect(onResize.mock.calls[0][0]).toMatchObject({ cssWidth: 640, cssHeight: 420 });
    mg.destroy();
  });

  it('useLegacyLoadedClassBehavior: false — no isLoaded class on canvas', () => {
    const { mg, canvas } = bootstrap({ useLegacyLoadedClassBehavior: false });

    drainRaf(20);
    expect(canvas.classList.contains('isLoaded')).toBe(false);
    mg.destroy();
  });

  it('targetFps disables skipEveryOtherFrame', () => {
    const { mg } = bootstrap({ targetFps: 24, isStatic: false, pauseOnOutsideViewport: false });

    const inner = mg as unknown as { skipEveryOtherFrame?: boolean };

    expect(inner.skipEveryOtherFrame).toBe(false);
    mg.pause();
    mg.destroy();
  });

  it('reducedMotion: force-static stops the loop (disconnect after frames)', () => {
    const { mg } = bootstrap({
      reducedMotion: 'force-static',
      isStatic: false,
      pauseOnOutsideViewport: false,
    });

    drainRaf(80);
    const inner = mg as unknown as { animationRafId: number | null };

    expect(inner.animationRafId).toBeNull();
    mg.destroy();
  });

  it('animationSpeed and seed take effect', () => {
    const { mg } = bootstrap({ animationSpeed: 2.5, seed: 99, pauseOnOutsideViewport: false });

    expect(expose(mg).animationSpeed).toBe(2.5);
    expect(expose(mg).uniforms?.u_vertDeform).toBeTruthy();
    const vert = expose(mg).uniforms?.u_vertDeform?.value as { noiseSeed: { value: number } };

    expect(vert.noiseSeed.value).toBe(99);
    mg.destroy();
  });

  it('appearance: smooth — opacity 0 right after connect (before rAF initSystem)', () => {
    const canvas = createSizedCanvas(200, 200);
    const mg = new MeshGradient();

    mg.init(canvas, {
      colors: COLORS,
      appearance: 'smooth',
      pauseOnOutsideViewport: false,
      isStatic: true,
    });
    expect(canvas.style.opacity).toBe('0');
    drainRaf(20);
    mg.destroy();
  });

  it('cssVariablesFallback: reads styles from getComputedStyle — init without colors', () => {
    const styleMock = installCssVarsComputedStyleMock();

    try {
      const canvas = createSizedCanvas(300, 200);
      const mg = new MeshGradient();

      mg.init(canvas, {
        cssVariablesFallback: true,
        pauseOnOutsideViewport: false,
        isStatic: true,
        appearance: 'default',
      });
      drainRaf(40);
      expect(mg.isInitialized).toBe(true);
      mg.destroy();
    } finally {
      styleMock.restore();
    }
  });

  it('webglContextAttributes are forwarded to getContext', () => {
    const spy = env.webgl.spy;

    const { mg } = bootstrap({
      webglContextAttributes: { alpha: false, antialias: false },
      pauseOnOutsideViewport: false,
    });

    const alphaCalls = spy.mock.calls.filter((c) => c[0] === 'webgl2' || c[0] === 'webgl');

    expect(alphaCalls.length).toBeGreaterThan(0);
    expect(alphaCalls.some((c) => (c[1] as WebGLContextAttributes)?.alpha === false)).toBe(true);
    mg.destroy();
  });

  it('update with transition:false — hot path colors without destroying the instance', () => {
    const { mg } = bootstrap({ pauseOnOutsideViewport: false });
    const meshBefore = (mg as unknown as { mesh?: object }).mesh;

    mg.update({
      transition: false,
      colors: ['#111111', '#222222', '#333333', '#444444'],
    });
    drainRaf(10);
    expect((mg as unknown as { mesh?: object }).mesh).toBe(meshBefore);
    expect(expose(mg).configColors?.[0]).toBe('#111111');
    mg.destroy();
  });

  it('setColors / setActiveColors / setFrequency / setSeed', () => {
    const { mg } = bootstrap({ pauseOnOutsideViewport: false });

    mg.setColors(['#010101', '#020202', '#030303', '#040404']);
    expect(expose(mg).configColors?.[0]).toBe('#010101');

    mg.setActiveColors({ 1: true, 2: false, 3: false, 4: false });
    expect(expose(mg).uniforms?.u_active_colors?.value).toEqual([1, 0, 0, 0]);

    mg.setFrequency({ x: 0.2, y: 0.3 });
    let g = expose(mg).uniforms?.u_global?.value as { noiseFreq: { value: number[] } };

    expect(g.noiseFreq.value).toEqual([0.2, 0.3]);

    mg.setFrequency({ x: 0.2, y: 0.3, delta: 0.07 });
    g = expose(mg).uniforms?.u_global?.value as { noiseFreq: { value: number[] } };
    expect(g.noiseFreq.value).toEqual([0.2, 0.37]);

    mg.setSeed(123);
    const vert = expose(mg).uniforms?.u_vertDeform?.value as { noiseSeed: { value: number } };

    expect(vert.noiseSeed.value).toBe(123);
    mg.destroy();
  });

  it('webglcontextlost triggers onError and tears down GL', () => {
    const onError = vi.fn();
    const { mg, canvas } = bootstrap({
      callbacks: { onError },
      pauseOnOutsideViewport: false,
      isStatic: false,
      reducedMotion: 'ignore',
    });

    drainRaf(30);
    mg.pause();

    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(onError).toHaveBeenCalled();

    expect((mg as unknown as { mesh?: unknown }).mesh).toBeUndefined();
    mg.destroy();
  });

  it('update with transition:true re-inits after transitionDuration', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearInterval', 'clearTimeout'] });

    try {
      const alt: MeshGradientColorsConfig = ['#111111', '#222222', '#333333', '#444444'];

      const { mg } = bootstrap({
        pauseOnOutsideViewport: false,
        appearance: 'default',
      });

      drainRaf(80);

      mg.update({
        transition: true,
        transitionDuration: 100,
        colors: alt,
        pauseOnOutsideViewport: false,
        isStatic: true,
      });

      drainRaf(30);
      await vi.advanceTimersByTimeAsync(200);
      drainRaf(160);

      expect(expose(mg).configColors?.[0]).toBe('#111111');
      expect(mg.isInitialized).toBe(true);
      mg.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauseObserverOptions is forwarded to IntersectionObserver without errors', () => {
    const { mg } = bootstrap({
      pauseOnOutsideViewport: true,
      pauseObserverOptions: { rootMargin: '24px', threshold: [0, 0.5, 1] },
    });

    drainRaf(10);
    expect(mg.isInitialized).toBe(true);
    mg.destroy();
  });

  it('play / pause toggle conf.playing', () => {
    const { mg } = bootstrap({ isStatic: false, pauseOnOutsideViewport: false });

    mg.pause();

    expect(expose(mg).conf?.playing).toBe(false);
    mg.play();

    expect(expose(mg).conf?.playing).toBe(true);
    mg.destroy();
  });
});
