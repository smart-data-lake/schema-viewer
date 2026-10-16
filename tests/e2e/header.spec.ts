import { expect, Page, test } from '@playwright/test';
import { TOP_LEVEL_LABELS } from './fixture';
import { detailsPanelBorder, header, nodeLabel, openViewer } from './viewer';

/**
 * The horizontal gaps in the header, from left to right: before the first element, between the elements - the
 * dropdowns, the search and the buttons grouped at the right end - and after the last button.
 */
function headerGaps(page: Page): Promise<number[]> {
  return header(page).evaluate(h => {
    const children = [...h.children];
    const buttonGroup = children.pop()!;
    const elements = [...children, ...buttonGroup.children].map(e => e.getBoundingClientRect());
    const box = h.getBoundingClientRect();
    const edges = [box.left, ...elements.flatMap(e => [e.left, e.right]), box.right];
    return elements.concat(box).map((_, i) => Math.round(edges[2 * i + 1] - edges[2 * i]));
  });
}

/** the horizontal gaps left and right of the search field, up to the next element on either side */
function gapsAroundSearch(page: Page): Promise<[number, number]> {
  return header(page).evaluate(h => {
    const children = [...h.children];
    const searchIndex = children.findIndex(c => c.querySelector('input[placeholder="Search"]'));
    const buttonGroup = children[children.length - 1];
    const [before, search, after] = [children[searchIndex - 1], children[searchIndex], buttonGroup.children[0]]
      .map(e => e.getBoundingClientRect());
    return [Math.round(search.left - before.right), Math.round(after.left - search.right)];
  });
}

test.describe('header', () => {
  test('centers the search between the elements on its left and right', async ({ page }) => {
    await openViewer(page);
    const [left, right] = await gapsAroundSearch(page);
    expect(left).toBeGreaterThan(0);
    expect(left).toBe(right);
  });

  test('has the same margin at both ends and the same gap between all elements', async ({ page }) => {
    await openViewer(page);
    const gaps = await headerGaps(page);
    const [first, last] = [gaps[0], gaps[gaps.length - 1]];
    const [betweenButtons, betweenButtons2] = gaps.slice(-3, -1);
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

    const gaps = await headerGaps(page);
    const [first, last] = [gaps[0], gaps[gaps.length - 1]];
    const betweenElements = gaps.slice(1, -1);
    expect(first).toBe(last);
    expect(betweenElements).toEqual(betweenElements.map(() => betweenElements[0]));
  });
});
