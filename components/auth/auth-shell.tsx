import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { CardPreview } from './card-preview';

const copy = {
  'sign-in': {
    title: 'Habla sin perder el hilo.',
    text: 'Prepara tu exposición en fichas, una idea en cada una, y desliza mientras hablas.',
  },
  'sign-up': {
    title: 'Empieza tu primera exposición.',
    text: 'Crea tu cuenta y ten todas tus fichas guardadas en un solo lugar.',
  },
} as const;

const benefits = [
  'Una idea por ficha, sin muros de texto',
  'Desliza para avanzar mientras hablas',
  'Todo se guarda solo',
];

type AuthShellProps = {
  mode: keyof typeof copy;
  children: ReactNode;
  /** Shown under the form, for example the demo account. */
  aside?: ReactNode;
};

/** The frame around Clerk's sign-in and sign-up forms: what the app is, then the form. */
export function AuthShell({ mode, children, aside }: AuthShellProps) {
  const { title, text } = copy[mode];
  return (
    <main className="auth-screen">
      <section className="auth-stage">
        <Link className="brand" href="/" aria-label="Fichas">
          <span className="brand-icon">
            <BrandLogo size={32} />
          </span>
          fichas<span className="brand-dot">.</span>
        </Link>
        <h1>{title}</h1>
        <p className="auth-lead">{text}</p>
        <CardPreview />
        <ul className="auth-benefits">
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </section>
      <section className="auth-panel">
        {children}
        {aside}
        <p className="auth-privacy">Tus exposiciones son privadas: solo tú las ves.</p>
      </section>
    </main>
  );
}
