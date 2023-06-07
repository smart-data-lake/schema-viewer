import React from 'react';
import { render, screen } from '@testing-library/react';
import NodeSearch from './NodeSearch';
import { ClassNode, PropertyNode, RootNode, SchemaNode } from '../utils/SchemaNode';
import userEvent from '@testing-library/user-event';

test('search finds matching elements when providing two characters', async () => {
  const schema = createDummySchema();

  render(<NodeSearch schema={schema} selectedNode={null} setSelectedNode={() => {}} />);
  const searchBar = screen.getByPlaceholderText('Search');

  await userEvent.type(searchBar, 'pr');
  expect(screen.getAllByText('property1').length).toBe(2); // one for the label and one for the ancestor list
  expect(screen.getAllByText('property2').length).toBe(2);
  expect(screen.getByText('property3')).toBeInTheDocument();
  expect(screen.getByText('property4')).toBeInTheDocument();
  expect(screen.getByText('property2>class3>property3')).toBeInTheDocument();
  expect(screen.getByText('property2>class3>property4')).toBeInTheDocument();
  expect(screen.queryByText('class1')).not.toBeInTheDocument();
  expect(screen.queryByText('class2')).not.toBeInTheDocument();
  expect(screen.queryByText('class3')).not.toBeInTheDocument();
});

test('search finds matching elements when providing more than two characters', async () => {
  const schema = createDummySchema();

  render(<NodeSearch schema={schema} selectedNode={null} setSelectedNode={() => {}} />);
  const searchBar = screen.getByPlaceholderText('Search');

  await userEvent.type(searchBar, 'class');
  expect(screen.getByText('class1')).toBeInTheDocument();
  expect(screen.getByText('class2')).toBeInTheDocument();
  expect(screen.getByText('class3')).toBeInTheDocument();
  expect(screen.getByText('property2>class1')).toBeInTheDocument();
  expect(screen.getByText('property2>class2')).toBeInTheDocument();
  expect(screen.getByText('property2>class3')).toBeInTheDocument();
  expect(screen.queryByText('property1')).not.toBeInTheDocument();
  expect(screen.queryByText('property2')).not.toBeInTheDocument();
  expect(screen.queryByText('property3')).not.toBeInTheDocument();
  expect(screen.queryByText('property4')).not.toBeInTheDocument();
});

function createDummySchema(): SchemaNode {
  const root = new RootNode(0);

  // first level
  const p1 = new PropertyNode(1, 'property1', 'string', false, false);
  const p2 = new PropertyNode(2, 'property2', 'mapOf', false, false);
  [p1, p2].forEach(p => root.addChild(p));

  // second level
  const c1 = new ClassNode(3, 'class1', false);
  const c2 = new ClassNode(4, 'class2', false);
  const c3 = new ClassNode(5, 'class3', false);
  [c1, c2, c3].forEach(c => p2.addChild(c));

  // third level
  const p3 = new PropertyNode(6, 'property3', 'number', false, false);
  const p4 = new PropertyNode(7, 'property4', 'number', false, false);
  [p3, p4].forEach(p => c3.addChild(p));

  return root;
}
