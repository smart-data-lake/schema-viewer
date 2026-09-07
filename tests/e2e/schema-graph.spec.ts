import { expect, test } from '@playwright/test';
import {
  GLOBAL_FIRST_PROPERTY_LABEL,
  HIVE_TABLE_CONNECTION,
  HIVE_TABLE_DATA_OBJECT,
  NEWEST_SCHEMA,
  OLDER_SCHEMA,
  ROOT_LABEL,
  TOP_LEVEL_LABELS
} from './fixture';
import {
  detailsPanel,
  detailsPanelTitle,
  detailsPanelToggleButton,
  graphControlButton,
  nodeCircle,
  nodeLabel,
  openViewer,
  schemaSelector,
  searchAndSelect,
  searchField,
  selectSchema,
  treeGroup
} from './viewer';

test.describe('schema graph', () => {
  test('shows the top level of the newest schema, with the elements below it collapsed', async ({ page }) => {
    await openViewer(page);

    await expect(schemaSelector(page)).toHaveText(NEWEST_SCHEMA);
    await expect(nodeLabel(page, ROOT_LABEL)).toBeVisible();
    for (const label of Object.values(TOP_LEVEL_LABELS)) {
      await expect(nodeLabel(page, label)).toBeVisible();
    }
    await expect(nodeLabel(page, GLOBAL_FIRST_PROPERTY_LABEL)).toBeHidden();
  });

  test('expands and collapses an element when its circle is clicked', async ({ page }) => {
    await openViewer(page);

    await nodeCircle(page, TOP_LEVEL_LABELS.connections).click();
    await expect(nodeLabel(page, HIVE_TABLE_CONNECTION.label)).toBeVisible();

    await nodeCircle(page, TOP_LEVEL_LABELS.connections).click();
    await expect(nodeLabel(page, HIVE_TABLE_CONNECTION.label)).toBeHidden();
  });

  test('shows the details of an element when its label is clicked', async ({ page }) => {
    await openViewer(page);

    await nodeLabel(page, TOP_LEVEL_LABELS.dataObjects).click();

    await expect(detailsPanelTitle(page, 'dataObjects')).toBeVisible();
    // the type details of an element with class children are inferred from their common base class
    await expect(detailsPanel(page)).toContainText('mapOf: DataObject');
    await expect(detailsPanel(page)).toContainText('No description provided.');
  });

  test('keeps the selected element while the details panel is closed', async ({ page }) => {
    await openViewer(page);
    await nodeLabel(page, TOP_LEVEL_LABELS.dataObjects).click();
    await expect(detailsPanelTitle(page, 'dataObjects')).toBeVisible();

    await detailsPanelToggleButton(page, true).click();
    await expect(detailsPanel(page)).toBeHidden();

    await detailsPanelToggleButton(page, false).click();
    await expect(detailsPanelTitle(page, 'dataObjects')).toBeVisible();
  });

  test('the search selects an element which is not visible yet', async ({ page }) => {
    await openViewer(page);
    await expect(nodeLabel(page, HIVE_TABLE_DATA_OBJECT.label)).toBeHidden();

    await searchAndSelect(page, HIVE_TABLE_DATA_OBJECT.name, HIVE_TABLE_DATA_OBJECT.searchAncestors);

    await expect(nodeLabel(page, HIVE_TABLE_DATA_OBJECT.label)).toBeVisible();
    await expect(detailsPanelTitle(page, HIVE_TABLE_DATA_OBJECT.name)).toBeVisible();
    await expect(detailsPanel(page)).toContainText(HIVE_TABLE_DATA_OBJECT.type);
    await expect(detailsPanel(page)).toContainText(HIVE_TABLE_DATA_OBJECT.descriptionContains);
  });

  test('the search needs at least two characters', async ({ page }) => {
    await openViewer(page);

    await searchField(page).fill('t');
    await expect(page.getByText('No element found or not enough characters provided.')).toBeVisible();

    await searchField(page).fill(HIVE_TABLE_DATA_OBJECT.name);
    await expect(page.getByRole('option').first()).toBeVisible();
  });

  test('the reset button collapses the tree and clears the selection', async ({ page }) => {
    await openViewer(page);
    await nodeCircle(page, TOP_LEVEL_LABELS.connections).click();
    await nodeLabel(page, HIVE_TABLE_CONNECTION.label).click();
    await expect(detailsPanelTitle(page, HIVE_TABLE_CONNECTION.name)).toBeVisible();

    await graphControlButton(page, 'reset').click();

    await expect(nodeLabel(page, HIVE_TABLE_CONNECTION.label)).toBeHidden();
    await expect(detailsPanel(page)).toBeHidden();
  });

  test('the zoom buttons scale the tree', async ({ page }) => {
    await openViewer(page);
    await expect(treeGroup(page)).toHaveAttribute('transform', /scale\(1\)/);

    await graphControlButton(page, 'zoomIn').click();
    await expect(treeGroup(page)).toHaveAttribute('transform', /scale\(1\.2\)/);

    await graphControlButton(page, 'zoomOut').click();
    await expect(treeGroup(page)).toHaveAttribute('transform', /scale\(1\)/);
  });

  test('the legend can be shown', async ({ page }) => {
    await openViewer(page);
    await expect(page.getByText('Legend')).toBeHidden();

    await graphControlButton(page, 'legend').click();

    await expect(page.getByText('Legend')).toBeVisible();
  });

  test('another schema version can be selected', async ({ page }) => {
    await openViewer(page);

    await selectSchema(page, OLDER_SCHEMA);

    await expect(schemaSelector(page)).toHaveText(OLDER_SCHEMA);
    await expect(nodeLabel(page, TOP_LEVEL_LABELS.dataObjects)).toBeVisible();
    // connections only exists in the newest of the two fixture schemas
    await expect(nodeLabel(page, TOP_LEVEL_LABELS.connections)).toBeHidden();
  });
});
