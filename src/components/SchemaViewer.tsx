import React, { useEffect, useRef, useState } from 'react';
import DetailsPanel from './DetailsPanel';
import SchemaViewerHeader from './SchemaViewerHeader';
import SchemaGraph from './SchemaGraph';
import { Box, CssVarsProvider } from '@mui/joy';
import JsonSchemaParser, { JSONSchema } from '../utils/JsonSchemaParser';
import { SchemaNode } from '../utils/SchemaNode';
import { defaultTheme } from '../utils/DefaultTheme';
import SchemaSelector from './SchemaSelector';
import NodeSearch from './NodeSearch';
import DetailsPanelToggleButton from './DetailsPanelToggleButton';
import {
  createUrlToNode,
  getPathFromUrlParams,
  hasPathUrlParam,
  hasSchemaInUrlParams,
  resolvePath,
  serializeNode,
  updatePathInUrlParams,
  updateSchemaInUrlParams
} from '../utils/SchemaSerialization';
import DownloadButton from './DownloadButton';
import HelpButton from './HelpButton';

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
 * Component for visualizing Smart Data Lake Builder config schemas.
 */
export default function SchemaViewer(props: SchemaViewerProps) {
  const [selectedSchemaName, setSelectedSchemaName] = useState<string>();
  const [schema, setSchema] = useState<SchemaNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<SchemaNode | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [schemaBlob, setSchemaBlob] = useState<Blob | null>(null); // for download
  // the path of the element to select once the schema is parsed: initially the one from the url, and after
  // a switch of the schema version the one which was selected before, so that the user stays on the element
  const pathToRestore = useRef<string | null>(getPathFromUrlParams());
  const schemaSelectedBefore = useRef(false);

  function initSchema(schemaName: string): void {
    if (selectedNode) {
      pathToRestore.current = serializeNode(selectedNode);
    }
    // between loading schemas we set the old schema to null to prevent any confusion between the schemas
    setSelectedNode(null);
    setSchema(null);
    setSchemaBlob(null);
    const loadedSchema = props.loadSchema(schemaName);
    loadedSchema
      .then(schemaJson => new JsonSchemaParser(schemaJson as JSONSchema).parseSchema())
      .then(setSchema);
    loadedSchema
      .then(formatJson)
      .then(formattedSchema => setSchemaBlob(new Blob([formattedSchema])));
  }

  useEffect(() => {
    if (selectedSchemaName) {
      initSchema(selectedSchemaName);
      // a path without a schema refers to the newest schema, so the schema is added to the url as soon as
      // the user chooses another one - but not for the initial selection, which is the newest schema
      if (hasSchemaInUrlParams() || (hasPathUrlParam() && schemaSelectedBefore.current)) {
        updateSchemaInUrlParams(selectedSchemaName);
      }
      schemaSelectedBefore.current = true;
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
    if (schema && pathToRestore.current !== null) {
      const node = resolvePath(pathToRestore.current, schema);
      pathToRestore.current = null;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
            <Box sx={{ marginLeft: 'auto', display: 'flex' }}>
              <HelpButton />
              <DownloadButton toDownload={schemaBlob} fileName={selectedSchemaName} />
              <DetailsPanelToggleButton detailsPanelOpen={detailsPanelOpen} setDetailsPanelOpen={setDetailsPanelOpen} />
            </Box>
          </SchemaViewerHeader>
          <Box sx={{flex: 1}}>
            <SchemaGraph schema={schema} setSelectedNode={setSelectedNode} selectedNode={selectedNode} />
          </Box>
        </Box>
        {/* we hide the info panel with display: 'none' to keep its state when it is closed */}
        {selectedSchemaName &&
            <Box sx={{display: detailsPanelOpen ? 'block' : 'none'}}>
                <DetailsPanel node={selectedNode} createNodeUrl={n => createUrlToNode(n, selectedSchemaName)}
                              createLatestNodeUrl={n => createUrlToNode(n)} />
            </Box>
        }
      </Box>
    </CssVarsProvider>
  );
}

function formatJson(json: any): string {
  return JSON.stringify(json, null, 2);
}