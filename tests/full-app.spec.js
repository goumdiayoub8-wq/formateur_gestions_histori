const { test, expect } = require('@playwright/test');

const APP_URL = process.env.PLAYWRIGHT_APP_URL || 'http://127.0.0.1:5173';
const DESKTOP_VIEWPORT = { width: 1440, height: 1200 };
const DEMO_USERS = {
  chef: {
    roleCardName: /Administration/i,
    email: 'chef@test.com',
    routeSuffix: '/chef',
  },
  directeur: {
    roleCardName: /Directeur Pedagogique/i,
    email: 'directeur@test.com',
    routeSuffix: '/directeur',
  },
  formateur: {
    roleCardName: /Formateur/i,
    email: 'formateur@test.com',
    routeSuffix: '/formateur',
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

function isAllowedFailure(entry, allowedFailures = []) {
  return allowedFailures.some((fragment) => entry.includes(fragment));
}

function isExpectedApiFailure(path, status, afterLogout = false, allowedApiFailures = []) {
  const entry = `${path} -> ${status}`;

  if (isAllowedFailure(entry, allowedApiFailures)) {
    return true;
  }

  if (path.includes('/api/auth?action=check') && status === 401) {
    return true;
  }

  return afterLogout && status === 401;
}

function isExpectedConsoleError(message) {
  return message.includes('Failed to load resource: the server responded with a status of 401 (Unauthorized)');
}

function registerDiagnostics(page, options = {}) {
  const { allowedApiFailures = [], allowedRequestFailures = [], allowedConsoleErrors = [] } = options;
  const consoleErrors = [];
  const pageErrors = [];
  const apiFailures = [];
  const requestFailures = [];
  const apiCalls = [];
  let logoutSucceeded = false;

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error?.stack || error?.message || String(error));
  });

  page.on('requestfailed', (request) => {
    const path = toPath(request.url());
    const errorText = request.failure()?.errorText || 'request failed';

    if (path.includes('/api/')) {
      if (logoutSucceeded && errorText.includes('ERR_ABORTED')) {
        return;
      }

      const entry = `${request.method()} ${path} -> ${errorText}`;
      if (!isAllowedFailure(entry, allowedRequestFailures)) {
        requestFailures.push(entry);
      }
    }
  });

  page.on('response', (response) => {
    const path = toPath(response.url());

    if (!path.includes('/api/')) {
      return;
    }

    apiCalls.push(`${response.request().method()} ${path}`);

    if (path.includes('/api/auth?action=logout') && response.status() === 200) {
      logoutSucceeded = true;
    }

    if (response.status() >= 400 && !isExpectedApiFailure(path, response.status(), logoutSucceeded, allowedApiFailures)) {
      apiFailures.push(`${response.request().method()} ${path} -> ${response.status()}`);
    }
  });

  return {
    allowedConsoleErrors,
    consoleErrors,
    pageErrors,
    apiFailures,
    requestFailures,
    apiCalls,
  };
}

function assertNoClientOrApiErrors(diagnostics) {
  const consoleErrors = unique(diagnostics.consoleErrors).filter(
    (message) =>
      !isExpectedConsoleError(message) &&
      !isAllowedFailure(message, diagnostics.allowedConsoleErrors || []),
  );
  const pageErrors = unique(diagnostics.pageErrors);
  const apiFailures = unique(diagnostics.apiFailures);
  const requestFailures = unique(diagnostics.requestFailures);

  expect(
    consoleErrors,
    `Unexpected console errors detected:\n${consoleErrors.join('\n\n')}`,
  ).toEqual([]);

  expect(
    pageErrors,
    `Unexpected page errors detected:\n${pageErrors.join('\n\n')}`,
  ).toEqual([]);

  expect(
    apiFailures,
    `Unexpected API failures detected:\n${apiFailures.join('\n\n')}`,
  ).toEqual([]);

  expect(
    requestFailures,
    `Unexpected failed API requests detected:\n${requestFailures.join('\n\n')}`,
  ).toEqual([]);
}

