import React from 'react';
import { Box, Divider, IconButton, styled, Tooltip, Typography } from '@mui/joy';
import { ClassNode, PropertyNode, SchemaNode, SchemaVisitor } from '../utils/SchemaNode';
import { Share } from '@mui/icons-material';

export default function DetailsPanelContent(props: { node: SchemaNode, createNodeUrl: (n: SchemaNode) => string }) {
  const nodeName = props.node.accept(nodeNameVisitor);
  const nodeType = props.node && props.node.accept(nodeTypeVisitor);
  const nodeDescription = props.node && props.node.accept(nodeDescriptionVisitor);

  return (
    <Box sx={{flex: 1, paddingLeft: 2, paddingRight: 2, overflow: 'auto'}}>
      <Box sx={{display: 'flex', justifyContent: 'space-between', marginTop: 3, alignItems: 'center'}}>
        <Typography level="h5" sx={{wordBreak: 'break-word'}}>{nodeName}</Typography>
        <Tooltip title="Copy link to schema element">
          <IconButton variant="plain" size="sm" onClick={() => navigator.clipboard.writeText(props.createNodeUrl(props.node))}>
            <Share />
          </IconButton>
        </Tooltip>
      </Box>
      <SectionDivider />
      <SectionTitle>Type</SectionTitle>
      <SectionText>{nodeType}</SectionText>
      <SectionDivider />
      <SectionTitle>Definition</SectionTitle>
      <SectionText>{nodeDescription ? nodeDescription : 'No description provided.'}</SectionText>
    </Box>
  );
}

const SectionDivider = styled(Divider)({
  marginTop: 24,
  marginBottom: 24
});

const SectionTitle = (props: { children: string }) => {
  return (<Typography level="h6" sx={{marginTop: 1, marginBottom: 1}}>{props.children}</Typography>);
}

const SectionText = (props: { children?: string }) => {
  return (
    <Typography level="body2" sx={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>{props.children}</Typography>);
}

const nodeNameVisitor: SchemaVisitor<string> = {
  visitClassNode: (n: ClassNode) => n.className,
  visitPropertyNode: (n: PropertyNode) => n.propertyName,
  visitRootNode: () => 'Schema'
};

const nodeTypeVisitor: SchemaVisitor<string> = {
  visitClassNode: (n: ClassNode) => 'object: ' + n.className + (n.baseClass ? ' extends ' + n.baseClass : ''),
  visitPropertyNode: (n: PropertyNode) => n.type + (n.typeDetails ? ': ' + n.typeDetails : ''),
  visitRootNode: () => 'object'
};

const nodeDescriptionVisitor: SchemaVisitor<string | undefined> = {
  visitClassNode: (n: ClassNode) => n.description,
  visitPropertyNode: (n: PropertyNode) => n.description,
  visitRootNode: () => ''
}