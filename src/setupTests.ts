// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Jest uses jsdom to simulate the DOM. Some properties are missing in jsdom and need to be mocked accordingly.

// see https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
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

Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn()
});
