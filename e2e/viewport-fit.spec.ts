import { expect, test, type Page } from '@playwright/test';

const landscapeViewports = [
  { name: 'living-room-tv', width: 960, height: 540 },
  { name: 'compact-hd', width: 1024, height: 576 },
  { name: 'hd', width: 1280, height: 720 },
] as const;

async function expectScreenFits(page: Page, state: string) {
  const frame = page.getByTestId('screen-scroll');
  const screen = page.getByTestId(`screen-${state}`);
  await expect(screen).toBeVisible();

  const metrics = await frame.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  expect(metrics.scrollHeight, `${state} scroll height at ${metrics.viewportHeight}px`).toBeLessThanOrEqual(metrics.clientHeight + 1);

  const bounds = await screen.boundingBox();
  expect(bounds, `${state} must have measurable bounds`).not.toBeNull();
  expect(bounds!.y, `${state} starts above the viewport`).toBeGreaterThanOrEqual(-1);
  expect(bounds!.y + bounds!.height, `${state} extends below the viewport`).toBeLessThanOrEqual(metrics.viewportHeight + 1);
}

for (const viewport of landscapeViewports) {
  test(`major screens fit without vertical scrolling at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expectScreenFits(page, 'home');

    await page.getByTestId('view-plan').click();
    await expectScreenFits(page, 'plan');
    await page.getByRole('button', { name: 'Back' }).click();

    await page.getByTestId('energy-gentle').click();
    await page.getByTestId('start-workout').click();
    await expectScreenFits(page, 'exercise');

    await page.keyboard.press('Escape');
    await expectScreenFits(page, 'paused');
    await page.getByRole('button', { name: 'Resume workout' }).click();

    await page.getByTestId('session-primary').click();
    await expectScreenFits(page, 'rest');
    await page.getByTestId('session-primary').click();

    for (let exercise = 1; exercise < 7; exercise += 1) {
      await page.getByTestId('session-primary').click();
      if (exercise < 6) await page.getByTestId('session-primary').click();
    }
    await expectScreenFits(page, 'complete');
  });
}
