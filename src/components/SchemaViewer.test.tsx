import React from 'react';
import SchemaViewer from './SchemaViewer';
import { render, screen } from '@testing-library/react';
import exampleSchema from '../example-schema.json';

test('example schema is loaded and rendered without errors', async () => {
  defineMissingProperties();

  render(
    <SchemaViewer
      loadSchemaNames={() => Promise.resolve(['schema1.json', 'schema2.json'])}
      loadSchema={schemaName => {
        expect(schemaName).toBe('schema2.json');
        return Promise.resolve(exampleSchema);
      }} />
  );

  expect(await screen.findByText('schema{ }')).toBeInTheDocument();
});

/**
 * Jest uses jsdom to simulate the DOM. Some properties are missing in jsdom and need to be mocked accordingly.
 */
function defineMissingProperties(): void {
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
    value: jest.fn().mockReturnValue({
      x: 0,
      y: 0,
    }),
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
}