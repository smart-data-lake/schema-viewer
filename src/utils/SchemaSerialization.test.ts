import { ClassNode, PropertyNode, RootNode, SchemaNode } from './SchemaNode';
import { createUrlToNode, getNodeFromPathUrlParam, getSchemaFromUrlParams } from './SchemaSerialization';
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
  const p4 = new PropertyNode(6, 'p4', 'number', false, false);
  [p3, p4].forEach(p => c3.addChild(p));

  return root;
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