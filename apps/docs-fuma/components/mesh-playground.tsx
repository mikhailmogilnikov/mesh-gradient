'use client';

import { useMemo, useState } from 'react';
import { MeshGradient } from '@mesh-gradient/react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import {
  genRandomColors,
  type MeshGradientColorsConfig,
  type MeshGradientOptions,
  type MeshGradientToggleColorsConfig,
} from '@mesh-gradient/core';
import { PiPauseFill, PiPlayFill } from 'react-icons/pi';

const GradientColors = {
  green: ['#043D5D', '#032E46', '#23B684', '#0F595E'],
  peach: ['#FE6860', '#FE8A71', '#D9BBAE', '#F3C9BF'],
  sky: ['#c3e4ff', '#6ec3f4', '#eae2ff', '#b9beff'],
  purple: ['#ba53df', '#7948ea', '#6b03b0', '#210368'],
  sunrise: ['#8a519a', '#6101c1', '#e24097', '#f3121d'],
  oceanic: ['#005377', '#00A8E8', '#FFFFFF', '#00A8E8'],
  twilight: ['#2c3e50', '#4ca1af', '#c94b4b', '#e96443'],
  sunset: ['#ff7e5f', '#feb47b', '#ff9a8b', '#ff6a88'],
} as const;

function formatObjectAsJS(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/"([^"]+)":/g, '$1:');
}

function getReadableColor(hex: string): string {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) return '#000000';

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? '#111111' : '#ffffff';
}

