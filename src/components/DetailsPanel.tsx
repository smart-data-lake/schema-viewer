import React, { useState } from 'react';
import { Box, Typography } from '@mui/joy';
import { SchemaNode } from '../utils/SchemaNode';
import DetailsPanelBorder from './DetailsPanelBorder';
import DetailsPanelContent from './DetailsPanelContent';

export default function DetailsPanel(props: {
  node: SchemaNode | null,
  createNodeUrl: (n: SchemaNode) => string,
  createLatestNodeUrl: (n: SchemaNode) => string
}) {
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(350);

  return (
    <Box data-testid="details-panel"
         sx={{display: 'flex', height: '100%', background: theme => theme.palette.background.body}}
         style={{
           width: detailsPanelWidth, /* dynamic styles should be defined in style and not sx */
           minWidth: 200,
           flexShrink: 1 /* when dragged wider than there is room next to the graph, the panel shrinks instead of the page overflowing */
         }}>
      <DetailsPanelBorder setDetailsPanelWidth={setDetailsPanelWidth} />
      {props.node
        ? <DetailsPanelContent node={props.node} createNodeUrl={props.createNodeUrl}
                               createLatestNodeUrl={props.createLatestNodeUrl} />
        : <Typography sx={{margin: 'auto'}}>No node selected.</Typography>
      }
    </Box>
  )
}
