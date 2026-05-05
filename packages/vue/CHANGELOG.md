# @mesh-gradient/vue

## 2.0.0

### Major Changes

- Aligns with **`@mesh-gradient/core` 2.0.0** for all gradient behavior (layout/HiDPI, resize observers, animation pacing, reduced motion, WebGL robustness).

- **`MeshGradient` component**: same `options` / `isPaused` contract; **`useMeshGradient`** still owns instance lifetime and `destroy()` on unmount. Prefer a **stable `options` reference** (`ref` / `reactive` / `computed`) when parents re-render often.

See the [`@mesh-gradient/core` changelog](../core/CHANGELOG.md) for full release notes and migration guidance.

## 1.5.0

### Minor Changes

- introducing vue integration with Mesh Gradient

### Patch Changes

- Updated dependencies
  - @mesh-gradient/core@1.5.0

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
