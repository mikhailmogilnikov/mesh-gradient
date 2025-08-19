import { useEffect, useState } from 'react';
import { MeshGradient } from '@mesh-gradient/core';

/**
 * Hook to create and manage a MeshGradient instance. Automatically cleans up the instance when the component unmounts.
 *
 * @returns The MeshGradient instance.
 */
export const useMeshGradient = () => {
  const [instance, setInstance] = useState<MeshGradient | null>(null);

  useEffect(() => {
    const gradient = new MeshGradient();

    setInstance(gradient);

    return () => {
      gradient.destroy();
      setInstance(null);
    };
  }, []);

  return { instance };
};
