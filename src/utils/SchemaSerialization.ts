import { SchemaNode } from './SchemaNode';

/**
 * Schema and node serialization is used to create and interpret links to specific schemas and nodes.
 * The serialized values are passed as url parameters.
 * Per default, there are no url parameters and the newest schema is loaded.
 * If there are according url parameters (see {@link pathUrlParam} and ${@link schemaUrlParam} defined in the
 * url, these will be used and updated as long as they are present in the url.
 */

export const pathUrlParam = 'path';
export const schemaUrlParam = 'schema';

export function getSchemaFromUrlParams(): string | null {
  return getUrlParams().get(schemaUrlParam);
}

export function hasSchemaInUrlParams(): boolean {
  return getUrlParams().has(schemaUrlParam);
}

export function updateSchemaInUrlParams(schemaName: string): void {
  const urlParams = getUrlParams();
  const lastSchema = urlParams.get(schemaUrlParam);
  if (lastSchema !== schemaName) {
    urlParams.set(schemaUrlParam, schemaName)
    urlParams.delete(pathUrlParam); // the path only makes sense with the respective schema, so we remove it after a change
    window.history.replaceState(null, '', '?' + urlParams.toString());
  }
}

export function hasPathUrlParam(): boolean {
  return getUrlParams().has(pathUrlParam);
}

export function updatePathInUrlParams(selectedNode: SchemaNode) {
  const pathIndexes = serialize(selectedNode);
  const urlParams = getUrlParams();
  const lastPath = urlParams.get(pathUrlParam);
  const newPath = JSON.stringify(pathIndexes);
  if (lastPath !== newPath) {
    urlParams.set(pathUrlParam, newPath);
    window.history.replaceState(null, '', '?' + urlParams.toString());
  }
}

export function getNodeFromPathUrlParam(schema: SchemaNode): SchemaNode | undefined {
  const path = getUrlParams().get(pathUrlParam);
  if (!path) {
    return undefined;
  }
  const pathIndexes = JSON.parse(path) as number[];
  return deserialize(pathIndexes, schema);
}

export function deletePathFromUrlParams() {
  const urlParams = getUrlParams();
  urlParams.delete(pathUrlParam);
  window.history.replaceState(null, '', '?' + urlParams.toString());
}

function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function createUrlToNode(node: SchemaNode, schemaName: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set(schemaUrlParam, schemaName);
  url.searchParams.set(pathUrlParam, JSON.stringify(serialize(node)));
  return url.toString();
}

/**
 * Converts a node into a path of indexes which represent the path from the root to the node.
 */
function serialize(node: SchemaNode): number[] {
  const pathIndexes = [];
  let ancestor = node;
  while (ancestor.parent) {
    pathIndexes.push(ancestor.parent.children.indexOf(ancestor));
    ancestor = ancestor.parent;
  }
  return pathIndexes.reverse();
}

/**
 * Finds the schema node in the schema based on the serialized path indexes. This will not work if the schema has changed too
 * much since the serialization.
 */
function deserialize(pathIndexes: number[], schema: SchemaNode): SchemaNode {
  let nodeOnPath = schema;
  for (let i of pathIndexes) {
    nodeOnPath = nodeOnPath.children[i];
  }
  return nodeOnPath;
}