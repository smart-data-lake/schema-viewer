import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
  writable: true,
  value: () => {
    return {x: 0, y: 0}
  },
});

Object.defineProperty(global.SVGElement.prototype, 'viewBox', {
  writable: true,
  value: {
    animVal: {
      x: 0,
      y: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0
    },
    baseVal: {
      x: 0,
      y: 0,
      height: 0,
      width: 0
    }
  }
});

Object.defineProperty(global.SVGElement.prototype, 'width', {
  writable: true,
  value: {
    baseVal: {
      value: 0
    }
  }
});

Object.defineProperty(global.SVGElement.prototype, 'height', {
  writable: true,
  value: {
    baseVal: {
      value: 0
    }
  }
});

Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn()
});
