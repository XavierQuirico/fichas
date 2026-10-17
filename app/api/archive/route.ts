import { authenticatedUserId } from '@/lib/server/auth';
import { database } from '@/db/store';
import { readArchivedDeckIds, setDeckArchived } from '@/lib/server/workspace-repository';
import { isSameOriginMutation } from '@/lib/server/request-security';
import { archivePayloadSchema } from '@/lib/server/workspace-schema';
import {
  forbidden,
  noStoreHeaders,
  readJsonWithinLimit,
  serviceUnavailable,
  tooManyRequests,
  unauthorized,
} from '@/app/api/_lib/http';
import { archiveWriteLimit } from '@/app/api/_lib/limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ownerId = await authenticatedUserId();
  if (!ownerId) return unauthorized();
  try {
    const ids = await readArchivedDeckIds(database(), ownerId);
    return Response.json({ ids }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Archive read failed', error);
    return serviceUnavailable('No pudimos cargar el archivo.');
  }
}

export async function PUT(request: Request) {
  const ownerId = await authenticatedUserId();
  if (!ownerId) return unauthorized();
  if (!isSameOriginMutation(request)) return forbidden();
  const limit = archiveWriteLimit(ownerId);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
  try {
    const raw = await readJsonWithinLimit(request, 8_192);
    if (raw === null)
      return Response.json(
        { error: 'Datos demasiado grandes.' },
        { status: 413, headers: noStoreHeaders },
      );
    const parsed = archivePayloadSchema.safeParse(raw);
    if (!parsed.success)
      return Response.json({ error: 'Datos inválidos' }, { status: 400, headers: noStoreHeaders });
    const updated = await setDeckArchived(
      database(),
      ownerId,
      parsed.data.id,
      parsed.data.archived,
    );
    if (!updated)
      return Response.json(
        { error: 'No se encontró la exposición.' },
        { status: 404, headers: noStoreHeaders },
      );
    return Response.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Archive write failed', error);
    return serviceUnavailable('No pudimos actualizar el archivo.');
  }
}
