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

  test('A4 General → BMR/TDEE updates with weight', async ({ page }) => {
    await reseed(page, { profile: { weight: 70, weightLog: [{ date: '2026-04-26', kg: 70 }] } });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'General');

    // CALORIES tile — find via the eyebrow text
    const calsCard = page.locator('.sl-card-eyebrow', { hasText: /CALORIES/i }).locator('xpath=..');
    const calsValue = calsCard.locator('.sl-card-value').first();
    await expect(calsValue).toBeVisible();
    const initialCals = await intIn(calsValue);

    await reseed(page, { profile: { weight: 100, weightLog: [{ date: '2026-04-26', kg: 100 }] } });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goTab(page, 'General');
    const calsAfterCard = page.locator('.sl-card-eyebrow', { hasText: /CALORIES/i }).locator('xpath=..');
    const after = await intIn(calsAfterCard.locator('.sl-card-value').first());
    expect(after, `TDEE should rise from ${initialCals} after weight 70→100, got ${after}`).toBeGreaterThan(initialCals);
  });

  test('A5 Birthday → Age + Max HR via Tanaka', async ({ page }) => {
    await reseed(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'General');

    const ageVal = page.locator('.sl-card-eyebrow', { hasText: /^AGE$/i }).locator('xpath=..').locator('.sl-card-value').first();
    const hrVal  = page.locator('.sl-card-eyebrow', { hasText: /MAX HR/i }).locator('xpath=..').locator('.sl-card-value').first();
    await expect(ageVal).toBeVisible();
    await expect(hrVal).toBeVisible();
    const initialAge = await intIn(ageVal);
    const initialHr  = await intIn(hrVal);

    // Bump birthday back to 1980 (~46yo). Tanaka: HR_max ≈ 208 - 0.7*46 ≈ 176
    await reseed(page, { profile: { birthday: '1980-01-01', age: undefined } });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await goTab(page, 'General');
    const ageAfter = await intIn(page.locator('.sl-card-eyebrow', { hasText: /^AGE$/i }).locator('xpath=..').locator('.sl-card-value').first());
    const hrAfter  = await intIn(page.locator('.sl-card-eyebrow', { hasText: /MAX HR/i }).locator('xpath=..').locator('.sl-card-value').first());

    expect(ageAfter, `age should rise from ${initialAge}, got ${ageAfter}`).toBeGreaterThan(initialAge);
    expect(hrAfter,  `max HR should fall from ${initialHr}, got ${hrAfter}`).toBeLessThan(initialHr);
  });

  test('A7 Duplicate preset flow — menu + modal renders, custom persists', async ({ page }) => {
    // Pre-seed a custom preset directly so we verify the rendering path:
    // CUSTOM eyebrow shows, Delete option is offered. The interactive
    // duplicate-and-save click is awkward in headless because the bottom
    // nav and stacked overlays make actionability tricky — that path is
    // covered by manual verification on phone.
    await reseed(page, {
      profile: {
        customPresets: [{
          id: 'custom_test1',
          name: 'My Custom PPL',
          sub: 'Your custom preset',
          sourcePresetId: 'classic_ppl',
          createdAt: Date.now(),
          days: ['push','rest','pull','legs','push','pull','rest'],
          splitsByType: {},
        }],
      },
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await goTab(page, 'Schedule');
    await page.getByRole('button', { name: /Presets/i }).click();
    await page.waitForTimeout(300);

    // Custom row is visible with CUSTOM eyebrow at the top of the list
    await expect(page.locator('.ps-row-n').filter({ hasText: 'My Custom PPL' })).toBeVisible();
    await expect(page.locator('.ps-row-eyebrow').filter({ hasText: 'CUSTOM' }).first()).toBeVisible();

    // The "..." menu on a built-in row offers Duplicate but NOT Delete
    await page.locator('.ps-row-menu').nth(1).click();   // 2nd row (1st builtin)
    await page.waitForTimeout(150);
    await expect(page.getByRole('button', { name: /^Duplicate$/i })).toBeVisible();
    expect(await page.getByRole('button', { name: /^Delete$/i }).count()).toBe(0);

    // Duplicate opens the modal with prefilled "(copy)" name
    await page.getByRole('button', { name: /^Duplicate$/i }).click();
    await page.waitForTimeout(200);
    const inputVal = await page.locator('.ps-dup-input').inputValue();
    expect(inputVal).toMatch(/\(copy\)/);
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
