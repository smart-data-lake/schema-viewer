import { ClassNode, PropertyNode, RootNode, SubFeedTypes } from './SchemaNode';
import {
  closestVisibleNode,
  collectSubFeedTypes,
  createSubFeedTypeFilter,
  formatSubFeedType,
  noNodeHidden
} from './SubFeedTypeFilter';
import { expect, test } from 'vitest';

function classNode(id: number, subFeedTypes?: SubFeedTypes): ClassNode {
  return new ClassNode(id, `Class${id}`, false, undefined, undefined, subFeedTypes);
}

const sparkAction = classNode(1, {kind: 'Action', types: ['SparkSubFeed']});
const fileAction = classNode(2, {kind: 'Action', types: ['FileSubFeed']});
const sparkConnectReadingDataObject = classNode(3, {kind: 'DataObject', read: ['SparkConnectSubFeed'], write: []});
const sparkConnectWritingDataObject = classNode(4, {kind: 'DataObject', read: [], write: ['SparkConnectSubFeed']});
const unknownClass = classNode(5);
const property = new PropertyNode(6, 'property', 'string', false, false);

test.each([
  ['FileSubFeed', 'File'],
  ['SparkConnectSubFeed', 'SparkConnect'],
  ['SQLSubFeed', 'SQL']
])('%s is shortened to %s', (type, label) => {
  expect(formatSubFeedType(type)).toBe(label);
});

test('the SubFeed types of the whole schema are collected without duplicates', () => {
  const root = new RootNode(0);
  const actions = new PropertyNode(7, 'actions', 'mapOf', false, false);
  root.addChild(actions);
  [sparkAction, fileAction, sparkConnectReadingDataObject].forEach(c => actions.addChild(c));

  expect(collectSubFeedTypes(root)).toEqual(['FileSubFeed', 'SparkSubFeed', 'SparkConnectSubFeed']);
});

test('without selected types nothing is hidden', () => {
  expect(createSubFeedTypeFilter([])).toBe(noNodeHidden);
});

test('elements supporting none of the selected types are hidden', () => {
  const isHidden = createSubFeedTypeFilter(['SparkSubFeed', 'FileSubFeed']);
  expect(isHidden(sparkAction)).toBe(false);
  expect(isHidden(fileAction)).toBe(false);
  expect(isHidden(sparkConnectReadingDataObject)).toBe(true);
});

test('DataObjects are shown if they can read or write one of the selected types', () => {
  const isHidden = createSubFeedTypeFilter(['SparkConnectSubFeed']);
  expect(isHidden(sparkConnectReadingDataObject)).toBe(false);
  expect(isHidden(sparkConnectWritingDataObject)).toBe(false);
});

test('elements with unknown SubFeed types are not hidden', () => {
  const isHidden = createSubFeedTypeFilter(['SparkSubFeed']);
  expect(isHidden(unknownClass)).toBe(false);
  expect(isHidden(property)).toBe(false);
});

test('a hidden node falls back to its closest visible ancestor', () => {
  const root = new RootNode(0);
  const dataObjects = new PropertyNode(1, 'dataObjects', 'mapOf', false, false);
  const dataObject = classNode(2, {kind: 'DataObject', read: ['FileSubFeed'], write: []});
  const table = new PropertyNode(3, 'table', 'string', false, false);
  root.addChild(dataObjects);
  dataObjects.addChild(dataObject);
  dataObject.addChild(table);

  expect(closestVisibleNode(table, createSubFeedTypeFilter(['SparkSubFeed']))).toBe(dataObjects);
  expect(closestVisibleNode(table, createSubFeedTypeFilter(['FileSubFeed']))).toBe(table);
});
