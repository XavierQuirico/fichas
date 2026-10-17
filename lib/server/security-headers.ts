const clerkScriptHosts = [
  'https://*.clerk.accounts.dev',
  'https://challenges.cloudflare.com',
  'https://*.protect.clerk.com:*',
];

const clerkConnectHosts = [
  'https://*.clerk.accounts.dev',
  'https://clerk-telemetry.com',
  'https://*.protect.clerk.com:*',
];

/**
 * Content Security Policy for the app and the Clerk widgets.
 * Next.js injects inline scripts for hydration, so `script-src` keeps
 * 'unsafe-inline'. A per-request nonce would remove it, at the cost of
 * making every page dynamic.
 */
export function contentSecurityPolicy({ development }: { development: boolean }): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(development ? ["'unsafe-eval'"] : []),
      ...clerkScriptHosts,
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://img.clerk.com'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...(development ? ['ws:', 'wss:'] : []), ...clerkConnectHosts],
    'frame-src': ["'self'", 'https://challenges.cloudflare.com', 'https://*.clerk.accounts.dev'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (!development) policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}

export function securityHeaders({
  development,
}: {
  development: boolean;
}): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy({ development }) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
    ...(development
      ? []
      : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
  ];
}
