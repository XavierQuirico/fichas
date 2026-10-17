import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { clerkAppearance } from '@/lib/clerk-appearance';
import { localization } from '@/lib/clerk-localization';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fichas: prepara y presenta tus exposiciones',
  description:
    'Prepara tus exposiciones en fichas, una idea por ficha, y preséntalas deslizando a tu ritmo.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const key =
    process.env.AUTH_MODE === 'demo' && process.env.NODE_ENV === 'production'
      ? undefined
      : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html lang="es">
      <body>
        {key ? (
          <ClerkProvider
            publishableKey={key}
            localization={localization}
            appearance={clerkAppearance}
            telemetry={false}
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
