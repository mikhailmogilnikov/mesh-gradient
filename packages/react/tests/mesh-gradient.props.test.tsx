import type { MeshGradientColorsConfig } from '@mesh-gradient/core';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeshGradient } from '../src/mesh-gradient';
import { drainRaf, installMinimalBrowserEnv } from '../../core/tests/helpers/test-env';

const COLORS: MeshGradientColorsConfig = ['#112233', '#445566', '#778899', '#aabbcc'];

describe('React MeshGradient — props', () => {
  let env: ReturnType<typeof installMinimalBrowserEnv>;

  beforeEach(() => {
    env = installMinimalBrowserEnv();
  });

  afterEach(() => {
    cleanup();
    env.dispose();
    vi.restoreAllMocks();
  });

  it('options and DOM props on canvas + onInit with initialized instance', async () => {
    const onInit = vi.fn();

    render(
      <MeshGradient
        data-testid='grad'
        className='hero-canvas'
        options={{
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          pixelRatio: 1,
          targetFps: 30,
          reducedMotion: 'ignore',
          seed: 3,
          animationSpeed: 1.25,
          frequency: { x: 1e-4, y: 2e-4 },
          activeColors: { 1: true, 2: false, 3: true, 4: false },
          darkenTop: true,
          density: [0.08, 0.09],
          wireframe: false,
          zoom: 1.1,
          rotation: 0.2,
          presetName: 'react-test',
          webglContextAttributes: { alpha: false },
          useLegacyLoadedClassBehavior: false,
          appearance: 'default',
          maxSegments: 20,
          resizeDelay: 100,
          transition: false,
        }}
        onInit={onInit}
      />,
    );

    const canvas = screen.getByTestId('grad');

    expect(canvas.tagName).toBe('CANVAS');
    expect(canvas).toHaveClass('hero-canvas');

    drainRaf(200);
    await waitFor(() => expect(onInit).toHaveBeenCalled(), { timeout: 3000 });

    drainRaf(80);
    expect(onInit.mock.calls[0][0].isInitialized).toBe(true);
  });

  it('isPaused puts core in paused state', async () => {
    const onInit = vi.fn();

    const { rerender } = render(
      <MeshGradient
        data-testid='p'
        options={{
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          appearance: 'default',
        }}
        onInit={onInit}
      />,
    );

    drainRaf(200);
    await waitFor(() => expect(onInit).toHaveBeenCalled(), { timeout: 3000 });

    drainRaf(50);

    const inst = onInit.mock.calls[0][0];

    rerender(
      <MeshGradient
        data-testid='p'
        isPaused
        options={{
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          appearance: 'default',
        }}
        onInit={onInit}
      />,
    );

    expect((inst as unknown as { conf?: { playing: boolean } }).conf?.playing).toBe(false);
  });

  it('onUpdate when options change', async () => {
    const onUpdate = vi.fn();

    const { rerender } = render(
      <MeshGradient
        options={{
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          appearance: 'default',
          animationSpeed: 1,
        }}
        onUpdate={onUpdate}
      />,
    );

    await waitFor(() => expect(document.querySelector('canvas')).toBeTruthy(), { timeout: 3000 });
    drainRaf(200);

    rerender(
      <MeshGradient
        options={{
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          appearance: 'default',
          animationSpeed: 2,
        }}
        onUpdate={onUpdate}
      />,
    );

    drainRaf(120);
    await waitFor(() => expect(onUpdate).toHaveBeenCalled(), { timeout: 3000 });
  });
});
