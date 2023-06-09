import React from 'react';
import { ClassNode, PropertyNode, SchemaType } from '../utils/SchemaNode';
import DetailsPanelContent from './DetailsPanelContent';
import { render, screen } from '@testing-library/react';

const deprecatedText = 'deprecated';

test('details are shown for property node without type details', () => {
  const title = 'testProperty';
  const type: SchemaType = 'string';
  const description = 'some description';
  const propertyNode = new PropertyNode(0, 'testProperty', 'string', false, false, undefined, 'some description');

  render(<DetailsPanelContent node={propertyNode} createNodeUrl={() => ''} />)

  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByText(type)).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.queryByText(deprecatedText)).not.toBeInTheDocument();
});

test('details are shown for property node with type details', () => {
  const title = 'testProperty';
  const type: SchemaType = 'array';
  const typeDetails = 'string';
  const description = 'some description';
  const propertyNode = new PropertyNode(0, 'testProperty', type, false, false, typeDetails, 'some description');

  render(<DetailsPanelContent node={propertyNode} createNodeUrl={() => ''} />)

  expect(screen.getByText(title)).toBeInTheDocument();
  expect(screen.getByText(`${type}: ${typeDetails}`)).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.queryByText(deprecatedText)).not.toBeInTheDocument();
});

test('details are shown for class node with base class', () => {
  const className = 'TestClass';
  const baseClass = 'BaseClass';
  const description = 'some description';
  const classNode = new ClassNode(0, className, false, description, baseClass);

  render(<DetailsPanelContent node={classNode} createNodeUrl={() => ''} />)

  expect(screen.getByText(className)).toBeInTheDocument();
  expect(screen.getByText(`object: ${className} extends ${baseClass}`)).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.queryByText(deprecatedText)).not.toBeInTheDocument();
});

test('details are shown for class node without base class', () => {
  const className = 'TestClass';
  const description = 'some description';
  const classNode = new ClassNode(0, className, false, description);

  render(<DetailsPanelContent node={classNode} createNodeUrl={() => ''} />)

  expect(screen.getByText(className)).toBeInTheDocument();
  expect(screen.getByText(`object: ${className}`)).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.queryByText(deprecatedText)).not.toBeInTheDocument();
});

test('deprecated text is shown for deprecated node', () => {
  const className = 'TestClass';
  const description = 'some description';
  const classNode = new ClassNode(0, className, true, description);

  render(<DetailsPanelContent node={classNode} createNodeUrl={() => ''} />)

  expect(screen.getByText(className)).toBeInTheDocument();
  expect(screen.getByText(`object: ${className}`)).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.getByText(deprecatedText)).toBeInTheDocument();
})