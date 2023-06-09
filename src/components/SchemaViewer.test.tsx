import React from 'react';
import SchemaViewer from './SchemaViewer';
import { render, screen } from '@testing-library/react';
import exampleSchema from '../example-schema.json';

test('example schema is loaded and rendered without errors', async () => {
  render(
    <SchemaViewer
      loadSchemaNames={() => Promise.resolve(['schema1.json', 'schema2.json'])}
      loadSchema={schemaName => {
        expect(schemaName).toBe('schema2.json');
        return Promise.resolve(exampleSchema);
      }} />
  );

  expect(await screen.findByText('schema{ }')).toBeInTheDocument();
  expect(screen.getByText('global{ }')).toBeInTheDocument();
  expect(screen.getByText('connections[mapOf]')).toBeInTheDocument();
  expect(screen.getByText('dataObjects[mapOf]*')).toBeInTheDocument();
  expect(screen.getByText('actions[mapOf]*')).toBeInTheDocument();
});