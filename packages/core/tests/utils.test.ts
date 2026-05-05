import { describe, expect, it } from 'vitest';

import { MeshGradient } from '../src/gradient';
import { normalizeColor, parseHexColor, genRandomColors } from '../src/utils';

describe('utils', () => {
  it('normalizeColor parses packed RGB integers', () => {
    expect(normalizeColor(0xff0000)).toEqual([1, 0, 0]);
    expect(normalizeColor(0x00ff80)).toEqual([0, 1, 128 / 255]);
  });

  it('parseHexColor accepts #RGB, #RRGGBB, #RRGGBBAA', () => {
    expect(parseHexColor('#abc')).toBe(0xaabbcc);
    expect(parseHexColor('#336699')).toBe(0x336699);
    expect(parseHexColor('#336699cc')).toBe(0x336699);
    expect(parseHexColor('oops')).toBeNull();
  });

  it('genRandomColors returns four hex triplets', () => {
    let i = 0;
    const colors = genRandomColors(() => {
      i += 0.11;

      return i % 1;
    });

    expect(colors.length).toBe(4);

    colors.forEach((hex) => {
      expect(hex).toMatch(/^#[\da-f]{6}$/i);
    });
  });
});

describe('MeshGradient.isSupported', () => {
  it('returns a boolean', () => {
    if (typeof document === 'undefined') {
      expect(MeshGradient.isSupported()).toBe(false);
    } else {
      expect(typeof MeshGradient.isSupported()).toBe('boolean');
    }
  });
});
