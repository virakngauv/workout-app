import { expect, test, type Page } from '@playwright/test';

const landscapeViewports = [
  { name: 'living-room-tv', width: 960, height: 540 },
  { name: 'compact-hd', width: 1024, height: 576 },
  { name: 'hd', width: 1280, height: 720 },
  { name: 'native-full-hd-tv', width: 1920, height: 1080 },
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

async function getTodayButton(page: Page) {
  const testID = await page.getByRole('button', { name: /· Today/ }).getAttribute('data-testid');
  expect(testID, 'the rendered plan should identify today').not.toBeNull();
  return page.getByTestId(testID!);
}

for (const viewport of landscapeViewports) {
  test(`major screens fit without vertical scrolling at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expectScreenFits(page, 'plan');
    const currentDayButton = await getTodayButton(page);
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
    await expect(page.getByTestId('core-note')).toContainText('Build the side plank toward 30 sec');
    await expect(page.getByTestId('core-rounds-1')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('core-rounds-2').click();
    await expect(page.getByTestId('core-rounds-2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('start-workout')).toHaveAccessibleName('Start Workout B + Core 1');

    await page.getByTestId('week-1').click();
    await page.getByTestId('day-0').click();

    await page.getByTestId('energy-gentle').click();
    await page.getByTestId('start-workout').click();
    await expectScreenFits(page, 'exercise');
    await expect(page.getByTestId('progress-summary')).toContainText('0 of 12 sets complete');
    await expect(page.getByTestId('remaining-summary')).toContainText('About');
    await expect(page.getByTestId('current-exercise-name')).toHaveText('Goblet squat');

    await page.getByRole('button', { name: 'Pause workout', exact: true }).click();
    await expectScreenFits(page, 'paused');
    await page.getByRole('button', { name: 'Resume workout' }).click();

    await page.getByTestId('session-primary').click();
    await expectScreenFits(page, 'rest');
    const recovery = page.getByTestId('recovery-countdown');
    await expect(recovery).toHaveText('0:45');
    await expect.poll(() => recovery.textContent(), { timeout: 3_000 }).not.toBe('0:45');
    await expect(recovery).toHaveText(/^0:(?:4[0-4]|[0-3]\d)$/);
    await expect(page.getByTestId('next-exercise-summary')).toContainText('Next: Romanian deadlift · Set 1 of 2');
    await page.getByTestId('session-primary').click();
    await expect(page.getByTestId('current-exercise-name')).toHaveText('Romanian deadlift');

    for (let completed = 1; completed < 12; completed += 1) {
      await page.getByTestId('session-primary').click();
      if (completed < 11) await page.getByTestId('session-primary').click();
    }
    await expectScreenFits(page, 'complete');
    await expect(page.getByTestId('progress-summary')).toContainText('12 of 12 sets complete');
    await page.getByRole('button', { name: 'Back to weekly plan' }).click();
    await expectScreenFits(page, 'plan');
  });
}

test('weekly plan and active workout remain usable on a phone-sized layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByTestId('screen-plan')).toBeVisible();
  await expect(await getTodayButton(page)).toBeFocused();

  await page.getByTestId('day-0').click();
  await page.getByTestId('start-workout').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('screen-exercise')).toBeVisible();

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await expect(page.getByTestId('session-primary')).toBeVisible();
});

test('reference progression, safety, and cardio instructions are visible', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/');
  await page.getByTestId('open-plan-guidance').click();
  await expectScreenFits(page, 'guidance');
  await expect(page.getByTestId('screen-guidance')).toContainText('Do not make up missed exercise');
  await expect(page.getByTestId('screen-guidance')).toContainText('incline 10–11, speed 2.8');
  await expect(page.getByTestId('screen-guidance')).toContainText('dizziness, chest symptoms');
  await page.getByTestId('guidance-back').click();
  await expect(page.getByTestId('screen-plan')).toBeVisible();
});

test('seconds-based exercises expose a user-controlled timer', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto('/');
  await expect(await getTodayButton(page)).toBeFocused();
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

for (const state of ['exercise', 'rest', 'paused', 'complete'] as const) {
  test(`Back returns from ${state} to the selected plan without toggling pause`, async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 540 });
    await page.goto('/');
    await expect(await getTodayButton(page)).toBeFocused();
    await page.getByTestId('week-2').click();
    await page.getByTestId('day-0').click();
    await page.getByTestId('energy-gentle').click();
    await page.getByTestId('start-workout').click();
    await expect(page).toHaveURL(/\/workout$/);
    const primary = page.getByTestId('session-primary');
    if (state === 'rest') await primary.click();
    if (state === 'paused') {
      await page.getByTestId('pause-workout').focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('resume-workout')).toBeFocused();
    }
    if (state === 'complete') {
      for (let set = 0; set < 12; set += 1) {
        await primary.click();
        if (set < 11) await primary.click();
      }
    }
    await expect(page.getByTestId(`screen-${state}`)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('screen-plan')).toBeVisible();
    await expect(page.getByTestId('screen-paused')).toHaveCount(0);
    await expect(page.getByTestId('week-2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('day-0')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('day-0')).toBeFocused();
    await expect(page.getByTestId('energy-gentle')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('start-workout').click();
    await expect(page.getByTestId('progress-summary')).toContainText('0 of 12 sets complete');
    await expect(page.getByTestId('screen-exercise')).toBeVisible();
  });
}

test('guidance uses stack Back and root preview Back leaves the plan unchanged', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-plan-guidance').click();
  await expect(page).toHaveURL(/\/guidance$/);
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('screen-plan')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('screen-plan')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

test('browser history Back also pops the workout route', async ({ page }) => {
  await page.goto('/');
  await expect(await getTodayButton(page)).toBeFocused();
  await page.getByTestId('day-0').click();
  await page.getByTestId('start-workout').click();
  await expect(page).toHaveURL(/\/workout$/);
  await page.goBack();
  await expect(page.getByTestId('screen-plan')).toBeVisible();
});


test('a direct guidance link exposes only the focused route and retains native stack Back', async ({ page }) => {
  await page.goto('/guidance');
  await expect(page.getByTestId('guidance-back')).toBeFocused();
  await expect(page.getByTestId('screen-scroll')).toHaveCount(1);
  await expect(page.getByTestId('screen-plan')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('screen-plan')).toBeVisible();
  await expect(page.getByTestId('screen-scroll')).toHaveCount(1);
});


test('an unavailable direct workout link returns to one plan route with root Back unchanged', async ({ page }) => {
  // Sunday has no workout. Fix only Date; focus and navigation timers still run.
  await page.clock.setFixedTime(new Date('2026-09-27T12:00:00Z'));
  await page.goto('/workout');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('screen-plan')).toBeVisible();
  await expect(page.getByTestId('day-6')).toBeFocused();
  await expect(page.getByTestId('screen-scroll')).toHaveCount(1);
  const backWasConsumed = await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(backWasConsumed, 'the plan should be the root, without a duplicate plan below it').toBe(false);
  await expect(page).toHaveURL(/\/$/);
});
