import { expect, test } from '@playwright/test';
import { TOP_LEVEL_LABELS } from './fixture';
import { detailsPanel, detailsPanelBorder, detailsPanelTitle, nodeLabel, openViewer } from './viewer';

test.describe('details panel', () => {
  test('is resized by dragging its border, without selecting any text on the way', async ({ page }) => {
    await openViewer(page);
    await nodeLabel(page, TOP_LEVEL_LABELS.global).click();
    await expect(detailsPanelTitle(page, 'global')).toBeVisible();
    const widthBefore = (await detailsPanel(page).boundingBox())!.width;

    // drag across the panel text and back over the graph, which is where a text selection would grow
    const border = (await detailsPanelBorder(page).boundingBox())!;
    const y = border.y + border.height / 2;
    await page.mouse.move(border.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(border.x + 100, y, { steps: 10 });
    await page.mouse.move(border.x - 150, y, { steps: 10 });
    await page.mouse.up();

    expect((await detailsPanel(page).boundingBox())!.width).toBeCloseTo(widthBefore + 150, -1);
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('');
  });

  test('is not dragged wider than the room next to the graph header, so that the page does not scroll', async ({ page }) => {
    await openViewer(page);
    await nodeLabel(page, TOP_LEVEL_LABELS.global).click();

    const border = (await detailsPanelBorder(page).boundingBox())!;
    const y = border.y + border.height / 2;
    await page.mouse.move(border.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(0, y, { steps: 10 });

    const viewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight, clientHeight: document.documentElement.clientHeight
    }));
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
    expect(viewport.scrollHeight).toBe(viewport.clientHeight);

    // the panel follows the mouse back right away, although it was dragged further than it could grow
    const widestBorder = (await detailsPanelBorder(page).boundingBox())!;
    const widestWidth = (await detailsPanel(page).boundingBox())!.width;
    await page.mouse.move(widestBorder.x + 50, y, { steps: 5 });
    await page.mouse.up();
    expect((await detailsPanel(page).boundingBox())!.width).toBeCloseTo(widestWidth - 50, -1);
  });
});
