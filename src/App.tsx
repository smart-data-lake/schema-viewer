import React  from 'react';
import SchemaViewer from './components/SchemaViewer';
import './App.css';

const schemasUrl = "https://smartdatalake.ch/json-schema-viewer/schemas/";

/**
 * This component is only used for local testing and is not part of the npm package.
 */
function App() {
  return (
    <div style={{height: '100vh'}}>
      <SchemaViewer loadSchemaNames={loadSchemaNames} loadSchema={loadSchema} />
    </div>
  );
}

function loadSchema(schemaName: string): Promise<any> {
  return fetch(schemasUrl + schemaName).then(res => res.json());
}

function loadSchemaNames(): Promise<string[]> {
  return fetch(schemasUrl).then(res => res.json());
}

export default App;
