import type { MeshGradientToggleColorsConfig, Vec4 } from './types';

// Animation and timing constants
export const DEFAULT_TIME_VALUE = 1253106;
export const MAX_FRAME_DELTA = 1000 / 15; // 15 FPS limit
export const DEFAULT_ANIMATION_SPEED = 1.0;

export const LOADED_CLASS_DELAY = 3000;

// Resize throttling constants
export const RESIZE_THROTTLE_DELAY = 300; // milliseconds

// Gradient configuration constants
export const DEFAULT_DENSITY: [number, number] = [0.06, 0.16];
export const DEFAULT_ZOOM = 1;
export const DEFAULT_ROTATION = 0;
export const DEFAULT_PRESET_NAME = '';
export const DEFAULT_WIREFRAME = false;

export const DEFAULT_PAUSE_OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: '0px',
  threshold: 0.05,
};

export const DEFAULT_ACTIVE_TOGGLE_COLORS: MeshGradientToggleColorsConfig = {
  1: true,
  2: true,
  3: true,
  4: true,
};

export const DEFAULT_APPEARANCE_MODE = 'smooth';
export const DEFAULT_APPEARANCE_DURATION = 300;
export const DEFAULT_TRANSITION_DURATION = 300;

// Noise and animation constants
export const DEFAULT_AMP = 320;
export const DEFAULT_SEED = 5;
export const DEFAULT_FREQ_X = 14e-5;
export const DEFAULT_FREQ_Y = 29e-5;
export const DEFAULT_FREQ_DELTA = 1e-5;

export const SMALL_SCREEN_SHADOW_POWER = 5;
export const LARGE_SCREEN_SHADOW_POWER = 6;
export const SMALL_SCREEN_WIDTH_THRESHOLD = 600;

// Default colors (fallback when CSS vars are not available)
export const DEFAULT_FALLBACK_COLORS = [16711680, 16711680, 16711935, 65280, 255];

// CSS variable names
export const CSS_GRADIENT_VARS = [
  '--mesh-gradient-color-1',
  '--mesh-gradient-color-2',
  '--mesh-gradient-color-3',
  '--mesh-gradient-color-4',
] as const;

// Active colors default
export const DEFAULT_ACTIVE_COLORS: Vec4 = [1, 1, 1, 1];

// WebGL debug query
export const DEBUG_QUERY_STRING = 'debug=webgl';
