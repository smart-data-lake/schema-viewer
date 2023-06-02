import React from 'react';
import SchemaViewer from './components/SchemaViewer';
import './App.css';

/**
 * This component is only used for local testing and is not part of the npm package.
 */
function App() {

  return (
    <div style={{height: '100vh'}}>
      <SchemaViewer schemasUrl="https://smartdatalake.ch/json-schema-viewer/schemas/"/>
    </div>
  );
}

export default App;
