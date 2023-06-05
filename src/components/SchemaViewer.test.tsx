import React from 'react';
import SchemaViewer from './SchemaViewer';
import { render, screen } from '@testing-library/react';
import exampleSchema from '../example-schema.json';

const schemasUrl = 'http://testSchemas/';

test('example schema is loaded and rendered without errors', async () => {
  defineMissingProperties();
  mockRequests();

  render(<SchemaViewer schemasUrl={schemasUrl} />)

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

function mockRequests(): void {
  global.fetch = jest.fn((url: string) => {
    if (url === schemasUrl) {
      return Promise.resolve({
        json: () => Promise.resolve(['schema1.json', 'schema2.json'])
      });
    } else if (url === schemasUrl + 'schema2.json') {
      return Promise.resolve({
        json: () => Promise.resolve(exampleSchema)
      });
    } else {
      throw new Error(`Unexpected request ${url}`);
    }
  }) as jest.Mock;
}
