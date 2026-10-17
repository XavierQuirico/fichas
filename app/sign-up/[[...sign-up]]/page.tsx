import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { isClerkConfigured } from '@/lib/server/auth';
import { AuthShell } from '@/components/auth/auth-shell';

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
    <AuthShell mode="sign-up">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthShell>
  );
}
