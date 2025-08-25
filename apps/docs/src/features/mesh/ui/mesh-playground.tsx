'use client';

import { MeshGradient } from '@mesh-gradient/react';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { genRandomColors, MeshGradientColorsConfig, MeshGradientOptions, MeshGradientToggleColorsConfig } from '@mesh-gradient/core';
import { readableColor } from 'color2k';
import { PiPauseFill, PiPlayFill } from 'react-icons/pi';
import { clsx } from 'clsx';
import { useTheme } from 'nextra-theme-docs';

import { GradientColors } from '../model/colors';

import { CodeHighlighter } from '@/src/shared/ui/code-highlighter';

export const MeshPlayground = () => {
  const { resolvedTheme } = useTheme();

  const [colors, setColors] = useState<MeshGradientColorsConfig>(GradientColors.green as MeshGradientColorsConfig);
  const [activeColors, setActiveColors] = useState<MeshGradientToggleColorsConfig | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(true);
  const [transition, setTransition] = useState<false | undefined>(undefined);
  const [randomSeed, setRandomSeed] = useState(true);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newColors = [...colors] as MeshGradientColorsConfig;

      newColors[index] = e.target.value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setColors(newColors);
      }, 150);
    },
    [colors],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const meshOptions: MeshGradientOptions = useMemo(
    () => ({ colors, transition, seed: randomSeed ? undefined : 5, activeColors }),
    [colors, transition, randomSeed, activeColors],
  );

  const formatObjectAsJS = (obj: any, indent = 2): string => {
    const spaces = ' '.repeat(indent);
    const parentSpaces = ' '.repeat(Math.max(0, indent - 2));
    const entries = Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          const formattedArray = `[\n${value.map((item) => `${spaces}  "${item}"`).join(',\n')}\n${spaces}]`;

          return `${spaces}${key}: ${formattedArray}`;
        }

        if (typeof value === 'object' && value !== null) {
          const nestedSpaces = ' '.repeat(indent + 2);
          const nestedEntries = Object.entries(value).map(([nestedKey, nestedValue]) => {
            if (typeof nestedValue === 'string') {
              return `${nestedSpaces}${nestedKey}: "${nestedValue}"`;
            }

            return `${nestedSpaces}${nestedKey}: ${nestedValue}`;
          });

          return `${spaces}${key}: {\n${nestedEntries.join(',\n')}\n${spaces}}`;
        }

        if (typeof value === 'string') {
          return `${spaces}${key}: "${value}"`;
        }

        return `${spaces}${key}: ${value}`;
      });

    return `{\n${entries.join(',\n')}\n${parentSpaces}}`;
  };

  return (
    <div>
      <div className='flex flex-col gap-4'>
        <MeshGradient options={meshOptions} isPaused={!isPlaying} className='w-full h-80 shrink-0 sm:aspect-video sm:h-auto rounded-2xl' />

        <div className='flex gap-2 sm:gap-4'>
          {colors.map((color, index) => {
            const colorId = index + 1;
            const isCurrentColorDisabled = activeColors?.[colorId as 1] === false;

            return (
              <div key={index} className='w-full flex flex-col gap-3'>
                <div
                  id='color'
                  style={{ backgroundColor: color }}
                  className='w-full h-10 rounded-full flex items-center justify-center transition-colors duration-300 relative'
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

        <p className='text-sm text-foreground/50 font-medium'>Click to line under the color to toggle its visibility</p>

        <div className='h-px w-full bg-foreground/10' />

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

        <div className='flex gap-2 -mt-1'>
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
            onClick={() => setRandomSeed(!randomSeed)}
            className={clsx(
              'h-12 rounded-full w-full flex items-center justify-center font-medium transition-colors duration-300',
              randomSeed && 'bg-foreground text-background',
              !randomSeed && 'bg-foreground/10 text-foreground',
            )}
          >
            Random seed
          </button>
        </div>

        <div className='mt-2'>
          <p className='text-base mb-2 font-medium'>Output configuration:</p>
          <CodeHighlighter
            className='bg-foreground/5'
            code={`import { type MeshGradientOptions } from '@mesh-gradient/core';

const options: MeshGradientOptions = ${formatObjectAsJS(meshOptions)};;`}
            language='typescript'
            theme={`github-${resolvedTheme}`}
          />
        </div>
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