function assertExpectedApiCalls(diagnostics, fragments) {
  const calls = unique(diagnostics.apiCalls);

  for (const fragment of fragments) {
    expect(
      calls.some((call) => call.includes(fragment)),
      `Expected an API call containing "${fragment}". Seen calls:\n${calls.join('\n')}`,
    ).toBeTruthy();
  }
}

async function expectNonEmptyMain(page, headingName, requiredTexts = []) {
  const main = page.locator('main');

  await expect(main).toBeVisible();
  await expect(page.getByRole('heading', { name: headingName }).first()).toBeVisible();

  for (const text of requiredTexts) {
    await expect(main).toContainText(text);
  }

  const visibleText = (await main.innerText()).replace(/\s+/g, ' ').trim();
  expect(
    visibleText.length,
    `Expected non-empty rendering for ${page.url()}, but the main area looked empty.`,
  ).toBeGreaterThan(80);
}

async function navigateFromSidebar(page, linkName, routeSuffix, headingName, requiredTexts = []) {
  await Promise.all([
    page.waitForURL(new RegExp(`${escapeRegExp(routeSuffix)}$`)),
    page.getByRole('link', { name: linkName }).click(),
  ]);

  await expectNonEmptyMain(page, headingName, requiredTexts);
}

async function pickFirstRealOption(selectLocator) {
  const options = await selectLocator.locator('option').evaluateAll((nodes) =>
    nodes
      .map((node) => ({
        value: node.value,
        label: node.textContent ? node.textContent.trim() : '',
      }))
      .filter((option) => option.value),
  );

  expect(options.length, 'Expected at least one selectable module option in the demand form.').toBeGreaterThan(0);
  await selectLocator.selectOption(options[0].value);

  return options[0];
}

async function fetchJsonThroughPage(page, path, options = {}) {
  return page.evaluate(
    async ({ path: requestPath, options: requestOptions }) => {
      const response = await fetch(requestPath, {
        method: requestOptions.method || 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(requestOptions.headers || {}),
        },
        body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
      });

      let json = null;
      try {
        json = await response.json();
      } catch (error) {
        json = null;
      }

      return {
        ok: response.ok,
        status: response.status,
        json,
      };
    },
    { path, options },
  );
}

async function countVisibleTextMatches(locator, text) {
  const count = await locator.count();
  let matches = 0;

  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible()) {
      const content = await item.innerText();
      if (content.includes(text)) {
        matches += 1;
      }
    }
  }

  return matches;
}

async function loginWithDemoAccount(page, account) {
  const passwordInput = page.locator('#login-password');

  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
  await expect(page.getByLabel('Email / Identifiant')).toBeVisible();
  await expect(passwordInput).toBeVisible();

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
  await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
}

async function createChangeRequestAsFormateur(page, uniqueReason) {
  await loginWithDemoAccount(page, DEMO_USERS.formateur);
  await expectNonEmptyMain(page, /Bienvenue Mr/i, ['Visibilite Planning']);

  await navigateFromSidebar(
    page,
    /Demande/i,
    '/formateur/demande',
    /Demande de Modification/i,
    ['Nouvelle demande', 'Historique des demandes'],
  );

  const moduleSelect = page.getByLabel('Module concerne');
  const groupInput = page.getByLabel('Groupe');
  const weekInput = page.getByLabel('Semaine');
  const reasonInput = page.getByLabel('Raison de la modification');

  await pickFirstRealOption(moduleSelect);
  await groupInput.fill('S13');
  await weekInput.fill('Semaine S13');
  await reasonInput.fill(uniqueReason);

  const createRequestPromise = page.waitForResponse((response) => {
    const path = toPath(response.url());
    return response.request().method() === 'POST' && path.includes('/api/formateur?action=demandes');
  });

  await page.getByRole('button', { name: /Envoyer la demande/i }).click();

  const createRequestResponse = await createRequestPromise;
  expect(createRequestResponse.status()).toBe(201);
  await expect(page.getByText(/Votre demande de modification a bien ete envoyee/i)).toBeVisible();
  await expect(page.getByText(uniqueReason)).toBeVisible();

  await logoutFromSidebar(page);
}

test.use({ viewport: DESKTOP_VIEWPORT });

