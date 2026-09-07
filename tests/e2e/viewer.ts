import { expect, Locator, Page } from '@playwright/test';
import { ROOT_LABEL } from './fixture';

/**
 * Locators and interactions for the schema viewer, shared by the specs.
 *
 * The graph is an SVG drawn by d3, so its nodes are addressed by their rendered label
 * (see labelVisitor in src/utils/D3NodeUtils.ts) instead of by a role.
 * The buttons of the header and of the graph controls have no accessible name, so they are addressed by
 * the test id which @mui/icons-material puts on the rendered icon.
 */

/** the label of a graph node, which selects the node when clicked */
export const nodeLabel = (page: Page, label: string): Locator => page.getByText(label, { exact: true });

/** the circle of a graph node, which expands or collapses the node when clicked */
export const nodeCircle = (page: Page, label: string): Locator =>
  page.locator('g.node').filter({ has: nodeLabel(page, label) }).locator('circle');

export const detailsPanel = (page: Page): Locator => page.getByTestId('details-panel');

/** the name of the element the details panel currently shows */
export const detailsPanelTitle = (page: Page, name: string): Locator =>
  detailsPanel(page).getByText(name, { exact: true });

/** the schema dropdown, which is a button and not the only combobox in the header */
export const schemaSelector = (page: Page): Locator => page.locator('button[role="combobox"]');

export const searchField = (page: Page): Locator => page.getByPlaceholder('Search');

/** the group holding the whole tree, which carries the zoom transform */
export const treeGroup = (page: Page): Locator => page.locator('svg > g').first();

/**
 * Opens the viewer and waits until the schema is loaded and the tree is drawn. Interacting earlier is
 * pointless: the schema is loaded asynchronously and the search is rerendered once it arrives, which
 * discards whatever has been typed into it before.
 */
export async function openViewer(page: Page, url = '/'): Promise<void> {
  await page.goto(url);
  await expect(nodeLabel(page, ROOT_LABEL)).toBeVisible();
}

export async function selectSchema(page: Page, schemaName: string): Promise<void> {
  await schemaSelector(page).click();
  await page.getByRole('option', { name: schemaName, exact: true }).click();
}

/**
 * Selects an element through the search field. The ancestors are needed to identify the element,
 * because the same name can occur in several places in the schema.
 */
export async function searchAndSelect(page: Page, name: string, ancestors: string): Promise<void> {
  await searchField(page).fill(name);
  await page.getByRole('option')
    .filter({ has: page.getByText(ancestors, { exact: true }) })
    .click();
}

export function graphControlButton(page: Page, control: 'zoomIn' | 'zoomOut' | 'reset' | 'legend'): Locator {
  const icons = {zoomIn: 'AddCircleIcon', zoomOut: 'RemoveCircleIcon', reset: 'RefreshIcon', legend: 'InfoIcon'};
  return page.getByTestId(icons[control]);
}

export const shareButton = (page: Page): Locator => page.getByTestId('ShareIcon');

export const detailsPanelToggleButton = (page: Page, currentlyOpen: boolean): Locator =>
  page.getByTestId(currentlyOpen ? 'KeyboardDoubleArrowRightIcon' : 'KeyboardDoubleArrowLeftIcon');

export function elementLink(schemaName: string, pathParam: string): string {
  return `/?schema=${schemaName}&path=${encodeURIComponent(pathParam)}`;
}
