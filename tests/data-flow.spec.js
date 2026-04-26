// Data-flow audit — verify edits in one tab actually propagate to others.
//
// IMPORTANT pattern: writing to localStorage from inside the running page
// races with App.jsx's 500ms debounced saveState — the app can overwrite
// our mutation before the reload reads it. Instead we always re-seed via
// addInitScript before goto/reload so the seed wins.

import { test, expect } from '@playwright/test';

const REST_DAY = { type:'rest', focus:'Rest', exIds:[], rest:true, restNote:'Recover.' };
const SEVEN_RESTS = Array.from({ length: 7 }, () => ({ ...REST_DAY }));

const baseProfile = {
  days: 4, height: 180, hUnit: 'cm', weight: 78, wUnit: 'kg',
  birthday: '2003-04-26', age: 22, sex: 'm', sport: 'soccer', cardioMin: 90,
  weightLog: [{ date: '2026-04-26', kg: 78 }],
};

const stateOf = (override = {}) => ({
  onboarded: true,
  theme: 'dark',
  profile: { ...baseProfile, ...(override.profile || {}) },
  days: override.days || SEVEN_RESTS,
  cardioDays: override.cardioDays || Array.from({ length: 7 }, () => ({ items: [] })),
  locked: override.locked || [false, false, false, false, false, false, false],
  splitsByType: override.splitsByType || {},
});

// Re-seed before next navigation. addInitScript runs on every navigation.
const reseed = (page, override) => page.addInitScript(s => {
  try {
    // Seed v4 (the live key) and clear any earlier-version stragglers so
    // a previous goto's v4 write doesn't overwrite this seed on reload.
    localStorage.setItem('splitlift-state-v4', JSON.stringify(s));
    localStorage.removeItem('splitlift-state-v3');
    localStorage.removeItem('splitlift-state-v2');
    localStorage.removeItem('splitlift-state-v1');
  } catch {}
}, stateOf(override));

const goTab = async (page, name) => {
  await page.locator('.bn-item').filter({ hasText: name }).first().click();
  await page.waitForTimeout(300);
};

const intIn = async (loc) => {
  const txt = await loc.innerText();
  return parseInt(txt.match(/\d+/)?.[0] || '0', 10);
};

