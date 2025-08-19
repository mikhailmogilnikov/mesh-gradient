# React Mesh Gradient

Apple-inspired animated **mesh gradient** component for React applications. A React wrapper around the high-performance WebGL-powered mesh gradient library.

## ✨ Features

- 🔄 **Smooth Animations** - Hardware-accelerated WebGL transitions
- 🎨 **Customizable Colors** - Support for up to 4 colors simultaneously  
- ⚡ **Static Mode** - Optimized mode for static gradients
- 📱 **Responsive** - Automatic pause when out of viewport
- 🚀 **High Performance** - WebGL hardware acceleration with smart optimizations
- 🛠️ **TypeScript** - Full type support out of the box
- ⚛️ **React-First** - Built specifically for React with hooks and components
- 📦 **Lightweight** - Minimal bundle size impact

## 🚀 Installation

```bash
# npm
npm install @mesh-gradient/react
```

## 🏃‍♂️ Quick Start

```tsx
import { MeshGradient } from '@mesh-gradient/react';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <MeshGradient
        options={{
          colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000']
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

## 📖 API Reference

### MeshGradient Component

The main React component for rendering animated mesh gradients.

```tsx
interface MeshGradientProps extends HTMLAttributes<HTMLCanvasElement> {
  options: MeshGradientOptions & MeshGradientInitOptions & MeshGradientUpdateOptions;
  isPaused?: boolean;
  onInit?: (instance: CoreMeshGradient) => void;
  onUpdate?: (instance: CoreMeshGradient) => void;
}
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `MeshGradientOptions` | Configuration options for the gradient |
| `isPaused` | `boolean` | Whether the animation should be paused |
| `onInit` | `(instance) => void` | Callback when gradient is initialized |
| `onUpdate` | `(instance) => void` | Callback when gradient is updated |
| `...canvasProps` | `HTMLAttributes` | Standard HTML canvas attributes |

### useMeshGradient Hook

Hook for manual gradient management with automatic cleanup.

```tsx
const { instance } = useMeshGradient();
```

Returns a `MeshGradient` instance that can be manually controlled.

### MeshGradientOptions

```tsx
interface MeshGradientOptions {
  /** Array of 4 hex color strings */
  colors?: [string, string, string, string];
  
  /** Seed for reproducible randomness */
  seed?: number;
  
  /** Animation frequency configuration */
  frequency?: number | {
    x?: number;
    y?: number; 
    delta?: number;
  };
  
  /** Which colors are active */
  activeColors?: {
    1?: boolean;
    2?: boolean;
    3?: boolean;
    4?: boolean;
  };
  
  /** Disable animation for performance */
  isStatic?: boolean;
  
  /** Auto-pause when out of viewport */
  pauseOnOutsideViewport?: boolean;
  
  /** Intersection observer options */
  pauseObserverOptions?: IntersectionObserverInit;
  
  /** Resize recalculation delay (ms) */
  resizeDelay?: number;
  
  /** Appearance mode */
  appearance?: 'smooth' | 'default';
  
  /** Appearance transition duration (ms) */
  appearanceDuration?: number;
  
  /** Enable smooth transitions on updates */
  transition?: boolean;
  
  /** Update transition duration (ms) */
  transitionDuration?: number;
}
```

## 💡 Usage Examples

### Basic Usage

```tsx
import { MeshGradient } from '@mesh-gradient/react';

export default function Hero() {
  return (
    <div className="relative h-screen">
      <MeshGradient
        options={{
          colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
          isStatic: false
        }}
        className="absolute inset-0"
      />
      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-white text-6xl font-bold">Welcome</h1>
      </div>
    </div>
  );
}
```

### Static Gradient (Performance Optimized)

```tsx
import { MeshGradient } from '@mesh-gradient/react';

export default function StaticBackground() {
  return (
    <MeshGradient
      options={{
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
        isStatic: true, // No animation for better performance
        appearance: 'smooth',
        appearanceDuration: 500
      }}
      style={{ 
        width: '100%', 
        height: '400px',
        borderRadius: '12px'
      }}
    />
  );
}
```

### Dynamic Color Updates

```tsx
import { useState } from 'react';
import { MeshGradient } from '@mesh-gradient/react';

const colorPresets = [
  ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
  ['#e91e63', '#2196f3', '#4caf50', '#ff9800'],
  ['#9c27b0', '#673ab7', '#3f51b5', '#2196f3']
] as const;

export default function DynamicGradient() {
  const [colorIndex, setColorIndex] = useState(0);

  return (
    <div>
      <MeshGradient
        options={{
          colors: colorPresets[colorIndex],
          transitionDuration: 1000,
          transition: true
        }}
        style={{ width: '100%', height: '300px' }}
      />
      
      <div className="mt-4 space-x-2">
        {colorPresets.map((_, index) => (
          <button
            key={index}
            onClick={() => setColorIndex(index)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Preset {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Advanced Configuration

```tsx
import { MeshGradient } from '@mesh-gradient/react';

