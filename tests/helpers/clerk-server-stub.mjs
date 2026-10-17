// Stand-in for `@clerk/nextjs/server` in tests. The signed-in user is whatever
// the test put in `globalThis.__testUserId`; null means no session.
export async function auth() {
  return { userId: globalThis.__testUserId ?? null };
}
