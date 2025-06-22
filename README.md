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
import { SchemaViewer } from 'sdlb-schema-viewer';

<SchemaViewer loadSchemaNames={...} loadSchema={...} />
```

The `SchemaViewer` component has the following properties:
* `loadSchemaNames`: A function for loading a list of schema names. These are the schemas that a user can select.
* `loadSchema`: A function for loading a JSON schema which takes the selected schema name as an input parameter.

## Example

This example shows how to visualize a simple example schema.

```jsx
import { SchemaViewer } from 'sdlb-schema-viewer';

<SchemaViewer loadSchemaNames={loadSchemaNames} loadSchema={loadSchema}/>

const exampleSchema =
    {
        "title": "Person",
        "type": "object",
        "properties": {
            "firstName": {
                "type": "string",
                "description": "The person's first name."
            },
            "lastName": {
                "type": "string",
                "description": "The person's last name."
            },
            "age": {
                "description": "Age in years which must be equal to or greater than zero.",
                "type": "integer",
            }
        }
    }

function loadSchemaNames() {
    return Promise.resolve(['exampleSchema.json']);
}

function loadSchema(schemaName) {
    return schemaName === 'exampleSchema.json' ? Promise.resolve(exampleSchema) : Promise.reject();
}
```

## Styling

The `SchemaViewer` component uses [@mui/joy](https://www.npmjs.com/package/@mui/joy) for component styling. 
The default theme can be overridden by providing a custom theme:

```jsx
import { SchemaViewer } from 'sdlb-schema-viewer';
import { CssVarsProvider, extendTheme } from "@mui/joy";

const theme = extendTheme({...});

<CssVarsProvider theme={theme}>
    <SchemaViewer loadSchemaNames={...} loadSchema={...}/>
</CssVarsProvider>
```

See https://mui.com/joy-ui/customization/theme-colors/ for more information about color
theme configuration.

The default theme for the schema viewer can be imported with

```typescript
import { defaultTheme } from 'sdlb-schema-viewer';
```

## Build
For building and testing the component, Node.js (Version 22+) and yarn are required. 

### Install

Checkout the repository and install the required packages by executing:

`yarn install`

in the project directory.

### Available Scripts

In the project directory, you can run:

* `yarn start` \
Runs the app in the development mode. \
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.
The page will reload if you make edits. You will also see any lint errors in the console.

* `yarn test` \
Launches the test runner in the interactive watch mode.

* `yarn build` \
Compiles the components into the `dist` folder to be used by other React projects.

### Test with SDLB website

To test changes of schema-viewer component with SDLB documentation website, build the component locally and run `yarn pack`, then in SDLB projects `documentation` branch:
* remove schema-viewer from `dependencies` in package.json file
* add local packed dependency using `yarn add ../schema-viewer/sdlb-schema-viewer-v2.0.0.tgz`.