import { defineComponent, ref, onMounted, watch, h, type PropType, type CanvasHTMLAttributes } from 'vue';
import {
  MeshGradient as CoreMeshGradient,
  type MeshGradientInitOptions,
  type MeshGradientOptions,
  type MeshGradientUpdateOptions,
} from '@mesh-gradient/core';

import { useMeshGradient } from './use-mesh-gradient';

export interface MeshGradientProps {
  /**
   * Configuration options for the gradient
   */
  options?: MeshGradientOptions & MeshGradientInitOptions & MeshGradientUpdateOptions;
  /**
   * Pause the gradient animation
   */
  isPaused?: boolean;
}

/**
 * Vue MeshGradient component that connects the core MeshGradient class to Vue.
 *
 * @example
 * ```vue
 * <template>
 *   <MeshGradient
 *     :options="{ colors: ['#ff0000', '#00ff00', '#0000ff'] }"
 *     :isPaused="false"
 *     @init="onGradientInit"
 *     @update="onGradientUpdate"
 *   />
 * </template>
 * ```
 */
export const MeshGradient = defineComponent({
  name: 'MeshGradient',
  props: {
    /**
     * Gradient configuration options
     */
    options: {
      type: Object as PropType<MeshGradientOptions & MeshGradientInitOptions & MeshGradientUpdateOptions>,
      default: () => ({}),
    },
    /**
     * Pause the gradient animation
     */
    isPaused: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    /**
     * Gradient initialization event
     */
    init: (instance: CoreMeshGradient) => instance instanceof CoreMeshGradient,
    /**
     * Gradient update event
     */
    update: (instance: CoreMeshGradient) => instance instanceof CoreMeshGradient,
  },
  setup(props, { emit, attrs }) {
    const canvasRef = ref<HTMLCanvasElement>();
    const { instance } = useMeshGradient();
    const prevOptionsRef = ref<string | null>(null);
    const isInitialized = ref(false);

    // Initialize gradient on mount
    onMounted(() => {
      if (!instance.value || !canvasRef.value) return;

      instance.value.init(canvasRef.value, props.options);
      emit('init', instance.value as CoreMeshGradient);
      prevOptionsRef.value = JSON.stringify(props.options);
      isInitialized.value = true;
    });

    // Watch for options changes
    watch(
      () => props.options,
      (newOptions) => {
        if (!instance.value || !instance.value.isInitialized || !isInitialized.value || prevOptionsRef.value === JSON.stringify(newOptions))
          return;

        instance.value.update(newOptions);
        emit('update', instance.value as CoreMeshGradient);
        prevOptionsRef.value = JSON.stringify(newOptions);
      },
      { deep: true },
    );

    // Watch for pause state changes
    watch(
      () => props.isPaused,
      (paused) => {
        if (!instance.value || !isInitialized.value) return;

        if (paused) {
          instance.value.pause();
        } else {
          instance.value.play();
        }
      },
    );

    return () => {
      return h('canvas', {
        ref: canvasRef,
        ...(attrs as CanvasHTMLAttributes),
      });
    };
  },
});
