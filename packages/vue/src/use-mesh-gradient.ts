import { ref, onBeforeUnmount } from 'vue';
import { MeshGradient } from '@mesh-gradient/core';

/**
 * Composable for creating and managing a MeshGradient instance.
 * Automatically cleans up resources when the component unmounts.
 *
 * @returns Reactive reference to MeshGradient instance
 */
export const useMeshGradient = () => {
  const instance = ref<MeshGradient | null>(null);

  // Create MeshGradient instance
  const gradient = new MeshGradient();

  instance.value = gradient;

  // Automatic cleanup on unmount
  onBeforeUnmount(() => {
    if (instance.value) {
      instance.value.destroy();
      instance.value = null;
    }
  });

  return { instance };
};
