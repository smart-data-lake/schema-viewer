import { ClassNode, PropertyNode, RootNode, SchemaNode } from './SchemaNode';
import { createUrlToNode, getNodeFromPathUrlParam, getSchemaFromUrlParams, pathUrlParam } from './SchemaSerialization';
import { test, expect } from 'vitest';

test('serializing and deserializing gives the same node', () => {
  const schemaName = 'testSchema';
  const schema = createDummySchema();
  const node = schema.children[1].children[2].children[0];

  const nodeUrl = createUrlToNode(node, schemaName);
  setWindowLocationUrl(nodeUrl);
  const deserializedSchemaName = getSchemaFromUrlParams();
  const deserializedNode = getNodeFromPathUrlParam(schema);

  expect(deserializedSchemaName).toBe(schemaName);
  expect(deserializedNode).toBe(node);
});

test('serializing and deserializing works for root node', () => {
  const schemaName = 'testSchema';
  const root = new RootNode(0);

  const nodeUrl = createUrlToNode(root, schemaName);
  setWindowLocationUrl(nodeUrl);
  const deserializedSchemaName = getSchemaFromUrlParams();
  const deserializedNode = getNodeFromPathUrlParam(root);

  expect(deserializedSchemaName).toBe(schemaName);
  expect(deserializedNode).toBe(root);
});

test('the path of a node is composed of the names of the elements leading to it', () => {
  const schema = createDummySchema();
  const node = schema.children[1].children[2].children[0];

  const nodeUrl = createUrlToNode(node, 'testSchema');

  expect(getPathFromUrl(nodeUrl)).toBe('p2/c3/p3');
});

test('a name containing the path separator is serialized and deserialized correctly', () => {
  const schema = createDummySchema();
  const node = schema.children[1].children[2].children[2];

  const nodeUrl = createUrlToNode(node, 'testSchema');
  setWindowLocationUrl(nodeUrl);

  expect(getPathFromUrl(nodeUrl)).toBe('p2/c3/p5%2Fwith%2Fseparator');
  expect(getNodeFromPathUrlParam(schema)).toBe(node);
});

test('a path of positions, as used by older links, is still deserialized', () => {
  const schema = createDummySchema();
  openUrlWithPath('[1,2,0]');

  expect(getNodeFromPathUrlParam(schema)).toBe(schema.children[1].children[2].children[0]);
});

test('the closest ancestor which exists is used if an element on the path does not exist', () => {
  const schema = createDummySchema();
  openUrlWithPath('p2/c3/removedProperty');

  expect(getNodeFromPathUrlParam(schema)).toBe(schema.children[1].children[2]);
});

test('the closest ancestor which exists is used if a position on the path does not exist', () => {
  const schema = createDummySchema();
  openUrlWithPath('[1,99,0]');

  expect(getNodeFromPathUrlParam(schema)).toBe(schema.children[1]);
});

test('no node is returned if the path does not fit the schema at all', () => {
  const schema = createDummySchema();
  openUrlWithPath('doesNotExist/p3');

  expect(getNodeFromPathUrlParam(schema)).toBeUndefined();
});

test('no node is returned if there is no path in the url', () => {
  const schema = createDummySchema();
  setWindowLocationUrl('http://localhost/?schema=testSchema');

  expect(getNodeFromPathUrlParam(schema)).toBeUndefined();
});

test('an incorrectly encoded path does not fail', () => {
  const schema = createDummySchema();
  setWindowLocationUrl(`http://localhost/?${pathUrlParam}=%p2`);

  expect(getNodeFromPathUrlParam(schema)).toBeUndefined();
});

function createDummySchema(): SchemaNode {
  const root = new RootNode(0);

  // first level
  const p1 = new PropertyNode(1, 'p1', 'string', false, false);
  const p2 = new PropertyNode(2, 'p2', 'mapOf', false, false);
  [p1, p2].forEach(p => root.addChild(p));

  // second level
  const c1 = new ClassNode(3, 'c1', false);
  const c2 = new ClassNode(4, 'c2', false);
  const c3 = new ClassNode(5, 'c3', false);
  [c1, c2, c3].forEach(c => p2.addChild(c));

  // third level
  const p3 = new PropertyNode(6, 'p3', 'number', false, false);
  const p4 = new PropertyNode(7, 'p4', 'number', false, false);
  const p5 = new PropertyNode(8, 'p5/with/separator', 'number', false, false);
  [p3, p4, p5].forEach(p => c3.addChild(p));

  return root;
}

function getPathFromUrl(url: string): string | null {
  return new URL(url).searchParams.get(pathUrlParam);
}

function openUrlWithPath(path: string): void {
  setWindowLocationUrl(`http://localhost/?schema=testSchema&${pathUrlParam}=${encodeURIComponent(path)}`);
}

/**
 * Function for setting window.location during test. Overwriting window.location.href is not enough,
 * see https://stackoverflow.com/questions/54021037/how-to-mock-window-location-href-with-jest-vuejs.
 */
function setWindowLocationUrl(url: string) {
  //@ts-expect-error overriding location for test setup
  delete window.location;
  //@ts-expect-error assigning mock location for test
  window.location = new URL(url);
}