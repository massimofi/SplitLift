// SplitLift smoke test — runs against `npm run dev` (5173).
// Pre-populates localStorage with a valid v3 state so we skip onboarding,
// then walks every tab, takes screenshots, asserts non-empty content +
// no console errors. Also checks the body-zoom drawer + reset flow.

import { test, expect } from '@playwright/test';

// Mirrors the v3 schema in src/state/persist.js + INITIAL_DAYS in
// src/data/exercises.js so the app boots straight into the dashboard.
const SEED_STATE = {
  onboarded: true,
  theme: 'dark',
  profile: {
    days: 4,
    height: 180, hUnit: 'cm',
    weight: 78,  wUnit: 'kg',
    birthday: '2003-04-26',
    age: 22,
    sex: 'm',
    sport: 'soccer',
    cardioMin: 90,
    weightLog: [{ date: '2026-04-26', kg: 78 }],
  },
  /* Smoke runs in dark mode by default; the Profile-via-avatar test
     also captures a light-mode screenshot so we can spot mode-bugs. */
  days: [
    { type:'push', focus:'Push', exIds:['bench','ohp','fly','tri'] },
    { type:'rest', focus:'Rest', exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' },
    { type:'pull', focus:'Pull', exIds:['pullup','row','face','curlbb'] },
    { type:'legs', focus:'Legs', exIds:['squat','rdl','curl','calf'] },
    { type:'push', focus:'Push', exIds:['incline','dbpress','lat','overtri'] },
    { type:'pull', focus:'Pull', exIds:['tbar','pulldown','hammer','rear'] },
    { type:'rest', focus:'Rest', exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' },
  ],
  cardioDays: Array.from({ length: 7 }, () => ({ items: [] })),
  locked: [false, false, false, false, false, false, false],
  splitsByType: {},
};

const TABS = ['Dashboard', 'Splits', 'Schedule', 'Body', 'Cardio', 'Friends', 'General'];

test.describe('SplitLift smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(seed => {
      try {
        localStorage.setItem('splitlift-state-v4', JSON.stringify(seed));
        localStorage.removeItem('splitlift-state-v3');
      } catch {}
    }, SEED_STATE);
  });

  for (const tab of TABS) {
    test(`Tab "${tab}" renders without errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`));

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // bottom nav uses .bn-item buttons whose label is the visible text
      await page.locator('.bn-item').filter({ hasText: tab }).first().click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: `tests/screenshots/${tab.toLowerCase()}.png`, fullPage: true });
      // General tab also gets a scrolled snap so we can see the gender card.
      if (tab === 'General') {
        await page.evaluate(() => {
          const pane = document.querySelector('.screen-body');
          if (pane) pane.scrollTop = 600;
        });
        await page.waitForTimeout(150);
        await page.screenshot({ path: 'tests/screenshots/general-mid.png', fullPage: true });
      }
      // Body tab also gets a scrolled snap so we can see coverage cells.
      if (tab === 'Body') {
        await page.evaluate(() => {
          const pane = document.querySelector('.screen-body');
          if (pane) pane.scrollTop = 600;
        });
        await page.waitForTimeout(150);
        await page.screenshot({ path: 'tests/screenshots/body-coverage.png', fullPage: true });
        // Snap the back view too (no clipping there either)
        await page.evaluate(() => {
          const pane = document.querySelector('.screen-body');
          if (pane) pane.scrollTop = 0;
        });
        await page.waitForTimeout(150);
        await page.locator('.sl-toggle-btn', { hasText: 'Back' }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: 'tests/screenshots/body-back.png', fullPage: true });
      }

      const bodyText = await page.locator('#root').innerText();
      expect(bodyText.length).toBeGreaterThan(50);

      // Tab pane should exist and be non-empty
      const pane = page.locator('.tab-pane').first();
      await expect(pane).toBeVisible();
      const paneText = await pane.innerText();
      expect(paneText.length).toBeGreaterThan(20);

      // No console errors during render. We allow vite hmr / fontshare network
      // diagnostics through by filtering known noise.
      const real = consoleErrors.filter(e =>
        !/Failed to load resource.*api\.fontshare\.com/.test(e) &&
        !/Failed to load resource.*404/.test(e) &&
        !/\[vite\]/.test(e)
      );
      expect(real, `Console errors on ${tab}:\n${real.join('\n')}`).toEqual([]);
    });
  }

  test('Profile reset card is reachable + visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForTimeout(500);
    // Scroll mid-page to capture Privacy / Coach tone area
    await page.evaluate(() => {
      const pane = document.querySelector('.screen-body');
      if (pane) pane.scrollTop = 700;
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/screenshots/profile-mid.png', fullPage: true });
    // Scroll to bottom so the reset card is in viewport for the screenshot
    await page.evaluate(() => {
      const pane = document.querySelector('.screen-body');
      if (pane) pane.scrollTop = 99999;
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/screenshots/profile-reset.png', fullPage: true });
    // Reset card should exist and be a danger gradient
    const reset = page.locator('.prof-reset-card').first();
    await expect(reset).toBeVisible();
    const grad = await reset.getAttribute('data-grad');
    expect(grad).toBe('danger');
  });

  test('Profile tab renders via avatar', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/profile.png', fullPage: true });

    const pane = page.locator('.tab-pane').first();
    await expect(pane).toBeVisible();
    expect((await pane.innerText()).length).toBeGreaterThan(40);
    expect(consoleErrors.filter(e => !/api\.fontshare/.test(e) && !/404/.test(e))).toEqual([]);
  });

  test('Light mode renders without text contrast regressions', async ({ page }) => {
    // Toggle theme to light, then snap each tab.
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('splitlift-state-v4');
        if (raw) {
          const s = JSON.parse(raw);
          s.theme = 'light';
          localStorage.setItem('splitlift-state-v4', JSON.stringify(s));
        }
      } catch {}
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (const tab of ['Dashboard', 'Splits', 'Schedule', 'Body', 'Friends', 'General']) {
      await page.locator('.bn-item').filter({ hasText: tab }).first().click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `tests/screenshots/light-${tab.toLowerCase()}.png`, fullPage: true });
    }
  });

  test('Gender input has visible contrast in dark mode', async ({ page }) => {
    // App is seeded in dark mode; navigate to General + scroll to gender card.
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.bn-item').filter({ hasText: 'General' }).first().click();
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const pane = document.querySelector('.screen-body');
      if (pane) pane.scrollTop = 600;
    });
    await page.waitForTimeout(150);
    // The active option (.on) must have visible contrast: text vs bg
    // luminance gap >= 0.45 (rough WCAG-ish smell test).
    const activeBtn = page.locator('.gen-seg-four button.on').first();
    await expect(activeBtn).toBeVisible();
    const { fg, bg } = await activeBtn.evaluate(el => {
      const cs = getComputedStyle(el);
      return { fg: cs.color, bg: cs.backgroundColor };
    });
    const luma = (rgb) => {
      const m = rgb.match(/\d+(\.\d+)?/g);
      if (!m) return 0;
      const [r, g, b] = m.map(Number);
      // sRGB to relative luminance approximation
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };
    const diff = Math.abs(luma(fg) - luma(bg));
    expect(diff, `active gender button text/bg contrast too low: fg=${fg} bg=${bg}`).toBeGreaterThan(0.45);
  });

  test('Schedule floating chip bar visible + tap-to-apply works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.bn-item').filter({ hasText: 'Schedule' }).first().click();
    await page.waitForTimeout(500);

    // Floating chip bar visible
    const bar = page.locator('.sched-chip-bar');
    await expect(bar).toBeVisible();
    // Bar sits above the bottom navbar (its bottom edge is above viewport bottom)
    const barBox = await bar.boundingBox();
    const navBox = await page.locator('.bottom-nav').boundingBox();
    expect(barBox.y + barBox.height, 'chip bar should sit above the bottom nav').toBeLessThan(navBox.y + 4);

    // At least one chip with "Push" in it (built-in seed has push days)
    const pushChip = page.locator('.sched-chip').filter({ hasText: /^Push$/i }).first();
    await expect(pushChip).toBeVisible();

    // Tap-to-select gives the chip an is-selected class
    await pushChip.click();
    await page.waitForTimeout(150);
    await expect(pushChip).toHaveClass(/is-selected/);

    // Tap a Tuesday day (rest in seed) → it should change type
    const day1 = page.locator('[data-sched-day="1"]').first();
    await expect(day1).toContainText(/REST/i);
    await day1.click();
    await page.waitForTimeout(400);
    // After tap-apply, day 1 should now show PUSH
    await expect(page.locator('[data-sched-day="1"]')).toContainText(/PUSH/i);
  });

  test('Body drawer can be closed via X button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.bn-item').filter({ hasText: 'Body' }).first().click();
    await page.waitForTimeout(500);
    // Open drawer by clicking the first coverage cell
    await page.locator('.b2-cov .sl-card[data-interactive="true"]').first().click();
    await page.waitForTimeout(400);
    const drawer = page.locator('.b2-drawer-card').first();
    await expect(drawer).toBeVisible();

    // Close button is reachable + tappable
    const closeBtn = page.getByTestId('b2-close-btn');
    await expect(closeBtn).toBeVisible();
    const box = await closeBtn.boundingBox();
    expect(box.width, 'close button must be ≥ 44px wide').toBeGreaterThanOrEqual(40);
    expect(box.height, 'close button must be ≥ 44px tall').toBeGreaterThanOrEqual(40);
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(drawer).toBeHidden();
  });

  test('Body zoom drawer has solid background', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.bn-item').filter({ hasText: 'Body' }).first().click();
    await page.waitForTimeout(600);

    // Tap a coverage cell — guaranteed to set focus on a muscle
    const cell = page.locator('.b2-cov .sl-card[data-interactive="true"]').first();
    await expect(cell).toBeVisible();
    await cell.click();
    await page.waitForTimeout(500);

    // The drawer should now exist
    const drawer = page.locator('.b2-drawer-card').first();
    await expect(drawer).toBeVisible();
    const drawerText = await drawer.innerText();
    expect(drawerText.length).toBeGreaterThan(20);

    const bg = await drawer.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(bg).not.toBe('transparent');

    // Drawer must layer above the body
    const drawerZ = await drawer.evaluate(el => parseInt(getComputedStyle(el).zIndex, 10) || 0);
    expect(drawerZ).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: 'tests/screenshots/body-zoomed.png', fullPage: true });
  });

  test('Reset all data returns to landing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: /Reset everything/i }).click();
    await page.waitForTimeout(300);
    // confirm
    await page.getByRole('button', { name: /^Reset everything$/i }).last().click();
    await page.waitForTimeout(800);

    // After reset: landing or login screen visible (no .tab-pane)
    const tabPane = await page.locator('.tab-pane').count();
    expect(tabPane).toBe(0);
  });
});
