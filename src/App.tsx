import React from 'react';
import SchemaViewer from './components/SchemaViewer';
import './App.css';

function App() {

  return (
    <div style={{height: '100vh'}}>
      <SchemaViewer schemasUrl="https://smartdatalake.ch/json-schema-viewer/schemas/"/>
    </div>
  );
}

export default App;
