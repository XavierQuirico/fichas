import { auth } from '@clerk/nextjs/server';

const demoUserId = 'local-demo-user';

export function isClerkConfigured(): boolean {
  return (
    process.env.AUTH_MODE !== 'demo' &&
    Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  );
}

export async function authenticatedUserId(): Promise<string | null> {
  if (process.env.AUTH_MODE === 'demo') {
    return process.env.NODE_ENV === 'production' ? null : demoUserId;
  }
  if (!isClerkConfigured()) return null;
  try {
    const session = await auth();
    return session.userId ?? null;
  } catch {
    return null;
  }
}
