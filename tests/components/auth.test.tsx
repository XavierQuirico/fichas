import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthShell } from '@/components/auth/auth-shell';

describe('AuthShell', () => {
  it('says what the app is and shows the form it was given', () => {
    render(
      <AuthShell mode="sign-in">
        <form aria-label="Formulario de acceso" />
      </AuthShell>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Habla sin perder el hilo.' }),
    ).toBeVisible();
    expect(screen.getByRole('form', { name: 'Formulario de acceso' })).toBeInTheDocument();
    expect(screen.getByText('Todo se guarda solo')).toBeInTheDocument();
  });

  it('uses its own headline on the sign-up screen', () => {
    render(<AuthShell mode="sign-up">{null}</AuthShell>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Empieza tu primera exposición.' }),
    ).toBeVisible();
  });

  it('hides the decorative card preview from screen readers', () => {
    render(<AuthShell mode="sign-in">{null}</AuthShell>);
    const preview = document.querySelector('.auth-preview') as HTMLElement;
    expect(preview).toHaveAttribute('aria-hidden', 'true');
    expect(preview.querySelectorAll('.auth-card')).toHaveLength(3);
  });

  it('renders the extra block under the form', () => {
    render(
      <AuthShell mode="sign-in" aside={<p>Cuenta de prueba</p>}>
        {null}
      </AuthShell>,
    );
    expect(screen.getByText('Cuenta de prueba')).toBeInTheDocument();
  });
});

describe('DemoAccountHint', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const load = async () => (await import('@/components/auth/demo-account-hint')).DemoAccountHint;

  it('renders nothing unless both demo variables are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_EMAIL', 'demo@example.com');
    vi.stubEnv('NEXT_PUBLIC_DEMO_PASS', '');
    vi.resetModules();
    const DemoAccountHint = await load();
    const { container } = render(<DemoAccountHint />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the account and copies each value, saying so', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_EMAIL', 'demo@example.com');
    vi.stubEnv('NEXT_PUBLIC_DEMO_PASS', 'una-contrasena-de-prueba');
    vi.resetModules();
    const DemoAccountHint = await load();
    const user = userEvent.setup();
    render(<DemoAccountHint />);

    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Copiar correo/ }));
    expect(await navigator.clipboard.readText()).toBe('demo@example.com');
    expect(screen.getByRole('button', { name: /Copiado correo/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Copiar contraseña/ }));
    expect(await navigator.clipboard.readText()).toBe('una-contrasena-de-prueba');
  });
});
