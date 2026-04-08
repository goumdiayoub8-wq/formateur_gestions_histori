import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.documentElement.className = '';
  document.documentElement.style.colorScheme = '';
  document.head.innerHTML = '<meta name="theme-color" content="#f5f7fb">';
});

