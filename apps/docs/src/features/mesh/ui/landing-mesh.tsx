'use client';

import { useMeshGradient } from '@mesh-gradient/react';
import { useEffect, useRef } from 'react';
import { MeshGradientColorsConfig } from '@mesh-gradient/core';

import { getRandomColorSet, GradientColors } from '../model/colors';

export const LandingMesh = () => {
  const { instance } = useMeshGradient();

  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!instance || !ref.current) return;

    instance.init(ref.current, {
      colors: GradientColors.purple as MeshGradientColorsConfig,
    });

    setInterval(() => {
      instance.update({
        colors: getRandomColorSet() as MeshGradientColorsConfig,
        transitionDuration: 400,
      });
    }, 4500);
  }, [instance, ref]);

  return <canvas ref={ref} className='w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-xl absolute top-2 left-2 z-0' />;
};
