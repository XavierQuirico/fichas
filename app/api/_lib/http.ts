export const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' };

export function unauthorized() {
  return Response.json(
    { error: 'Inicia sesión para continuar.' },
    { status: 401, headers: noStoreHeaders },
  );
}

export function forbidden() {
  return Response.json(
    { error: 'La solicitud debe originarse en esta aplicación.' },
    { status: 403, headers: noStoreHeaders },
  );
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { error: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' },
    { status: 429, headers: { ...noStoreHeaders, 'Retry-After': String(retryAfterSeconds) } },
  );
}

export function serviceUnavailable(message = 'El servicio no está configurado.') {
  return Response.json({ error: message }, { status: 503, headers: noStoreHeaders });
}

export function payloadTooLarge() {
  return Response.json(
    { error: 'El contenido supera el tamaño permitido.' },
    { status: 413, headers: noStoreHeaders },
  );
}

export async function readJsonWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<unknown | null> {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}
