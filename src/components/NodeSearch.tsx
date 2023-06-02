import React, { useEffect, useState } from 'react';
import { ClassNode, PropertyNode, SchemaNode, SchemaVisitor } from '../utils/SchemaNode';
import { Autocomplete, AutocompleteOption, ListItemContent, Typography } from '@mui/joy';

interface NodeOption {
  label: string,
  ancestors: string[] // ancestors of node including the current node
  node: SchemaNode
}

export default function NodeSearch(props: { schema: SchemaNode | null, selectedNode: SchemaNode | null, setSelectedNode: (node: SchemaNode | null) => void }) {
  const [options, setOptions] = useState<NodeOption[]>([]);
  const [key, setKey] = useState(0); // the key is needed to trigger a rerender of the autocomplete component

  useEffect(() => {
    // changing the options does not change the selected value in the autocomplete,
    // which leads to errors because the previously selected element is no longer found, so we have to rerender
    rerenderSearch();
    if (props.schema) {
      setOptions(buildNodeOptions(props.schema));
    } else {
      setOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.schema]);

  useEffect(() => {
    // when the selectedNode is set to null we rerender the search because this means there was a refresh
    if (!props.selectedNode) {
      rerenderSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedNode]);

  function rerenderSearch(): void {
    setKey(key + 1);
  }

  return (
    <Autocomplete key={key}
                  options={options}
                  placeholder="Search"
                  sx={{minWidth: 500, width: '35%', margin: 'auto'}}
                  onChange={(_, o: NodeOption | null) => o && props.setSelectedNode(o.node)}
                  noOptionsText="No element found or not enough characters provided."
                  filterOptions={(allOptions, state) =>
                    findMatchingOptionsWhenMinCharactersProvided(allOptions, state.inputValue, 2)
                  }
                  renderOption={(p, o) => (
                    <AutocompleteOption {...p} key={o.node.id}>
                      <OptionWithAncestors option={o} />
                    </AutocompleteOption>
                  )} />
  );
}

function findMatchingOptionsWhenMinCharactersProvided(options: NodeOption[], input: string, minCharacters: number): NodeOption[] {
  if (input.length < minCharacters) {
    return [];
  }
  return options.filter(o => String(o.label).toLowerCase().includes(input.toLowerCase()));
}

function OptionWithAncestors(props: { option: NodeOption }) {
  return (<ListItemContent>
    {props.option.label}
    <Typography level="body3">{props.option.ancestors.join('>')}</Typography>
  </ListItemContent>)
}

function buildNodeOptions(schema: SchemaNode): NodeOption[] {
  const options: NodeOption[] = [];

  function addOptionsRecursively(node: SchemaNode, parentAncestors: string[]): void {
    const name = node.accept(nodeNameVisitor);
    const ancestors = [...parentAncestors, name];
    const option = {label: name, ancestors, node};
    options.push(option);
    node.children.forEach(c => addOptionsRecursively(c, ancestors));
  }

  schema.children.forEach(c => addOptionsRecursively(c, []));
  options.sort((o1, o2) => o1.label.localeCompare(o2.label));
  return options;
}

const nodeNameVisitor: SchemaVisitor<string> = {
  visitClassNode: (n: ClassNode) => n.className,
  visitPropertyNode: (n: PropertyNode) => n.propertyName,
  visitRootNode: () => {
    throw new Error('Root node should not be used for search')
  }
};
