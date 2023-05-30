import { Box, IconButton } from '@mui/joy';
import React from 'react';
import { AddCircle, Info, Refresh, RemoveCircle } from '@mui/icons-material';
import D3SchemaTree from '../utils/D3SchemaTree';
import D3Zoom from '../utils/D3Zoom';

export default function GraphControlButtons(props: {
  schemaTree: D3SchemaTree, zoom: D3Zoom, showLegend: boolean, setShowLegend: (show: boolean) => void
}) {

  function reset(): void {
    props.zoom.resetScale();
    props.schemaTree.initTree();
    props.setShowLegend(false);
  }

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', position: 'absolute', marginTop: 5, marginLeft: 1}}>
      {props.zoom &&
          <>
              <RoundIconButton onClick={() => props.zoom.zoomIn()}>
                  <AddCircle />
              </RoundIconButton>
              <RoundIconButton onClick={() => props.zoom.zoomOut()}>
                  <RemoveCircle />
              </RoundIconButton>
          </>}
      {props.schemaTree &&
          <RoundIconButton onClick={reset}>
              <Refresh />
          </RoundIconButton>}
      <RoundIconButton onClick={() => props.setShowLegend(!props.showLegend)}>
        <Info />
      </RoundIconButton>
    </Box>
  );
}

const RoundIconButton = (props: { onClick?: () => void, children: React.ReactElement }) => {
  return (<IconButton onClick={props.onClick} variant="outlined" sx={{borderRadius: 20}}>{props.children}</IconButton>);
}
