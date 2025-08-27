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

## Documentation

Documentation website [available here](https://meshgradientweb.vercel.app/).

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