test('auth flow rejects invalid credentials, preserves session on reload, and blocks formateur access to academic config', async ({ page }) => {
  test.setTimeout(120000);

  const diagnostics = registerDiagnostics(page, {
    allowedApiFailures: ['/api/auth?action=login -> 401', '/api/academic-config -> 403'],
    allowedConsoleErrors: ['status of 403 (Forbidden)'],
  });

  await test.step('Reject an invalid login with the real API error', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();

    await page.getByRole('button', { name: /Formateur/i }).click();
    await page.locator('#login-password').fill('bad-password');

    const invalidLoginResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/auth?action=login');
    });

    await page.getByRole('button', { name: /Se connecter/i }).click();

    const invalidLoginResponse = await invalidLoginResponsePromise;
    expect(invalidLoginResponse.status()).toBe(401);
    await expect(page.getByText(/Email ou mot de passe incorrect/i)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`^${escapeRegExp(`${APP_URL}/`)}$`));
  });

  await test.step('Log in as the formateur and keep the session alive across a hard reload', async () => {
    await loginWithDemoAccount(page, DEMO_USERS.formateur);

    await navigateFromSidebar(
      page,
      /Mes Modules/i,
      '/formateur/modules',
      /Mes Modules/i,
      ['Liste de mes modules'],
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/formateur/modules`)}$`));
    await expectNonEmptyMain(page, /Mes Modules/i, ['Liste de mes modules', 'Modules actifs']);
  });

  await test.step('Block direct URL navigation and API access to the academic configuration for a formateur', async () => {
    await page.goto(`${APP_URL}/directeur/academic-config`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/formateur`)}$`));
    await expectNonEmptyMain(page, /Bienvenue Mr/i, ['Visibilite Planning']);

    const academicConfigResponse = await fetchJsonThroughPage(page, '/api/academic-config');
    expect(academicConfigResponse.status).toBe(403);
    expect(academicConfigResponse.json?.message).toMatch(/Acces interdit/i);
  });

  await test.step('Log out cleanly after the permission checks', async () => {
    await logoutFromSidebar(page);
  });

  assertExpectedApiCalls(diagnostics, [
    '/api/auth?action=login',
    '/api/auth?action=check',
    '/api/planning?action=mes-modules',
    '/api/academic-config',
    '/api/auth?action=logout',
  ]);

  assertNoClientOrApiErrors(diagnostics);
});

test('formateur duplicate demand submission is rejected and the request survives reload only once', async ({ page }) => {
  test.setTimeout(120000);

  const diagnostics = registerDiagnostics(page, {
    allowedApiFailures: ['/api/formateur?action=demandes -> 409'],
    allowedConsoleErrors: ['status of 403 (Forbidden)', 'status of 409 (Conflict)'],
  });

  const uniqueReason = `QA duplicate prevention ${new Date().toISOString()} - verification de l idempotence.`;

  await test.step('Create a fresh request and validate the API payload, then reject the duplicate retry', async () => {
    await loginWithDemoAccount(page, DEMO_USERS.formateur);

    await navigateFromSidebar(
      page,
      /Demande/i,
      '/formateur/demande',
      /Demande de Modification/i,
      ['Nouvelle demande', 'Historique des demandes'],
    );

    const moduleSelect = page.getByLabel('Module concerne');
    const groupInput = page.getByLabel('Groupe');
    const weekInput = page.getByLabel('Semaine');
    const reasonInput = page.getByLabel('Raison de la modification');

    const selectedModule = await pickFirstRealOption(moduleSelect);
    await groupInput.fill('S14');
    await weekInput.fill('Semaine S14');
    await reasonInput.fill(uniqueReason);

    const createRequestPromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/formateur?action=demandes');
    });

    await page.getByRole('button', { name: /Envoyer la demande/i }).click();

    const createRequestResponse = await createRequestPromise;
    expect(createRequestResponse.status()).toBe(201);
    const createdPayload = await createRequestResponse.json();
    expect(createdPayload?.status).toBe('success');
    expect(createdPayload?.request?.reason).toBe(uniqueReason);
    expect(String(createdPayload?.request?.module_code || '')).toContain(selectedModule.label.split(' - ')[0]);
    await expect(page.getByText(uniqueReason)).toBeVisible();

    await moduleSelect.selectOption(selectedModule.value);
    await groupInput.fill('S14');
    await weekInput.fill('Semaine S14');
    await reasonInput.fill(uniqueReason);

    const duplicateRequestPromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/formateur?action=demandes');
    });

    await page.getByRole('button', { name: /Envoyer la demande/i }).click();

    const duplicateRequestResponse = await duplicateRequestPromise;
    expect(duplicateRequestResponse.status()).toBe(409);
    const duplicatePayload = await duplicateRequestResponse.json();
    expect(duplicatePayload?.message).toMatch(/deja en attente/i);
    await expect(page.getByText(/deja en attente de traitement/i)).toBeVisible();
  });

  await test.step('Reload the page and confirm the request history only contains one visible entry for the new reason', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/formateur/demande`)}$`));
    await expectNonEmptyMain(page, /Demande de Modification/i, ['Historique des demandes']);

    const reasonMatches = await countVisibleTextMatches(page.locator('main').getByText(uniqueReason, { exact: true }), uniqueReason);
    expect(reasonMatches).toBe(1);
  });

  await test.step('Log out after the duplicate guard verification', async () => {
    await logoutFromSidebar(page);
  });

  assertExpectedApiCalls(diagnostics, [
    '/api/auth?action=login',
    '/api/formateur?action=demandes',
    '/api/auth?action=logout',
  ]);

  assertNoClientOrApiErrors(diagnostics);
});

