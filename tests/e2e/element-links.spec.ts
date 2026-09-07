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
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParam));

    // the ancestors of the element are expanded, so that the element becomes visible
    for (const label of TABLE_ELEMENT.labelsOnPath) {
      await expect(nodeLabel(page, label)).toBeVisible();
    }
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    await expect(detailsPanel(page)).toContainText(TABLE_ELEMENT.type);
  });

  test('opens the element referenced by a path which is not url encoded', async ({ page }) => {
    // the path of an element is readable, so it can also be written by hand
    await openViewer(page, `/?schema=${NEWEST_SCHEMA}&path=${TABLE_ELEMENT.pathParam}`);

    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
  });

  test('keeps the path parameter up to date when another element is selected', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParam));
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();

    await nodeLabel(page, ACTIONS_ELEMENT.label).click();

    await expect(detailsPanelTitle(page, ACTIONS_ELEMENT.name)).toBeVisible();
    await expect(page).toHaveURL(url => url.searchParams.get('path') === ACTIONS_ELEMENT.pathParam);
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
    expect(new URL(link).searchParams.get('path')).toBe(TABLE_ELEMENT.pathParam);
    await openViewer(page, link);
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
  });

  test('a link refers to the same element in another schema version', async ({ page }) => {
    // the element sits at other positions in the older schema, but has the same path of names
    await openViewer(page, elementLink(OLDER_SCHEMA, TABLE_ELEMENT.pathParam));

    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    for (const label of TABLE_ELEMENT.labelsOnPath) {
      await expect(nodeLabel(page, label)).toBeVisible();
    }
  });

  test('the selected element is kept when the schema version is changed', async ({ page }) => {
    await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.pathParam));
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();

    await selectSchema(page, OLDER_SCHEMA);

    await expect(schemaSelector(page)).toHaveText(OLDER_SCHEMA);
    await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
    await expect(page).toHaveURL(url => url.searchParams.get('path') === TABLE_ELEMENT.pathParam);
  });

  test('an element which does not exist anymore falls back to its closest ancestor', async ({ page }) => {
    await openViewer(page, elementLink(OLDER_SCHEMA, ELEMENT_MISSING_IN_OLDER_SCHEMA.pathParam));

    await expect(detailsPanelTitle(page, ELEMENT_MISSING_IN_OLDER_SCHEMA.parentName)).toBeVisible();
    await expect(nodeLabel(page, ELEMENT_MISSING_IN_OLDER_SCHEMA.parentLabel)).toBeVisible();
    // the url is corrected to the element which is shown
    await expect(page).toHaveURL(url => url.searchParams.get('path') === 'dataObjects/HiveTableDataObject');
  });

  test.describe('links created before the paths were composed of names', () => {
    test('a path of positions still opens the element in the schema it was created for', async ({ page }) => {
      await openViewer(page, elementLink(NEWEST_SCHEMA, TABLE_ELEMENT.positionPathParamInNewestSchema));

      await expect(detailsPanelTitle(page, TABLE_ELEMENT.name)).toBeVisible();
      // the url is rewritten to the path of names, so sharing it again gives a stable link
      await expect(page).toHaveURL(url => url.searchParams.get('path') === TABLE_ELEMENT.pathParam);
    });

    test('a path of positions which does not fit the schema does not break the viewer', async ({ page }) => {
      // in the older schema the positions lead into actions, which has no child at the next position
      await openViewer(page, elementLink(OLDER_SCHEMA, TABLE_ELEMENT.positionPathParamInNewestSchema));

      await expect(detailsPanelTitle(page, ACTIONS_ELEMENT.name)).toBeVisible();
    });
  });
});
