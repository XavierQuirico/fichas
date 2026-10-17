import { authenticatedUserId } from '@/lib/auth';
import { database } from '@/db/store';
import { readCardFonts, writeCardFonts } from '@/lib/workspace-repository';
import { isSameOriginMutation } from '@/lib/request-security';
import { fontsPayloadSchema } from '@/lib/workspace-schema';
import {
  forbidden,
  noStoreHeaders,
  readJsonWithinLimit,
  serviceUnavailable,
  tooManyRequests,
  unauthorized,
} from '@/app/api/_lib/http';
import { fontsWriteLimit } from '@/app/api/_lib/limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ownerId = await authenticatedUserId();
  if (!ownerId) return unauthorized();
  try {
    const fonts = await readCardFonts(database(), ownerId);
    return Response.json({ fonts }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Card font read failed', error);
    return serviceUnavailable('No pudimos cargar las tipografías.');
  }
}

export async function PUT(request: Request) {
  const ownerId = await authenticatedUserId();
  if (!ownerId) return unauthorized();
  if (!isSameOriginMutation(request)) return forbidden();
  const limit = fontsWriteLimit(ownerId);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
  try {
    const raw = await readJsonWithinLimit(request, 32_768);
    if (raw === null)
      return Response.json(
        { error: 'Datos demasiado grandes.' },
        { status: 413, headers: noStoreHeaders },
      );
    const parsed = fontsPayloadSchema.safeParse(raw);
    if (!parsed.success)
      return Response.json({ error: 'Datos inválidos' }, { status: 400, headers: noStoreHeaders });

    const saved = await writeCardFonts(database(), ownerId, parsed.data);
    if (!saved)
      return Response.json(
        { error: 'No se encontró una o más fichas.' },
        { status: 404, headers: noStoreHeaders },
      );
    return Response.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Card font write failed', error);
    return serviceUnavailable('No pudimos guardar las tipografías.');
  }
}
