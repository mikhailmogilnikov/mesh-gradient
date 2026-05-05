'use client';

import { type MeshGradientColorsConfig } from '@mesh-gradient/core';
import { useMeshGradient } from '@mesh-gradient/react';
import { useEffect, useRef } from 'react';

const GRADIENT_COLORS = {
  green: ['#043D5D', '#032E46', '#23B684', '#0F595E'],
  purple: ['#ba53df', '#7948ea', '#6b03b0', '#210368'],
  sunrise: ['#8a519a', '#6101c1', '#e24097', '#f3121d'],
  oceanDream: ['#00B4DB', '#0083B0', '#00C6FF', '#0072FF'],
  twilightPurple: ['#5D3FD3', '#A389D4', '#C5B0E3', '#D9B3FF'],
  emeraldGlow: ['#0F2027', '#203A43', '#2C5364', '#4CA1AF'],
} as const;

const LANDING_COLOR_SETS = [
  GRADIENT_COLORS.oceanDream,
  GRADIENT_COLORS.twilightPurple,
  GRADIENT_COLORS.purple,
  GRADIENT_COLORS.green,
  GRADIENT_COLORS.sunrise,
  GRADIENT_COLORS.emeraldGlow,
] as const;

function getRandomColorSet(): MeshGradientColorsConfig {
  const randomIndex = Math.floor(Math.random() * LANDING_COLOR_SETS.length);

  return LANDING_COLOR_SETS[randomIndex] as unknown as MeshGradientColorsConfig;
}

export function LandingMesh() {
  const { instance } = useMeshGradient();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!instance || !ref.current) return;

    instance.init(ref.current, {
      colors: GRADIENT_COLORS.green as unknown as MeshGradientColorsConfig,
    });

    const interval = setInterval(() => {
      const randomSpeed = Math.random() * 0.5 + 0.8;

      instance.update({
        colors: getRandomColorSet(),
        transitionDuration: 400,
        animationSpeed: randomSpeed,
      });
    }, 4500);

    return () => {
      instance.destroy();
      clearInterval(interval);
    };
  }, [instance]);

  return <canvas ref={ref} className='absolute top-2 left-2 z-0 h-[calc(100%-16px)] w-[calc(100%-16px)] rounded-xl' />;
}