test.describe('Data flow audit', () => {
  test('A1 Splits → Schedule sync', async ({ page }) => {
    await reseed(page, {
      days: [
        { type:'push', focus:'Push', exIds:['bench','ohp'] },
        ...Array.from({ length: 6 }, () => ({ ...REST_DAY })),
      ],
      splitsByType: { push: ['bench', 'ohp'] },
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await goTab(page, 'Schedule');
    const monCard = page.locator('.sched-day-card').first();
    await expect(monCard).toContainText(/Bench Press|PUSH/i);

    await goTab(page, 'Splits');
    const splitsList = page.locator('.st-list .st-ex');
    await expect(splitsList).toHaveCount(2);
  });

  test('A2 Schedule → Body coverage', async ({ page }) => {
    // Empty schedule → chest = 0
    await reseed(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Body');
    const chestCell = page.locator('.b2-cov-grid .sl-card').filter({ hasText: /^Chest/i }).first();
    await expect(chestCell).toBeVisible();
    const initial = await intIn(chestCell);
    expect(initial).toBe(0);

    // Re-seed with a populated push day
    await reseed(page, {
      days: [
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        ...Array.from({ length: 6 }, () => ({ ...REST_DAY })),
      ],
      splitsByType: { push: ['bench','ohp','fly','tri'] },
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Body');
    const after = await intIn(page.locator('.b2-cov-grid .sl-card').filter({ hasText: /^Chest/i }).first());
    expect(after, `chest coverage should rise from ${initial}, got ${after}`).toBeGreaterThan(initial);
  });

  test('A3 Schedule → Dashboard SMS updates', async ({ page }) => {
    await reseed(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Dashboard');
    const initialSms = await intIn(page.locator('.dw-sms-num').first());

    await reseed(page, {
      days: [
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        { type:'pull', focus:'Pull', exIds:['pullup','row','face','curlbb'] },
        { type:'legs', focus:'Legs', exIds:['squat','rdl','curl','calf'] },
        { ...REST_DAY },
        { type:'push', focus:'Push', exIds:['incline','dbpress','lat','overtri'] },
        { ...REST_DAY },
        { ...REST_DAY },
      ],
      splitsByType: {
        push: ['bench','ohp','fly','tri'],
        pull: ['pullup','row','face','curlbb'],
        legs: ['squat','rdl','curl','calf'],
      },
      cardioDays: [
        { items: [] }, { items: ['c-z2-30'] }, { items: [] },
        { items: ['c-bike'] }, { items: [] }, { items: ['c-z2-30'] }, { items: [] },
      ],
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Dashboard');
    const after = await intIn(page.locator('.dw-sms-num').first());
    expect(after, `SMS should rise from ${initialSms}, got ${after}`).toBeGreaterThan(initialSms);
  });

  // v11.5: General was merged into Dashboard. Cards live in the
  // About-me section at the bottom of Dashboard. Helper scrolls there.
  const goAboutMe = async (page) => {
    await goTab(page, 'Dashboard');
    await page.evaluate(() => {
      const pane = document.querySelector('.screen-body');
      if (pane) pane.scrollTop = 99999;
    });
    await page.waitForTimeout(300);
  };

  test('A4 Weight → BMR/TDEE updates (About me on Dashboard)', async ({ page }) => {
    await reseed(page, { profile: { weight: 70, weightLog: [{ date: '2026-04-26', kg: 70 }] } });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goAboutMe(page);

    const calsCard = page.locator('.sl-card-eyebrow', { hasText: /CALORIES/i }).locator('xpath=..');
    const calsValue = calsCard.locator('.sl-card-value').first();
    await expect(calsValue).toBeVisible();
    const initialCals = await intIn(calsValue);

    await reseed(page, { profile: { weight: 100, weightLog: [{ date: '2026-04-26', kg: 100 }] } });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goAboutMe(page);
    const after = await intIn(page.locator('.sl-card-eyebrow', { hasText: /CALORIES/i }).locator('xpath=..').locator('.sl-card-value').first());
    expect(after, `TDEE should rise from ${initialCals} after weight 70→100, got ${after}`).toBeGreaterThan(initialCals);
  });

  test('A5 Birthday → Age + Max HR via Tanaka (About me)', async ({ page }) => {
    await reseed(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goAboutMe(page);

    const ageVal = page.locator('.sl-card-eyebrow', { hasText: /^AGE$/i }).locator('xpath=..').locator('.sl-card-value').first();
    const hrVal  = page.locator('.sl-card-eyebrow', { hasText: /MAX HR/i }).locator('xpath=..').locator('.sl-card-value').first();
    await expect(ageVal).toBeVisible();
    await expect(hrVal).toBeVisible();
    const initialAge = await intIn(ageVal);
    const initialHr  = await intIn(hrVal);

    await reseed(page, { profile: { birthday: '1980-01-01', age: undefined } });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goAboutMe(page);
    const ageAfter = await intIn(page.locator('.sl-card-eyebrow', { hasText: /^AGE$/i }).locator('xpath=..').locator('.sl-card-value').first());
    const hrAfter  = await intIn(page.locator('.sl-card-eyebrow', { hasText: /MAX HR/i }).locator('xpath=..').locator('.sl-card-value').first());

    expect(ageAfter, `age should rise from ${initialAge}, got ${ageAfter}`).toBeGreaterThan(initialAge);
    expect(hrAfter,  `max HR should fall from ${initialHr}, got ${hrAfter}`).toBeLessThan(initialHr);
  });

  test('A7 Preset detail view — Use / Duplicate / Delete (custom only)', async ({ page }) => {
    // v10 Issue 6: pre-seed a custom preset, then verify the simpler
    // tap-card → detail-modal flow exposes the right actions.
    await reseed(page, {
      profile: {
        customPresets: [{
          id: 'custom_test1',
          name: 'My Custom PPL',
          sub: 'A custom 4-day push/pull split',
          sourcePresetId: 'classic_ppl',
          createdAt: Date.now(),
          days: ['push','rest','pull','legs','push','pull','rest'],
          splitsByType: {},
        }],
      },
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // v11.5: Presets moved Schedule → Splits (button is data-testid'd).
    await goTab(page, 'Splits');
    await page.getByTestId('splits-presets-btn').click();
    await page.waitForTimeout(300);

    // Custom preset shows under its own section header
    await expect(page.getByText('Your custom presets')).toBeVisible();
    await expect(page.locator('.ps-card-name').filter({ hasText: 'My Custom PPL' })).toBeVisible();

    // Tap the custom card — detail view shows Use / Duplicate / Delete
    await page.locator('.ps-card-name').filter({ hasText: 'My Custom PPL' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /^Use this$/i })).toBeVisible();
    // v11.6: Duplicate is now an icon button with aria-label
    await expect(page.getByRole('button', { name: /Duplicate/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Delete$/i })).toBeVisible();

    // Close detail
    await page.locator('.ps-sheet-narrow .ip-x').click({ force: true });
    await page.waitForTimeout(200);

    // Tap a built-in card — Delete should NOT appear
    await page.locator('.ps-card-name').nth(1).click();   // first built-in
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /^Use this$/i })).toBeVisible();
    // v11.6: Duplicate is now an icon button with aria-label
    await expect(page.getByRole('button', { name: /Duplicate/i })).toBeVisible();
    expect(await page.getByRole('button', { name: /^Delete$/i }).count()).toBe(0);
  });

  test('A8 Health Score reflects coverage balance', async ({ page }) => {
    // Empty week → most muscles untrained → score should be low
    await reseed(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Dashboard');
    const emptyEl = page.getByTestId('health-value');
    await expect(emptyEl).toBeVisible();
    await page.waitForTimeout(900); // wait for animated number to settle
    const emptyScore = await intIn(emptyEl);
    expect(emptyScore, `empty week should be a low health score, got ${emptyScore}`).toBeLessThan(40);

    // Re-seed with a balanced 5-day split → score should rise
    await reseed(page, {
      days: [
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        { type:'pull', focus:'Pull', exIds:['pullup','row','face','curlbb'] },
        { type:'legs', focus:'Legs', exIds:['squat','rdl','curl','calf'] },
        { type:'push', focus:'Push', exIds:['incline','dbpress','lat','overtri'] },
        { type:'pull', focus:'Pull', exIds:['tbar','pulldown','hammer','rear'] },
        { ...REST_DAY }, { ...REST_DAY },
      ],
      splitsByType: {
        push: ['bench','ohp','fly','tri'],
        pull: ['pullup','row','face','curlbb'],
        legs: ['squat','rdl','curl','calf'],
      },
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Dashboard');
    await page.waitForTimeout(900);
    const fullScore = await intIn(page.getByTestId('health-value'));
    expect(fullScore, `balanced 5-day week should rise from ${emptyScore}, got ${fullScore}`).toBeGreaterThan(emptyScore);
  });

  test('A9 Cardio-only day renders as Cardio (not Rest)', async ({ page }) => {
    // Day index 1 is rest (no type) but has a cardio session.
    // effectiveType should derive 'cardio' and the card should reflect it.
    await reseed(page, {
      days: [
        { ...REST_DAY },
        { ...REST_DAY },          // Tue: rest type, but cardio scheduled below
        { ...REST_DAY },
        { ...REST_DAY },
        { ...REST_DAY },
        { ...REST_DAY },
        { ...REST_DAY },
      ],
      cardioDays: [
        { items: [] },
        { items: ['c-z2-30'] },   // Tuesday gets a Zone 2 Run
        { items: [] }, { items: [] }, { items: [] }, { items: [] }, { items: [] },
      ],
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Schedule');
    const tueCard = page.locator('[data-sched-day="1"]').first();
    await expect(tueCard).toBeVisible();
    const eff = await tueCard.getAttribute('data-effective-type');
    expect(eff, 'Tuesday with only cardio should derive effective-type = cardio').toBe('cardio');
    // Pill text should say "Cardio" (matches DAY_TYPES.cardio.label)
    await expect(tueCard.locator('.sched-day-type-pill')).toContainText(/cardio/i);
    // The cardio name should be in the card body
    await expect(tueCard).toContainText(/Zone 2 Run/i);
  });

  test('A6 Find My Weak Spots highlights neglected muscles', async ({ page }) => {
    await reseed(page, {
      days: [
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        { ...REST_DAY },
        { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
        { ...REST_DAY }, { ...REST_DAY },
      ],
      splitsByType: { push: ['bench','ohp','fly','tri'] },
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Body');
    await page.waitForTimeout(400);

    await page.getByText(/find my weak spots/i).click();
    await page.waitForTimeout(500);

    const focused = page.locator('.b2-d-n').first();
    await expect(focused).toBeVisible({ timeout: 3000 });
    const name = (await focused.innerText()).toLowerCase();
    expect(name, `weak-spot focus should be a neglected muscle, was "${name}"`).not.toMatch(/chest|tricep/i);
  });
});
