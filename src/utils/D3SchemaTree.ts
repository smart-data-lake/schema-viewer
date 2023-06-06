import { ClassNode, PropertyNode, RootNode, SchemaNode, SchemaVisitor, toVisitor } from './SchemaNode';
import * as d3 from 'd3';
import { hierarchy, HierarchyPointNode, TreeLayout } from 'd3';
import D3Zoom from './D3Zoom';
import D3NodePainter, { nodeClass, NodeSelection, SchemaTreeColors } from './D3NodePainter';
import D3LinkPainter from './D3LinkPainter';
import { formatNodeId, getCoordinates, labelVisitor, setCoordinates, swap } from './D3NodeUtils';

const animationDurationMillis = 400;
const heightPerNode = 35;

// constants for the spacing between the levels of the tree
const minLabelSpace = 30;
const labelSpaceFactor = 8;
const labelSpaceOffset = 100;

const selectedClass = 'selected';

export default class D3SchemaTree {
  private readonly schema: SchemaNode;
  private readonly svg: SVGSVGElement;
  private readonly setSelectedNode: (n: SchemaNode | null) => void;
  private readonly treeLayout: TreeLayout<SchemaNode>;
  private readonly zoom: D3Zoom;
  private readonly nodePainter: D3NodePainter;
  private readonly linkPainter: D3LinkPainter;

  constructor(schema: SchemaNode, treeSvg: SVGSVGElement, setSelectedNode: (n: SchemaNode | null) => void,
              zoom: D3Zoom, colors: SchemaTreeColors) {
    this.schema = schema;
    this.svg = treeSvg;
    this.setSelectedNode = setSelectedNode;
    this.zoom = zoom;
    this.treeLayout = d3.tree();
    this.nodePainter = new D3NodePainter(treeSvg, colors, animationDurationMillis, setSelectedNode, n => this.toggleNode(n));
    this.linkPainter = new D3LinkPainter(treeSvg, animationDurationMillis);
  }

  clearTree(): void {
    d3.select(this.svg).selectChildren().remove();
  }

  initTree(): void {
    this.setSelectedNode(null);
    this.schema.traverse(expandOnlyRootNodeVisitor);
    const root = this.drawTree();
    this.centerNode(this.getMiddleChild(root), 0);
  }

  private drawTree(): HierarchyPointNode<SchemaNode> {
    const maxNodesPerLevel = calculateMaxVisibleLevelWidth(this.schema);
    const height = maxNodesPerLevel * heightPerNode;
    this.treeLayout.size(swap(this.zoom.getViewerWidth(), height));

    const root = this.calculateHierarchy();
    this.setDistanceBetweenLevels(root);
    this.nodePainter.drawNodes(root);
    this.linkPainter.drawLinks(root);
    return root;
  }

  private calculateHierarchy(): HierarchyPointNode<SchemaNode> {
    return this.treeLayout(hierarchy(this.schema, n => n.visibleChildren));
  }

  private setDistanceBetweenLevels(root: HierarchyPointNode<SchemaNode>): void {
    const levelPositions = calculateLevelPositions(root);
    root.descendants().forEach(n => {
      setCoordinates(n, [levelPositions.get(n.depth)!, getCoordinates(n)[1]]);
    });
  }

  private getMiddleChild(node: HierarchyPointNode<SchemaNode>) {
    if (!node.children) {
      throw new Error(`Node with id ${node.id} has no children!`);
    }
    const middle = Math.floor(node.children.length / 2);
    return node.children[middle];
  }

  private centerNode(node: HierarchyPointNode<SchemaNode>, centerDurationMillis = animationDurationMillis): void {
    const nodeCoordinates = getCoordinates(node);
    this.zoom.center(nodeCoordinates[0], nodeCoordinates[1], centerDurationMillis);
  }

  /**
   * Marks the node as selected and centers it. If the node was not visible before, the tree is expanded accordingly.
   */
  focusOnNode(schemaNode: SchemaNode): void {
    let node = this.findNodeBySchemaNode(schemaNode);
    if (!node) {
      this.makeNodeVisible(schemaNode);
      this.drawTree();
      node = this.findNodeBySchemaNode(schemaNode)!;
    }
    this.unmarkPreviouslySelectedNodes();
    this.markSelectedNode(schemaNode);
    this.centerNode(node);
  }

  private findNodeBySchemaNode(schemaNode: SchemaNode): HierarchyPointNode<SchemaNode> | undefined {
    const element = this.findElementBySchemaNode(schemaNode);
    return element?.node() && element.datum();
  }

