import { HierarchyPointLink, HierarchyPointNode } from 'd3';
import { SchemaNode } from './SchemaNode';
import * as d3 from 'd3';
import { formatNodeId, getCoordinates } from './D3NodeUtils';

type LinkSelection = d3.Selection<any, HierarchyPointLink<SchemaNode>, SVGSVGElement, unknown>;

const linkClass = 'link';

/**
 * This class is responsible for drawing links between nodes.
 */
export default class D3LinkPainter {
  private readonly svg: SVGSVGElement;
  private readonly animationDurationMillis: number;

  constructor(svg: SVGSVGElement, animationDurationMillis: number) {
    this.svg = svg;
    this.animationDurationMillis = animationDurationMillis;
  }

  /**
   * Draws the links. The nodes must already be drawn at this point to determine the link positions.
   */
  drawLinks(root: HierarchyPointNode<SchemaNode>): void {
    const links = this.updateLinkData(root);
    this.addNewLinks(links);
    this.updateExistingLinks(links);
    this.removeLeavingLinks(links);
  }

  private updateLinkData(root: HierarchyPointNode<SchemaNode>): LinkSelection {
    return d3.select(this.svg)
      .selectAll('polyline.' + linkClass)
      .data(root.links(), l => {
        const link = (l as HierarchyPointLink<SchemaNode>);
        return link.target.data.id;
      });
  }

  private addNewLinks(links: LinkSelection): void {
    links.enter()
      .insert('polyline', 'g') // line needs to be drawn before node so that the line does not cross into the node
      .attr('class', linkClass)
      .attr('fill', 'none')
      .attr('points', link => this.calculateLinePoints(link.source, link.target))
      .attr('stroke', 'lightgrey')
      .attr('stroke-width', 2)
      .attr('shape-rendering', 'crispEdges'); // prevents overlapping lines from getting more bold
  }

  private updateExistingLinks(links: LinkSelection): void {
    links.transition()
      .duration(this.animationDurationMillis)
      .attr('points', link => this.calculateLinePoints(link.source, link.target));
  }

  private calculateLinePoints(from: HierarchyPointNode<SchemaNode>, to: HierarchyPointNode<SchemaNode>): string {
    const fromElement = d3.select(this.svg).select('#' + formatNodeId(from.data)).node();
    if (!fromElement) {
      throw Error('No from element found for link');
    }
    const elementWidth = (fromElement as SVGSVGElement).getBBox().width;
    const fromCoordinates = getCoordinates(from);
    const toCoordinates = getCoordinates(to);
    const points = [
      [fromCoordinates[0] + elementWidth, fromCoordinates[1]],
      [toCoordinates[0] - 30, fromCoordinates[1]],
      [toCoordinates[0] - 30, toCoordinates[1]],
      [toCoordinates[0], toCoordinates[1]]
    ]
    return points.join(' ');
  }

  private removeLeavingLinks(links: LinkSelection): void {
    links.exit().remove();
  }
}