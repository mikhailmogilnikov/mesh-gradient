'use client';

import { useState, useCallback } from 'react';

import { useDebounce } from '@/src/shared/lib/useDebounce';
import { Slider } from '@/src/shared/ui/slider';

interface MeshSlidersProps {
  seed: number | undefined;
  animationSpeed: number | undefined;
  frequency: number | undefined;
  onSeedChange: (seed: number | undefined) => void;
  onAnimationSpeedChange: (speed: number | undefined) => void;
  onFrequencyChange: (frequency: number | undefined) => void;
}

const DEBOUNCE_TIME = 200;

export const MeshSliders = ({
  seed,
  animationSpeed,
  frequency,
  onSeedChange,
  onAnimationSpeedChange,
  onFrequencyChange,
}: MeshSlidersProps) => {
  const [localSeed, setLocalSeed] = useState(seed ?? 5);
  const [localAnimationSpeed, setLocalAnimationSpeed] = useState(animationSpeed ?? 1);
  const [localFrequency, setLocalFrequency] = useState(frequency ?? 0.0002);

  // Дебаунснутые коллбэки для передачи наверх
  const { debouncedCallback: debouncedOnSeedChange } = useDebounce(onSeedChange, DEBOUNCE_TIME);
  const { debouncedCallback: debouncedOnAnimationSpeedChange } = useDebounce(onAnimationSpeedChange, DEBOUNCE_TIME);
  const { debouncedCallback: debouncedOnFrequencyChange } = useDebounce(onFrequencyChange, DEBOUNCE_TIME);

  const handleSeedChange = useCallback(
    (value: number[]) => {
      const newSeed = value[0];

      setLocalSeed(newSeed);
      debouncedOnSeedChange(newSeed);
    },
    [debouncedOnSeedChange],
  );

  const handleAnimationSpeedChange = useCallback(
    (value: number[]) => {
      const newSpeed = value[0];

      setLocalAnimationSpeed(newSpeed);

      const newSpeedNormalized = newSpeed === 1 ? undefined : newSpeed;

      debouncedOnAnimationSpeedChange(newSpeedNormalized);
    },
    [debouncedOnAnimationSpeedChange],
  );

  const handleFrequencyChange = useCallback(
    (value: number[]) => {
      const newFrequency = value[0];

      setLocalFrequency(newFrequency);

      const newFrequencyNormalized = newFrequency === 0.0002 ? undefined : newFrequency;

      debouncedOnFrequencyChange(newFrequencyNormalized);
    },
    [debouncedOnFrequencyChange],
  );

  return (
    <>
      <div className='flex flex-col gap-3 mt-2'>
        <div className='flex items-center justify-between'>
          <p className='text-base font-medium'>Seed</p>
          <p className='text-sm text-foreground/50 font-medium'>{localSeed ?? 'Random'}</p>
        </div>

        <Slider
          disabled={seed === undefined}
          min={1}
          max={500}
          step={1}
          value={[localSeed]}
          onValueChange={handleSeedChange}
          className='w-full'
        />
      </div>

      <div className='flex flex-col gap-3 mt-2'>
        <div className='flex items-center justify-between'>
          <p className='text-base font-medium'>Animation speed</p>
          <p className='text-sm text-foreground/50 font-medium'>x{localAnimationSpeed ?? 1}</p>
        </div>

        <Slider min={0.1} max={10} step={0.1} value={[localAnimationSpeed]} onValueChange={handleAnimationSpeedChange} className='w-full' />
      </div>

      <div className='flex flex-col gap-3 mt-2'>
        <div className='flex items-center justify-between'>
          <p className='text-base font-medium'>Frequency</p>
          <p className='text-sm text-foreground/50 font-medium'>{localFrequency === 0.0002 ? 'Default' : localFrequency}</p>
        </div>

        <Slider min={0.0001} max={0.001} step={0.00001} value={[localFrequency]} onValueChange={handleFrequencyChange} className='w-full' />
      </div>
    </>
  );
};