export function MeshPlayground() {
  const [colors, setColors] = useState<MeshGradientColorsConfig>(GradientColors.sunrise as unknown as MeshGradientColorsConfig);
  const [activeColors, setActiveColors] = useState<MeshGradientToggleColorsConfig | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(false);
  const [transition, setTransition] = useState<false | undefined>(undefined);
  const [animationSpeed, setAnimationSpeed] = useState<number | undefined>(undefined);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [frequency, setFrequency] = useState<number | undefined>(undefined);

  const options = useMemo<MeshGradientOptions>(() => {
    return {
      colors,
      activeColors,
      transition,
      animationSpeed,
      frequency,
      seed,
    };
  }, [colors, activeColors, transition, animationSpeed, frequency, seed]);

  const colorsPresetValue = useMemo(() => {
    const preset = Object.entries(GradientColors).find(([, value]) => value.every((color) => colors.includes(color)));

    return preset?.[0] ?? '';
  }, [colors]);

  const toggleColor = (index: number) => {
    const colorId = (index + 1) as 1 | 2 | 3 | 4;

    if (!activeColors) {
      setActiveColors({ [colorId]: false });

      return;
    }

    const next = { ...activeColors };

    if (next[colorId] === false) {
      delete next[colorId];
    } else {
      next[colorId] = false;
    }

    setActiveColors(Object.keys(next).length ? next : undefined);
  };

  return (
    <div className='my-6'>
      <div className='flex flex-col gap-4'>
        <MeshGradient
          options={options}
          isPaused={isPaused}
          className='h-100 w-full rounded-2xl border border-fd-border sm:h-auto sm:aspect-video'
        />

        <div className='grid gap-2 sm:grid-cols-4 sm:gap-4'>
          {colors.map((color, index) => {
            const colorId = (index + 1) as 1 | 2 | 3 | 4;
            const isDisabled = activeColors?.[colorId] === false;

            return (
              <div key={index} className='space-y-2'>
                <label
                  className='relative flex h-10 cursor-pointer items-center justify-center rounded-full border border-fd-border transition-[filter,background-color]'
                  style={{ backgroundColor: color, filter: isDisabled ? 'grayscale(1)' : 'none' }}
                >
                  <input
                    type='color'
                    value={color}
                    onChange={(e) => {
                      const next = [...colors] as MeshGradientColorsConfig;

                      next[index] = e.target.value;
                      setColors(next);
                    }}
                    className='absolute inset-0 opacity-0'
                  />
                  <span className='text-xs font-medium' style={{ color: getReadableColor(color) }}>
                    {color}
                  </span>
                </label>
                <button
                  type='button'
                  onClick={() => toggleColor(index)}
                  className='h-2 w-full rounded-full border border-fd-border bg-fd-foreground transition-opacity'
                  style={{ opacity: isDisabled ? 0.3 : 1 }}
                  aria-label='Toggle color visibility'
                />
              </div>
            );
          })}
        </div>

        <p className='text-sm text-fd-muted-foreground'>Tap color badge to open picker. Tap line under badge to toggle visibility.</p>

        <div className='h-px w-full bg-fd-border' />

        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => setColors(genRandomColors())}
            className='h-12 w-full rounded-full border border-fd-border px-4 font-medium hover:bg-fd-accent/30'
          >
            🎲 Randomize colors
          </button>

          <button
            type='button'
            onClick={() => setIsPaused((v) => !v)}
            className='flex h-12 w-12 items-center justify-center rounded-full border border-fd-border hover:bg-fd-accent/30'
          >
            {isPaused ? <PiPlayFill className='text-xl' /> : <PiPauseFill className='text-xl' />}
          </button>
        </div>

        <label className='flex flex-col gap-2 text-sm'>
          <span className='font-medium'>Preset</span>
          <select
            value={colorsPresetValue}
            onChange={(e) =>
              setColors(GradientColors[e.target.value as keyof typeof GradientColors] as unknown as MeshGradientColorsConfig)
            }
            className='h-12 rounded-full border border-fd-border bg-transparent px-4'
          >
            <option value=''>Custom</option>
            {Object.keys(GradientColors).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>

        <div className='h-px w-full bg-fd-border' />

        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => setTransition((v) => (v === undefined ? false : undefined))}
            className='h-12 w-full rounded-full border border-fd-border font-medium hover:bg-fd-accent/30'
          >
            {transition === undefined ? 'Transition on' : 'Transition off'}
          </button>
          <button
            type='button'
            onClick={() => setSeed((v) => (v === undefined ? 5 : undefined))}
            className='h-12 w-full rounded-full border border-fd-border font-medium hover:bg-fd-accent/30'
          >
            {seed === undefined ? 'Random seed' : 'Seed locked'}
          </button>
        </div>

        <label className='mt-2 flex flex-col gap-2 text-sm'>
          <span className='flex items-center justify-between'>
            <span className='font-medium'>Seed</span>
            <span className='text-fd-muted-foreground'>{seed ?? 'random'}</span>
          </span>
          <input
            type='range'
            min={1}
            max={500}
            step={1}
            value={seed ?? 5}
            disabled={seed === undefined}
            onChange={(e) => setSeed(Number(e.target.value))}
          />
        </label>

        <label className='flex flex-col gap-2 text-sm'>
          <span className='flex items-center justify-between'>
            <span className='font-medium'>Animation speed</span>
            <span className='text-fd-muted-foreground'>x{animationSpeed ?? 1}</span>
          </span>
          <input
            type='range'
            min={0.1}
            max={10}
            step={0.1}
            value={animationSpeed ?? 1}
            onChange={(e) => {
              const value = Number(e.target.value);

              setAnimationSpeed(value === 1 ? undefined : value);
            }}
          />
        </label>

        <label className='flex flex-col gap-2 text-sm'>
          <span className='flex items-center justify-between'>
            <span className='font-medium'>Frequency</span>
            <span className='text-fd-muted-foreground'>{frequency ?? 'default'}</span>
          </span>
          <input
            type='range'
            min={0.0001}
            max={0.001}
            step={0.00001}
            value={frequency ?? 0.0002}
            onChange={(e) => {
              const value = Number(e.target.value);

              setFrequency(value === 0.0002 ? undefined : value);
            }}
          />
        </label>

        <p className='text-sm text-fd-muted-foreground'>
          Frequency also supports granular control over x/y/delta. See <a href='/docs/api#frequency'>API reference</a>.
        </p>

        <div className='my-2 h-px w-full bg-fd-border' />

        <div>
          <p className='mb-2 text-lg font-semibold'>Output configuration:</p>
          <DynamicCodeBlock
            lang='ts'
            code={`import { type MeshGradientOptions } from '@mesh-gradient/core';\n\nconst options: MeshGradientOptions = ${formatObjectAsJS(options)};`}
            options={{
              themes: {
                light: 'github-light',
                dark: 'github-dark',
              },
            }}
          />
        </div>

        <p className='text-sm text-fd-muted-foreground'>
          You can paste this configuration into any <b>MeshGradient</b> instance. See full list in <a href='/docs/api'>API reference</a>.
        </p>
      </div>
    </div>
  );
}
