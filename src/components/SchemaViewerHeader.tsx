import React, { ReactNode } from 'react';
import { Box } from '@mui/joy';

export default function SchemaViewerHeader(props: { children: ReactNode }) {
  return (
    <Box sx={{
      height: 60,
      backgroundColor: theme => theme.palette.background.level3,
      display: 'flex',
      alignItems: 'center',
    }}>
      {props.children}
    </Box>
  );
}