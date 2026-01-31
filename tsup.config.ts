import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts', 'src/demo.ts'],
  format: ['esm'],
  dts: {
    entry: ['src/index.ts', 'src/server.ts'],
  },
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  target: 'node20',
  outDir: 'dist',
  esbuildOptions(options, context) {
    if (context.entry?.includes('demo')) {
      options.banner = { js: '#!/usr/bin/env node' }
    }
  },
})
