import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { esMX } from '@clerk/localizations';
import './globals.css';
export const metadata: Metadata = {
  title: 'Fichas — tus ideas, a mano',
  description: 'Prepara tus exposiciones con fichas personalizables y presenta a tu ritmo.',
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
          <ClerkProvider publishableKey={key} localization={esMX} telemetry={false}>
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
