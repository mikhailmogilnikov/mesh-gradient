# @mesh-gradient/react

## 1.5.1

### Patch Changes

- Fix HiDPI canvas sizing: set logical CSS width/height on the canvas alongside the framebuffer dimensions so layout no longer grows in a ResizeObserver feedback loop.

  Also includes internal TypeScript/import cleanups affecting published types (`constants` uses `import type` where needed), tooling (`check-types` in workspaces and CI), and documentation/site updates.

- Updated dependencies
  - @mesh-gradient/core@1.5.1

## 1.5.0

### Minor Changes

- introducing vue integration with Mesh Gradient

### Patch Changes

- Updated dependencies
  - @mesh-gradient/core@1.5.0

## 1.4.1

### Patch Changes

- e950fe4: update props defs
- Updated dependencies [e950fe4]
  - @mesh-gradient/core@1.4.1

## 1.4.0

### Minor Changes

- Introducing animationSpeed option and enchanced TS documentation

### Patch Changes

- Updated dependencies
  - @mesh-gradient/core@1.4.0

## 1.3.1

### Patch Changes

- introduce React wrapper
- Updated dependencies
  - @mesh-gradient/core@1.3.1
  - react@0.0.2

## 1.3.0

### Minor Changes

- introducing React integration

### Patch Changes

- Updated dependencies
  - @mesh-gradient/core@1.3.0
  - react@0.0.1
