import React from 'react';
import { IconButton } from '@mui/joy';
import { KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight } from '@mui/icons-material';

export default function DetailsPanelToggleButton(props: {detailsPanelOpen: boolean, setDetailsPanelOpen: (open: boolean) => void}) {
  return (
    <IconButton onClick={() => props.setDetailsPanelOpen(!props.detailsPanelOpen)}
                size="sm"
                sx={{
                  backgroundColor: theme => theme.palette.background.body,
                  marginLeft: 'auto',
                  marginRight: 2,
                  borderRadius: 15
                }}>
      {props.detailsPanelOpen ? <KeyboardDoubleArrowRight /> : <KeyboardDoubleArrowLeft />}
    </IconButton>
  );
}
