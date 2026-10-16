import { expect, test } from '@playwright/test';
import { NEWEST_SCHEMA, OLDER_SCHEMA, SUB_FEED_TYPES, TOP_LEVEL_LABELS } from './fixture';
import {
  detailsPanel,
  detailsPanelTitle,
  nodeCircle,
  nodeLabel,
  openViewer,
  searchAndSelect,
  searchField,
  selectSchema,
  selectSubFeedTypes,
  subFeedTypeSelector
} from './viewer';

const {
  filterLabel, supportingDataObject, unsupportingDataObject, unsupportingDataObjectProperty, action, ignoredLabels,
  filterOptions
} = SUB_FEED_TYPES;

test.describe('SubFeed types', () => {
  test('of an Action are shown as chips in the details panel', async ({ page }) => {
    await openViewer(page);
    await searchAndSelect(page, action.name, action.searchAncestors);

    for (const label of action.labels) {
      await expect(detailsPanel(page).getByText(label, { exact: true })).toBeVisible();
    }
    for (const label of ignoredLabels) {
      await expect(detailsPanel(page).getByText(label, { exact: true })).toHaveCount(0);
    }
  });

  test('filter offers the SubFeed types of the schema except the ignored ones', async ({ page }) => {
    await openViewer(page);
    await subFeedTypeSelector(page).click();

    await expect(page.getByRole('option')).toHaveText(filterOptions);
  });

  test('of a DataObject are shown separately for reading and writing', async ({ page }) => {
    await openViewer(page);
    await searchAndSelect(page, supportingDataObject.name, supportingDataObject.searchAncestors);

    await expect(detailsPanel(page).getByText('Read', { exact: true })).toBeVisible();
    await expect(detailsPanel(page).getByText('Write', { exact: true })).toBeVisible();
    await expect(detailsPanel(page).getByText(filterLabel, { exact: true })).toHaveCount(2);
  });

  test('filter hides the DataObjects which do not support the selected type, in the graph and the search', async ({ page }) => {
    await openViewer(page);
    await nodeCircle(page, TOP_LEVEL_LABELS.dataObjects).click();
    await expect(nodeLabel(page, unsupportingDataObject.label)).toBeVisible();

    await selectSubFeedTypes(page, filterLabel);

    await expect(nodeLabel(page, unsupportingDataObject.label)).toHaveCount(0);
    await expect(nodeLabel(page, supportingDataObject.label)).toBeVisible();
    await searchField(page).fill(unsupportingDataObjectProperty.name);
    await expect(page.getByText(unsupportingDataObjectProperty.searchAncestors, { exact: true })).toHaveCount(0);
  });

  test('filter selects the closest visible ancestor when the selected element is hidden', async ({ page }) => {
    await openViewer(page);
    await searchAndSelect(page, unsupportingDataObjectProperty.name, unsupportingDataObjectProperty.searchAncestors);

    await selectSubFeedTypes(page, filterLabel);

    await expect(detailsPanelTitle(page, 'dataObjects')).toBeVisible();
  });

  test('filter is hidden and does not hide anything in a schema version without SubFeed types', async ({ page }) => {
    await openViewer(page);
    await selectSubFeedTypes(page, filterLabel);

    await selectSchema(page, OLDER_SCHEMA);
    await nodeCircle(page, TOP_LEVEL_LABELS.dataObjects).click();

    await expect(nodeLabel(page, unsupportingDataObject.label)).toBeVisible();
    await expect(subFeedTypeSelector(page)).toHaveCount(0);
  });

  test('filter is kept when switching back from a schema version without SubFeed types', async ({ page }) => {
    await openViewer(page);
    await selectSubFeedTypes(page, filterLabel);
    await selectSchema(page, OLDER_SCHEMA);
    await expect(subFeedTypeSelector(page)).toHaveCount(0);

    await selectSchema(page, NEWEST_SCHEMA);
    await nodeCircle(page, TOP_LEVEL_LABELS.dataObjects).click();

    await expect(subFeedTypeSelector(page)).toContainText(filterLabel);
    await expect(nodeLabel(page, supportingDataObject.label)).toBeVisible();
    await expect(nodeLabel(page, unsupportingDataObject.label)).toHaveCount(0);
  });
});
