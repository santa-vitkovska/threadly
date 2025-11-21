import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Threadly',
      fileName: (format) => `threadly.${format}.js`,
      formats: ['es', 'umd']
    },
    cssCodeSplit: false, // Bundle all CSS into a single file
    rollupOptions: {
      external: ['react', 'react-dom', 'react-router-dom', 'firebase'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          firebase: 'Firebase'
        },
        assetFileNames: 'threadly.[ext]' // Name the CSS file
      }
    }
  }
})
