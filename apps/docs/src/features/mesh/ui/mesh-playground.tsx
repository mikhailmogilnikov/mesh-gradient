'use client';

import { MeshGradient } from '@mesh-gradient/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { genRandomColors, MeshGradientColorsConfig } from '@mesh-gradient/core';
import { readableColor } from 'color2k';
import { PiCheckBold, PiCopyBold, PiPauseFill, PiPlayFill } from 'react-icons/pi';
import { clsx } from 'clsx';

import { GradientColors } from '../model/colors';

export const MeshPlayground = () => {
  const [colors, setColors] = useState<MeshGradientColorsConfig>(GradientColors.green as MeshGradientColorsConfig);
  const [isPlaying, setIsPlaying] = useState(true);
  const [transition, setTransition] = useState(true);
  const [randomSeed, setRandomSeed] = useState(true);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newColors = [...colors] as MeshGradientColorsConfig;

      newColors[index] = e.target.value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Устанавливаем новый таймер на 150ms
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

  return (
    <div>
      <div className='flex flex-col gap-4'>
        <MeshGradient
          options={{ colors, transition, seed: randomSeed ? undefined : 5 }}
          isPaused={!isPlaying}
          className='w-full h-80 shrink-0 sm:aspect-video sm:h-auto rounded-2xl'
        />

        <div className='flex gap-2 sm:gap-4'>
          {colors.map((color, index) => (
            <div
              key={index}
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
          ))}
        </div>

        <div className='h-px w-full bg-foreground/10' />

        <div className='flex gap-2'>
          <button onClick={() => setColors(genRandomColors())} className='bg-foreground/10 px-4 py-2 rounded-full w-full font-medium'>
            🎲 Randomize colors
          </button>

          <CopyButton colors={colors} />

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className='bg-foreground/10 aspect-square w-10 h-10 rounded-full flex items-center justify-center'
          >
            {isPlaying ? <PiPauseFill /> : <PiPlayFill />}
          </button>
        </div>

        <div className='flex gap-2 -mt-1'>
          <button
            onClick={() => setTransition(!transition)}
            className={clsx(
              'py-2 rounded-full w-full flex items-center justify-center font-medium transition-colors duration-300',
              transition && 'bg-foreground text-background',
              !transition && 'bg-foreground/10 text-foreground',
            )}
          >
            Transition
          </button>
          <button
            onClick={() => setRandomSeed(!randomSeed)}
            className={clsx(
              'py-2 rounded-full w-full flex items-center justify-center font-medium transition-colors duration-300',
              randomSeed && 'bg-foreground text-background',
              !randomSeed && 'bg-foreground/10 text-foreground',
            )}
          >
            Random seed
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyButton = ({ colors }: { colors: string[] }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyColors = () => {
    navigator.clipboard.writeText(colors.map((color) => color).join(',')).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setCopied(false);
      }, 2000);
    });
  };

  return (
    <button onClick={handleCopyColors} className='bg-foreground/10 aspect-square w-10 h-10 rounded-full flex items-center justify-center'>
      {copied ? <PiCheckBold className='text-xl text-green-500' /> : <PiCopyBold className='text-lg' />}
    </button>
  );
};
