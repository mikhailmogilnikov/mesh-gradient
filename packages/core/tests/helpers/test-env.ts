import { vi } from 'vitest';

import { CSS_GRADIENT_VARS } from '../../src/constants';

import { installWebGLGetContextMock } from './webgl-mock';

const rafQueue: FrameRequestCallback[] = [];

/**
 * Deterministic rAF: enqueue; call `drainRaf()` to run pending callbacks.
 */
function installRafMocks() {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback): number => {
    rafQueue.push(cb);

    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (_id: number) => {
    /** no-op: tests avoid cancel edge cases */
  });
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];
  unobserve = vi.fn();
}

class MockResizeObserver implements ResizeObserver {
  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

/** Run queued rAF callbacks repeatedly until empty or `maxTicks` is hit. */
export function drainRaf(maxTicks = 200): void {
  let ticks = 0;

  while (rafQueue.length && ticks < maxTicks) {
    const batch = rafQueue.splice(0, rafQueue.length);

    for (const cb of batch) {
      ticks += 1;
      cb(performance.now() + ticks);

      if (ticks >= maxTicks) break;
    }
  }
}

export function createSizedCanvas(cssW: number, cssH: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const rect = {
    width: cssW,
    height: cssH,
    top: 0,
    left: 0,
    bottom: cssH,
    right: cssW,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  };

  canvas.getBoundingClientRect = vi.fn(() => rect);

  return canvas;
}

export interface TestEnvironment {
  webgl: ReturnType<typeof installWebGLGetContextMock>;
  dispose(): void;
}

/** Install rAF, ResizeObserver, IntersectionObserver, disable matchMedia reduce by default, WebGL mock. */
export function installMinimalBrowserEnv(): TestEnvironment {
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 2 });
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  installRafMocks();
  const webgl = installWebGLGetContextMock();

  return {
    webgl,
    dispose() {
      webgl.spy.mockRestore();
      vi.unstubAllGlobals();
    },
  };
}

/** getComputedStyle shim: CSS mesh vars look “loaded” without real stylesheets. */
export function installCssVarsComputedStyleMock(): { restore: () => void } {
  const original = window.getComputedStyle.bind(window);

  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
    const base = original(el);

    return {
      getPropertyValue: (prop: string): string => {
        if ((CSS_GRADIENT_VARS as readonly string[]).includes(prop)) {
          return '#aabbcc';
        }

        return base.getPropertyValue(prop);
      },
    } as unknown as CSSStyleDeclaration;
  });

  return {
    restore: () => {
      vi.mocked(window.getComputedStyle).mockRestore();
    },
  };
}
