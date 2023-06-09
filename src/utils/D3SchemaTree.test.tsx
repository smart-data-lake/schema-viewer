import { render, screen } from '@testing-library/react';
import D3SchemaTree from './D3SchemaTree';
import { PropertyNode, RootNode, SchemaNode } from './SchemaNode';
import D3Zoom from './D3Zoom';
import { SchemaTreeColors } from './D3NodePainter';
import userEvent from '@testing-library/user-event';

test('draws only root and first level nodes', async () => {
  const schema = createDummySchema();
  const zoom = createMockZoom();
  const svg = setupSvg();
  const schemaTree = new D3SchemaTree(schema, svg, () => {}, zoom, dummyColors);

  schemaTree.initTree();

  expect(screen.getByText('schema{ }')).toBeInTheDocument();
  expect(screen.getByText('property1(string)')).toBeInTheDocument();
  expect(screen.queryByText('property2(string)')).not.toBeInTheDocument();
});

test('focusOnNode expands tree so that node is visible', async () => {
  const schema = createDummySchema();
  const zoom = createMockZoom();
  const svg = setupSvg();
  const schemaTree = new D3SchemaTree(schema, svg, () => {}, zoom, dummyColors);
  schemaTree.initTree();

  // eslint-disable-next-line testing-library/no-node-access
  const node = schema.children[0].children[0]; // only first level children are visible at this moment, so this node is not
  schemaTree.focusOnNode(node);

  expect(screen.getByText('schema{ }')).toBeInTheDocument();
  expect(screen.getByText('property1(string)')).toBeInTheDocument();
  expect(screen.getByText('property2(string)')).toBeInTheDocument();
});

test('node is expanded when clicking on circle', async () => {
  const schema = createDummySchema();
  const zoom = createMockZoom();
  const svg = setupSvg();
  const schemaTree = new D3SchemaTree(schema, svg, () => {}, zoom, dummyColors);
  schemaTree.initTree();

  // eslint-disable-next-line testing-library/no-node-access
  const circle = screen.getByText('property1(string)').parentElement!.querySelector('circle')!;
  await userEvent.click(circle);

  expect(screen.getByText('schema{ }')).toBeInTheDocument();
  expect(screen.getByText('property1(string)')).toBeInTheDocument();
  expect(screen.getByText('property2(string)')).toBeInTheDocument();
});

test('selects node when text is clicked', async () => {
  const schema = createDummySchema();
  const zoom = createMockZoom();
  const svg = setupSvg();
  let selectedNode: SchemaNode | null = null;
  const setSelectedNode = (n: SchemaNode | null) => selectedNode = n;
  const schemaTree = new D3SchemaTree(schema, svg, setSelectedNode, zoom, dummyColors);
  schemaTree.initTree();

  const nodeText = screen.getByText('schema{ }');
  await userEvent.click(nodeText);

  expect(selectedNode).toBe(schema);
});

test('clearTree removes all nodes', async () => {
  const schema = createDummySchema();
  const zoom = createMockZoom();
  const svg = setupSvg();
  const schemaTree = new D3SchemaTree(schema, svg, () => {}, zoom, dummyColors);
  schemaTree.initTree();

  schemaTree.clearTree();

  expect(screen.queryByText('schema{ }')).not.toBeInTheDocument();
});

function createDummySchema(): SchemaNode {
  const root = new RootNode(0);
  const property1 = new PropertyNode(1, 'property1', 'string', false, false);
  root.addChild(property1);
  const property2 = new PropertyNode(2, 'property2', 'string', false, false);
  property1.addChild(property2);
  return root;
}

function createMockZoom(): D3Zoom {
  return {
    center: () => {},
    getViewerHeight: () => 100,
    getViewerWidth: () => 100,
    resetScale: () => {},
    zoomOut: () => {},
    zoomIn: () => {}
  } as any;
}

function setupSvg(): SVGSVGElement {
  render(<svg data-testid='test-svg' />);
  return screen.getByTestId('test-svg') as any;
}

const dummyColors: SchemaTreeColors = {
  circleBorderColor: '',
  collapsedCircleColor: '',
  deprecatedTextColor: '',
  expandedCircleColor: ''
}