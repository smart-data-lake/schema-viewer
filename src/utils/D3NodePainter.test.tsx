import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClassNode, PropertyNode, RootNode, SchemaNode } from './SchemaNode';
import D3NodePainter, { SchemaTreeColors } from './D3NodePainter';
import * as d3 from 'd3';
import { hierarchy, HierarchyPointNode } from 'd3';

test('draws lone root', () => {
  const root = new RootNode(0);
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  createNodePainter(testSvg, colors).drawNodes(treeData);

  const rootNode = screen.getByText('schema{ }');
  expect(rootNode).toBeInTheDocument();
});

test('draws property nodes', () => {
  const root = new RootNode(0);
  root.addChild(new PropertyNode(1, 'objectProperty', 'object', false, false));
  root.addChild(new PropertyNode(2, 'deprecatedProperty', 'boolean', false, true));
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  createNodePainter(testSvg, colors).drawNodes(treeData);

  const rootNode = screen.getByText('schema{ }');
  const objectProperty = screen.getByText('objectProperty{ }');
  const deprecatedProperty = screen.getByText('deprecatedProperty(boolean)');
  expect(rootNode).toBeInTheDocument();
  expect(objectProperty).toBeInTheDocument();
  expect(deprecatedProperty).toBeInTheDocument();
  expect(deprecatedProperty.style.fill).toBe(colors.deprecatedTextColor);
});

test('draws class nodes', () => {
  const root = new RootNode(0);
  const propertyNode = new PropertyNode(1, 'oneOfProperty', 'oneOf', false, false);
  root.addChild(propertyNode);
  propertyNode.addChild(new ClassNode(2, 'TestClass', false));
  propertyNode.addChild(new ClassNode(3, 'DeprecatedClass', true));
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  createNodePainter(testSvg, colors).drawNodes(treeData);

  const rootNode = screen.getByText('schema{ }');
  const mapOfProperty = screen.getByText(`oneOfProperty[oneOf]`);
  const testClass = screen.getByText('TestClass{ }');
  const deprecatedClass = screen.getByText('DeprecatedClass{ }');
  expect(rootNode).toBeInTheDocument();
  expect(mapOfProperty).toBeInTheDocument();
  expect(testClass).toBeInTheDocument();
  expect(deprecatedClass).toBeInTheDocument();
  expect(deprecatedClass.style.fill).toBe(colors.deprecatedTextColor);
});

function createExpandedTreeFromSchema(schema: SchemaNode): HierarchyPointNode<SchemaNode> {
  return d3.tree<SchemaNode>()(hierarchy(schema, n => n.children)); // we draw all children for testing
}

function createNodePainter(svg: SVGSVGElement, colors: SchemaTreeColors): D3NodePainter {
  return new D3NodePainter(svg, colors, 0, () => {}, () => {});
}

function setupSvg(): SVGSVGElement {
  render(<svg data-testid='test-svg'/>);
  return screen.getByTestId('test-svg') as any;
}

const colors: SchemaTreeColors = { circleBorderColor: '', collapsedCircleColor: '', deprecatedTextColor: 'red', expandedCircleColor: '' }
