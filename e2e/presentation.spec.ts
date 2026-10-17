import { createDeck, expect, test, waitUntilSaved } from './helpers';

const counter = (page: import('@playwright/test').Page) => page.locator('.present-counter');

test('the guide opens in presentation mode and keyboard navigation moves between cards', async ({
  app: page,
}) => {
  await page.getByRole('button', { name: /Empezar la guía/ }).click();
  await expect(page.getByRole('heading', { name: 'Prueba a deslizar.' })).toBeVisible();
  await expect(counter(page)).toContainText('01');

  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Salta a cualquier idea.' })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('heading', { name: 'Prueba a deslizar.' })).toBeVisible();
  await page.keyboard.press('End');
  await expect(counter(page)).toContainText('Fin');
  await expect(page.getByRole('heading', { name: /Llegaste\s+al final/ })).toBeVisible();
});

test('dragging the card to the left goes to the next card and to the right goes back', async ({
  app: page,
}) => {
  await page.getByRole('button', { name: /Empezar la guía/ }).click();
  const card = page.locator('article.present-card');
  const box = (await card.boundingBox())!;
  const y = box.y + box.height / 2;

  const drag = async (fromX: number, toX: number) => {
    await page.mouse.move(fromX, y);
    await page.mouse.down();
    await page.mouse.move((fromX + toX) / 2, y, { steps: 6 });
    await page.mouse.move(toX, y, { steps: 6 });
    await page.mouse.up();
  };

  await drag(box.x + box.width * 0.8, box.x + box.width * 0.1);
  await expect(counter(page)).toContainText('02');
  await drag(box.x + box.width * 0.1, box.x + box.width * 0.8);
  await expect(counter(page)).toContainText('01');
});

test('a short drag does not change the card', async ({ app: page }) => {
  await page.getByRole('button', { name: /Empezar la guía/ }).click();
  const box = (await page.locator('article.present-card').boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 25, y, { steps: 4 });
  await page.mouse.up();
  await expect(counter(page)).toContainText('01');
});

test('a thumbnail jumps straight to its card, and Salir returns to the editor', async ({
  app: page,
}) => {
  await page.getByRole('button', { name: /Empezar la guía/ }).click();
  await page.getByRole('button', { name: /Ir a ficha 3/ }).click();
  await expect(page.getByRole('heading', { name: 'Elige cómo moverte.' })).toBeVisible();

  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('button', { name: 'Exponer' })).toBeVisible();
  await expect(page.getByLabel('Título de la ficha (opcional)')).toHaveValue('Elige cómo moverte.');
});

test('Exponer shows the deck being edited, and Escape leaves', async ({ app: page }) => {
  await createDeck(page, 'Mi exposición');
  await page.getByLabel('Título de la ficha (opcional)').fill('Idea uno');
  await page.getByLabel('Contenido de la ficha').fill('Cuerpo uno');
  await waitUntilSaved(page);

  await page.getByRole('button', { name: 'Exponer' }).click();
  await expect(page.getByRole('heading', { name: 'Idea uno' })).toBeVisible();
  await expect(page.locator('.card-body-text')).toHaveText('Cuerpo uno');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Exponer' })).toBeVisible();
});

test('the navigation options hide the thumbnails and the choice is remembered', async ({
  app: page,
}) => {
  const saved = page.waitForResponse(
    (r) => r.url().endsWith('/api/workspace') && r.request().method() === 'PUT' && r.ok(),
  );
  await page.getByRole('button', { name: /Empezar la guía/ }).click();
  await page.getByRole('button', { name: 'Opciones de navegación' }).click();
  await page.getByRole('switch', { name: /Miniaturas de las fichas/ }).click();
  await page.getByRole('button', { name: /Listo/ }).click();
  await expect(page.locator('.presentation')).toHaveClass(/thumbs-hidden/);
  await saved; // the presentation hides the status bar, so wait for the autosave itself

  await page.reload();
  await page.getByRole('button', { name: 'Abrir Tu primera vuelta por Fichas' }).click();
  await page.getByRole('button', { name: 'Exponer' }).click();
  await expect(page.locator('.presentation')).toHaveClass(/thumbs-hidden/);
});
