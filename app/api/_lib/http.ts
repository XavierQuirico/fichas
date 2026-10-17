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

/**
 * Reads the body as JSON without ever holding more than `maxBytes` of it.
 * Returns null when the body is too big, undefined when it is not valid JSON.
 * The stream is read in chunks, so the cap holds even with no Content-Length
 * header (chunked uploads).
 */
export async function readJsonWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<unknown | null> {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  const chunks: Uint8Array[] = [];
  let received = 0;
  const reader = request.body?.getReader();
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(value);
    }
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
  } catch {
    return undefined;
  }
}