export default function AdvancedGradient() {
  return (
    <MeshGradient
      options={{
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
        seed: 42, // Reproducible randomness
        frequency: {
          x: 0.0001,
          y: 0.0002, 
          delta: 0.00005
        },
        activeColors: {
          1: true,
          2: true,
          3: true,
          4: false // Disable fourth color
        },
        pauseOnOutsideViewport: true,
        pauseObserverOptions: {
          rootMargin: '50px', // Start pausing 50px before exit
          threshold: 0.1 // Pause at 10% visibility
        },
        resizeDelay: 300
      }}
      style={{ width: '100%', height: '500px' }}
      onInit={(instance) => {
        console.log('Gradient initialized:', instance);
      }}
      onUpdate={(instance) => {
        console.log('Gradient updated:', instance);  
      }}
    />
  );
}
```

### Manual Control with Hook

```tsx
import { useEffect, useRef } from 'react';
import { useMeshGradient } from '@mesh-gradient/react';

export default function ManualGradient() {
  const { instance } = useMeshGradient();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!instance || !canvasRef.current) return;

    instance.init(canvasRef.current, {
      colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000']
    });
  }, [instance]);

  const handlePause = () => instance?.pause();
  const handlePlay = () => instance?.play();

  const updateColors = () => {
    instance?.update({
      colors: ['#e91e63', '#2196f3', '#4caf50', '#ff9800'],
      transitionDuration: 2000
    });
  };

  return (
    <div>
      <canvas 
        ref={canvasRef}
        style={{ width: '100%', height: '400px' }}
      />
      
      <div className="mt-4 space-x-2">
        <button onClick={handlePlay}>Play</button>
        <button onClick={handlePause}>Pause</button>
        <button onClick={updateColors}>Change Colors</button>
      </div>
    </div>
  );
}
```

### Using with CSS Variables

Set up CSS variables for consistent theming:

```css
/* styles.css */
:root {
  --mesh-gradient-color-1: #ff0080;
  --mesh-gradient-color-2: #0080ff;
  --mesh-gradient-color-3: #80ff00;
  --mesh-gradient-color-4: #ff8000;
}

[data-theme="dark"] {
  --mesh-gradient-color-1: #8b5cf6;
  --mesh-gradient-color-2: #06b6d4;
  --mesh-gradient-color-3: #10b981;
  --mesh-gradient-color-4: #f59e0b;
}
```

```tsx
// Component will automatically use CSS variables if colors not specified
import { MeshGradient } from '@mesh-gradient/react';

export default function ThemedGradient() {
  return (
    <MeshGradient
      options={{
        // colors will be read from CSS variables automatically
        isStatic: false
      }}
      style={{ width: '100%', height: '300px' }}
    />
  );
}
```

### Performance Optimizations

```tsx
import { MeshGradient } from '@mesh-gradient/react';

export default function OptimizedGradient() {
  return (
    <MeshGradient
      options={{
        colors: ['#ff0080', '#0080ff', '#80ff00', '#ff8000'],
        // Respect user's motion preferences
        isStatic: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        // Increase delay for slower devices  
        resizeDelay: 500,
        // Pause earlier when scrolling out of view
        pauseObserverOptions: {
          rootMargin: '100px'
        }
      }}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

## 🎯 Best Practices

### Performance

1. **Use Static Mode for Static Content**
   ```tsx
   <MeshGradient options={{ isStatic: true }} />
   ```

2. **Respect Motion Preferences**
   ```tsx
   const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   
   <MeshGradient 
     options={{ 
       isStatic: prefersReducedMotion 
     }} 
   />
   ```

3. **Optimize Resize Handling**
   ```tsx
   <MeshGradient 
     options={{ 
       resizeDelay: 500 // Increase for slower devices
     }} 
   />
   ```

### Accessibility

1. **Provide Alternative Content**
   ```tsx
   <div className="mesh-gradient-container">
     <MeshGradient options={{...}} />
     <div className="fallback-gradient" aria-hidden="true">
       {/* CSS fallback gradient */}
     </div>
   </div>
   ```

2. **Handle Reduced Motion**
   ```tsx
   const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
   
   <MeshGradient 
     options={{ 
       isStatic: reduceMotion 
     }} 
   />
   ```

### Memory Management

1. **Component Cleanup is Automatic**
   ```tsx
   // No manual cleanup needed - handled automatically
   export default function MyComponent() {
     return <MeshGradient options={{...}} />;
   }
   ```

2. **Manual Control Cleanup**
   ```tsx
   const { instance } = useMeshGradient();
   // Instance is automatically destroyed on unmount
   ```

## ⚠️ Important Notes

1. **WebGL Requirement**: This library requires WebGL support in the browser
2. **Canvas Element**: The component renders as a `<canvas>` element
3. **Automatic Cleanup**: Memory cleanup is handled automatically
4. **Performance**: Use `isStatic: true` for non-animated gradients

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start development 
pnpm dev

# Build package
pnpm build

# Lint code
pnpm lint
```

## 📦 Related Packages

- [`@mesh-gradient/core`](../core/README.md) - Core mesh gradient engine
- [`@mesh-gradient/docs`](../../apps/docs/README.md) - Documentation site

## 🤝 Contributing

Contributions are welcome! Please see the [contributing guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT © [Mikhail Mogilnikov](https://github.com/mikhailmogilnikov)

