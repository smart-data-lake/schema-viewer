import { expect, Page, test } from '@playwright/test';
import { TOP_LEVEL_LABELS } from './fixture';
import { detailsPanelBorder, header, nodeLabel, openViewer } from './viewer';

/**
 * The horizontal gaps in the header, from left to right: before the schema dropdown, between it and the search,
 * between the search and the first button, between the buttons, and after the last button.
 */
function headerGaps(page: Page): Promise<number[]> {
  return header(page).evaluate(h => {
    const [selector, search, buttonGroup] = [...h.children];
    const elements = [selector, search, ...buttonGroup.children].map(e => e.getBoundingClientRect());
    const box = h.getBoundingClientRect();
    const edges = [box.left, ...elements.flatMap(e => [e.left, e.right]), box.right];
    return elements.concat(box).map((_, i) => Math.round(edges[2 * i + 1] - edges[2 * i]));
  });
}

test.describe('header', () => {
  test('has the same margin at both ends and the same gap between all elements', async ({ page }) => {
    await openViewer(page);
    const [first, , , betweenButtons, betweenButtons2, last] = await headerGaps(page);
    expect(first).toBe(last);
    expect(betweenButtons2).toBe(betweenButtons);
  });

  test('keeps the gaps when the details panel takes all the room it can', async ({ page }) => {
    await openViewer(page);
    await nodeLabel(page, TOP_LEVEL_LABELS.global).click();
    const border = (await detailsPanelBorder(page).boundingBox())!;
    const y = border.y + border.height / 2;
    await page.mouse.move(border.x + 1, y);
    await page.mouse.down();
    await page.mouse.move(0, y, { steps: 10 });
    await page.mouse.up();

    const [first, selectorToSearch, searchToButtons, betweenButtons, betweenButtons2, last] = await headerGaps(page);
    expect(first).toBe(last);
    expect([selectorToSearch, searchToButtons, betweenButtons2]).toEqual([betweenButtons, betweenButtons, betweenButtons]);
  });
});
