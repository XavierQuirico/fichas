import { existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const clerkStub = new URL('./clerk-server-stub.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@clerk/nextjs/server') return { url: clerkStub, shortCircuit: true };
  if (specifier.startsWith('@/')) {
    const path = specifier.slice(2);
    for (const suffix of ['.ts', '/index.ts', '']) {
      const candidate = new URL(path + suffix, root);
      if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
