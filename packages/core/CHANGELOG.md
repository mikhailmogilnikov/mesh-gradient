# mesh-gradient

## 2.0.0

### Major Changes

Production-focused rewrite of the WebGL gradient engine, configuration model, and framework integrations.

#### Rendering, layout & performance

- **HiDPI / layout correctness**: Logical canvas size (`getBoundingClientRect`) is coupled to the WebGL framebuffer via `pixelRatio`; inline CSS `width`/`height` in CSS px are synced on resize so backing-store dimensions cannot inflate layout and recurse through `ResizeObserver`.
- **Resize pipeline**: Canvas `ResizeObserver` plus debounced `window.resize` handling; configurable `resizeDelay`, `maxSegments`, and density-driven mesh segmentation capped for large layouts.
- **Animation pacing**: Target FPS pacing, `visibilitychange` integration, and `u_time`/frame timing tuned for predictable motion.
- **Accessibility & motion**: `reducedMotion` (`auto`, `ignore`, `force-static`) respects `prefers-reduced-motion` when appropriate.
- **WebGL resilience**: Context loss / restore flows, configurable `webglContextAttributes`, and `MeshGradient.isSupported()` for capability checks ahead of init.

#### Public API surface

- **Rich options**: Expanded `MeshGradientOptions` (`pixelRatio`, `frequency` with `delta`, `darkenTop`, `webglContextAttributes`, `targetFps`, callbacks, viewport pause tuning, transitions, legacy toggles, and more — see README and hosted docs).
- **Typed slices**: `MeshGradientInitOptions` (appearance) and `MeshGradientUpdateOptions` (fade/update transitions) composed into init/update payloads.
- **Hot-path helpers**: `setColors`, `setActiveColors`, `setFrequency`, `setSeed`, `setAnimationSpeed`, `toggleAutoPause`, plus existing `play`/`pause`/`destroy`.

#### Implementation quality

- **Structure**: Modular MiniGl / gradient stack, shaders and constants reorganized; fewer redundant code paths.
- **Types**: Published types stay `verbatimModuleSyntax`-friendly (`import type` where values are not runtime exports).

#### Breaking changes (migration from 1.x)

- Bump **`@mesh-gradient/core`**, **`@mesh-gradient/react`**, and **`@mesh-gradient/vue`** to **2.x together** so workspace and peer resolutions stay aligned.
- **Sizing contract**: Assume you provide meaningful CSS/layout for `<canvas>`; the library mirrors logical px into styles — review overlays that depended on uninitialized or attribute-only sizing.
- **Defaults & safety knobs**: Confirm `pauseOnOutsideViewport`, `reducedMotion`, transition defaults, and `allowDocumentCanvasFallback` (**still off by default**) match your product; prefer **`callbacks`** (`onReady`, `onError`, `onResize`) over implicit legacy class behavior where possible.

## 1.5.0

### Minor Changes

- introducing vue integration with Mesh Gradient

## 1.4.1

### Patch Changes

- e950fe4: update props defs

## 1.4.0

### Minor Changes

- Introducing animationSpeed option and enchanced TS documentation

## 1.3.1

### Patch Changes

- introduce React wrapper

## 1.3.0

### Minor Changes

- introducing React integration

## 1.2.1

### Patch Changes

- 24222d3: refactor: gradient method decomposition

## 1.2.0

### Minor Changes

- refactor core gradient functionality, remove unused event listeners

## 1.1.1

### Patch Changes

- 7fc9463: enchance package.json configuration

## 1.1.0

### Minor Changes

- 6a0238a: init
