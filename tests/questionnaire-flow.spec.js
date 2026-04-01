const { test, expect } = require('@playwright/test');

const APP_URL = process.env.PLAYWRIGHT_APP_URL || 'http://127.0.0.1:5173';
const DEMO_FORMATEUR = {
  roleCardName: /Formateur/i,
  email: 'formateur@test.com',
  routeSuffix: '/formateur',
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

function registerDiagnostics(page, options = {}) {
  const { allowedApiFailures = [], allowedConsoleErrors = [] } = options;
  const consoleErrors = [];
  const pageErrors = [];
  const apiFailures = [];
  const apiCalls = [];

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

    apiCalls.push(`${response.request().method()} ${path}`);

    const entry = `${response.request().method()} ${path} -> ${response.status()}`;
    const allowed = allowedApiFailures.some((fragment) => entry.includes(fragment));

    if (response.status() >= 400 && !allowed) {
      apiFailures.push(entry);
    }
  });

  return {
    allowedConsoleErrors,
    consoleErrors,
    pageErrors,
    apiFailures,
    apiCalls,
  };
}

function assertNoClientOrApiErrors(diagnostics) {
  const consoleErrors = unique(diagnostics.consoleErrors).filter(
    (message) =>
      !isExpectedConsoleError(message) &&
      !(diagnostics.allowedConsoleErrors || []).some((fragment) => message.includes(fragment)),
  );

  expect(consoleErrors, `Unexpected console errors detected:\n${consoleErrors.join('\n\n')}`).toEqual([]);
  expect(unique(diagnostics.pageErrors), `Unexpected page errors detected:\n${diagnostics.pageErrors.join('\n\n')}`).toEqual([]);
  expect(unique(diagnostics.apiFailures), `Unexpected API failures detected:\n${diagnostics.apiFailures.join('\n\n')}`).toEqual([]);
}

async function loginWithDemoAccount(page, account) {
  const passwordInput = page.locator('#login-password');

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
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

async function logoutFromQuestionnairePage(page) {
  await page.goto(`${APP_URL}/formateur`, { waitUntil: 'domcontentloaded' });

  const logoutResponsePromise = page.waitForResponse((response) => {
    const path = toPath(response.url());
    return response.request().method() === 'POST' && path.includes('/api/auth?action=logout');
  });

  await page.getByRole('button', { name: /Deconnexion/i }).click();
  const logoutResponse = await logoutResponsePromise;
  expect(logoutResponse.status()).toBe(200);
}

test('Mes Modules is the only UI entry point to the hidden questionnaire route and invalid tokens fail safely', async ({ page }) => {
  test.setTimeout(120000);

  const diagnostics = registerDiagnostics(page, {
    allowedApiFailures: [
      'GET /api/auth?action=check -> 401',
      'GET /api/questionnaire?token=invalid-token-qa -> 404',
    ],
    allowedConsoleErrors: ['status of 404 (Not Found)'],
  });

  await test.step('Log in as the formateur and open Mes Modules', async () => {
    await loginWithDemoAccount(page, DEMO_FORMATEUR);

    const modulesResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes('/api/planning?action=mes-modules');
    });

    await page.goto(`${APP_URL}/formateur/modules`, { waitUntil: 'domcontentloaded' });
    const modulesResponse = await modulesResponsePromise;
    expect(modulesResponse.status()).toBe(200);

    await expect(page.locator('h1', { hasText: 'Mes Modules' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Répondre au questionnaire/i }).first()).toBeVisible();
  });

  await test.step('Use the Mes Modules button to reach the hidden questionnaire route', async () => {
    const questionnaireEntry = page.getByRole('link', { name: /Répondre au questionnaire/i }).first();
    const href = await questionnaireEntry.getAttribute('href');

    expect(href, 'Expected a hidden questionnaire link in Mes Modules.').toMatch(/^\/questionnaire\/.+/);

    const questionnaireResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes('/api/questionnaire?token=');
    });

    await questionnaireEntry.click();
    await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/questionnaire/`)}`));

    const questionnaireResponse = await questionnaireResponsePromise;
    expect(questionnaireResponse.status()).toBe(200);

    const completionHeading = page.getByRole('heading', {
      name: /Questionnaire deja soumis|Merci, votre questionnaire est envoye/i,
    });
    const startButton = page.getByRole('button', { name: /Commencer le questionnaire/i });

    await expect(
      completionHeading.or(startButton),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Deconnexion/i })).toHaveCount(0);
  });

  await test.step('An invalid token shows a safe not-found page instead of crashing', async () => {
    const invalidResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes('/api/questionnaire?token=invalid-token-qa');
    });

    await page.goto(`${APP_URL}/questionnaire/invalid-token-qa`, { waitUntil: 'domcontentloaded' });
    const invalidResponse = await invalidResponsePromise;
    expect(invalidResponse.status()).toBe(404);

    await expect(page.getByRole('heading', { name: /Questionnaire introuvable/i })).toBeVisible();
    await expect(
      page.getByText(/Questionnaire introuvable|Le lien du questionnaire est invalide/i).first(),
    ).toBeVisible();
  });

  await test.step('Log out cleanly after the questionnaire checks', async () => {
    await logoutFromQuestionnairePage(page);
  });

  assertNoClientOrApiErrors(diagnostics);
  expect(
    diagnostics.apiCalls.filter((entry) => entry.includes('/api/questionnaire/score')),
    'The questionnaire page should load without a duplicate /questionnaire/score request.',
  ).toEqual([]);
});
