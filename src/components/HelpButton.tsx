import { QuestionMark } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/joy';
import React from 'react';
import { headerButtonSize, headerButtonStyle } from './SchemaViewerHeader';

export default function HelpButton() {
  const helpUrl = 'https://smartdatalake.ch/docs/reference/schema-viewer-navigation';
  return (
    <Tooltip title="Get help">
      <IconButton
        component="a"
        href={helpUrl}
        target='_blank'
        size={headerButtonSize}
        sx={headerButtonStyle}>
        <QuestionMark />
      </IconButton>
    </Tooltip>
  );
}
