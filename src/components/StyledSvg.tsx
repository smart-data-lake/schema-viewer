import { styled } from "@mui/joy";

/**
 * SVG where the text is styled according to the current theme.
 */
export default styled('svg')(({theme}) => ({
  fontFamily: theme.fontFamily.body,
  fill: theme.palette.text.primary
}))