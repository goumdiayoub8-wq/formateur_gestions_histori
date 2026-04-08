const { test, expect } = require('../helpers/playwright');
const { clearAuthThrottleRecords } = require('../helpers/db');

const APP_URL = process.env.PLAYWRIGHT_APP_URL || 'http://127.0.0.1:5173';
const DESKTOP_VIEWPORT = { width: 1440, height: 1200 };
const DEMO_USERS = {
  chef: {
    roleCardName: /Administration/i,
    email: 'chef@test.com',
    routeSuffix: '/chef',
    content: /Bienvenue sur le tableau de bord/i,
    links: [
      { name: /Modules & Filieres/i, suffix: '/chef/modules', content: /Gestion des Modules/i },
      { name: /Planning/i, suffix: '/chef/planning', content: /Gestion du Planning/i },
      { name: /Rapports/i, suffix: '/chef/rapports', content: /^Rapports$/i },
    ],
  },
  directeur: {
    roleCardName: /Directeur Pedagogique/i,
    email: 'directeur@test.com',
    routeSuffix: '/directeur',
    content: /Tableau de Bord - Directeur Pedagogique/i,
    links: [
      { name: /Validation Planning/i, suffix: '/directeur/validation-planning', content: /Validation des Plannings/i },
      { name: /Progression Modules/i, suffix: '/directeur/progression-modules', content: /Progression des Modules/i },
      { name: /Rapports/i, suffix: '/directeur/rapports', content: /Génération de Rapports/i },
    ],
  },
  formateur: {
    roleCardName: /Formateur/i,
    email: 'formateur@test.com',
    routeSuffix: '/formateur',
    content: /Bonjour/i,
    links: [
      { name: /^Mon Planning$/i, suffix: '/formateur/planning', content: /Mon Planning/i },
      { name: /^Mes Modules$/i, suffix: '/formateur/modules', content: /Mes Modules/i },
      { name: /Notifications/i, suffix: '/formateur/notifications', content: /^Notifications$/i },
    ],
  },
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPath(urlString) {
  try {
    const url = new URL(urlString);
    return `${url.pathname}${url.search}`;
  } catch (error) {
    return urlString;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isExpectedConsoleError(message) {
  return message.includes('Failed to load resource: the server responded with a status of 401 (Unauthorized)');
}

function registerDiagnostics(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const apiFailures = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error?.stack || error?.message || String(error));
  });

  page.on('response', (response) => {
    const path = toPath(response.url());
    if (!path.includes('/api/')) {
      return;
    }

    if (response.status() >= 400 && !(path.includes('/api/auth?action=check') && response.status() === 401)) {
      apiFailures.push(`${response.request().method()} ${path} -> ${response.status()}`);
    }
  });

  return { consoleErrors, pageErrors, apiFailures };
}

function assertNoClientOrApiErrors(diagnostics) {
  const consoleErrors = unique(diagnostics.consoleErrors).filter(
    (message) => !isExpectedConsoleError(message),
  );

  expect(consoleErrors, `Unexpected console errors detected:\n${consoleErrors.join('\n\n')}`).toEqual([]);
  expect(unique(diagnostics.pageErrors), `Unexpected page errors detected:\n${diagnostics.pageErrors.join('\n\n')}`).toEqual([]);
  expect(unique(diagnostics.apiFailures), `Unexpected API failures detected:\n${diagnostics.apiFailures.join('\n\n')}`).toEqual([]);
}

async function waitForAppToRender(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return Boolean(root && root.textContent && root.textContent.trim().length > 0);
  });
}

async function loginWithDemoAccount(page, account) {
  const passwordInput = page.locator('#login-password');

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await waitForAppToRender(page);
  await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: account.roleCardName }).click();
  await expect(page.getByLabel('Email / Identifiant')).toHaveValue(account.email);
  await expect(passwordInput).toHaveValue('123456');

  const loginResponsePromise = page.waitForResponse((response) => {
    const path = toPath(response.url());
    return response.request().method() === 'POST' && path.includes('/api/auth?action=login');
  });

  await page.getByRole('button', { name: /Se connecter/i }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status()).toBe(200);
  await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}${account.routeSuffix}`)}$`));
}

async function logoutFromSidebar(page) {
  const logoutResponsePromise = page.waitForResponse((response) => {
    const path = toPath(response.url());
    return response.request().method() === 'POST' && path.includes('/api/auth?action=logout');
  });

  await page.getByRole('button', { name: /Deconnexion/i }).click();

  const logoutResponse = await logoutResponsePromise;
  expect(logoutResponse.status()).toBe(200);
  await page.waitForURL(new RegExp(`^${escapeRegExp(`${APP_URL}/`)}$`));
}

async function expectMainToContain(page, matcher) {
  const main = page.locator('main');
  await expect(main).toBeVisible();
  await expect(main.getByText(matcher).first()).toBeVisible({ timeout: 15000 });
}

function getSidebarLink(page, name) {
  return page
    .getByRole('navigation', { name: /Navigation principale/i })
    .getByRole('link', { name })
    .first();
}

test.use({ viewport: DESKTOP_VIEWPORT });

test.beforeEach(() => {
  clearAuthThrottleRecords();
});

for (const account of Object.values(DEMO_USERS)) {
  test(`navigation smoke for ${account.routeSuffix}`, async ({ page }) => {
    test.setTimeout(120000);

    await loginWithDemoAccount(page, account);
    await expectMainToContain(page, account.content);
    const diagnostics = registerDiagnostics(page);

    for (const link of account.links) {
      await getSidebarLink(page, link.name).click();
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(`${APP_URL}${link.suffix}`)}(?:\\?.*)?$`));

      await expectMainToContain(page, link.content);
    }

    assertNoClientOrApiErrors(diagnostics);
    await logoutFromSidebar(page);
  });
}
