# Vue Mesh Gradient

Apple-inspired animated **mesh gradient** component for Vue applications. A Vue wrapper around the high-performance WebGL-powered mesh gradient library.

## ✨ Features

- 🔄 **Smooth Animations** - Hardware-accelerated WebGL transitions
- 🎨 **Customizable Colors** - Support for up to 4 colors simultaneously  
- ⚡ **Static Mode** - Optimized mode for static gradients
- 📱 **Responsive** - Automatic pause when out of viewport
- 🚀 **High Performance** - WebGL hardware acceleration with smart optimizations
- 🛠️ **TypeScript** - Full type support out of the box
- 🔧 **Vue 3 Ready** - Built specifically for Vue 3 with Composition API
- 📦 **Lightweight** - Minimal bundle size impact

## 📦 Installation

```bash
# pnpm (recommended)
pnpm add @mesh-gradient/vue

# npm
npm install @mesh-gradient/vue

# yarn
yarn add @mesh-gradient/vue
```

## 🚀 Quick Start

### Basic Usage

```vue
<template>
  <MeshGradient
    :options="gradientOptions"
    class="w-full h-64 rounded-lg"
  />
</template>

<script setup lang="ts">
import { MeshGradient } from '@mesh-gradient/vue';

const gradientOptions = {
  colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
};
</script>
```

### With Composable

```vue
<template>
  <canvas 
    ref="canvasRef" 
    class="w-full h-64 rounded-lg" 
  />
  <button @click="toggleAnimation">
    {{ isPaused ? 'Play' : 'Pause' }}
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMeshGradient } from '@mesh-gradient/vue';

const canvasRef = ref<HTMLCanvasElement>();
const { instance } = useMeshGradient();
const isPaused = ref(false);

onMounted(() => {
  if (instance.value && canvasRef.value) {
    instance.value.init(canvasRef.value, {
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
    });
  }
});

const toggleAnimation = () => {
  if (!instance.value) return;
  
  isPaused.value = !isPaused.value;
  
  if (isPaused.value) {
    instance.value.pause();
  } else {
    instance.value.play();
  }
};
</script>
```

### Advanced configuration

```vue
<template>
  <MeshGradient
    :options="advancedOptions"
    :isPaused="false"
    class="w-full h-96 rounded-xl"
    @init="onGradientInit"
    @update="onGradientUpdate"
  />
</template>

<script setup lang="ts">
import type { MeshGradient as CoreGradient, MeshGradientOptions } from '@mesh-gradient/core';
import { MeshGradient } from '@mesh-gradient/vue';

const advancedOptions: MeshGradientOptions = {
  colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
  animationSpeed: 1.2,
  density: [0.07, 0.08],
  wireframe: false,
  presetName: 'vue-demo',
  isStatic: false,
};

function onGradientInit(instance: CoreGradient) {
  console.log('Gradient initialized:', instance);
}

function onGradientUpdate(instance: CoreGradient) {
  console.log('Gradient updated:', instance);
}
</script>
```

See [Advanced usage](https://meshgradientweb.vercel.app/docs/advanced-usage) for the full option list.

## 📖 API Reference

### MeshGradient Component

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `MeshGradientOptions` | `{}` | Configuration options for the gradient |
| `isPaused` | `boolean` | `false` | Whether the animation is paused |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `init` | `(instance: MeshGradient)` | Emitted when gradient is initialized |
| `update` | `(instance: MeshGradient)` | Emitted when gradient options are updated |

### useMeshGradient Composable

Returns a reactive reference to a MeshGradient instance with automatic cleanup.

```typescript
const { instance } = useMeshGradient();
```

## Documentation

Full documentation website [available here](https://meshgradientweb.vercel.app/).

## ⚠️ Important Notes

1. **Sizing** — use `:style`, `class`, or a sized parent so the `<canvas>` has a predictable layout ([details](https://meshgradientweb.vercel.app/docs/advanced-usage#canvas-layout--hidpi)).
2. **WebGL** — requires WebGL in the browser.
3. **Cleanup** — handled on unmount when using `<MeshGradient />`; call `destroy()` on manually managed instances from `useMeshGradient` if needed.
4. **Performance** — prefer `options.isStatic` when you do not need animation.

## 🛠️ Development

```bash
pnpm install

pnpm dev
pnpm build
pnpm lint
pnpm check-types   # run from monorepo root recommended
```

## 📦 Related Packages

- [`@mesh-gradient/core`](../core/README.md) - Core mesh gradient engine
- [`@mesh-gradient/react`](../react/README.md) - React integration
- [`@mesh-gradient/docs`](../../apps/docs/README.md) - Documentation site

## 🤝 Contributing

Contributions are welcome! Please see the [contributing guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT © [Mikhail Mogilnikov](https://github.com/mikhailmogilnikov)
