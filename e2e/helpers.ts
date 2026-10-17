import { expect, test as base, type Page } from '@playwright/test';
import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://fichas:fichas-local@127.0.0.1:5432/fichas';

/** The demo user owns everything the tests create; start each test with none of it. */
async function resetDemoUser() {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("DELETE FROM card_fonts WHERE owner_id = 'local-demo-user'");
    await client.query("DELETE FROM decks WHERE owner_id = 'local-demo-user'");
    await client.query("DELETE FROM workspaces WHERE owner_id = 'local-demo-user'");
  } finally {
    await client.end();
  }
}

export const test = base.extend<{ app: Page }>({
  app: async ({ page }, provide) => {
    await resetDemoUser();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Mis exposiciones/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Empezar la guía/ })).toBeVisible();
    await provide(page);
  },
});

export { expect };

export async function waitUntilSaved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: 'Todo guardado' })).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Clicks one of a deck tile's actions. They stay inert until the pointer is
 * over the tile (or the tile has focus), exactly as for a person.
 */
export async function tileAction(
  page: Page,
  title: string,
  action: 'Archivar' | 'Restaurar' | 'Duplicar' | 'Eliminar',
) {
  const tile = page
    .locator('article.deck-item')
    .filter({ has: page.getByRole('heading', { name: title, level: 2, exact: true }) });
  await tile.hover();
  await tile.getByRole('button', { name: `${action} ${title}`, exact: true }).click();
}

/** Creates a deck through the dialog and lands in its editor. */
export async function createDeck(page: Page, title: string) {
  await page
    .getByRole('button', { name: /Nueva exposición/ })
    .first()
    .click();
  await page.getByLabel('Nombre de la exposición').fill(title);
  await page.getByRole('button', { name: 'Crear exposición' }).click();
  await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible();
}