test('mon planning table only exposes valid actions and updates the row state after an action', async ({ page }) => {
  test.setTimeout(120000);

  const diagnostics = registerDiagnostics(page, {
    allowedApiFailures: ['/api/planning?action=entry-decision -> 409'],
    allowedConsoleErrors: ['status of 409 (Conflict)'],
  });
  let triggeredEntryDecision = false;

  await test.step('Open Mon Planning and verify completed rows no longer expose invalid actions', async () => {
    await loginWithDemoAccount(page, DEMO_USERS.formateur);

    await navigateFromSidebar(
      page,
      /Mon Planning/i,
      '/formateur/planning',
      /Mon Planning/i,
      ['Mon Planning Hebdomadaire'],
    );

    const completedRow = page.locator('table tbody tr').filter({ hasText: /Realise/i }).first();
    await expect(completedRow).toBeVisible();
    await expect(completedRow.getByRole('button', { name: /Accepter ce creneau/i })).toHaveCount(0);
    await expect(completedRow.getByRole('button', { name: /Refuser ce creneau/i })).toHaveCount(0);
    await expect(completedRow.getByRole('button', { name: /Marquer realise/i })).toHaveCount(0);
  });

  await test.step('Future scheduled rows keep review actions but do not offer completion before the session date', async () => {
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    let futureScheduledIndex = -1;

    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const text = await row.innerText();
      if (/Planifie|En attente|Valide|Refuse/i.test(text) && !/Realise/i.test(text)) {
        futureScheduledIndex = index;
        break;
      }
    }

    expect(futureScheduledIndex).toBeGreaterThanOrEqual(0);
    const futureScheduledRow = rows.nth(futureScheduledIndex);
    await expect(futureScheduledRow.getByRole('button', { name: /Marquer realise/i })).toHaveCount(0);
  });

  await test.step('Submitting an action updates the row state so the user cannot immediately repeat it blindly', async () => {
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    let actionableIndex = -1;

    for (let index = 0; index < rowCount; index += 1) {
      if ((await rows.nth(index).getByRole('button', { name: /Accepter ce creneau/i }).count()) > 0) {
        actionableIndex = index;
        break;
      }
    }

    if (actionableIndex >= 0) {
      const sameRow = rows.nth(actionableIndex);
      triggeredEntryDecision = true;
      const decisionResponsePromise = page.waitForResponse((response) => {
        const path = toPath(response.url());
        return response.request().method() === 'POST' && path.includes('/api/planning?action=entry-decision');
      });

      await sameRow.getByRole('button', { name: /Accepter ce creneau/i }).click();

      const decisionResponse = await decisionResponsePromise;
      expect([201, 409]).toContain(decisionResponse.status());
      await expect(sameRow.getByText(/Acceptation en attente/i)).toBeVisible();
      await expect(sameRow.getByRole('button', { name: /Accepter ce creneau/i })).toHaveCount(0);
      await expect(sameRow.getByRole('button', { name: /Refuser ce creneau/i })).toHaveCount(0);
      return;
    }

    const pendingRow = rows.filter({ hasText: /En attente/i }).first();
    await expect(pendingRow).toBeVisible();
    await expect(pendingRow.getByRole('button', { name: /Accepter ce creneau/i })).toHaveCount(0);
    await expect(pendingRow.getByRole('button', { name: /Refuser ce creneau/i })).toHaveCount(0);
  });

  await test.step('Reloading keeps the pending status visible because it is now backed by API data', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/formateur/planning`)}$`));
    await expectNonEmptyMain(page, /Mon Planning/i, ['Mon Planning Hebdomadaire']);
    await expect(page.locator('table tbody tr').getByText(/Acceptation en attente/i).first()).toBeVisible();
  });

  await test.step('Log out after validating the planning table actions', async () => {
    await logoutFromSidebar(page);
  });

  const expectedCalls = [
    '/api/auth?action=login',
    '/api/planning?action=visibility',
    '/api/auth?action=logout',
  ];

  if (triggeredEntryDecision) {
    expectedCalls.push('/api/planning?action=entry-decision');
  }

  assertExpectedApiCalls(diagnostics, expectedCalls);

  assertNoClientOrApiErrors(diagnostics);
});

