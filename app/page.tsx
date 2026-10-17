import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Home from './workspace-client';
import { isClerkConfigured } from '@/lib/auth';
import { BrandLogo } from '@/components/brand-logo';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (process.env.AUTH_MODE === 'demo' && process.env.NODE_ENV !== 'production') return <Home />;

  if (!isClerkConfigured()) {
    return (
      <main className="auth-setup-screen">
        <section className="auth-setup-card">
          <span className="brand-icon">
            <BrandLogo size={32} />
          </span>
          <h1>Configura tu entorno</h1>
          <p>Para abrir Fichas, configura Clerk y PostgreSQL según la guía de instalación.</p>
        </section>
      </main>
    );
  }

  const session = await auth();
  if (!session.userId) redirect('/sign-in');
  return <Home accountControl={<UserButton />} />;
}
