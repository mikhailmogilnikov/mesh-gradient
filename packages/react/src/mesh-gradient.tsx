import { HTMLAttributes, useEffect, useRef } from 'react';
import {
  MeshGradient as CoreMeshGradient,
  MeshGradientInitOptions,
  MeshGradientOptions,
  MeshGradientUpdateOptions,
} from '@mesh-gradient/core';

import { useMeshGradient } from './use-mesh-gradient';

export interface MeshGradientProps extends HTMLAttributes<HTMLCanvasElement> {
  options: MeshGradientOptions & MeshGradientInitOptions & MeshGradientUpdateOptions;
  /**
   * Pause the gradient.
   */
  isPaused?: boolean;
  /**
   * Callback when the gradient is initialized.
   */
  onInit?: (instance: CoreMeshGradient) => void;
  /**
   * Callback when the gradient is updated.
   */
  onUpdate?: (instance: CoreMeshGradient) => void;
}

/**
 * MeshGradient component that connects the core MeshGradient class with React.
 *
 * @param props - The component props.
 * @returns The MeshGradient component.
 */
export const MeshGradient = (props: MeshGradientProps) => {
  const { options, isPaused, onInit, onUpdate, ...canvasProps } = props;

  const { instance } = useMeshGradient();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevOptionsIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!instance || !canvasRef.current) return;

    instance.init(canvasRef.current, options);
    onInit?.(instance);
    prevOptionsIdRef.current = JSON.stringify(options);
  }, [instance, canvasRef.current]);

  useEffect(() => {
    if (!instance || !instance.isInitialized || prevOptionsIdRef.current === JSON.stringify(options)) return;

    instance.update(options);
    onUpdate?.(instance);
    prevOptionsIdRef.current = JSON.stringify(options);
  }, [instance, options]);

  useEffect(() => {
    if (!instance) return;

    if (isPaused) {
      instance.pause();
    } else {
      if (!instance.isInitialized) return;

      instance.play();
    }
  }, [instance, isPaused]);

  return <canvas ref={canvasRef} {...canvasProps} />;
};
