const { test, expect } = require('../helpers/playwright');
const { clearAuthThrottleRecords, runMysql } = require('../helpers/db');

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

function getQuestionnaireFixture() {
  const payload = runMysql(`
    SELECT JSON_OBJECT(
      'formateur_id', a.formateur_id,
      'module_id', m.id,
      'module_name', m.intitule,
      'token', mq.questionnaire_token,
      'question_count', (
        SELECT COUNT(*)
        FROM evaluation_questions
        WHERE questionnaire_id = (
          SELECT id
          FROM evaluation_questionnaires
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        )
      )
    )
    FROM affectations a
    INNER JOIN modules m ON m.id = a.module_id
    INNER JOIN module_questionnaires mq ON mq.module_id = m.id
    LEFT JOIN evaluation_scores es
      ON es.formateur_id = a.formateur_id
     AND es.module_id = m.id
    WHERE a.formateur_id = 1
      AND a.annee = 2026
    ORDER BY CASE WHEN es.id IS NULL THEN 0 ELSE 1 END ASC, m.id ASC
    LIMIT 1;
  `);

  return JSON.parse(payload);
}

function resetQuestionnaireSubmission(formateurId, moduleId) {
  runMysql(`
    DELETE FROM evaluation_answers
    WHERE formateur_id = ${Number(formateurId)}
      AND module_id = ${Number(moduleId)};

    DELETE FROM evaluation_scores
    WHERE formateur_id = ${Number(formateurId)}
      AND module_id = ${Number(moduleId)};

    DELETE FROM formateur_module_scores
    WHERE formateur_id = ${Number(formateurId)}
      AND module_id = ${Number(moduleId)};
  `);
}

