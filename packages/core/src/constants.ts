import { MeshGradientToggleColorsConfig, Vec4 } from './types';

// Animation and timing constants
export const DEFAULT_TIME_VALUE = 1253106;
export const MAX_FRAME_DELTA = 1000 / 15; // 15 FPS limit
export const ANIMATION_DELTA_FAST = 160;
export const ANIMATION_DELTA_SLOW = -160;

// CSS and styling constants
export const MAX_CSS_VAR_RETRIES = 200;
export const SCROLLING_REFRESH_DELAY = 200;
export const MIN_WIDTH_FOR_LEGEND = 1111;
export const DEFAULT_HEIGHT = 600;
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

// Shader constants
export const DEFAULT_SHADOW_POWER = 5;
export const SMALL_SCREEN_SHADOW_POWER = 5;
export const LARGE_SCREEN_SHADOW_POWER = 6;
export const SMALL_SCREEN_WIDTH_THRESHOLD = 600;

// Uniform values
export const GLOBAL_NOISE_SPEED = 5e-6;
export const VERT_DEFORM_NOISE_SPEED = 10;
export const VERT_DEFORM_NOISE_FLOW = 3;
export const VERT_DEFORM_OFFSET = -0.5;
export const VERT_DEFORM_NOISE_FREQ: [number, number] = [3, 4];

// Wave layer constants
export const WAVE_LAYER_BASE_NOISE_SPEED = 11;
export const WAVE_LAYER_NOISE_SPEED_INCREMENT = 0.3;
export const WAVE_LAYER_BASE_NOISE_FLOW = 6.5;
export const WAVE_LAYER_NOISE_FLOW_INCREMENT = 0.3;
export const WAVE_LAYER_SEED_MULTIPLIER = 10;
export const WAVE_LAYER_NOISE_FLOOR = 0.1;
export const WAVE_LAYER_BASE_NOISE_CEIL = 0.63;
export const WAVE_LAYER_NOISE_CEIL_INCREMENT = 0.07;

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
