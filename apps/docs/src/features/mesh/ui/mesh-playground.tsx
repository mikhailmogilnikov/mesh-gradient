'use client';

import { MeshGradient } from '@mesh-gradient/react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { genRandomColors, MeshGradientColorsConfig, MeshGradientOptions, MeshGradientToggleColorsConfig } from '@mesh-gradient/core';
import { readableColor } from 'color2k';
import { PiPauseFill, PiPlayFill } from 'react-icons/pi';
import { clsx } from 'clsx';
import { Link, useTheme } from 'nextra-theme-docs';

import { GradientColors } from '../model/colors';

import { MeshSliders } from './mesh-sliders';

import { CodeHighlighter } from '@/src/shared/ui/code-highlighter';
import { formatObjectAsJS } from '@/src/shared/lib/formatObj';
import { useDebounce } from '@/src/shared/lib/useDebounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/ui/select';

export const MeshPlayground = () => {
  const { resolvedTheme } = useTheme();

  const [colors, setColors] = useState<MeshGradientColorsConfig>(GradientColors.sunrise as MeshGradientColorsConfig);
  const [activeColors, setActiveColors] = useState<MeshGradientToggleColorsConfig | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(true);
  const [transition, setTransition] = useState<false | undefined>(undefined);
  const [animationSpeed, setAnimationSpeed] = useState<number | undefined>(undefined);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [frequency, setFrequency] = useState<number | undefined>(undefined);

  const handleToggleColor = useCallback(
    (index: number) => {
      const colorId = index + 1;

      if (!activeColors) {
        setActiveColors({ [colorId]: false });

        return;
      }

      const isCurrentColorDisabled = activeColors[colorId as 1] === false;

      const isHaveAnotherDisabledColors = Object.entries(activeColors).some(([key, valueNew]) => {
        const colorIdNew = Number(key);

        return valueNew === false && colorIdNew !== colorId;
      });

      if (isHaveAnotherDisabledColors) {
        let newActiveColors = { ...activeColors };

        if (isCurrentColorDisabled) {
          delete newActiveColors[colorId as 1];
        } else {
          newActiveColors[colorId as 1] = false;
        }

        setActiveColors(newActiveColors);

        return;
      }

      setActiveColors(undefined);
    },
    [activeColors],
  );

  const { debouncedCallback: debouncedSetColors } = useDebounce(setColors, 50);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newColors = [...colors] as MeshGradientColorsConfig;

      newColors[index] = e.target.value;

      debouncedSetColors(newColors);
    },
    [colors, debouncedSetColors],
  );

  const handleToggleRandomSeed = useCallback(() => {
    setSeed(seed === undefined ? 5 : undefined);
  }, [seed]);

  const colorsPresetValue = useMemo(() => {
    const colorsPreset = Object.entries(GradientColors).find(([_key, value]) => {
      return value.every((color) => colors.includes(color));
    });

    return colorsPreset?.[0] ?? '';
  }, [colors]);

  const meshOptions: MeshGradientOptions = useMemo(
    () => ({ colors, transition, seed, activeColors, animationSpeed, frequency }),
    [colors, transition, seed, activeColors, animationSpeed, frequency],
  );

  const [debouncedMeshOptions, setDebouncedMeshOptions] = useState<MeshGradientOptions>(meshOptions);

  const { debouncedCallback: debouncedSetMeshOptions, cleanup: cleanupMeshOptions } = useDebounce(setDebouncedMeshOptions, 150);

  useEffect(() => {
    debouncedSetMeshOptions(meshOptions);
  }, [meshOptions]);

  useEffect(() => {
    return () => {
      cleanupMeshOptions();
    };
  }, [cleanupMeshOptions]);

  return (
    <div>
      <div className='flex flex-col gap-4'>
        <MeshGradient
          options={debouncedMeshOptions}
          isPaused={!isPlaying}
          className='w-full h-80 shrink-0 sm:aspect-video sm:h-auto rounded-2xl'
        />

        <div className='flex gap-2 sm:gap-4'>
          {colors.map((color, index) => {
            const colorId = index + 1;
            const isCurrentColorDisabled = activeColors?.[colorId as 1] === false;

            return (
              <div key={index} className='w-full flex flex-col gap-3'>
                <div
                  id='color'
                  style={{ backgroundColor: color }}
                  className={clsx(
                    'w-full h-10 rounded-full flex items-center justify-center transition-[filter,background-color] duration-300 relative',
                    isCurrentColorDisabled && 'grayscale',
                  )}
                >
                  <input
                    type='color'
                    value={color}
                    onChange={(e) => handleColorChange(e, index)}
                    className='absolute top-0 left-0 w-full h-full opacity-0 z-10'
                  />

                  <p className='text-sm z-0 font-medium' style={{ color: readableColor(color) }}>
                    {color}
                  </p>
                </div>

                <button
                  aria-label='Toggle color'
                  className={clsx(
                    'aspect-square w-full h-2 rounded-full flex items-center justify-center transition-colors duration-300',
                    isCurrentColorDisabled && 'bg-foreground/10',
                    !isCurrentColorDisabled && 'bg-foreground',
                  )}
                  onClick={() => handleToggleColor(index)}
                />
              </div>
            );
          })}
        </div>

        <p className='text-sm text-foreground/50 font-medium'>
          Tap to color badge to open color picker. Tap to line under the badge for change color visibility.
        </p>

        <div role='separator' className='h-px w-full bg-foreground/10' />

        <div className='flex gap-2'>
          <button onClick={() => setColors(genRandomColors())} className='bg-foreground/10 px-4 h-12 rounded-full w-full font-medium'>
            🎲 Randomize colors
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className='bg-foreground/10 aspect-square size-12 rounded-full flex items-center justify-center'
          >
            {isPlaying ? <PiPauseFill className='text-xl' /> : <PiPlayFill className='text-xl' />}
          </button>
        </div>

        <Select
          value={colorsPresetValue}
          onValueChange={(value) => setColors(GradientColors[value as keyof typeof GradientColors] as MeshGradientColorsConfig)}
        >
          <SelectTrigger className='w-full h-12 max-h-none rounded-full bg-foreground/10 text-foreground px-3'>
            <SelectValue placeholder='Select color preset' className='text-lg font-medium' />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GradientColors).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                <div
                  className='size-6 rounded-full flex items-center justify-center'
                  style={{ background: 'linear-gradient(to right, ' + value.join(', ') + ')' }}
                />
                <p className='text-base font-medium'>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div role='separator' className='h-px w-full bg-foreground/10' />

        <div className='flex gap-2'>
          <button
            onClick={() => setTransition(transition === undefined ? false : undefined)}
            className={clsx(
              'h-12 rounded-full w-full flex items-center justify-center font-medium transition-colors duration-300',
              transition === undefined && 'bg-foreground text-background',
              transition === false && 'bg-foreground/10 text-foreground',
            )}
          >
            Transition
          </button>
          <button
            onClick={handleToggleRandomSeed}
            className={clsx(
              'h-12 rounded-full w-full flex items-center justify-center font-medium transition-colors duration-300',
              !seed && 'bg-foreground text-background',
              seed && 'bg-foreground/10 text-foreground',
            )}
          >
            Random seed
          </button>
        </div>

        <MeshSliders
          seed={seed}
          animationSpeed={animationSpeed}
          frequency={frequency}
          onSeedChange={setSeed}
          onAnimationSpeedChange={setAnimationSpeed}
          onFrequencyChange={setFrequency}
        />

        <p className='text-sm text-foreground/50 font-medium mt-1'>
          Frequency also supports more granular control over the x,y and delta properties. Follow{' '}
          <Link href='/docs/api#frequency'>API reference</Link> for more details.
        </p>

        <div role='separator' className='h-px w-full bg-foreground/10 my-4' />

        <div className=''>
          <p className='text-lg mb-2 font-semibold'>Output configuration:</p>
          <CodeHighlighter
            className='bg-foreground/5'
            code={`import { type MeshGradientOptions } from '@mesh-gradient/core';

const options: MeshGradientOptions = ${formatObjectAsJS(debouncedMeshOptions)};;`}
            language='typescript'
            theme={`github-${resolvedTheme}`}
          />
        </div>
        <p className='text-sm text-foreground/50 font-medium'>
          You can paste this configuration to any <b>MeshGradient</b> instance or component in your project. Full list of available options
          you can find in <Link href='/docs/api'>API reference</Link> section.
        </p>
      </div>
    </div>
  );
};

// const CopyButton = ({ colors }: { colors: string[] }) => {
//   const [copied, setCopied] = useState(false);

//   const handleCopyColors = () => {
//     navigator.clipboard.writeText(colors.map((color) => color).join(',')).then(() => {
//       setCopied(true);
//       setTimeout(() => {
//         setCopied(false);
//         setCopied(false);
//       }, 2000);
//     });
//   };

//   return (
//     <button onClick={handleCopyColors} className='bg-foreground/10 aspect-square w-10 h-10 rounded-full flex items-center justify-center'>
//       {copied ? <PiCheckBold className='text-xl text-green-500' /> : <PiCopyBold className='text-lg' />}
//     </button>
//   );
// };
