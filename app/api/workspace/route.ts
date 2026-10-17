import { authenticatedUserId } from '@/lib/server/auth';
import { database } from '@/db/store';
import { readWorkspace, writeWorkspace } from '@/lib/server/workspace-repository';
import { isSameOriginMutation } from '@/lib/server/request-security';
import { MAX_WORKSPACE_BYTES, workspacePayloadSchema } from '@/lib/server/workspace-schema';
import {
  forbidden,
  noStoreHeaders,
  payloadTooLarge,
  readJsonWithinLimit,
  serviceUnavailable,
  tooManyRequests,
  unauthorized,
} from '@/app/api/_lib/http';
import { workspaceWriteLimit } from '@/app/api/_lib/limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ownerId = await authenticatedUserId();
  if (!ownerId) return unauthorized();
  try {
    const workspace = await readWorkspace(database(), ownerId);
    return Response.json(workspace, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Workspace read failed', error);
    return serviceUnavailable('No pudimos cargar tus exposiciones.');
  }
}

export async function PUT(request: Request) {
  const ownerId = await authenticatedUserId();
  if (!ownerId) return unauthorized();
  if (!isSameOriginMutation(request)) return forbidden();
  const limit = workspaceWriteLimit(ownerId);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
  try {
    const raw = await readJsonWithinLimit(request, MAX_WORKSPACE_BYTES);
    if (raw === null) return payloadTooLarge();
    const parsed = workspacePayloadSchema.safeParse(raw);
    if (!parsed.success)
      return Response.json(
        { error: 'Revisa el contenido de las fichas.' },
        { status: 400, headers: noStoreHeaders },
      );
    const revision = await writeWorkspace(database(), ownerId, parsed.data);
    if (revision === null) {
      return Response.json(
        {
          error:
            'Esta exposición cambió en otra ventana. Tus cambios siguen aquí; recarga después de copiarlos.',
        },
        { status: 409, headers: noStoreHeaders },
      );
    }
    return Response.json({ revision }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Workspace write failed', error);
    return serviceUnavailable('No se pudo guardar. Tus cambios siguen en pantalla.');
  }
}
