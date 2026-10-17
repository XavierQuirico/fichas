'use client';
import { useState } from 'react';

// Set only on the public demo (NEXT_PUBLIC_DEMO_EMAIL and NEXT_PUBLIC_DEMO_PASSWORD).
// Without them nothing is rendered, so a real deployment never shows it.
const email = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

type Field = 'email' | 'password';

export function DemoAccountHint() {
  const [copied, setCopied] = useState<Field | null>(null);
  if (!email || !password) return null;

  const copy = async (field: Field, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      setTimeout(() => setCopied((current) => (current === field ? null : current)), 1800);
    } catch {
      // The value stays on screen to be selected by hand.
    }
  };

  return (
    <aside className="auth-demo" aria-label="Cuenta de prueba">
      <p className="auth-demo-title">¿Solo quieres echar un vistazo?</p>
      <p className="auth-demo-text">
        Entra con la cuenta de prueba, ya tiene exposiciones de ejemplo.
      </p>
      <dl>
        <div>
          <dt>Correo</dt>
          <dd>
            <code>{email}</code>
            <button
              type="button"
              aria-label={`${copied === 'email' ? 'Copiado' : 'Copiar'} correo`}
              onClick={() => void copy('email', email)}
            >
              {copied === 'email' ? 'Copiado' : 'Copiar'}
            </button>
          </dd>
        </div>
        <div>
          <dt>Contraseña</dt>
          <dd>
            <code>{password}</code>
            <button
              type="button"
              aria-label={`${copied === 'password' ? 'Copiado' : 'Copiar'} contraseña`}
              onClick={() => void copy('password', password)}
            >
              {copied === 'password' ? 'Copiado' : 'Copiar'}
            </button>
          </dd>
        </div>
      </dl>
      <span className="sr-only" role="status">
        {copied ? 'Copiado al portapapeles' : ''}
      </span>
    </aside>
  );
}
