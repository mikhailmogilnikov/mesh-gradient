import type { Vec3 } from './types';

/**
 * Converts HEX color to normalized RGB array (0-1)
 * @param hexCode - HEX color code
 * @returns RGB array [r, g, b] in range 0-1
 */
export function normalizeColor(hexCode: number): Vec3 {
  const red = ((hexCode >> 16) & 255) / 255;
  const green = ((hexCode >> 8) & 255) / 255;
  const blue = (255 & hexCode) / 255;

  return [red, green, blue];
}

/**
 * Blend modes for WebGL
 */
export const BlendModes: Record<string, number> = ['SCREEN', 'LINEAR_LIGHT'].reduce<Record<string, number>>(
  (acc, modeName, index) => Object.assign(acc, { [modeName]: index }),
  {},
);

/**
 * Helper function to assign properties dynamically
 * Used for setting up gradient properties
 */
export function setProperty<T extends object, K extends PropertyKey>(object: T, propertyName: K, val: any): T & Record<K, any> {
  if (propertyName in object) {
    Object.defineProperty(object, propertyName, {
      value: val,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    // @ts-ignore
    object[propertyName] = val;
  }

  // @ts-ignore
  return object as T & Record<K, any>;
}

/**
 * Creates a default gradient configuration
 */
export function createDefaultConfig(): {
  presetName: string;
  wireframe: boolean;
  density: [number, number];
  zoom: number;
  rotation: number;
  playing: boolean;
} {
  return {
    presetName: '',
    wireframe: false,
    density: [0.06, 0.16],
    zoom: 1,
    rotation: 0,
    playing: true,
  };
}

/**
 * Parses hex color string and handles different formats
 * @param hexValue - hex color value from CSS
 * @returns parsed integer or null if invalid
 */
export function parseHexColor(hexValue: string): number | null {
  const trimmed = hexValue.trim();

  // Handle short hex format (#RGB -> #RRGGBB)
  if (trimmed.length === 4) {
    const expanded = trimmed
      .substr(1)
      .split('')
      .map((c) => c + c)
      .join('');

    return parseInt(expanded, 16);
  }

  // Handle standard hex format
  if (trimmed && trimmed.startsWith('#')) {
    const parsed = parseInt(trimmed.substr(1), 16);

    return isNaN(parsed) ? null : parsed;
  }

  return null;
}
