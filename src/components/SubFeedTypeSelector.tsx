import React, { useState } from 'react';
import { Box, Checkbox, Option, optionClasses, Select, Tooltip } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';
import { formatSubFeedType, sortSubFeedTypes } from '../utils/SubFeedTypeFilter';

/**
 * Dropdown for choosing the engines (SubFeed types) whose Actions and DataObjects are shown, see
 * {@link createSubFeedTypeFilter}. Selected types which the schema does not list are still offered, so that
 * they can be deselected.
 */
export default function SubFeedTypeSelector(props: {
  availableTypes: string[], selectedTypes: string[], setSelectedTypes: (types: string[]) => void
}) {
  const [listboxOpen, setListboxOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const options = sortSubFeedTypes(Array.from(new Set([...props.availableTypes, ...props.selectedTypes])));

  // the tooltip is hidden while the listbox is open, because it would overlap with it
  return (
    <Tooltip title="Show only the Actions and DataObjects which support one of the selected engines"
             open={tooltipOpen && !listboxOpen} onOpen={() => setTooltipOpen(true)} onClose={() => setTooltipOpen(false)}>
      <Box>
        <Select multiple
                value={props.selectedTypes}
                onChange={(_, newValue) => props.setSelectedTypes(newValue)}
                placeholder="All engines"
                onListboxOpenChange={setListboxOpen}
                renderValue={selected => (
                  <Box component="span" sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {sortSubFeedTypes(selected.map(o => o.value)).map(formatSubFeedType).join(', ')}
                  </Box>
                )}
                sx={{width: 200}}
                slotProps={{button: {'aria-label': 'Engines'}}}>
          {options.map(t => (
            <Option key={t} value={t} sx={optionStyle}>
              {/* only shows the state: the option itself is what is clicked and what carries aria-selected */}
              <Checkbox checked={props.selectedTypes.includes(t)} size="sm" aria-hidden
                        slotProps={{input: {tabIndex: -1}}} sx={{pointerEvents: 'none'}} />
              {formatSubFeedType(t)}
            </Option>
          ))}
        </Select>
      </Box>
    </Tooltip>
  );
}

// the selection is shown by the checkboxes, so selected options get the same background as the others
const optionStyle: SxProps = {
  [`&.${optionClasses.selected}`]: {
    backgroundColor: 'transparent',
    color: 'inherit',
    fontWeight: 'inherit'
  },
  [`&.${optionClasses.selected}:hover, &.${optionClasses.highlighted}`]: {
    backgroundColor: theme => theme.vars.palette.neutral.plainHoverBg
  }
};
