import React, { useEffect, useState } from 'react';
import { Select, Option } from '@mui/joy';
import { getSchemaFromUrlParams } from '../utils/SchemaSerialization';

export default function SchemaSelector(props: { schemasUrl: string, selectedSchemaName: string | undefined, setSelectedSchemaName: (name: string) => void }) {
  const [schemaNames, setSchemaNames] = useState<string[]>([]);

  useEffect(() => {
    fetch(props.schemasUrl)
      .then(res => res.json())
      .then(availableSchemas => {
        let schemas = availableSchemas as string[];
        schemas.sort((s1, s2) => s2.localeCompare(s1))
        setSchemaNames(schemas);
      });
  }, [props.schemasUrl]);

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
    <Select value={props.selectedSchemaName}
            onChange={(_, newValue) => newValue && props.setSelectedSchemaName(newValue)}
            sx={{width: 300, marginLeft: 7}}>
      {schemaNames.map(schema => <Option key={schema} value={schema}>{schema}</Option>)}
    </Select>
  );
}