test('formateur journey stays functional across the main pages', async ({ page }) => {
  test.setTimeout(120000);

  const diagnostics = registerDiagnostics(page);

  await test.step('Open the login page and authenticate with the real demo formateur account', async () => {
    const passwordInput = page.locator('#login-password');

    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
    await expect(page.getByLabel('Email / Identifiant')).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await page.getByRole('button', { name: /Formateur/i }).click();
    await expect(page.getByLabel('Email / Identifiant')).toHaveValue('formateur@test.com');
    await expect(passwordInput).toHaveValue('123456');

    const loginResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/auth?action=login');
    });

    await page.getByRole('button', { name: /Se connecter/i }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);

    await page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/formateur`)}$`));
    await expectNonEmptyMain(page, /Bienvenue Mr/i, ['Visibilite Planning']);
  });

  await test.step('Navigate to the weekly planning and change week with the real controls', async () => {
    await navigateFromSidebar(
      page,
      /Mon Planning/i,
      '/formateur/planning',
      /Mon Planning/i,
      ['Mon Planning Hebdomadaire'],
    );

    const weekLabel = page.getByText(/^Semaine \d+$/).first();
    const previousWeekText = (await weekLabel.textContent()) || '';

    const visibilityResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes('/api/planning?action=visibility');
    });

    await page.getByRole('button', { name: /Semaine suivante/i }).click();

    const visibilityResponse = await visibilityResponsePromise;
    expect(visibilityResponse.status()).toBe(200);
    await expect(weekLabel).not.toHaveText(previousWeekText);
  });

  await test.step('Open the modules page and verify the assigned modules area renders real data', async () => {
    await navigateFromSidebar(
      page,
      /Mes Modules/i,
      '/formateur/modules',
      /Mes Modules/i,
      ['Liste de mes modules'],
    );

    await expect(page.getByText(/Modules actifs/i)).toBeVisible();
  });

  await test.step('Create a real planning change request from the demand form and verify the UI updates', async () => {
    await navigateFromSidebar(
      page,
      /Demande/i,
      '/formateur/demande',
      /Demande de Modification/i,
      ['Nouvelle demande', 'Historique des demandes'],
    );

    const moduleSelect = page.getByLabel('Module concerne');
    const groupInput = page.getByLabel('Groupe');
    const weekInput = page.getByLabel('Semaine');
    const reasonInput = page.getByLabel('Raison de la modification');
    const uniqueReason = `QA Playwright ${new Date().toISOString()} - ajustement ponctuel de mon planning.`;

    await pickFirstRealOption(moduleSelect);
    await groupInput.fill('S13');
    await weekInput.fill('Semaine S13');
    await reasonInput.fill(uniqueReason);

    const createRequestPromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/formateur?action=demandes');
    });

    await page.getByRole('button', { name: /Envoyer la demande/i }).click();

    const createRequestResponse = await createRequestPromise;
    expect(createRequestResponse.status()).toBe(201);

    await expect(page.getByText(/Votre demande de modification a bien ete envoyee/i)).toBeVisible();
    await expect(moduleSelect).toHaveValue('');
    await expect(groupInput).toHaveValue('');
    await expect(weekInput).toHaveValue('');
    await expect(reasonInput).toHaveValue('');
    await expect(page.getByText(uniqueReason)).toBeVisible();
  });

  await test.step('Visit notifications to ensure the final user-facing page still renders correctly', async () => {
    await navigateFromSidebar(
      page,
      /Notifications/i,
      '/formateur/notifications',
      /Notifications/i,
      ['Notifications recentes'],
    );

    await expect(page.getByText(/notifications non lues/i)).toBeVisible();
  });

  await test.step('Log out through the real sidebar button and return to the public login route', async () => {
    const logoutResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/auth?action=logout');
    });

    await page.getByRole('button', { name: /Deconnexion/i }).click();

    const logoutResponse = await logoutResponsePromise;
    expect(logoutResponse.status()).toBe(200);

    await page.waitForURL(new RegExp(`^${escapeRegExp(`${APP_URL}/`)}$`));
    await expect(page.getByRole('heading', { name: /Bienvenue/i })).toBeVisible();
  });

  assertExpectedApiCalls(diagnostics, [
    '/api/auth?action=login',
    '/api/dashboard',
    '/api/formateur?action=profil',
    '/api/planning?action=stats',
    '/api/planning?action=visibility',
    '/api/planning?action=mes-modules',
    '/api/formateur?action=demandes',
    '/api/formateur?action=notifications',
    '/api/auth?action=logout',
  ]);

  assertNoClientOrApiErrors(diagnostics);
});

