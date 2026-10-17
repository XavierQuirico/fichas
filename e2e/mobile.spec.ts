import { createDeck, expect, test, waitUntilSaved } from './helpers';

test('on a phone: create a deck, edit it, present it and leave', async ({ app: page }) => {
  await createDeck(page, 'En el móvil');
  await page.getByLabel('Contenido de la ficha').fill('Escrito con el pulgar');
  await waitUntilSaved(page);

  await page.getByRole('button', { name: 'Exponer' }).click();
  await expect(page.locator('.card-body-text')).toHaveText('Escrito con el pulgar');
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('button', { name: 'Exponer' })).toBeVisible();
});

test('on a phone the design panel opens from its toggle', async ({ app: page }) => {
  await createDeck(page, 'Diseño móvil');
  const toggle = page.getByRole('button', { name: /Hazla tuya/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});
