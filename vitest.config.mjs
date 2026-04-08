import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from './frontend/node_modules/vitest/dist/config.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(rootDir, 'frontend');

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(frontendDir, 'src'),
      axios: path.join(frontendDir, 'node_modules/axios'),
      react: path.join(frontendDir, 'node_modules/react'),
      'react-dom': path.join(frontendDir, 'node_modules/react-dom'),
      'react-dom/client': path.join(frontendDir, 'node_modules/react-dom/client.js'),
      'react/jsx-runtime': path.join(frontendDir, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.join(frontendDir, 'node_modules/react/jsx-dev-runtime.js'),
      'react-redux': path.join(frontendDir, 'node_modules/react-redux'),
      'react-router': path.join(frontendDir, 'node_modules/react-router'),
      'react-router-dom': path.join(frontendDir, 'node_modules/react-router-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-redux', 'react-router', 'react-router-dom'],
  },
  server: {
    fs: {
      allow: [rootDir, frontendDir],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.join(frontendDir, 'src/test/setup.js')],
    include: ['tests/**/*.test.{js,jsx}'],
    exclude: ['tests/**/*.spec.js', 'frontend/dist/**', 'frontend/node_modules/**', 'backend/vendor/**'],
    clearMocks: true,
    restoreMocks: true,
    css: true,
    coverage: {
      reporter: ['text', 'html'],
      include: ['frontend/src/**/*.{js,jsx}'],
      exclude: ['frontend/src/main.jsx'],
    },
  },
});