function getSubmissionSummary(formateurId, moduleId) {
  const payload = runMysql(`
    SELECT JSON_OBJECT(
      'answer_count', (
        SELECT COUNT(*)
        FROM evaluation_answers
        WHERE formateur_id = ${Number(formateurId)}
          AND module_id = ${Number(moduleId)}
      ),
      'score_count', (
        SELECT COUNT(*)
        FROM evaluation_scores
        WHERE formateur_id = ${Number(formateurId)}
          AND module_id = ${Number(moduleId)}
      ),
      'module_score_count', (
        SELECT COUNT(*)
        FROM formateur_module_scores
        WHERE formateur_id = ${Number(formateurId)}
          AND module_id = ${Number(moduleId)}
      )
    );
  `);

  return JSON.parse(payload);
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

test.beforeEach(() => {
  clearAuthThrottleRecords();
});

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

async function answerCurrentQuestion(page, stepIndex) {
  const textAnswer = page.locator('textarea');
  if (await textAnswer.count()) {
    await textAnswer.fill(`Commentaire QA module ${stepIndex + 1}`);
    return;
  }

  const binaryOptions = [
    page.getByRole('button', { name: /^Oui/i }),
    page.getByRole('button', { name: /^Non/i }),
  ];
  if (await binaryOptions[0].count()) {
    await binaryOptions[stepIndex % binaryOptions.length].click();
    return;
  }

  const ratingLabels = [/Excellent/i, /Solide/i, /Correct/i, /Fragile/i, /Insuffisant/i];
  await page.getByRole('button', { name: ratingLabels[stepIndex % ratingLabels.length] }).click();
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

test('Questionnaire flow stays module-scoped with required validation, navigation, progress, and final submission', async ({ page }) => {
  test.setTimeout(120000);

  const fixture = getQuestionnaireFixture();
  resetQuestionnaireSubmission(fixture.formateur_id, fixture.module_id);

  const diagnostics = registerDiagnostics(page, {
    allowedApiFailures: ['GET /api/auth?action=check -> 401'],
  });

  const progressBar = page.getByRole('progressbar', { name: /Progression du questionnaire/i });
  const nextButton = page.getByRole('button', { name: /^Question suivante$/ });
  const backButton = page.getByRole('button', { name: /^Question precedente$/ });

  await test.step('Log in and open a module questionnaire reset to a clean state', async () => {
    await loginWithDemoAccount(page, DEMO_FORMATEUR);

    const questionnaireResponsePromise = page.waitForResponse((response) => {
      const path = toPath(response.url());
      return response.request().method() === 'GET' && path.includes(`/api/questionnaire?token=${fixture.token}`);
    });

    await page.goto(`${APP_URL}/questionnaire/${fixture.token}`, { waitUntil: 'domcontentloaded' });
    const questionnaireResponse = await questionnaireResponsePromise;
    expect(questionnaireResponse.status()).toBe(200);

    await expect(page.getByRole('heading', { name: new RegExp(escapeRegExp(fixture.module_name), 'i') })).toBeVisible();
    await expect(page.getByRole('button', { name: /Commencer le questionnaire/i })).toBeVisible();
  });

  await test.step('Start the questionnaire and enforce the required first answer', async () => {
    await page.getByRole('button', { name: /Commencer le questionnaire/i }).click();

    await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
    await expect(progressBar).toHaveAttribute('aria-valuenow', String(Math.round((1 / fixture.question_count) * 100)));
    await expect(backButton).toBeDisabled();
    await expect(nextButton).toBeDisabled();

    await answerCurrentQuestion(page, 0);
    await expect(nextButton).toBeEnabled();
  });

  await test.step('Move forward, then back, while keeping the current progress coherent', async () => {
    await nextButton.click();
    await expect(page.getByText('Question 2', { exact: true })).toBeVisible();
    await expect(progressBar).toHaveAttribute('aria-valuenow', String(Math.round((2 / fixture.question_count) * 100)));
    await expect(backButton).toBeEnabled();

    await backButton.click();
    await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
    await expect(progressBar).toHaveAttribute('aria-valuenow', String(Math.round((1 / fixture.question_count) * 100)));
    await expect(nextButton).toBeEnabled();

    await nextButton.click();
    await expect(page.getByText('Question 2', { exact: true })).toBeVisible();
  });

  await test.step('Answer the remaining questions and submit once the final step is reached', async () => {
    for (let questionNumber = 2; questionNumber <= fixture.question_count; questionNumber += 1) {
      await answerCurrentQuestion(page, questionNumber - 1);

      if (questionNumber === fixture.question_count) {
        await expect(progressBar).toHaveAttribute('aria-valuenow', '100');

        const submitResponsePromise = page.waitForResponse((response) => {
          const path = toPath(response.url());
          return response.request().method() === 'POST' && path.includes(`/api/questionnaire/submit?token=${fixture.token}`);
        });

        await page.getByRole('button', { name: /^Envoyer le questionnaire$/ }).click();
        const submitResponse = await submitResponsePromise;
        expect(submitResponse.status()).toBe(201);
      } else {
        await nextButton.click();
        await expect(page.getByText(`Question ${questionNumber + 1}`, { exact: true })).toBeVisible();
      }
    }

    await expect(page.getByRole('heading', { name: /Merci, votre questionnaire est envoye/i })).toBeVisible();
    await expect(page.getByText(/Votre evaluation a bien ete enregistree pour ce module/i)).toBeVisible();
  });

  await test.step('Persist the submission on the targeted module only', async () => {
    const submissionSummary = getSubmissionSummary(fixture.formateur_id, fixture.module_id);

    expect(submissionSummary.answer_count).toBe(fixture.question_count);
    expect(submissionSummary.score_count).toBe(1);
    expect(submissionSummary.module_score_count).toBe(1);

    resetQuestionnaireSubmission(fixture.formateur_id, fixture.module_id);
  });

  await test.step('Log out cleanly after the completed questionnaire flow', async () => {
    await logoutFromQuestionnairePage(page);
  });

  assertNoClientOrApiErrors(diagnostics);
});
