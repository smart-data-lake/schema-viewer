import { nameVisitor, SchemaNode } from './SchemaNode';

/**
 * Schema and node serialization is used to create and interpret links to specific schemas and nodes.
 * The serialized values are passed as url parameters.
 * Per default, there are no url parameters and the newest schema is loaded.
 * If there are according url parameters (see {@link pathUrlParam} and ${@link schemaUrlParam} defined in the
 * url, these will be used and updated as long as they are present in the url.
 */

export const pathUrlParam = 'path';
export const schemaUrlParam = 'schema';

const pathSeparator = '/';

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
    // the path is kept, because a path of element names is not specific to a schema version
    window.history.replaceState(null, '', '?' + urlParams.toString());
  }
}

export function hasPathUrlParam(): boolean {
  return getUrlParams().has(pathUrlParam);
}

export function updatePathInUrlParams(selectedNode: SchemaNode) {
  const urlParams = getUrlParams();
  const lastPath = urlParams.get(pathUrlParam);
  const newPath = serialize(selectedNode);
  if (lastPath !== newPath) {
    urlParams.set(pathUrlParam, newPath);
    window.history.replaceState(null, '', '?' + urlParams.toString());
  }
}

export function getNodeFromPathUrlParam(schema: SchemaNode): SchemaNode | undefined {
  const path = getUrlParams().get(pathUrlParam);
  if (path === null) {
    return undefined;
  }
  return deserialize(path, schema);
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
  url.searchParams.set(pathUrlParam, serialize(node));
  return url.toString();
}

/**
 * Converts a node into a path of the names of the elements leading from the root to the node.
 * Names are used instead of the positions of the elements, so that a link to a node stays valid in other
 * versions of the schema. The names are encoded, so that a name containing the separator does not
 * introduce another path element.
 */
function serialize(node: SchemaNode): string {
  const names = [];
  let ancestor = node;
  while (ancestor.parent) {
    names.push(encodeURIComponent(ancestor.accept(nameVisitor)));
    ancestor = ancestor.parent;
  }
  return names.reverse().join(pathSeparator);
}

/**
 * Finds the node the serialized path refers to. Paths of names as created by {@link serialize} and the
 * paths of positions which were used before are both understood.
 */
function deserialize(path: string, schema: SchemaNode): SchemaNode | undefined {
  return isPathOfPositions(path)
    ? deserializePathOfPositions(path, schema)
    : deserializePathOfNames(path, schema);
}

/**
 * Names are encoded, so a path of names never starts with the bracket of a serialized array.
 */
function isPathOfPositions(path: string): boolean {
  return path.startsWith('[');
}

function deserializePathOfNames(path: string, schema: SchemaNode): SchemaNode | undefined {
  const names = splitPathOfNames(path);
  if (!names) {
    return undefined;
  }
  return findNodeOnPath(schema, names, (parent, name) => parent.children.find(c => c.accept(nameVisitor) === name));
}

function splitPathOfNames(path: string): string[] | undefined {
  if (path === '') {
    return []; // the root node has no name, so its path is empty
  }
  try {
    return path.split(pathSeparator).map(decodeURIComponent);
  } catch {
    return undefined; // the names are not encoded correctly, so the path cannot be interpreted
  }
}

/**
 * Before the paths of names, a path was the list of the positions of the elements leading to the node.
 * Such paths are still resolved so that links which have already been created keep working, but they only
 * refer to the intended node in the schema version they were created for.
 */
function deserializePathOfPositions(path: string, schema: SchemaNode): SchemaNode | undefined {
  let positions: number[];
  try {
    positions = JSON.parse(path) as number[];
  } catch {
    return undefined;
  }
  return findNodeOnPath(schema, positions, (parent, position) => parent.children[position]);
}

/**
 * Walks down the tree along the path elements.
 * If an element on the path is not part of the schema, the closest ancestor which is part of it is
 * returned, so that a link to an element which has been removed still leads to its surroundings.
 * If not even the first element on the path is found, the path does not fit the schema at all and no node
 * is returned.
 */
function findNodeOnPath<T>(schema: SchemaNode, pathElements: T[],
                           findChild: (parent: SchemaNode, pathElement: T) => SchemaNode | undefined): SchemaNode | undefined {
  let nodeOnPath = schema;
  for (const pathElement of pathElements) {
    const child = findChild(nodeOnPath, pathElement);
    if (!child) {
      return nodeOnPath === schema ? undefined : nodeOnPath;
    }
    nodeOnPath = child;
  }
  return nodeOnPath;
}
