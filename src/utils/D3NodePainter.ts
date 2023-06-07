import { HierarchyPointNode } from "d3";
import { SchemaNode } from './SchemaNode';
import * as d3 from 'd3';
import { deprecatedVisitor, formatNodeId, getCoordinates, labelVisitor } from './D3NodeUtils';

export interface SchemaTreeColors {
  expandedCircleColor: string,
  collapsedCircleColor: string,
  circleBorderColor: string,
  deprecatedTextColor: string,
}

export const nodeClass = 'node';
export type NodeSelection = d3.Selection<any, HierarchyPointNode<SchemaNode>, SVGSVGElement, unknown>;

/**
 * This class is responsible for drawing nodes with the provided data and behaviour.
 */
export default class D3NodePainter {
  private readonly svg: SVGSVGElement;
  private readonly colors: SchemaTreeColors;
  private readonly animationDurationMillis: number;
  private readonly setSelectedNode: (n: SchemaNode) => void;
  private readonly toggleNode: (n: HierarchyPointNode<SchemaNode>) => void;

  constructor(svg: SVGSVGElement, colors: SchemaTreeColors, animationDurationMillis: number,
              setSelectedNode: (n: SchemaNode) => void, toggleNode: (n: HierarchyPointNode<SchemaNode>) => void) {
    this.svg = svg;
    this.colors = colors;
    this.animationDurationMillis = animationDurationMillis;
    this.setSelectedNode = setSelectedNode;
    this.toggleNode = toggleNode;
  }

  drawNodes(root: HierarchyPointNode<SchemaNode>): void {
    const nodes = this.updateNodeData(root);
    this.addNewNodes(nodes);
    this.updateExistingNodes(nodes);
    this.removeLeavingNodes(nodes);
  }

  private updateNodeData(root: HierarchyPointNode<SchemaNode>): NodeSelection {
    return d3.select(this.svg)
      .selectAll('g.' + nodeClass)
      .data(root.descendants(), n => (n as HierarchyPointNode<SchemaNode>).data.id);
  }

  private addNewNodes(nodes: NodeSelection): void {
    const nodeElement = this.addNode(nodes);
    this.addNodeCircle(nodeElement);
    this.addNodeText(nodeElement);
  }

  private addNode(nodes: NodeSelection): NodeSelection {
    return nodes.enter()
      .append('g')
      .attr('id', n => formatNodeId(n.data))
      .attr('class', nodeClass)
      .attr('transform', n => this.constructTranslateFromNodePosition(n))
  }

  private addNodeCircle(nodeElement: NodeSelection): void {
    nodeElement
      .append('circle')
      .style('stroke',  this.colors.circleBorderColor)
      .style('fill', n => this.getCircleFillColor(n))
      .attr('r', 7.5)
      .on('click', (_, n: HierarchyPointNode<SchemaNode>) => this.toggleNode(n));
  }

  private getCircleFillColor(node: HierarchyPointNode<SchemaNode>): string {
    return node.data.children.length > 0 && node.data.visibleChildren.length === 0
      ? this.colors.collapsedCircleColor
      : this.colors.expandedCircleColor;
  }

  private addNodeText(nodeElement: NodeSelection): void {
    nodeElement
      .append('text')
      .attr('x', () => 12)
      .attr('dy', '.25em')
      .style('fill', (n: HierarchyPointNode<SchemaNode>) => n.data.accept(deprecatedVisitor) ? this.colors.deprecatedTextColor : '')
      .on('click', (_, n: HierarchyPointNode<SchemaNode>) => this.setSelectedNode(n.data))
      .text(n => n.data.accept(labelVisitor))
  }

  private updateExistingNodes(nodes: NodeSelection): void {
    // any fields or event handlers using non-constant data need to be updated, otherwise the old data is used
    nodes
      .transition()
      .duration(this.animationDurationMillis)
      .attr('transform', n => this.constructTranslateFromNodePosition(n));

    nodes.select('circle')
      .style('fill', n => this.getCircleFillColor(n));

    nodes.select('text')
      .on('click', (_, n: HierarchyPointNode<SchemaNode>) => this.setSelectedNode(n.data));
  }

  private constructTranslateFromNodePosition(node: HierarchyPointNode<SchemaNode>): string {
    const coordinates = getCoordinates(node);
    return `translate(${coordinates[0]},${coordinates[1]})`;
  }

  private removeLeavingNodes(nodes: NodeSelection): void {
    nodes.exit().remove();
  }
}