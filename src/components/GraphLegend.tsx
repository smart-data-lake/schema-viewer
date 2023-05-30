import React from 'react';
import StyledSvg from './StyledSvg';
import { Box, Typography } from '@mui/joy';
import { SchemaTreeColors } from '../utils/D3NodePainter';

interface LegendItem {
  text: string;
  circleColor: string;
  textColor?: string;
}

export default function GraphLegend(props: { colors: SchemaTreeColors }) {

  const legendItems: LegendItem[] = [
    {
      text: 'Expanded',
      circleColor: props.colors.expandedCircleColor
    }, {
      text: 'Collapsed',
      circleColor: props.colors.collapsedCircleColor
    }, {
      text: 'Required*',
      circleColor: props.colors.expandedCircleColor
    }, {
      text: 'Object{ }',
      circleColor: props.colors.collapsedCircleColor
    }, {
      text: 'Array[type]',
      circleColor: props.colors.collapsedCircleColor
    }, {
      text: 'Property(type)',
      circleColor: props.colors.expandedCircleColor
    }, {
      text: 'Deprecated',
      circleColor: props.colors.expandedCircleColor,
      textColor: props.colors.deprecatedTextColor
    }
  ];

  return (
    <Box sx={{
      position: 'absolute',
      padding: 2,
      marginTop: 5,
      marginLeft: 10,
      borderRadius: 'md',
      border: '1px solid',
      borderColor: theme => theme.palette.background.level3,
      backgroundColor: theme => theme.palette.background.body
    }}>
      <Typography level="h6">Legend</Typography>
      <StyledSvg width="200px">
        <>
          {legendItems.map((l, i) =>
            (<g transform={`translate(10, ${(i + 1) * 20})`}>
              <circle r="7.5" fill={l.circleColor} stroke={props.colors.circleBorderColor}></circle>
              <text x="12" dy=".35em" fill={l.textColor}>{l.text}</text>
            </g>)
          )}
        </>
      </StyledSvg>
    </Box>
  );
}