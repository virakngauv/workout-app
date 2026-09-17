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

    await expectScreenFits(page, 'plan');
    const currentDay = (new Date().getDay() + 6) % 7;
    const currentDayButton = page.getByTestId(`day-${currentDay}`);
    await expect(currentDayButton).toHaveAttribute('aria-pressed', 'true');
    await expect(currentDayButton).toBeFocused();

    await page.getByTestId('day-6').click();
    await expect(page.getByTestId('rest-day-state')).toBeVisible();
    await expect(page.getByTestId('start-workout')).toHaveCount(0);

    const weekTwo = page.getByTestId('week-2');
    await weekTwo.click();
    await page.waitForTimeout(150);
    await expect(weekTwo).toBeFocused();
    await expect(currentDayButton).toHaveAccessibleName(/Current weekday/);
    await expect(currentDayButton).not.toHaveAccessibleName(/Today/);
    await currentDayButton.click();
    await expect(page.getByTestId('selected-day-label')).toContainText('CURRENT WEEKDAY');
    await page.getByTestId('day-3').click();
    await expect(page.getByTestId('core-plan')).toContainText('Core 1: Dead bug · Side plank');
    await expect(page.getByTestId('core-plan')).not.toContainText('Forearm plank');
    await expect(page.getByTestId('start-workout')).toHaveAccessibleName('Start Workout B + Core 1');

    await page.getByTestId('week-1').click();
    await page.getByTestId('day-0').click();

    await page.getByTestId('energy-gentle').click();
    await page.getByTestId('start-workout').click();
    await expectScreenFits(page, 'exercise');
    await expect(page.getByTestId('progress-summary')).toContainText('0 of 6 sets complete');
    await expect(page.getByTestId('remaining-summary')).toContainText('About');
    await expect(page.getByTestId('current-exercise-name')).toHaveText('Goblet squat');

    await page.keyboard.press('Escape');
    await expectScreenFits(page, 'paused');
    await page.getByRole('button', { name: 'Resume workout' }).click();

    await page.getByTestId('session-primary').click();
    await expectScreenFits(page, 'rest');
    await expect(page.getByTestId('next-exercise-summary')).toContainText('Next: Romanian deadlift · Set 1 of 1');
    await page.getByTestId('session-primary').click();
    await expect(page.getByTestId('current-exercise-name')).toHaveText('Romanian deadlift');

    for (let exercise = 1; exercise < 6; exercise += 1) {
      await page.getByTestId('session-primary').click();
      if (exercise < 5) await page.getByTestId('session-primary').click();
    }
    await expectScreenFits(page, 'complete');
    await expect(page.getByTestId('progress-summary')).toContainText('6 of 6 sets complete');
    await page.getByRole('button', { name: 'Back to weekly plan' }).click();
    await expectScreenFits(page, 'plan');
  });
}

test('weekly plan and active workout remain usable on a phone-sized layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('screen-plan')).toBeVisible();
  const currentDay = (new Date().getDay() + 6) % 7;
  await expect(page.getByTestId(`day-${currentDay}`)).toBeFocused();

  await page.getByTestId('day-0').click();
  await page.getByTestId('start-workout').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('screen-exercise')).toBeVisible();

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await expect(page.getByTestId('session-primary')).toBeVisible();
});

test('seconds-based exercises expose a user-controlled timer', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/');
  const currentDay = (new Date().getDay() + 6) % 7;
  await expect(page.getByTestId(`day-${currentDay}`)).toBeFocused();
  await page.getByTestId('week-2').click();
  await page.getByTestId('day-3').click();
  const gentle = page.getByTestId('energy-gentle');
  await gentle.focus();
  await expect(gentle).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('start-workout').focus();
  await page.keyboard.press('Enter');

  const primary = page.getByTestId('session-primary');
  for (let exercise = 0; exercise < 6; exercise += 1) {
    await primary.click();
    await primary.click();
  }

  await expect(page.getByTestId('current-exercise-name')).toHaveText('Side plank');
  await expect(page.getByTestId('exercise-timer')).toContainText('TIMER · EACH SIDE');
  const countdown = page.getByTestId('exercise-timer-countdown');
  const toggle = page.getByTestId('exercise-timer-toggle');
  await expect(countdown).toHaveText('0:15');
  await expect(toggle).toHaveAccessibleName('Start timer');
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Pause timer');
  await expect(countdown).toHaveText('0:14', { timeout: 2_000 });
  await toggle.click();
  await page.waitForTimeout(1_100);
  await expect(countdown).toHaveText('0:14');
  await page.getByTestId('exercise-timer-reset').click();
  await expect(countdown).toHaveText('0:15');
});
