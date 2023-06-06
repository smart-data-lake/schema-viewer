import React from 'react';
import SchemaViewer from './SchemaViewer';
import { render, screen } from '@testing-library/react';
import exampleSchema from '../example-schema.json';

test('example schema is loaded and rendered without errors', async () => {
  defineMissingProperties();

  render(<SchemaViewer
    loadSchemaNames={() => Promise.resolve(['schema1.json', 'schema2.json'])}
    loadSchema={schemaName => {
      expect(schemaName).toBe('schema2.json');
      return Promise.resolve(exampleSchema)
    }}
  />);

  expect(await screen.findByText('schema{ }')).toBeInTheDocument();
});

function defineMissingProperties(): void {
  // to prevent error 'window.matchMedia is not a function'
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

  // to prevent error 'getBBox is not a function'
  Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: jest.fn().mockReturnValue({
      x: 0,
      y: 0,
    }),
  });
}