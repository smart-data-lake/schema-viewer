import { HierarchyPointNode } from 'd3';
import { ClassNode, PropertyNode, SchemaNode, SchemaVisitor } from './SchemaNode';

/**
 * Usually, trees in D3 are vertical. To get a horizontal tree, we switch the coordinates.
 */
export function swap(x: number, y: number): [number, number] {
  return [y, x];
}

export function getCoordinates(node: HierarchyPointNode<SchemaNode>): [number, number] {
  return swap(node.x, node.y);
}

export function setCoordinates(node: HierarchyPointNode<SchemaNode>, coordinates: [number, number]) {
  [node.x, node.y] = swap(coordinates[0], coordinates[1]);
}

export function formatNodeId(schemaNode: SchemaNode): string {
  return 'node-' + schemaNode.id;
}

export const deprecatedVisitor: SchemaVisitor<boolean> = {
  visitClassNode: (n: ClassNode) => n.deprecated,
  visitPropertyNode: (n: PropertyNode) => n.deprecated,
  visitRootNode: () => false
}

export const labelVisitor: SchemaVisitor<string> = {
  visitClassNode: (n: ClassNode) => n.className + objectLabelSuffix,
  visitPropertyNode: (n: PropertyNode) => n.propertyName + getTypeSuffixForProperty(n) + getRequiredSuffix(n),
  visitRootNode: () => 'schema' + objectLabelSuffix
}

const objectLabelSuffix = '{ }';

function getTypeSuffixForProperty(propertyNode: PropertyNode): string {
  if (propertyNode.type === 'object') {
    return objectLabelSuffix;
  } else if (['mapOf', 'anyOf', 'oneOf', 'allOf'].includes(propertyNode.type)) {
    return '[' + propertyNode.type + ']';
  } else if (propertyNode.type === 'array') {
    return propertyNode.children.length > 0 || !propertyNode.typeDetails ? '[ ]' : '[' + propertyNode.typeDetails + ']';
  } else {
    return '(' + propertyNode.type + ')';
  }
}

function getRequiredSuffix(propertyNode: PropertyNode): string {
  return propertyNode.required ? '*' : '';
}