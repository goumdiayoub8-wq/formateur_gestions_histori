import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      axios: path.resolve(__dirname, './node_modules/axios'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', '../tests/**/*.test.{js,jsx}'],
    exclude: ['dist/**', 'node_modules/**', '../tests/**/*.spec.js'],
    clearMocks: true,
    restoreMocks: true,
    css: true,
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx'],
    },
  },
});
