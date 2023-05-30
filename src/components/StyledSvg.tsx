import { styled } from "@mui/joy";

export default styled('svg')(({theme}) => ({
  fontFamily: theme.fontFamily.body,
  fill: theme.palette.text.primary
}))