import React from  'react';
import { ClassNode, PropertyNode, SchemaType } from '../utils/SchemaNode';
import DetailsPanelContent from './DetailsPanelContent';
import { render, screen } from '@testing-library/react';

test('details are shown for property node without type details', () => {
  const title = 'testProperty';
  const type: SchemaType = 'string';
  const description = 'some description';
  const propertyNode = new PropertyNode(0, 'testProperty', 'string', false, false, undefined, 'some description');

  render(<DetailsPanelContent node={propertyNode} createNodeUrl={() => ''} />)

  const titleElement = screen.getByText(title);
  const typeElement = screen.getByText(type);
  const descriptionElement = screen.getByText(description);
  expect(titleElement).toBeInTheDocument();
  expect(typeElement).toBeInTheDocument();
  expect(descriptionElement).toBeInTheDocument();
});

test('details are shown for property node with type details', () => {
  const title = 'testProperty';
  const type: SchemaType = 'array';
  const typeDetails = 'string';
  const description = 'some description';
  const propertyNode = new PropertyNode(0, 'testProperty', type, false, false, typeDetails, 'some description');

  render(<DetailsPanelContent node={propertyNode} createNodeUrl={() => ''} />)

  const titleElement = screen.getByText(title);
  const typeElement = screen.getByText(`${type}: ${typeDetails}`);
  const descriptionElement = screen.getByText(description);
  expect(titleElement).toBeInTheDocument();
  expect(typeElement).toBeInTheDocument();
  expect(descriptionElement).toBeInTheDocument();
});

test('details are shown for class node with base class', () => {
  const className = 'TestClass';
  const baseClass = 'BaseClass';
  const description = 'some description';
  const propertyNode = new ClassNode(0, className, false, description, baseClass);

  render(<DetailsPanelContent node={propertyNode} createNodeUrl={() => ''} />)

  const titleElement = screen.getByText(className);
  const typeElement = screen.getByText(`object: ${className} extends ${baseClass}`);
  const descriptionElement = screen.getByText(description);
  expect(titleElement).toBeInTheDocument();
  expect(typeElement).toBeInTheDocument();
  expect(descriptionElement).toBeInTheDocument();
});

test('details are shown for class node without base class', () => {
  const className = 'TestClass';
  const description = 'some description';
  const propertyNode = new ClassNode(0, className, false, description);

  render(<DetailsPanelContent node={propertyNode} createNodeUrl={() => ''} />)

  const titleElement = screen.getByText(className);
  const typeElement = screen.getByText(`object: ${className}`);
  const descriptionElement = screen.getByText(description);
  expect(titleElement).toBeInTheDocument();
  expect(typeElement).toBeInTheDocument();
  expect(descriptionElement).toBeInTheDocument();
});
