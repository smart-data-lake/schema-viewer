import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClassNode, PropertyNode, RootNode, SchemaNode, SchemaType } from './SchemaNode';
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

test('draws properties', () => {
  const root = new RootNode(0);
  root.addChild(new PropertyNode(1, 'objectProperty', 'object', false, false));
  root.addChild(new PropertyNode(2, 'requiredProperty', 'string', true, false));
  root.addChild(new PropertyNode(3, 'deprecatedProperty', 'boolean', false, true));
  root.addChild(new PropertyNode(4, 'arrayProperty', 'array', false, false, 'string'));
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  createNodePainter(testSvg, colors).drawNodes(treeData);

  const rootNode = screen.getByText('schema{ }');
  const objectProperty = screen.getByText('objectProperty{ }');
  const requiredProperty = screen.getByText('requiredProperty(string)*');
  const deprecatedProperty = screen.getByText('deprecatedProperty(boolean)');
  const arrayProperty = screen.getByText('arrayProperty[string]');
  expect(rootNode).toBeInTheDocument();
  expect(objectProperty).toBeInTheDocument();
  expect(requiredProperty).toBeInTheDocument();
  expect(deprecatedProperty).toBeInTheDocument();
  expect(deprecatedProperty.style.fill).toBe(colors.deprecatedTextColor);
  expect(arrayProperty).toBeInTheDocument();
});

test.each(Array<SchemaType[]>(['oneOf'], ['allOf'], ['anyOf'], ['mapOf']))('draws class nodes as children of %s node', (type: SchemaType) => {
  const root = new RootNode(0);
  const containerNode = new PropertyNode(1, 'container', type, false, false);
  root.addChild(containerNode);
  containerNode.addChild(new ClassNode(2, 'TestClass', false));
  containerNode.addChild(new ClassNode(3, 'DeprecatedClass', true));
  const treeData = createExpandedTreeFromSchema(root);
  const testSvg = setupSvg();

  createNodePainter(testSvg, colors).drawNodes(treeData);

  const rootNode = screen.getByText('schema{ }');
  const mapOfProperty = screen.getByText(`container[${type}]`);
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
