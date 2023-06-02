import React from 'react';
import { render, screen } from '@testing-library/react';
import { PropertyNode, RootNode, SchemaNode } from '../utils/SchemaNode';
import D3NodePainter, { SchemaTreeColors } from './D3NodePainter';
import * as d3 from 'd3';
import { hierarchy, HierarchyPointNode } from 'd3';

test('draws lone root', () => {
  const root = new RootNode(0);
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  const nodePainter = new D3NodePainter(testSvg, colors, 0, () => {}, () => {});
  nodePainter.drawNodes(treeData);

  const objectProperty = screen.getByText('schema{ }');
  expect(objectProperty).toBeInTheDocument();
});

test('draws properties', () => {
  const root = new RootNode(0);
  root.addChild(new PropertyNode(1, 'objectProperty', 'object', false, false));
  root.addChild(new PropertyNode(2, 'requiredProperty', 'string', true, false));
  root.addChild(new PropertyNode(3, 'deprecatedProperty', 'boolean', false, true));
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  const nodePainter = new D3NodePainter(testSvg, colors, 0, () => {}, () => {});
  nodePainter.drawNodes(treeData);

  const objectProperty = screen.getByText('objectProperty{ }');
  const requiredProperty = screen.getByText('requiredProperty(string)*');
  const deprecatedProperty = screen.getByText('deprecatedProperty(boolean)');
  expect(objectProperty).toBeInTheDocument();
  expect(requiredProperty).toBeInTheDocument();
  expect(deprecatedProperty).toBeInTheDocument();
  expect(deprecatedProperty.style.fill).toBe(colors.deprecatedTextColor);
});

function createExpandedTreeFromSchema(schema: SchemaNode): HierarchyPointNode<SchemaNode> {
  return d3.tree<SchemaNode>()(hierarchy(schema, n => n.children)); // we draw all children for testing
}

function setupSvg(): SVGSVGElement {
  render(<svg data-testid='test-svg'/>);
  return screen.getByTestId('test-svg') as any;
}

const colors: SchemaTreeColors = { circleBorderColor: '', collapsedCircleColor: '', deprecatedTextColor: 'red', expandedCircleColor: '' }
