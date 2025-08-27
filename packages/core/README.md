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


## Documentation

Documentation website [available here](https://meshgradientweb.vercel.app/).

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