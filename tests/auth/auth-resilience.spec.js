const { test, expect } = require('../helpers/playwright');

test.describe('auth resilience', () => {
  test('blocks invalid client-side input before any login request is sent', async ({ page }) => {
    let loginCalls = 0;

    await page.route('**/api/auth?action=login', async (route) => {
      loginCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', user: { id: 2, role_id: 2 } }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email / Identifiant').fill('invalid-email');
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeDisabled();

    await page.locator('#login-password').fill('123456');
    await page.getByRole('button', { name: /Se connecter/i }).click();

    await expect
      .poll(async () => page.locator('#login-email').evaluate((input) => input.validationMessage))
      .toMatch(/@/);
    expect(loginCalls).toBe(0);
  });

  test('keeps the login button disabled when the password is missing', async ({ page }) => {
    let loginCalls = 0;

    await page.route('**/api/auth?action=login', async (route) => {
      loginCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', user: { id: 2, role_id: 2 } }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email / Identifiant').fill('chef@test.com');

    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeDisabled();
    expect(loginCalls).toBe(0);
  });

  test('shows a backend error toast when login returns a 500 response', async ({ page }) => {
    await page.route('**/api/auth?action=login', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          message: 'Erreur interne du serveur.',
        }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Administration/i }).click();
    await page.getByRole('button', { name: /Se connecter/i }).click();

    await expect(page.getByText('Erreur interne du serveur.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('surfaces a connection error when the login request is aborted', async ({ page }) => {
    await page.route('**/api/auth?action=login', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Administration/i }).click();
    await page.getByRole('button', { name: /Se connecter/i }).click();

    await expect(page.getByText('Connexion au serveur impossible.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
