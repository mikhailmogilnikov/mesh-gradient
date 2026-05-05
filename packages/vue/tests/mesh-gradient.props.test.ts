import type { MeshGradient as CoreMg, MeshGradientColorsConfig } from '@mesh-gradient/core';

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeshGradient } from '../src/mesh-gradient';
import { drainRaf, installMinimalBrowserEnv } from '../../core/tests/helpers/test-env';

const COLORS: MeshGradientColorsConfig = ['#aa1100', '#00aa11', '#0011aa', '#aa00aa'];

describe('Vue MeshGradient — props', () => {
  let env: ReturnType<typeof installMinimalBrowserEnv>;

  beforeEach(() => {
    env = installMinimalBrowserEnv();
  });

  afterEach(() => {
    env.dispose();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('forwards options and attrs to canvas, init emits core MeshGradient', async () => {
    const wrapper = mount(MeshGradient, {
      props: {
        options: {
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          pixelRatio: 1.5,
          targetFps: 20,
          reducedMotion: 'ignore',
          seed: 11,
          animationSpeed: 0.75,
          frequency: 0.04,
          activeColors: { 1: false, 2: true, 3: true, 4: false },
          darkenTop: false,
          density: [0.07, 0.07],
          wireframe: false,
          zoom: 1.05,
          rotation: 1.2,
          presetName: 'vue-test',
          webglContextAttributes: { preserveDrawingBuffer: true },
          useLegacyLoadedClassBehavior: false,
          appearance: 'default',
          maxSegments: 15,
          resizeDelay: 50,
          transition: false,
        },
      },
      attrs: {
        class: 'vue-grad-canvas',
        'data-testid': 'vgrad',
      },
      attachTo: document.body,
    });

    await flushPromises();
    drainRaf(120);

    expect(wrapper.element.tagName).toBe('CANVAS');
    expect(wrapper.classes()).toContain('vue-grad-canvas');

    expect(wrapper.emitted('init')).toBeTruthy();
    const core = wrapper.emitted('init')?.[0]?.[0] as CoreMg;

    expect(core).toBeTruthy();
    expect(core.isInitialized).toBe(true);
    wrapper.unmount();
  });

  it('isPaused puts core into paused state', async () => {
    const wrapper = mount(MeshGradient, {
      props: {
        isPaused: false,
        options: {
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          appearance: 'default',
        },
      },
      attachTo: document.body,
    });

    await flushPromises();
    drainRaf(120);

    const core = wrapper.emitted('init')?.[0]?.[0] as CoreMg;
    const state = core as unknown as { conf?: { playing: boolean } };

    expect(state.conf?.playing).toBe(true);

    await wrapper.setProps({ isPaused: true });
    await flushPromises();

    expect(state.conf?.playing).toBe(false);
    wrapper.unmount();
  });

  it('emits update when options change (deep watch)', async () => {
    const wrapper = mount(MeshGradient, {
      props: {
        options: {
          colors: COLORS,
          pauseOnOutsideViewport: false,
          isStatic: true,
          appearance: 'default',
          seed: 1,
        },
      },
      attachTo: document.body,
    });

    await flushPromises();
    drainRaf(120);

    await wrapper.setProps({
      options: {
        colors: COLORS,
        pauseOnOutsideViewport: false,
        isStatic: true,
        appearance: 'default',
        seed: 99,
      },
    });

    await flushPromises();
    drainRaf(120);

    expect(wrapper.emitted('update')?.length).toBeGreaterThan(0);
    wrapper.unmount();
  });
});
