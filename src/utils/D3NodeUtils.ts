import { HierarchyPointNode } from 'd3';
import { SchemaNode } from './SchemaNode';

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
