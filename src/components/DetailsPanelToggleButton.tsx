import React from 'react';
import { IconButton } from '@mui/joy';
import { KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from '@mui/icons-material';
import { headerButtonSize, headerButtonStyle } from './SchemaViewerHeader';

export default function DetailsPanelToggleButton(props: {detailsPanelOpen: boolean, setDetailsPanelOpen: (open: boolean) => void}) {
  return (
    <IconButton onClick={() => props.setDetailsPanelOpen(!props.detailsPanelOpen)}
                size={headerButtonSize}
                sx={{...headerButtonStyle, marginRight: 2}}>
      {props.detailsPanelOpen ? <KeyboardDoubleArrowRight /> : <KeyboardDoubleArrowLeft />}
    </IconButton>
  );
}
