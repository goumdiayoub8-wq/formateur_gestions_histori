const { test, expect } = require('../helpers/playwright');
const { clearAuthThrottleRecords } = require('../helpers/db');

const BASE = process.env.PLAYWRIGHT_APP_URL || 'http://127.0.0.1:5173';
const SCREENSHOT_DIR = '../test-results/visual-screenshots';
const DEMO_ACCOUNTS = {
  'chef@test.com': {
    roleCardName: /Administration/i,
    routeSuffix: '/chef',
  },
  'directeur@test.com': {
    roleCardName: /Directeur Pedagogique/i,
    routeSuffix: '/directeur',
  },
  'formateur@test.com': {
    roleCardName: /Formateur/i,
    routeSuffix: '/formateur',
  },
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

async function visit(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
}

async function loginAs(page, email, password = '123456') {
  await visit(page, '/');

  const demoAccount = DEMO_ACCOUNTS[email];
  const emailInput = page.getByLabel('Email / Identifiant');
  const passwordInput = page.locator('#login-password');

  if (demoAccount) {
    await page.getByRole('button', { name: demoAccount.roleCardName }).click();
    await expect(emailInput).toHaveValue(email);
    await expect(passwordInput).toHaveValue(password);
  } else {
    await emailInput.fill(email);
    await passwordInput.fill(password);
  }

  await Promise.all([
    page.waitForResponse((response) => {
      return response.request().method() === 'POST' && response.url().includes('/api/auth?action=login');
    }),
    page.waitForURL(
      new RegExp(
        `${escapeRegExp(`${BASE}${demoAccount?.routeSuffix || ''}`)}(?:\\/)?$`,
      ),
      { timeout: 20000 },
    ),
    page.getByRole('button', { name: /Se connecter/i }).click(),
  ]);
  await waitForAppReady(page);
  await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
}

test.beforeEach(() => {
  clearAuthThrottleRecords();
});

test.describe('Pages Publiques', () => {
  test('Login page - design & layout', async ({ page }) => {
    await visit(page, '/');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });
  });

  test('Login - erreur credentials invalides', async ({ page }) => {
    await visit(page, '/');

    await page.getByLabel('Email / Identifiant').fill('wrong@test.com');
    await page.locator('#login-password').fill('wrongpass');
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/auth?action=login')),
      page.getByRole('button', { name: /Se connecter/i }).click(),
    ]);
    await waitForAppReady(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-error.png`, fullPage: true });
  });

  test('Register page', async ({ page }) => {
    await visit(page, '/register');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register-page.png`, fullPage: true });
  });

  test('Forgot password page', async ({ page }) => {
    await visit(page, '/forgot-password');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-forgot-password.png`, fullPage: true });
  });
});

test.describe('Directeur - Toutes les pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'directeur@test.com');
  });

  test('Dashboard Directeur', async ({ page }) => {
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-directeur-dashboard.png`, fullPage: true });
  });

  test('Validation Planning', async ({ page }) => {
    await visit(page, '/directeur/validation-planning');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-directeur-validation-planning.png`, fullPage: true });
  });

  test('Progression Modules', async ({ page }) => {
    await visit(page, '/directeur/progression-modules');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-directeur-progression-modules.png`, fullPage: true });
  });

  test('Academic Config', async ({ page }) => {
    await visit(page, '/directeur/academic-config');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-directeur-academic-config.png`, fullPage: true });
  });

  test('Rapports Directeur', async ({ page }) => {
    await visit(page, '/directeur/rapports');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-directeur-rapports.png`, fullPage: true });
  });
});

test.describe('Chef de Pôle - Toutes les pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'chef@test.com');
  });

  test('Dashboard Chef', async ({ page }) => {
    await page.screenshot({ path: `${SCREENSHOT_DIR}/20-chef-dashboard.png`, fullPage: true });
  });

  test('Gestion Modules', async ({ page }) => {
    await visit(page, '/chef/modules');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/21-chef-modules.png`, fullPage: true });
  });

  test('Gestion Formateurs', async ({ page }) => {
    await visit(page, '/chef/formateurs');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/22-chef-formateurs.png`, fullPage: true });
  });

  test('Affectations Chef', async ({ page }) => {
    await visit(page, '/chef/affectations');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/23-chef-affectations.png`, fullPage: true });
  });

  test('Planning Chef', async ({ page }) => {
    await visit(page, '/chef/planning');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/24-chef-planning.png`, fullPage: true });
  });

  test('Rapports Chef', async ({ page }) => {
    await visit(page, '/chef/rapports');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/25-chef-rapports.png`, fullPage: true });
  });

  test('Parametrage Chef', async ({ page }) => {
    await visit(page, '/chef/parametrage');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/26-chef-parametrage.png`, fullPage: true });
  });

  test('Notifications Chef', async ({ page }) => {
    await visit(page, '/chef/notifications');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/27-chef-notifications.png`, fullPage: true });
  });
});

test.describe('Formateur - Toutes les pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'formateur@test.com');
  });

  test('Dashboard Formateur', async ({ page }) => {
    await page.screenshot({ path: `${SCREENSHOT_DIR}/30-formateur-dashboard.png`, fullPage: true });
  });

  test('Mon Planning', async ({ page }) => {
    await visit(page, '/formateur/planning');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/31-formateur-planning.png`, fullPage: true });
  });

  test('Mes Modules', async ({ page }) => {
    await visit(page, '/formateur/modules');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/32-formateur-modules.png`, fullPage: true });
  });

  test('Mes Demandes', async ({ page }) => {
    await visit(page, '/formateur/demande');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/33-formateur-demandes.png`, fullPage: true });
  });

  test('Notifications Formateur', async ({ page }) => {
    await visit(page, '/formateur/notifications');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/34-formateur-notifications.png`, fullPage: true });
  });
});

test.describe('Profil partagé', () => {
  test('Profile page as Chef', async ({ page }) => {
    await loginAs(page, 'chef@test.com');
    await visit(page, '/profile');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/40-profile-page.png`, fullPage: true });
  });
});

test.describe('Dark Mode', () => {
  test('Login page dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await visit(page, '/');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/50-login-dark-mode.png`, fullPage: true });
  });

  test('Dashboard dark mode (Chef)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await loginAs(page, 'chef@test.com');
    const themeToggle = page.getByRole('button', { name: /Activer le mode sombre|Activer le mode clair/i });
    if (await themeToggle.count() > 0) {
      await themeToggle.first().click();
      await waitForAppReady(page);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/51-dashboard-dark-mode.png`, fullPage: true });
  });
});

test.describe('Responsive Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Login page mobile', async ({ page }) => {
    await visit(page, '/');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/60-login-mobile.png`, fullPage: true });
  });

  test('Dashboard Chef mobile', async ({ page }) => {
    await loginAs(page, 'chef@test.com');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/61-chef-dashboard-mobile.png`, fullPage: true });
  });

  test('Planning Chef mobile', async ({ page }) => {
    await loginAs(page, 'chef@test.com');
    await visit(page, '/chef/planning');
    await expect(page.locator('main')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/62-chef-planning-mobile.png`, fullPage: true });
  });
});

test.describe('Responsive Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('Dashboard Directeur tablet', async ({ page }) => {
    await loginAs(page, 'directeur@test.com');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/70-directeur-dashboard-tablet.png`, fullPage: true });
  });
});
