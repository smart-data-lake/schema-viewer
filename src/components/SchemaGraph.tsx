import React, { useEffect, useRef, useState } from 'react';
import './SchemaGraph.css';
import { SchemaNode } from '../utils/SchemaNode';
import { Box, Theme, useTheme } from '@mui/joy';
import D3SchemaTree from '../utils/D3SchemaTree';
import D3Zoom from '../utils/D3Zoom';
import GraphControlButtons from './GraphControlButtons';
import StyledSvg from './StyledSvg';
import GraphLegend from './GraphLegend';
import { SchemaTreeColors } from '../utils/D3NodePainter';

/**
 * Component for rendering the schema tree and its associated components like the zoom buttons and the legend.
 */
export default function SchemaGraph(props: {
  schema: SchemaNode | null, setSelectedNode: (n: SchemaNode | null) => void, selectedNode: SchemaNode | null
}) {
  const treeSvg = useRef<SVGSVGElement>();
  const [schemaTree, setSchemaTree] = useState<D3SchemaTree>();
  const [zoom, setZoom] = useState<D3Zoom>();
  const [showLegend, setShowLegend] = useState(false);
  const theme = useTheme();
  const [schemaTreeColors, setSchemaTreeColors] = useState(getSchemaTreeColorsFromTheme(theme));

  // we only update the schemaTreeColors if the values have changed,
  // because changing the colors triggers a redrawing of the tree
  const schemaTreeColorsFromTheme = getSchemaTreeColorsFromTheme(theme);
  if (haveSchemaTreeColorsChanged(schemaTreeColors, schemaTreeColorsFromTheme)) {
    setSchemaTreeColors(schemaTreeColorsFromTheme);
  }

  useEffect(() => {
    if (schemaTree) {
      // clear the tree to prevent a mix-up between the schemas when the loading takes some time
      schemaTree.clearTree();
    }
    if (props.schema && treeSvg.current) {
      const newZoom = new D3Zoom(treeSvg.current.parentElement as any, treeSvg.current);
      setZoom(newZoom);
      const newSchemaTree = new D3SchemaTree(props.schema, treeSvg.current, props.setSelectedNode, newZoom, schemaTreeColors);
      newSchemaTree.initTree();
      setSchemaTree(newSchemaTree);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.schema, schemaTreeColors]);

  useEffect(() => {
    if (props.selectedNode && schemaTree) {
      schemaTree.focusOnNode(props.selectedNode);
    }
  }, [props.selectedNode, schemaTree]);

  return (
    <Box sx={{backgroundColor: theme.palette.background.level1, height: '100%', display: 'flex'}}>
      {schemaTree && zoom &&
          <GraphControlButtons schemaTree={schemaTree} zoom={zoom} showLegend={showLegend}
                               setShowLegend={setShowLegend} />}
      {showLegend && <GraphLegend colors={schemaTreeColors} />}
      <StyledSvg width="100%">
        <g ref={(ref: SVGSVGElement) => treeSvg.current = ref} />
      </StyledSvg>
    </Box>
  );
}

function haveSchemaTreeColorsChanged(currentColors: SchemaTreeColors, nextColors: SchemaTreeColors): boolean {
  return JSON.stringify(currentColors) !== JSON.stringify(nextColors);
}

function getSchemaTreeColorsFromTheme(theme: Theme): SchemaTreeColors {
  return {
    deprecatedTextColor: 'orange',
    expandedCircleColor: 'white',
    collapsedCircleColor: theme.palette.primary.plainActiveBg,
    circleBorderColor: theme.palette.primary.outlinedColor
  }
}
