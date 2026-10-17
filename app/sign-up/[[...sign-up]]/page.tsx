import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { isClerkConfigured } from '@/lib/auth';
import { BrandLogo } from '@/components/brand-logo';

export default function SignUpPage() {
  if (!isClerkConfigured())
    return (
      <main className="auth-setup-screen">
        <section className="auth-setup-card">
          <h1>Configura tu entorno</h1>
          <p>Añade las claves de Clerk para crear una cuenta.</p>
          <Link href="/">Volver</Link>
        </section>
      </main>
    );
  return (
    <main className="auth-screen">
      <section className="auth-brand">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <BrandLogo size={32} />
          </span>
          fichas<span className="brand-dot">.</span>
        </Link>
        <p>Prepara. Respira. Comparte.</p>
      </section>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}