  private findElementBySchemaNode(schemaNode: SchemaNode): NodeSelection | undefined {
    // we need to help the typing here along a bit
    return d3.select(this.svg).select('#' + formatNodeId(schemaNode)) as any;
  }

  private makeNodeVisible(schemaNode: SchemaNode) {
    let parent = schemaNode.parent;
    while (parent) {
      parent.showChildren = true;
      parent = parent.parent;
    }
  }

  private unmarkPreviouslySelectedNodes(): void {
    d3.select(this.svg).selectAll(`.${nodeClass}.${selectedClass}`)
      .classed(selectedClass, false);
  }

  private markSelectedNode(schemaNode: SchemaNode): void {
    const selectedElement = this.findElementBySchemaNode(schemaNode);
    if (!selectedElement) {
      throw new Error('Could not find element containing schema node');
    }
    selectedElement.classed(selectedClass, true)
  }

  /**
   * Toggle children on node click.
   */
  private toggleNode(node: HierarchyPointNode<SchemaNode>): void {
    if (node.data.children.length === 0) {
      return;
    }
    const isOpen = node.data.showChildren;
    if (isOpen) {
      this.collapseNode(node.data);
    } else {
      this.expandNode(node.data);
    }
  }

  private expandNode(schemaNode: SchemaNode): void {
    schemaNode.showChildren = true;
    this.drawTree();
    // the original node is now outdated because the tree has been updated, so we need to get the current one
    const updatedNode = this.findNodeBySchemaNode(schemaNode);
    if (!updatedNode) {
      throw new Error('Could not find node containing schema node');
    }
    this.centerNode(this.getMiddleChild(updatedNode));
  }

  private collapseNode(schemaNode: SchemaNode): void {
    schemaNode.traverse(toVisitor(n => n.showChildren = false)); // reset the subtree starting from the node
    schemaNode.showChildren = false;
    this.drawTree();
    const updatedNode = this.findNodeBySchemaNode(schemaNode);
    if (!updatedNode) {
      throw new Error('Could not find node containing schema node');
    }
    this.centerNode(updatedNode);
  }
}

const expandOnlyRootNodeVisitor: SchemaVisitor<void> = {
  visitClassNode: (n: ClassNode) => n.showChildren = false,
  visitPropertyNode: (n: PropertyNode) => n.showChildren = false,
  visitRootNode: (n: RootNode) => n.showChildren = true
}

function calculateMaxVisibleLevelWidth(schema: SchemaNode) {
  const levelWidths = [1];

  function countVisibleChildren(n: SchemaNode, level: number): void {
    if (n.visibleChildren.length > 0) {
      if (levelWidths.length <= level + 1) {
        levelWidths.push(0);
      }

      levelWidths[level + 1] += n.visibleChildren.length;
      n.visibleChildren.forEach(d => {
        countVisibleChildren(d, level + 1);
      });
    }
  }

  countVisibleChildren(schema, 0);
  return Math.max(...levelWidths);
}

function calculateLevelPositions(root: HierarchyPointNode<SchemaNode>): Map<number, number> {
  const distanceToNextLevel = calculateDistancesBetweenLevels(root);
  const maxLevel = Math.max(...root.descendants().map(n => n.depth));
  const levelPositions = new Map<number, number>();
  levelPositions.set(0, 0);
  for (let i=1; i <= maxLevel; ++i) {
    const levelPosition = levelPositions.get(i-1)! + distanceToNextLevel.get(i-1)!;
    levelPositions.set(i, levelPosition);
  }
  return levelPositions;
}

function calculateDistancesBetweenLevels(root: HierarchyPointNode<SchemaNode>): Map<number, number> {
  const maxLabelLengths = calculateMaxVisibleLabelLengthPerLevel(root);
  return new Map(Array.from(maxLabelLengths)
    .map(([level, maxLabelLength]) => ([level, Math.max(minLabelSpace, maxLabelLength)]))
    .map(([level, labelSpace]) => ([level, labelSpaceOffset + labelSpace * labelSpaceFactor])));
}

function calculateMaxVisibleLabelLengthPerLevel(root: HierarchyPointNode<SchemaNode>): Map<number, number> {
  const maxLabelLengths = new Map<number, number>();
  root.descendants().forEach(n => {
    const labelLength = n.data.accept(labelVisitor).length;
    const currentMax = maxLabelLengths.get(n.depth);
    maxLabelLengths.set(n.depth, currentMax ? Math.max(currentMax, labelLength) : labelLength);
  })
  return maxLabelLengths;
}