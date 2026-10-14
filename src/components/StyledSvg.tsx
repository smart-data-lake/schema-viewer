import { styled } from "@mui/joy";

/**
 * SVG where the text is styled according to the current theme, together with the styles of the d3-rendered nodes.
 * The styles are defined here rather than in a css file, because a library build extracts css files into a separate
 * asset which a consumer would have to import on its own.
 */
export default styled('svg')(({theme}) => ({
  fontFamily: theme.fontFamily.body,
  fill: theme.palette.text.primary,
  '& .node text, & .node circle': {
    cursor: 'pointer'
  },
  '& .node circle:hover': {
    strokeWidth: 2.5
  },
  '& .node text:hover': {
    textDecoration: 'underline'
  },
  '& .node.selected': {
    outline: '2px lightgrey solid',
    outlineOffset: '5px',
    fontWeight: 'bold'
  }
}))
