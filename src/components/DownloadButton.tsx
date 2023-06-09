import { Download } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/joy';
import React from 'react';
import { headerButtonSize, headerButtonStyle } from './SchemaViewerHeader';

export default function DownloadButton(props: { toDownload: Blob | null, fileName: string | undefined }) {

  return (
    <Tooltip title="Download schema file">
      <IconButton
        component="a"
        disabled={!props.toDownload}
        href={props.toDownload ? URL.createObjectURL(props.toDownload) : ''}
        download={props.fileName}
        size={headerButtonSize}
        sx={headerButtonStyle}>
        <Download />
      </IconButton>
    </Tooltip>
  );
}