test('chef dashboard loads the real operational overview', async ({ page }) => {
  test.setTimeout(180000);

  const diagnostics = registerDiagnostics(page);
  const uniqueReason = `QA Chef ${new Date().toISOString()} - demande a valider par le chef.`;
  const reviewNote = 'Validation QA automatique du chef de pole.';
  let triggeredSuggestionLookup = false;

  await test.step('Create a real pending trainer request that the chef will review later', async () => {
    await createChangeRequestAsFormateur(page, uniqueReason);
  });

  await test.step('Authenticate as the real chef demo user and open the chef dashboard', async () => {
    await loginWithDemoAccount(page, DEMO_USERS.chef);
    await expectNonEmptyMain(page, /Bienvenue sur le tableau de bord/i, [
      /Repartition des heures par formateur/i,
      /Charge de travail hebdomadaire/i,
      /Centre de vigilance/i,
    ]);
    await expect(page.locator('main')).toContainText('Formateurs');
    await expect(page.locator('main')).toContainText('Modules');
    await expect(page.locator('main')).toContainText('Heures / semaine');
  });

  await test.step('Browse the trainer management page and use the real search control', async () => {
    await navigateFromSidebar(
      page,
      /^Formateurs$/i,
      '/chef/formateurs',
      /Gestion des Formateurs/i,
      ['Ajouter Formateur', 'Heures cumulees', 'Alertes'],
    );

    await page.getByPlaceholder(/Rechercher par nom ou specialite/i).fill('Yassine');
    await expect(page.locator('main')).toContainText(/Yassine/i);
  });

  await test.step('Browse the modules page and open the intelligent assignment page from the real CTA', async () => {
    await navigateFromSidebar(
      page,
      /Modules\s*&\s*Filieres/i,
      '/chef/modules',
      /Gestion des Modules\s*&\s*Filieres/i,
      ['Ajouter Module', 'Assigner Module'],
    );

    await page.getByRole('button', { name: /Semestre S1/i }).click();

    await Promise.all([
      page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/chef/affectations`)}$`)),
      page.getByRole('button', { name: /Assigner Module/i }).click(),
    ]);

    await expectNonEmptyMain(page, /Appariement intelligent/i, [
      /Selectionner un module a assigner/i,
    ]);
  });

  await test.step('Select a real module in intelligent assignment to trigger backend suggestions', async () => {
    const moduleSelect = page.locator('main select').first();
    const options = await moduleSelect.locator('option').evaluateAll((nodes) =>
      nodes
        .map((node) => ({ value: node.value, label: node.textContent ? node.textContent.trim() : '' }))
        .filter((option) => option.value),
    );

    if (options.length === 0) {
      await expect(page.locator('main')).toContainText(/Tous les modules sont deja affectes/i);
      return;
    }

    const suggestionsResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes('/api/suggestions');
    });

    await moduleSelect.selectOption(options[0].value);
    triggeredSuggestionLookup = true;

    const suggestionsResponse = await suggestionsResponsePromise;
    expect(suggestionsResponse.status()).toBe(200);
    await expect(page.locator('main')).toContainText(/Module selectionne/i);
    await expect(page.locator('main')).toContainText(/Suggestions IA/i);
  });

  await test.step('Open planning, move to another week, and open the real creation modal', async () => {
    await navigateFromSidebar(
      page,
      /^Planning$/i,
      '/chef/planning',
      /Gestion du Planning/i,
      ['Cours planifies', 'Planning Formateurs'],
    );

    const weekLabel = page.getByText(/^Semaine \d+$/).first();
    const previousWeekText = (await weekLabel.textContent()) || '';

    const teamVisibilityResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes('/api/planning?action=team-visibility');
    });

    await page.getByRole('button', { name: /Semaine suivante/i }).click();

    const teamVisibilityResponse = await teamVisibilityResponsePromise;
    expect(teamVisibilityResponse.status()).toBe(200);
    await expect(weekLabel).not.toHaveText(previousWeekText);

    await page.getByRole('button', { name: /Creer planning/i }).click();
    await expect(page.getByText(/Configurez un creneau detaille/i)).toBeVisible();
    await page.getByRole('button', { name: /Annuler/i }).click();
    await expect(page.getByText(/Configurez un creneau detaille/i)).toHaveCount(0);
  });

  await test.step('Review the pending trainer request from the real notifications page', async () => {
    await navigateFromSidebar(
      page,
      /^Notifications$/i,
      '/chef/notifications',
      /^Notifications$/i,
      ['Dernières notifications'],
    );

    const requestCard = page.locator('.chef-notifications-page .space-y-3 > div').filter({ hasText: uniqueReason }).first();
    await expect(requestCard).toBeVisible();
    await requestCard.getByPlaceholder(/Ajoutez une reponse claire pour le formateur/i).fill(reviewNote);

    const reviewResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/planning?action=entry-status');
    });

    await requestCard.getByRole('button', { name: /^Valider$/i }).click();

    const reviewResponse = await reviewResponsePromise;
    expect(reviewResponse.status()).toBe(200);
    await expect(
      page.locator('.chef-notifications-page .space-y-3 > div').filter({ hasText: uniqueReason }).locator('textarea'),
    ).toHaveCount(0);
  });

  await test.step('Open the chef reports page to complete the main back-office journey', async () => {
    await navigateFromSidebar(
      page,
      /^Rapports$/i,
      '/chef/rapports',
      /^Rapports$/i,
      ['Charge enseignants', 'Couverture affectations', 'Rapports Recents'],
    );
  });

  await test.step('Log out from the chef workspace', async () => {
    await logoutFromSidebar(page);
  });

  const expectedChefApiCalls = [
    '/api/auth?action=login',
    '/api/dashboard?action=stats',
    '/api/formateurs',
    '/api/modules',
    '/api/affectations',
    '/api/academic-config',
    '/api/chef?action=notifications',
    '/api/planning?action=team-visibility',
    '/api/planning?action=sessions',
    '/api/planning?action=entry-status',
    '/api/reports?action=recent',
    '/api/auth?action=logout',
  ];

  if (triggeredSuggestionLookup) {
    expectedChefApiCalls.push('/api/suggestions');
  }

  assertExpectedApiCalls(diagnostics, expectedChefApiCalls);

  assertNoClientOrApiErrors(diagnostics);
});

