import React, { useState } from 'react';
import { Box, Typography } from '@mui/joy';
import { SchemaNode } from '../utils/SchemaNode';
import DetailsPanelBorder from './DetailsPanelBorder';
import DetailsPanelContent from './DetailsPanelContent';

export default function DetailsPanel(props: { node: SchemaNode | null, createNodeUrl: (n: SchemaNode) => string }) {
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(350);

  return (
    <Box sx={{display: 'flex', height: '100%', background: theme => theme.palette.background.body}}
         style={{
           width: detailsPanelWidth, /* dynamic styles should be defined in style and not sx */
           maxWidth: document.body.clientWidth - 960, /* maxWidth is chosen so that no horizontal scroll bar appears on maxWidth */
           minWidth: 200
         }}> {}
      <DetailsPanelBorder setDetailsPanelWidth={setDetailsPanelWidth} />
      {props.node
        ? <DetailsPanelContent node={props.node} createNodeUrl={props.createNodeUrl}/>
        : <Typography sx={{margin: 'auto'}}>No node selected.</Typography>
      }
    </Box>
  )
}
