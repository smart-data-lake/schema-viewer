import React, { ReactNode } from 'react';
import { Box } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';

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

export const headerButtonStyle: SxProps = {
  marginLeft: 1,
  borderRadius: 15,
  backgroundColor: theme => theme.palette.background.body,
}

export const headerButtonSize = "sm";