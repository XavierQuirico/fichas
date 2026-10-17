import { createRateLimiter } from '@/lib/rate-limit';

// Autosave sends at most one request every ~0.7 s, so 120 per minute leaves room for normal use.
export const workspaceWriteLimit = createRateLimiter({ limit: 120, windowMs: 60_000 });
export const archiveWriteLimit = createRateLimiter({ limit: 30, windowMs: 60_000 });
export const fontsWriteLimit = createRateLimiter({ limit: 30, windowMs: 60_000 });
