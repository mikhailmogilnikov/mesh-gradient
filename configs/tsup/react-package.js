/** @type {import('tsup').Options} */
export default {
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: false,
  banner: { js: '"use client";' },
};
