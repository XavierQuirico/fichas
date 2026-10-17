import { createDeck, expect, test, tileAction, waitUntilSaved } from './helpers';

test('a new deck and its card text are autosaved and survive a reload', async ({ app: page }) => {
  await createDeck(page, 'Charla de prueba');
  await page.getByLabel('Título de la ficha (opcional)').fill('Primera idea');
  await page.getByLabel('Contenido de la ficha').fill('Hablar despacio y mirar al público.');
  await waitUntilSaved(page);

  await page.reload();
  await page.getByRole('button', { name: 'Abrir Charla de prueba' }).click();
  await expect(page.getByLabel('Título de la ficha (opcional)')).toHaveValue('Primera idea');
  await expect(page.getByLabel('Contenido de la ficha')).toHaveValue(
    'Hablar despacio y mirar al público.',
  );
});

test('the status shows pending while typing and settles on "Todo guardado"', async ({
  app: page,
}) => {
  await createDeck(page, 'Estado');
  await page.getByLabel('Contenido de la ficha').fill('texto');
  await expect(
    page.getByRole('status').filter({ hasText: /Cambios pendientes|Guardando/ }),
  ).toBeVisible();
  await waitUntilSaved(page);
});

test('cards can be added, edited and removed with undo', async ({ app: page }) => {
  await createDeck(page, 'Fichas');
  await page.getByRole('button', { name: 'Añadir ficha' }).click();
  await expect(page.getByText('2 / 2').first()).toBeVisible();
  await page.getByLabel('Contenido de la ficha').fill('Segunda');
  await waitUntilSaved(page);

  await page.getByRole('button', { name: 'Opciones de ficha 2' }).click();
  await page.getByRole('menuitem', { name: 'Eliminar ficha' }).click();
  await expect(page.getByText('Ficha eliminada')).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.getByRole('button', { name: /Ir a ficha 2/ })).toBeVisible();
  await waitUntilSaved(page);
});

test('a deck can be renamed and then deleted', async ({ app: page }) => {
  await createDeck(page, 'Nombre viejo');
  await page
    .getByRole('button', { name: /Nombre viejo/ })
    .first()
    .click();
  await page.getByRole('textbox').fill('Nombre nuevo');
  await page.getByRole('button', { name: 'Guardar nombre' }).click();
  await expect(page.getByRole('heading', { name: 'Nombre nuevo', level: 1 })).toBeVisible();
  await waitUntilSaved(page);

  await page.getByRole('button', { name: 'Volver a mis exposiciones' }).click();
  await tileAction(page, 'Nombre nuevo', 'Eliminar');
  await page.getByRole('button', { name: 'Eliminar exposición' }).click();
  await expect(page.getByRole('button', { name: 'Abrir Nombre nuevo' })).toHaveCount(0);
  await waitUntilSaved(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Abrir Nombre nuevo' })).toHaveCount(0);
});

test('archiving hides a deck, keeps it after reload, and restoring brings it back', async ({
  app: page,
}) => {
  await createDeck(page, 'Para archivar');
  await page.getByRole('button', { name: 'Volver a mis exposiciones' }).click();
  await waitUntilSaved(page);

  await tileAction(page, 'Para archivar', 'Archivar');
  await expect(page.getByText('Exposición archivada')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir Para archivar' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('button', { name: /Archivadas \(1\)/ })).toBeVisible();
  await page.getByRole('button', { name: /Archivadas \(1\)/ }).click();
  await expect(page.getByRole('button', { name: 'Abrir Para archivar' })).toBeVisible();

  await tileAction(page, 'Para archivar', 'Restaurar');
  await page.getByRole('button', { name: 'Volver a las actuales' }).click();
  await expect(page.getByRole('button', { name: 'Abrir Para archivar' })).toBeVisible();
});

test('archiving does not delete the deck when the collection is saved again', async ({
  app: page,
}) => {
  await createDeck(page, 'Sigue aquí');
  await page.getByRole('button', { name: 'Volver a mis exposiciones' }).click();
  await tileAction(page, 'Sigue aquí', 'Archivar');
  await expect(page.getByText('Exposición archivada')).toBeVisible();

  // Any edit saves the whole collection again, archived decks included.
  await createDeck(page, 'Otra');
  await waitUntilSaved(page);

  await page.reload();
  await page.getByRole('button', { name: /Archivadas \(1\)/ }).click();
  await expect(page.getByRole('button', { name: 'Abrir Sigue aquí' })).toBeVisible();
});

test('a typography chosen right after creating a card is saved and survives a reload', async ({
  app: page,
}) => {
  // Picked immediately, before the autosave of the new card has run: the font
  // save has to wait for the card to exist on the server.
  await createDeck(page, 'Tipografías');
  await page.getByRole('button', { name: 'A mano' }).click();
  await expect(page.getByRole('button', { name: 'A mano' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('No se guardó la tipografía')).toHaveCount(0);

  await page.reload();
  await page.getByRole('button', { name: 'Abrir Tipografías' }).click();
  await expect(page.getByRole('button', { name: 'A mano' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the check on the chosen typography is drawn inside its button', async ({ app: page }) => {
  await createDeck(page, 'Marca');
  const chosen = page.locator('.font-options button[aria-pressed="true"]');
  await expect(chosen).toHaveCount(1);
  // The check is an absolutely positioned ::after; without a positioned
  // button it lands in a corner of the page.
  await expect(chosen).toHaveCSS('position', 'relative');
  const check = await chosen.evaluate((el) => {
    const after = getComputedStyle(el, '::after');
    return { content: after.content, position: after.position };
  });
  expect(check.position).toBe('absolute');
});

test('a card added with the typography of the current one keeps it', async ({ app: page }) => {
  await createDeck(page, 'Hereda');
  await page.getByRole('button', { name: 'Mono' }).click();
  await expect(page.getByRole('button', { name: 'Mono' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Añadir ficha' }).click();
  await expect(page.getByText('2 / 2').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mono' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('No se guardó la tipografía')).toHaveCount(0);
  await waitUntilSaved(page);

  await page.reload();
  await page.getByRole('button', { name: 'Abrir Hereda' }).click();
  await page.getByRole('button', { name: /Ir a ficha 2/ }).click();
  await expect(page.getByRole('button', { name: 'Mono' })).toHaveAttribute('aria-pressed', 'true');
});

test('the top row of a deck cover paints above its stack of cards, so tooltips are not hidden', async ({
  app: page,
}) => {
  await createDeck(page, 'Apilado');
  await page.getByRole('button', { name: 'Volver a mis exposiciones' }).click();
  const cover = page.locator('article.deck-item .deck-cover').first();
  await expect(cover).toBeVisible();

  const { topline, stack, position } = await cover.evaluate((el) => {
    const z = (node: Element) => Number.parseInt(getComputedStyle(node).zIndex, 10);
    const topRow = el.querySelector('.deck-cover-topline')!;
    const layers = [...el.querySelectorAll('.stack, .stack *')].map(z).filter(Number.isFinite);
    return {
      topline: z(topRow),
      stack: Math.max(0, ...layers),
      position: getComputedStyle(topRow).position,
    };
  });
  expect(position).not.toBe('static');
  expect(topline).toBeGreaterThan(stack);
});

test('a duplicated deck is a separate copy', async ({ app: page }) => {
  await createDeck(page, 'Original');
  await page.getByRole('button', { name: 'Volver a mis exposiciones' }).click();
  await tileAction(page, 'Original', 'Duplicar');
  await expect(page.getByRole('button', { name: 'Abrir Original (copia)' })).toBeVisible();
  await waitUntilSaved(page);
});
