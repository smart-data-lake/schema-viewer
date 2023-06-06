import React, { useEffect, useState } from 'react';
import DetailsPanel from './DetailsPanel';
import SchemaViewerHeader from './SchemaViewerHeader';
import SchemaGraph from './SchemaGraph';
import { Box, CssVarsProvider } from '@mui/joy';
import SchemaParser, { JSONSchema } from '../utils/SchemaParser';
import { SchemaNode } from '../utils/SchemaNode';
import { defaultTheme } from '../utils/DefaultTheme';
import SchemaSelector from './SchemaSelector';
import NodeSearch from './NodeSearch';
import DetailsPanelToggleButton from './DetailsPanelToggleButton';
import {
  createUrlToNode,
  deletePathFromUrlParams,
  getNodeFromPathUrlParam,
  hasPathUrlParam,
  hasSchemaInUrlParams,
  updatePathInUrlParams,
  updateSchemaInUrlParams
} from '../utils/SchemaSerialization';

interface SchemaViewerProps {
  /**
   * Function for loading a list of schema names. These are the schemas that a user can select.
   */
  loadSchemaNames: () => Promise<string[]>,

  /**
   * Function for loading a JSON schema corresponding to the schema name.
   * The schema must be provided as a JSON object and not as a string.
   */
  loadSchema: (schemaName: string) => Promise<any>
}

/**
 * Base component for the schema viewer.
 */
export default function SchemaViewer(props: SchemaViewerProps) {
  const [selectedSchemaName, setSelectedSchemaName] = useState<string>();
  const [schema, setSchema] = useState<SchemaNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SchemaNode | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  function initSchema(schemaName: string): void {
    // between loading schemas we set the old schema to null to prevent any confusion between the schemas
    setSelectedNode(null);
    setSchema(null);
    props.loadSchema(schemaName)
      .then(schemaJson => new SchemaParser(schemaJson as JSONSchema).parseSchema())
      .then(setSchema)
  }

  useEffect(() => {
    if (selectedSchemaName) {
      initSchema(selectedSchemaName);
      if (hasSchemaInUrlParams()) {
        updateSchemaInUrlParams(selectedSchemaName);
      } else if (hasPathUrlParam()) {
        deletePathFromUrlParams();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchemaName])

  useEffect(() => {
    setDetailsPanelOpen(Boolean(selectedNode));
    if (selectedNode && hasPathUrlParam()) {
      updatePathInUrlParams(selectedNode);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (schema && hasPathUrlParam()) {
      const node = getNodeFromPathUrlParam(schema);
      node && setSelectedNode(node);
    }
  }, [schema]);

  return (
    <CssVarsProvider theme={defaultTheme}>
      <Box sx={{display: 'flex', height: '100%'}}>
        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <SchemaViewerHeader>
            <SchemaSelector loadSchemaNames={props.loadSchemaNames} selectedSchemaName={selectedSchemaName}
                            setSelectedSchemaName={setSelectedSchemaName} />
            <NodeSearch schema={schema} selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
            <DetailsPanelToggleButton detailsPanelOpen={detailsPanelOpen} setDetailsPanelOpen={setDetailsPanelOpen} />
          </SchemaViewerHeader>
          <Box sx={{flex: 1}}>
            <SchemaGraph schema={schema} setSelectedNode={setSelectedNode} selectedNode={selectedNode} />
          </Box>
        </Box>
        {/* we hide the info panel with display: 'none' to keep its state when it is closed */}
        {selectedSchemaName &&
            <Box sx={{display: detailsPanelOpen ? 'block' : 'none'}}>
                <DetailsPanel node={selectedNode} createNodeUrl={n => createUrlToNode(n, selectedSchemaName)} />
            </Box>
        }
      </Box>
    </CssVarsProvider>
  );
}