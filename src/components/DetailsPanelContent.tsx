import React, { useState } from 'react';
import { Box, Divider, Dropdown, IconButton, Menu, MenuButton, MenuItem, styled, Tooltip, Typography } from '@mui/joy';
import { ClassNode, PropertyNode, SchemaNode, SchemaVisitor } from '../utils/SchemaNode';
import { Share } from '@mui/icons-material';
import { deprecatedVisitor } from '../utils/D3NodeUtils';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Github flavoured markdown (for hyperlinks)
import './DetailsPanelContent.css';


export default function DetailsPanelContent(props: {
  node: SchemaNode,
  createNodeUrl: (n: SchemaNode) => string,
  createLatestNodeUrl: (n: SchemaNode) => string
}) {
  const nodeName = props.node.accept(nodeNameVisitor);
  const nodeType = props.node.accept(nodeTypeVisitor);
  const nodeDescription = props.node.accept(nodeDescriptionVisitor);
  const deprecated = props.node.accept(deprecatedVisitor);
  
  return (
    <Box sx={{flex: 1, paddingLeft: 2, paddingRight: 2, overflow: 'auto'}}>
      <Box sx={{display: 'flex', justifyContent: 'space-between', marginTop: 3, alignItems: 'center'}}>
        <Typography level="title-lg" sx={{wordBreak: 'break-word'}}>{nodeName}</Typography>
        <ShareMenu getNodeUrl={() => props.createNodeUrl(props.node)}
                   getLatestNodeUrl={() => props.createLatestNodeUrl(props.node)} />
      </Box>
      {deprecated && <Typography sx={{fontStyle: 'italic'}}>deprecated</Typography>}
      <SectionDivider />
      <SectionTitle>Type</SectionTitle>
      <SectionText>{nodeType}</SectionText>
      <SectionDivider />
      <SectionTitle>Definition</SectionTitle>
      <Typography component={'div'} level="body-md" className="markdown-container">
        <Markdown remarkPlugins={[remarkGfm]}>
          {nodeDescription ? nodeDescription : 'No description provided.'}
        </Markdown>
      </Typography>
    </Box>
  );
}

const SectionDivider = styled(Divider)({
  marginTop: 24,
  marginBottom: 24
});

const SectionTitle = (props: { children: string }) => {
  return (<Typography level="title-md" sx={{marginTop: 1, marginBottom: 1}}>{props.children}</Typography>);
}

const SectionText = (props: { children?: string }) => {
  return (
    <Typography level="body-md" sx={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>{props.children}</Typography>);
}

/**
 * Offers a link to the element in the selected schema version, and one which always refers to the element
 * in the newest schema version.
 */
function ShareMenu(props: { getNodeUrl: () => string, getLatestNodeUrl: () => string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // the tooltip is hidden while the menu is open, because it would overlap with the menu
  return (
    <Dropdown open={menuOpen} onOpenChange={(_, open) => setMenuOpen(open)}>
      <Tooltip title="Copy link to schema element" open={tooltipOpen && !menuOpen}
               onOpen={() => setTooltipOpen(true)} onClose={() => setTooltipOpen(false)}>
        <MenuButton slots={{root: IconButton}} slotProps={{root: {variant: 'plain', size: 'sm'}}}>
          <Share />
        </MenuButton>
      </Tooltip>
      <Menu placement="bottom-end" size="sm">
        <MenuItem onClick={() => writeToClipboard(props.getNodeUrl())}>Copy link to this version</MenuItem>
        <MenuItem onClick={() => writeToClipboard(props.getLatestNodeUrl())}>Copy link to latest version</MenuItem>
      </Menu>
    </Dropdown>
  );
}

function writeToClipboard(text: string): void {
  if (!navigator.clipboard) {
    alert('Cannot copy to clipboard. Make sure you use a secure connection.');
    return;
  }
  navigator.clipboard.writeText(text);
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