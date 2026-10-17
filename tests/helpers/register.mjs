// Lets Node run the route handlers directly: resolves the "@/" alias and swaps
// the Clerk server SDK for a stub whose session comes from `globalThis.__testUserId`.
import { register } from 'node:module';

register('./hooks.mjs', import.meta.url);
