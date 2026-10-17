import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { isClerkConfigured } from '@/lib/server/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { DemoAccountHint } from '@/components/auth/demo-account-hint';

export default function SignInPage() {
  if (!isClerkConfigured())
    return (
      <main className="auth-setup-screen">
        <section className="auth-setup-card">
          <h1>Configura tu entorno</h1>
          <p>Añade las claves de Clerk para iniciar sesión.</p>
          <Link href="/">Volver</Link>
        </section>
      </main>
    );
  return (
    <AuthShell mode="sign-in" aside={<DemoAccountHint />}>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthShell>
  );
}
