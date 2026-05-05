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

1. **Canvas sizing** — set CSS dimensions (or a constrained parent layout). Logical size drives the mesh; resolution uses `pixelRatio`. See [**Canvas layout & HiDPI**](https://meshgradientweb.vercel.app/docs/advanced-usage#canvas-layout--hidpi).
2. **Canvas element** — ensure the canvas exists before initialization (or enable `allowDocumentCanvasFallback` only when appropriate).
3. **WebGL support** — the library requires WebGL in the browser.
4. **Resource cleanup** — call `destroy()` when removing the gradient.
5. **Performance** — use `isStatic: true` for non-animated output.

## 🛠️ Development

```bash
git clone https://github.com/mikhailmogilnikov/mesh-gradient.git
cd mesh-gradient
pnpm install

# From monorepo root
pnpm check-types
pnpm test
pnpm lint
pnpm build
```

## 📄 License

MIT © [Mikhail Mogilnikov](https://github.com/mikhailmogilnikov)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss.