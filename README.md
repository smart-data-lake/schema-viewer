# SDLB Schema Viewer

A React component for visualizing the [Smart Data Lake Builder](https://github.com/smart-data-lake/smart-data-lake) config schema.
It retrieves the SDLB JSON schemas and renders them as dynamic trees using the [d3](https://d3js.org/) library.

## Installation

```
npm install sdlb-schema-viewer
```

## Usage

Inside JSX:

```jsx
import { SchemaViewer } from 'sdl-schema-viewer';

<div style={{height: '...'}}>
  <SchemaViewer schemasUrl="..."/>
</div>
```

The schemasUrl must be a URL pointing to a REST endpoint which returns a list of possible schemas. The schema to be
visualized is then loaded from `{schemasUrl}/{schema}`. For example, if GET request to `https://myschemas` returns the list
`[schema1.json, schema2.json, schema3.json]`, the schemas will be retrieved from
```
https://myschemas/schema1.json
https://myschemas/schema2.json
https://myschemas/schema3.json
```

## Styling

The `SchemaViewer` component uses [@mui/joy](https://www.npmjs.com/package/@mui/joy) for component styling. 
The default theme can be overridden by providing a custom theme:

```jsx
import { SchemaViewer } from 'sdl-schema-viewer';
import { CssVarsProvider, extendTheme } from "@mui/joy";

const theme = extendTheme({...});

<div style={{height: '...'}}>
    <CssVarsProvider theme={theme}>
        <SchemaViewer schemasUrl="..."/>
    </CssVarsProvider>
</div>
```

See https://mui.com/joy-ui/customization/theme-colors/ for more information about color
theme configuration.