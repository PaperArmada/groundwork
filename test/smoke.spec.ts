// Smoke harness (000 S3, DESIGN.md §8 testing bar): loads every manifest
// entry — fixtures included — asserts it mounts without console errors,
// and survives interaction with all its rendered controls.

import { expect, test, type Page } from '@playwright/test';
import { modules } from '../src/modules/manifest.ts';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return errors;
}

test.describe('catalog', () => {
  test('renders from the manifest; fixtures hidden from catalog and search', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto('/#/');
    await expect(page.getByRole('heading', { name: 'Lessons' })).toBeVisible();
    for (const m of modules.filter((m) => m.hidden)) {
      await expect(page.getByText(m.title)).toHaveCount(0);
    }
    await page.getByRole('searchbox').fill('fixture');
    for (const m of modules.filter((m) => m.hidden)) {
      await expect(page.getByText(m.title)).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test('usable at 375px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/#/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
});

for (const m of modules) {
  test.describe(`module: ${m.id}`, () => {
    test('mounts without console errors and survives its controls', async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.goto(`/#/m/${m.id}`);
      await expect(
        page.getByRole('heading', { name: m.title }),
      ).toBeVisible();

      // Click every button (twice for toggles), drive every slider and
      // select, and send the transport keys to anything focusable. Buttons
      // may be legitimately disabled (e.g. Predict commit before a guess)
      // or detach after a click (e.g. commit → reveal swap) — skip those,
      // but let any thrown page error fail the test via the error check.
      const buttons = await page.locator('main button').all();
      for (const b of buttons) {
        for (let clicks = 0; clicks < 2; clicks++) {
          const clickable =
            (await b.isVisible().catch(() => false)) &&
            (await b.isEnabled().catch(() => false));
          if (!clickable) break;
          await b.click();
        }
      }
      const sliders = page.locator('main input[type="range"]');
      for (let i = 0; i < (await sliders.count()); i++) {
        const s = sliders.nth(i);
        await s.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
      }
      const selects = page.locator('main select');
      for (let i = 0; i < (await selects.count()); i++) {
        const s = selects.nth(i);
        const values = await s
          .locator('option')
          .evaluateAll((opts) =>
            opts.map((o) => (o as HTMLOptionElement).value),
          );
        for (const v of values) await s.selectOption(v);
      }
      const group = page.locator('main [role="group"]');
      if ((await group.count()) > 0) {
        await group.first().focus();
        for (const key of [' ', ' ', 'ArrowRight', 'ArrowLeft', 'Home']) {
          await page.keyboard.press(key === ' ' ? 'Space' : key);
        }
      }

      await expect(
        page.getByRole('heading', { name: m.title }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  });
}

test.describe('fixture-transport specifics', () => {
  test('play advances frames; pause freezes the readout', async ({ page }) => {
    await page.goto('/#/m/fixture-transport');
    const readout = page.getByText(/frame \d+ \/ 60/);
    await expect(readout).toHaveText(/frame 1 \/ 60/);
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(readout).not.toHaveText(/frame 1 \/ 60/);
    await page.getByRole('button', { name: 'Pause' }).click();
    const frozen = await readout.textContent();
    await page.waitForTimeout(400);
    expect(await readout.textContent()).toBe(frozen);
  });

  test('step back and seek are present (FramePlayer capabilities)', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-transport');
    await expect(page.getByRole('button', { name: 'Step back' })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Seek' })).toBeVisible();
  });
});

test.describe('fixture-predict specifics', () => {
  test('reveal content is absent from the DOM until commit', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-predict');
    await expect(
      page.getByText('Revealed content for the choice prediction'),
    ).toHaveCount(0);
    await page.getByRole('radio', { name: 'green' }).check();
    await page
      .locator('section', { hasText: 'Which of these is a color?' })
      .getByRole('button', { name: 'Lock in my guess' })
      .click();
    await expect(
      page.getByText('Revealed content for the choice prediction'),
    ).toBeVisible();
  });

  test('a commit persists across reload, in table and chip', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-predict');
    await page.getByRole('radio', { name: 'green' }).check();
    await page
      .locator('section', { hasText: 'Which of these is a color?' })
      .getByRole('button', { name: 'Lock in my guess' })
      .click();
    await expect(page.getByText('1 prediction ·')).toBeVisible();
    await page.reload();
    await expect(page.getByText('1 prediction ·')).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('re-answering increments attempt but never the summary', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-predict');
    const section = page.locator('section', {
      hasText: 'Which of these is a color?',
    });
    await page.getByRole('radio', { name: 'green' }).check();
    await section.getByRole('button', { name: 'Lock in my guess' }).click();
    await expect(page.getByText('1 prediction · 100% within range')).toBeVisible();
    await section.getByRole('button', { name: /Answer again/ }).click();
    await page.getByRole('radio', { name: 'seven' }).check(); // wrong on purpose
    await section.getByRole('button', { name: 'Lock in my guess' }).click();
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(1)).toContainText('2'); // attempt column
    // summary still counts only the first (correct) commitment
    await expect(page.getByText('1 prediction · 100% within range')).toBeVisible();
  });

  test('clear empties the table and hides the chip', async ({ page }) => {
    await page.goto('/#/m/fixture-predict');
    await page.getByRole('radio', { name: 'green' }).check();
    await page
      .locator('section', { hasText: 'Which of these is a color?' })
      .getByRole('button', { name: 'Lock in my guess' })
      .click();
    await page.getByRole('button', { name: /Clear ledger/ }).click();
    await expect(page.getByText('Nothing committed yet.')).toBeVisible();
    await expect(page.getByText('prediction ·')).toHaveCount(0);
  });
});

test.describe('fixture-viz specifics', () => {
  test('+100 re-bins live and the count readout matches samples fed', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-viz');
    await expect(page.getByText('samples fed: 0')).toBeVisible();
    await page.getByRole('button', { name: '+100 samples' }).click();
    await expect(page.getByText('samples fed: 100')).toBeVisible();
    await expect(page.locator('svg rect').first()).toBeVisible();
    await page.getByRole('button', { name: '+1 sample' }).click();
    await expect(page.getByText('samples fed: 101')).toBeVisible();
  });

  test('scale toggle re-lays out the same samples (count invariant)', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-viz');
    await page.getByRole('button', { name: '+100 samples' }).click();
    await page.getByRole('checkbox', { name: 'log scale' }).check();
    await expect(page.getByText('samples fed: 100')).toBeVisible();
    await expect(page.locator('svg rect').first()).toBeVisible();
    await page.waitForTimeout(300);
    expect(page.url()).toContain('scale=log');
  });

  test('known set places p50 at the documented 50.5', async ({ page }) => {
    await page.goto('/#/m/fixture-viz');
    await page.getByRole('button', { name: 'Load known set' }).click();
    await expect(page.getByText('samples fed: 100')).toBeVisible();
    await expect(page.locator('svg text', { hasText: 'p50' })).toContainText(
      '50.5',
    );
  });

  test('copy-per-question and copy-all yield the exact text', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/#/m/fixture-viz');
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Dummy question two' })
      .getByRole('button', { name: 'Copy' })
      .click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'Dummy question two, slightly longer, for the card fixture?',
    );
    await page.getByRole('button', { name: 'Copy all' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      [
        'Dummy question one for the card fixture?',
        'Dummy question two, slightly longer, for the card fixture?',
        'Dummy question three for the card fixture?',
      ].join('\n'),
    );
    await context.close();
  });
});

test.describe('fixture-shell specifics', () => {
  test('deep link params restore identical configuration', async ({
    page,
  }) => {
    await page.goto('/#/m/fixture-shell?shape=square&count=7');
    await expect(page.getByRole('img', { name: '7 squares' })).toBeVisible();
    await expect(page.getByText('Count: 7')).toBeVisible();
  });

  test('changing controls writes the URL for copy-link', async ({ page }) => {
    await page.goto('/#/m/fixture-shell');
    await page.getByLabel('Shape').selectOption('triangle');
    await page.waitForTimeout(300); // debounced replaceState
    expect(page.url()).toContain('shape=triangle');
  });

  test('reduced motion stills the pulse animation', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/#/m/fixture-shell');
    const duration = await page
      .locator('span[aria-hidden="true"]')
      .first()
      .evaluate((el) => getComputedStyle(el).animationDuration);
    // tokens.css forces 0.01ms; browsers may report it as '1e-05s'.
    expect(parseFloat(duration)).toBeLessThan(0.01);
    await context.close();
  });

  test('theme toggle persists across reload', async ({ page }) => {
    await page.goto('/#/m/fixture-shell');
    const initial = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    // The toggle's accessible name is its aria-label.
    const other = initial === 'dark' ? 'light' : 'dark';
    await page
      .getByRole('button', { name: `Switch to ${other} theme` })
      .click();
    await page.reload();
    const after = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    expect(after).not.toBe(initial);
  });
});
