import React, { useEffect, useState } from 'react';
import { Select, Option } from '@mui/joy';
import { getSchemaFromUrlParams } from '../utils/SchemaSerialization';

/**
 * Dropdown for selecting the schema to visualize.
 */
export default function SchemaSelector(props: { loadSchemaNames: () => Promise<string[]>, selectedSchemaName: string | undefined, setSelectedSchemaName: (name: string) => void }) {
  const [schemaNames, setSchemaNames] = useState<string[]>([]);

  useEffect(() => {
    props.loadSchemaNames()
      .then(availableSchemas => {
        availableSchemas.sort((s1, s2) => s2.localeCompare(s1))
        setSchemaNames(availableSchemas);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.loadSchemaNames]);

  useEffect(() => {
    if (schemaNames.length > 0) {
      props.setSelectedSchemaName(getInitialSchema());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaNames]);

  function getInitialSchema(): string {
    const schemaParam = getSchemaFromUrlParams();
    return schemaParam && schemaNames.includes(schemaParam) ? schemaParam : schemaNames[0];
  }

  return (
    <Select value={props.selectedSchemaName ?? ''}
            onChange={(_, newValue) => newValue && props.setSelectedSchemaName(newValue)}
            sx={{width: 300, marginLeft: 7}}>
      {schemaNames.map(schema => <Option key={schema} value={schema}>{schema}</Option>)}
    </Select>
  );
}