test('directeur dashboard loads the real validation and academic overview', async ({ page }) => {
  test.setTimeout(180000);

  const diagnostics = registerDiagnostics(page);
  let openedValidationDetail = false;

  await test.step('Authenticate as the real directeur demo user and open the dashboard', async () => {
    await loginWithDemoAccount(page, DEMO_USERS.directeur);
    await expectNonEmptyMain(page, /Calendrier Acad[ée]mique/i, [
      /[ÉE]tat des Validations/i,
      /Progression par Fili[èe]re/i,
      /Activit[ée]s R[ée]centes/i,
    ]);
    await expect(page.getByRole('link', { name: /Configurer/i })).toBeVisible();
  });

  await test.step('Open the validation dashboard and inspect a real submission detail when available', async () => {
    await navigateFromSidebar(
      page,
      /Validation Planning/i,
      '/directeur/validation-planning',
      /Validation des Plannings/i,
      ['Historique des validations récentes'],
    );

    const firstRow = page.locator('table tbody tr').first();
    if ((await firstRow.count()) > 0) {
      const detailResponsePromise = page.waitForResponse((response) => {
        const path = toPath(response.url());
        return response.request().method() === 'GET' && path.includes('/api/planning?action=validation-detail');
      });

      await firstRow.locator('button').first().click();
      openedValidationDetail = true;

      const detailResponse = await detailResponsePromise;
      expect(detailResponse.status()).toBe(200);
      await expect(page.getByText(/Détail de la soumission hebdomadaire/i)).toBeVisible();
      await page.locator('div.fixed.inset-0.z-50').getByRole('button').first().click();
    }
  });

  await test.step('Open the module progression page from the sidebar', async () => {
    await navigateFromSidebar(
      page,
      /Progression Modules/i,
      '/directeur/progression-modules',
      /Progression des Modules/i,
      ['Progression visuelle'],
    );
  });

  await test.step('Use the real dashboard configure button to reach the academic configuration page and save it', async () => {
    await Promise.all([
      page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/directeur`)}$`)),
      page.getByRole('link', { name: /Dashboard/i }).click(),
    ]);

    await Promise.all([
      page.waitForURL(new RegExp(`${escapeRegExp(`${APP_URL}/directeur/academic-config`)}$`)),
      page.getByRole('link', { name: /Configurer/i }).click(),
    ]);

    await expectNonEmptyMain(page, /Configuration Academique/i, [
      /Enregistrer la configuration/i,
      /Annee scolaire/i,
    ]);

    const saveResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'POST' && path.includes('/api/academic-config');
    });

    await page.getByRole('button', { name: /Enregistrer la configuration/i }).click();

    const saveResponse = await saveResponsePromise;
    expect(saveResponse.status()).toBe(200);
    await expect(page.getByText(/Configuration academique mise a jour avec succes/i)).toBeVisible();
  });

  await test.step('Open the reports page to complete the directeur journey', async () => {
    await navigateFromSidebar(
      page,
      /^Rapports$/i,
      '/directeur/rapports',
      /Génération de Rapports/i,
      ['Rapport progression modules', 'Rapport validation planning'],
    );
  });

  await test.step('Log out from the directeur workspace', async () => {
    await logoutFromSidebar(page);
  });

  const expectedDirecteurApiCalls = [
    '/api/auth?action=login',
    '/api/dashboard?action=director-overview',
    '/api/dashboard?action=stats',
    '/api/planning?action=validation-dashboard',
    '/api/modules?action=progress-summary',
    '/api/modules?action=progress-list',
    '/api/academic-config',
    '/api/reports?action=recent',
    '/api/auth?action=logout',
  ];

  if (openedValidationDetail) {
    expectedDirecteurApiCalls.push('/api/planning?action=validation-detail');
  }

  assertExpectedApiCalls(diagnostics, expectedDirecteurApiCalls);

  assertNoClientOrApiErrors(diagnostics);
});
