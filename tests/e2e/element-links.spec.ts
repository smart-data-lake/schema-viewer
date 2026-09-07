import { expect, test } from '@playwright/test';
import {
  ACTIONS_ELEMENT,
  ELEMENT_MISSING_IN_OLDER_SCHEMA,
  NEWEST_SCHEMA,
  OLDER_SCHEMA,
  ROOT_LABEL,
  TABLE_ELEMENT,
  TOP_LEVEL_LABELS,
  UNKNOWN_PATH_PARAM
} from './fixture';
import {
  detailsPanel,
  detailsPanelTitle,
  elementLink,
  nodeLabel,
  openViewer,
  schemaSelector,
  searchAndSelect,
  selectSchema,
  shareButton
} from './viewer';

/**
 * Links to a schema element are url parameters, see src/utils/SchemaSerialization.ts. The parameters are
 * only maintained if they are already there, so a bare url stays bare.
 */
test.describe('links to schema elements', () => {
  test('a url without parameters stays without parameters when an element is selected', async ({ page }) => {
    await openViewer(page);

    await nodeLabel(page, TOP_LEVEL_LABELS.dataObjects).click();

    await expect(detailsPanelTitle(page, 'dataObjects')).toBeVisible();
    expect(new URL(page.url()).search).toBe('');
  });

  test('opens the element referenced by the path parameter', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParamInNewestSchema));

    // the ancestors of the element are expanded, so that the element becomes visible
    for (const label of TABLE_ELEMENT.labelsOnPath) {
      await expect(nodeLabel(page, label)).toBeVisible();
    }
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    await expect(detailsPanel(page)).toContainText(TABLE_ELEMENT.type);
  });

  test('the same path parameter refers to the same element in the schema it was created for', async ({ page }) => {
    await openViewer(page, elementLink(OLDER_SCHEMA, TABLE_ELEMENT.pathParamInOlderSchema));

    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    for (const label of TABLE_ELEMENT.labelsOnPath) {
      await expect(nodeLabel(page, label)).toBeVisible();
    }
  });

  test('keeps the path parameter up to date when another element is selected', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParamInNewestSchema));
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();

    await nodeLabel(page, ACTIONS_ELEMENT.label).click();

    await expect(detailsPanelTitle(page, ACTIONS_ELEMENT.name)).toBeVisible();
    await expect(page).toHaveURL(url => url.searchParams.get('path') === ACTIONS_ELEMENT.pathParamInNewestSchema);
  });

  test('keeps the schema parameter up to date when another schema is selected', async ({ page }) => {
    await openViewer(page, `/?schema=${OLDER_SCHEMA}`);
    await expect(schemaSelector(page)).toHaveText(OLDER_SCHEMA);

    await selectSchema(page, NEWEST_SCHEMA);

    await expect(page).toHaveURL(url => url.searchParams.get('schema') === NEWEST_SCHEMA);
  });

  test('a path parameter which does not point to an element is ignored', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, UNKNOWN_PATH_PARAM));

    await expect(nodeLabel(page, ROOT_LABEL)).toBeVisible();
    await expect(detailsPanel(page)).toBeHidden();
  });

  test('the share button copies a link which opens the same element', async ({ page }) => {
    await openViewer(page);
    await searchAndSelect(page, TABLE_ELEMENT.name, TABLE_ELEMENT.searchAncestors);
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();

    await shareButton(page).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());

    expect(new URL(link).searchParams.get('schema')).toBe(NEWEST_SCHEMA);
    await openViewer(page, link);
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
  });

  /**
   * The following specs describe how links should behave across schema versions. They do not pass yet:
   * a path is currently a list of child positions, which is only valid for the schema it was created for.
   * In the older fixture schema the element sits at other positions, so the same path either refers to a
   * different element or cannot be resolved at all.
   */
  test.fixme('a link to an element refers to the same element in another schema version', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParamInNewestSchema));
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();

    await openViewer(page, elementLink(OLDER_SCHEMA, TABLE_ELEMENT.pathParamInNewestSchema));

    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    for (const label of TABLE_ELEMENT.labelsOnPath) {
      await expect(nodeLabel(page, label)).toBeVisible();
    }
  });

  test.fixme('an element which no longer exists falls back to its closest ancestor', async ({ page }) => {
    await openViewer(page, elementLink(OLDER_SCHEMA, ELEMENT_MISSING_IN_OLDER_SCHEMA.pathParamInNewestSchema));

    await expect(detailsPanelTitle(page, ELEMENT_MISSING_IN_OLDER_SCHEMA.parentName)).toBeVisible();
    await expect(nodeLabel(page, ELEMENT_MISSING_IN_OLDER_SCHEMA.parentLabel)).toBeVisible();
  });

  test.fixme('the selected element is kept when the schema version is changed', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParamInNewestSchema));
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();

    await selectSchema(page, OLDER_SCHEMA);

    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    await expect(page).toHaveURL(url => url.searchParams.has('path'));
  });
});
