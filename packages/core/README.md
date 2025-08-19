# Web Mesh Gradient

A library for creating beautiful animated mesh gradients in the browser. Inspired by SwiftUI Mesh Gradient with WebGL rendering support and performance optimization.

## ✨ Features

- 🔄 **Smooth Transitions** - Animated transitions between configurations
- 🎨 **Customizable Colors** - Support for up to 4 colors simultaneously
- ⚡ **Static Mode** - Optimized mode for static gradients
- 📱 **Responsive** - Automatic pause when out of viewport
- 🚀 **High Performance** - Autopause on leave viewport, resize throttling, WebGL hardware accelerated graphics
- 🛠️ **TypeScript** - Full type support
- 📦 **Lightweight** - Zero dependencies, `8kb` gzip

## 📦 Installation

```bash
npm install @mesh-gradient/core
```

## 🚀 Quick Start

### HTML

```html
<canvas id="gradient-canvas"></canvas>
```

### JavaScript/TypeScript

```javascript
import { MeshGradient } from 'web-mesh-gradient';

const canvas = document.querySelector('#gradient-canvas');
const gradient = new MeshGradient();

gradient.init(canvas, {
  colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
});
```

## ⚙️ Configuration

### MeshGradientOptions

| Option                   | Type                               | Default                                  | Description                     |
| ------------------------ | ---------------------------------- | ---------------------------------------- | ------------------------------- |
| `colors`                 | `[string, string, string, string]` | CSS variables                            | Array of 4 hex colors           |
| `isStatic`               | `boolean`                          | `false`                                  | Static mode without animation   |
| `seed`                   | `number`                           | `random`                                 | Seed for noise generation       |
| `frequency`              | `number \| object`                 | `{ x: 0.00014, y: 0.00029 }`             | Animation frequency             |
| `activeColors`           | `object`                           | `{ 1: true, 2: true, 3: true, 4: true }` | Active gradient colors          |
| `pauseOnOutsideViewport` | `boolean`                          | `true`                                   | Pause when out of viewport      |
| `appearance`             | `'smooth' \| 'default'`            | `'smooth'`                               | Gradient appearance mode        |
| `appearanceDuration`     | `number`                           | `300`                                    | Appearance duration (ms)        |
| `resizeDelay`            | `number`                           | `300`                                    | Resize recalculation delay (ms) |

### Frequency Configuration

```javascript
// Single value for all axes
frequency: 0.0002

// Detailed configuration
frequency: {
  x: 0.00014,      // X-axis frequency
  y: 0.00029,      // Y-axis frequency
  delta: 0.0001    // Change delta
}
```

### ActiveColors Configuration

```javascript
activeColors: {
  1: true,   // First color active
  2: true,   // Second color active
  3: false,  // Third color disabled
  4: true    // Fourth color active
}
```

## 🎯 API Methods

### `init(selector, options)`

Initializes the gradient on the specified canvas element.

```javascript
gradient.init('#canvas', {
  colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
  isStatic: false,
});
```

### `play()`

Starts the gradient animation.

```javascript
gradient.play();
```

### `pause()`

Pauses the animation.

```javascript
gradient.pause();
```

### `update(config)`

Updates the configuration with smooth transition.

```javascript
gradient.update({
  colors: ['#e91e63', '#2196f3', '#4caf50', '#ff9800'],
  transitionDuration: 1000, // Transition duration in ms
  transition: true, // Enable smooth transition
});
```

### `destroy()`

Completely destroys the gradient and frees up resources.

```javascript
gradient.destroy();
```

## 💡 Usage Examples

### Static Gradient

```javascript
const gradient = new MeshGradient();

gradient.init(canvas, {
  colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
  isStatic: true, // No animation for better performance
  appearance: 'smooth',
  appearanceDuration: 500,
});
```

### Animated Gradient with Settings

```javascript
const gradient = new MeshGradient();

gradient.init(canvas, {
  colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
  seed: 42,
  frequency: {
    x: 0.0001,
    y: 0.0002,
    delta: 0.00005,
  },
  activeColors: {
    1: true,
    2: true,
    3: true,
    4: false, // Disable fourth color
  },
});
```

### Dynamic Updates

```javascript
const gradient = new MeshGradient();

gradient.init(canvas, {
  colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
});

// Change colors after 3 seconds
setTimeout(() => {
  gradient.update({
    colors: ['#e91e63', '#2196f3', '#4caf50', '#ff9800'],
    transitionDuration: 2000,
  });
}, 3000);

// Switch to static mode
setTimeout(() => {
  gradient.update({
    isStatic: true,
    transitionDuration: 1000,
  });
}, 8000);
```

### Animation Control

```javascript
const gradient = new MeshGradient();

gradient.init(canvas, {
  colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
  pauseOnOutsideViewport: false, // Disable auto-pause
});

// Manual control
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gradient.pause();
  } else {
    gradient.play();
  }
});
```

### Using CSS Variables

```css
:root {
  --mesh-gradient-color-1: #ff0080;
  --mesh-gradient-color-2: #0080ff;
  --mesh-gradient-color-3: #80ff00;
  --mesh-gradient-color-4: #ff8000;
}
```

```javascript
// Colors will be automatically taken from CSS variables
const gradient = new MeshGradient();
gradient.init(canvas);
```

## 🔧 Advanced Settings

### Intersection Observer Settings

```javascript
gradient.init(canvas, {
  colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
  pauseOnOutsideViewport: true,
  pauseObserverOptions: {
    root: null,
    rootMargin: '50px', // Start pausing 50px before exit
    threshold: 0.1, // Pause at 10% visibility
  },
});
```

### Performance Optimization

```javascript
gradient.init(canvas, {
  colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
  resizeDelay: 500, // Increase delay for slow devices
  isStatic: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
});
```

## ⚠️ Important Notes

1. **Canvas Element** - Ensure the canvas element exists before initialization
2. **WebGL Support** - The library requires WebGL support in the browser
3. **Resource Cleanup** - Use `destroy()` when removing the component
4. **Performance** - Use `isStatic: true` for static gradients

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/mikhailmogilnikov/mesh-gradient.git

# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build
```

## 📄 License

MIT © [Mikhail Mogilnikov](https://github.com/mikhailmogilnikov)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss.