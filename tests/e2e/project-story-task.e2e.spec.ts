import { expect, test } from '@playwright/test';

const SUPER_ADMIN_EMAIL = 'olafcodeweb@gmail.com';

function createFakeGoogleCredential(email: string): string {
  const encode = (value: string) => Buffer.from(value, 'utf-8').toString('base64url');
  const header = encode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = encode(
    JSON.stringify({
      sub: `e2e-${Date.now()}`,
      email,
      given_name: 'E2E',
      family_name: 'Admin',
      name: 'E2E Admin',
    }),
  );

  return `${header}.${payload}.signature`;
}

async function closeNotifications(page: import('@playwright/test').Page): Promise<void> {
  const closeButton = page.locator('dialog button', { hasText: 'Zamknij' });
  for (let i = 0; i < 5; i++) {
    if ((await closeButton.count()) === 0) break;
    if (!(await closeButton.first().isVisible())) break;
    await closeButton.first().click({ timeout: 2000 });
  }
}

test.describe('E2E - projekty, historyjki i zadania', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await page.addInitScript(() => {
      (window as any).__e2eGoogleCallback = undefined;
      (window as any).google = {
        accounts: {
          id: {
            initialize: (config: { callback: (response: { credential: string }) => void }) => {
              (window as any).__e2eGoogleCallback = config.callback;
            },
            renderButton: () => {},
            prompt: () => {},
          },
        },
      };
    });
  });

  test('powinien utworzyc, zedytowac, zmienic status i usunac projekt/historyjke/zadanie', async ({
    page,
  }) => {
    test.setTimeout(120000);

    const runId = Date.now();
    const projectName = `Projekt E2E ${runId}`;
    const projectEditedName = `Projekt E2E Zmieniony ${runId}`;
    const storyName = `Historyjka E2E ${runId}`;
    const taskName = `Zadanie E2E ${runId}`;
    const taskEditedName = `Zadanie E2E Zmienione ${runId}`;

    await page.goto('/login');
    await page.waitForFunction(() => typeof (window as any).__e2eGoogleCallback === 'function');
    await page.evaluate((credential) => {
      (window as any).__e2eGoogleCallback({ credential });
    }, createFakeGoogleCredential(SUPER_ADMIN_EMAIL));
    await page.waitForURL('**/');
    await expect(page.getByRole('link', { name: 'Projekty' })).toBeVisible();

    await page.getByRole('link', { name: 'Projekty' }).click();
    await page.waitForURL('**/projects');
    await expect(page.getByRole('heading', { name: 'Projekty' })).toBeVisible();
    await page.getByLabel('Nazwa').fill(projectName);
    await page.getByLabel('Opis').fill('Opis projektu E2E');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
    await expect(page.locator('.project-card h3', { hasText: projectName })).toBeVisible();
    await closeNotifications(page);

    await page
      .locator('.project-card', { hasText: projectName })
      .locator('button.btn-edit')
      .click();
    await expect(page.getByRole('heading', { name: 'Edytuj projekt' })).toBeVisible();
    await page.getByLabel('Nazwa').fill(projectEditedName);
    await page.locator('.form-card').getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.locator('.project-card h3', { hasText: projectEditedName })).toBeVisible({
      timeout: 15000,
    });

    await page.locator('#project-select').selectOption({ label: projectEditedName });
    await closeNotifications(page);

    await page.getByRole('link', { name: 'Historyjki' }).click();
    await page.waitForURL('**/');
    await expect(page.getByRole('heading', { name: 'Dodaj nową historyjkę' })).toBeVisible();
    await page.getByLabel('Nazwa').fill(storyName);
    await page.getByLabel('Opis').fill('Opis historyjki E2E');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
    await expect(page.locator('.story-card h3', { hasText: storyName })).toBeVisible();
    await closeNotifications(page);

    await page.locator('.story-card', { hasText: storyName }).locator('button.btn-edit').click();
    await expect(page.getByRole('heading', { name: 'Edytuj historyjkę' })).toBeVisible();
    await page.getByLabel('Stan').selectOption('doing');
    await page.locator('.form-card').getByRole('button', { name: 'Zapisz' }).click();
    await expect(page.getByRole('heading', { name: 'Dodaj nową historyjkę' })).toBeVisible();
    await closeNotifications(page);

    await page.getByRole('link', { name: 'Zadania' }).click();
    await page.waitForURL('**/tasks');
    await expect(page.getByRole('heading', { name: 'Dodaj nowe zadanie' })).toBeVisible();
    await page.getByLabel('Historyjka').selectOption({ label: storyName });
    await page.getByLabel('Nazwa').fill(taskName);
    await page.getByLabel('Opis').fill('Opis zadania E2E');
    await page.getByLabel('Przewidywany czas (h)').fill('4');
    await page.getByRole('button', { name: 'Dodaj', exact: true }).click();
    await expect(page.locator('.task-card h3', { hasText: taskName })).toBeVisible();
    await closeNotifications(page);

    await page.locator('.task-card', { hasText: taskName }).locator('button.btn-edit').click();
    await expect(page.getByRole('heading', { name: 'Edytuj zadanie' })).toBeVisible();
    await page.getByLabel('Nazwa').fill(taskEditedName);
    await page.getByLabel('Stan').selectOption('doing');
    await page.locator('.form-card').getByRole('button', { name: 'Zapisz' }).click();

    const updatedTask = page.locator('.task-card', { hasText: taskEditedName });
    await expect(updatedTask).toBeVisible();
    await expect(updatedTask.locator('.task-status')).toContainText('W trakcie');

    await closeNotifications(page);
    await updatedTask.locator('button.btn-delete').click();

    await page.getByRole('link', { name: 'Historyjki' }).click();
    await page.waitForURL('**/');
    await closeNotifications(page);
    await page.locator('.story-card', { hasText: storyName }).locator('button.btn-delete').click();

    await page.getByRole('link', { name: 'Projekty' }).click();
    await page.waitForURL('**/projects');
    await closeNotifications(page);
    await page
      .locator('.project-card', { hasText: projectEditedName })
      .locator('button.btn-delete')
      .click();
  });
});
