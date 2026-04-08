const { expect, test } = require('../helpers/playwright');
const { clearAuthThrottleRecords } = require('../helpers/db');

const THEMES = ['light', 'dark'];

test.beforeEach(() => {
  clearAuthThrottleRecords();
});

const ACCOUNTS = {
  administration: {
    label: 'Administration',
    email: 'chef@test.com',
    password: '123456',
    landing: /\/chef(?:\/)?$/,
  },
  formateur: {
    label: 'Formateur',
    email: 'formateur@test.com',
    password: '123456',
    landing: /\/formateur(?:\/)?$/,
  },
  directeur: {
    label: 'Directeur Pedagogique',
    email: 'directeur@test.com',
    password: '123456',
    landing: /\/directeur(?:\/)?$/,
  },
};

async function prepareTheme(page, theme) {
  await page.addInitScript((nextTheme) => {
    window.localStorage.setItem('theme', nextTheme);
  }, theme);
}

async function waitForAppReady(page) {
  await expect(page.locator('#root')).toBeVisible();
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return Boolean(root && root.textContent && root.textContent.trim().length > 0);
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function forceTheme(page, theme) {
  const applyTheme = async () => {
    await page.evaluate((nextTheme) => {
      window.localStorage.setItem('theme', nextTheme);
      document.documentElement.style.colorScheme = nextTheme;
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }, theme);
  };

  try {
    await applyTheme();
  } catch (error) {
    if (!String(error?.message || error).includes('Execution context was destroyed')) {
      throw error;
    }

    await page.waitForLoadState('domcontentloaded');
    await waitForAppReady(page);
    await applyTheme();
  }
}

async function isDarkThemeEnabled(page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'));
}

async function loginAs(page, roleKey, theme) {
  const account = ACCOUNTS[roleKey];
  await prepareTheme(page, theme);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
  await forceTheme(page, theme);

  await page.getByRole('button', { name: new RegExp(account.label, 'i') }).click();
  await page.fill('#login-email', account.email);
  await page.fill('#login-password', account.password);
  await page.getByRole('button', { name: /se connecter|connexion/i }).click();
  await page.waitForURL(account.landing, { timeout: 20000 });
  await forceTheme(page, theme);
}

async function capture(page, testInfo, name) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

async function collectContrastIssues(page, selectors) {
  return page.evaluate((inputSelectors) => {
    const parseColor = (value) => {
      if (!value || value === 'transparent') {
        return null;
      }

      const match = value.match(/rgba?\(([^)]+)\)/i);
      if (!match) {
        return null;
      }

      const [r, g, b, a = '1'] = match[1].split(',').map((item) => item.trim());
      return {
        r: Number.parseFloat(r),
        g: Number.parseFloat(g),
        b: Number.parseFloat(b),
        a: Number.parseFloat(a),
      };
    };

    const luminance = (channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    };

    const contrast = (foreground, background) => {
      const fg =
        0.2126 * luminance(foreground.r)
        + 0.7152 * luminance(foreground.g)
        + 0.0722 * luminance(foreground.b);
      const bg =
        0.2126 * luminance(background.r)
        + 0.7152 * luminance(background.g)
        + 0.0722 * luminance(background.b);
      const lighter = Math.max(fg, bg);
      const darker = Math.min(fg, bg);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const getBackground = (element) => {
      let current = element;

      while (current) {
        const style = window.getComputedStyle(current);
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          return null;
        }
        const color = parseColor(style.backgroundColor);
        if (color && color.a > 0.92) {
          return color;
        }
        current = current.parentElement;
      }

      return parseColor(window.getComputedStyle(document.body).backgroundColor) || {
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      };
    };

    const matches = [];

    for (const selector of inputSelectors) {
      matches.push(...Array.from(document.querySelectorAll(selector)).slice(0, 8));
    }

    const seen = new Set();

    return matches
      .filter((element) => {
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        if (element.closest('.recharts-wrapper')) {
          return false;
        }

        const key = element.outerHTML.slice(0, 140);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return element.offsetParent !== null && element.innerText.trim().length > 0;
      })
      .map((element) => {
        const style = window.getComputedStyle(element);
        const foreground = parseColor(style.color);
        const background = getBackground(element);
        const ratio = foreground && background ? contrast(foreground, background) : null;
        return {
          selector: element.tagName.toLowerCase(),
          text: element.innerText.trim().slice(0, 80),
          ratio,
        };
      })
      .filter((item) => item.ratio !== null && item.ratio < 2.8);
  }, selectors);
}

async function expectReadable(page, selectors) {
  const issues = await collectContrastIssues(page, selectors);
  expect(
    issues,
    issues.length
      ? `Low contrast elements detected:\n${issues
          .map((item) => `${item.selector} "${item.text}" -> ${item.ratio.toFixed(2)}`)
          .join('\n')}`
      : 'No contrast issues detected',
  ).toEqual([]);
}

for (const theme of THEMES) {
  test(`login page theme audit (${theme})`, async ({ page }, testInfo) => {
    await prepareTheme(page, theme);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await forceTheme(page, theme);
    await capture(page, testInfo, `login-${theme}`);
    await expectReadable(page, ['h2', 'p', 'label span', 'button', 'input']);
  });

  test(`chef pages theme audit (${theme})`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
    await loginAs(page, 'administration', theme);

    const routes = [
      ['/chef', 'chef-dashboard'],
      ['/chef/formateurs', 'chef-formateurs'],
      ['/chef/notifications', 'chef-notifications'],
    ];

    for (const [route, name] of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      await forceTheme(page, theme);
      await capture(page, testInfo, `${name}-${theme}`);
      await expectReadable(page, ['h1', 'h2', 'h3', 'p', 'button', 'input', 'textarea']);
    }
  });

  test(`formateur modules theme audit (${theme})`, async ({ page }, testInfo) => {
    await loginAs(page, 'formateur', theme);
    await page.goto('/formateur/modules', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await forceTheme(page, theme);
    await capture(page, testInfo, `formateur-modules-${theme}`);
    await expectReadable(page, ['h1', 'h2', 'p', 'button', 'label', 'table td', 'table th', 'select']);
  });

  test(`directeur reports theme audit (${theme})`, async ({ page }, testInfo) => {
    await loginAs(page, 'directeur', theme);
    await page.goto('/directeur/rapports', { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await forceTheme(page, theme);
    await capture(page, testInfo, `directeur-rapports-${theme}`);
    await expectReadable(page, ['h1', 'h2', 'p', 'button', '.director-report-action']);
  });
}

test('theme toggle updates the UI immediately before the backend sync resolves', async ({ page }) => {
  await loginAs(page, 'administration', 'light');
  await page.goto('/chef', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);

  const themeSyncResponse = page.waitForResponse((response) =>
    response.request().method() === 'PATCH'
      && response.url().includes('/api/auth?action=theme')
  );

  await page.route('**/auth?action=theme', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });

  const toggleButton = page.getByRole('button', { name: /activer le mode sombre/i });

  await expect(toggleButton).toBeVisible();
  expect(await isDarkThemeEnabled(page)).toBe(false);

  await toggleButton.click();

  await expect
    .poll(async () => isDarkThemeEnabled(page), { timeout: 300 })
    .toBe(true);

  await expect(page.getByRole('button', { name: /activer le mode clair/i })).toBeVisible();
  await themeSyncResponse;
  expect(await isDarkThemeEnabled(page)).toBe(true);
});
