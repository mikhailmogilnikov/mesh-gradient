# @mesh-gradient/vue

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
  - vue@0.0.1

## 1.4.1

### Minor Changes

- 🎉 Initial Vue 3 integration release
- ✨ MeshGradient component with reactive props
- 🔧 useMeshGradient composable for manual control
- 📝 Full TypeScript support
- 🎨 Supports all core mesh gradient features
- 🚀 Automatic memory cleanup and lifecycle management

### Patch Changes

- Updated dependencies
  - @mesh-gradient/core@1.4.1
