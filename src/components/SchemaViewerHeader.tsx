import React, { ReactNode } from 'react';
import { Box } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';

export default function SchemaViewerHeader(props: { children: ReactNode }) {
  return (
    <Box data-testid="schema-viewer-header" sx={{
      height: 60,
      backgroundColor: theme => theme.palette.background.level3,
      display: 'flex',
      alignItems: 'center',
      paddingX: 2,
      gap: headerSpacing,
    }}>
      {props.children}
    </Box>
  );
}

/** the space between the elements of the header, also between the buttons grouped at its right end */
export const headerSpacing = 1;

export const headerButtonStyle: SxProps = {
  borderRadius: 15,
  backgroundColor: theme => theme.palette.background.body,
}

export const headerButtonSize = "sm";