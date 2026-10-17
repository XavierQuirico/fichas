import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Topbar } from '@/components/workspace/topbar';

describe('Topbar', () => {
  const props = { status: 'saved' as const, helpOpen: false, onHome: vi.fn(), onHelp: vi.fn() };

  it('puts the save status first, then help, and the account control at the far right', () => {
    render(<Topbar {...props} accountControl={<button aria-label="Cuenta">U</button>} />);
    const right = document.querySelector('.topbar-right') as HTMLElement;
    const order = [...right.querySelectorAll('[role="status"], button')].map(
      (el) => el.getAttribute('aria-label') ?? el.getAttribute('role'),
    );
    expect(order).toEqual(['status', 'Cómo usar Fichas', 'Cuenta']);
  });

  it('keeps help and account together in one group', () => {
    render(<Topbar {...props} accountControl={<button aria-label="Cuenta">U</button>} />);
    const group = document.querySelector('.topbar-actions') as HTMLElement;
    expect(group).toContainElement(screen.getByRole('button', { name: 'Cómo usar Fichas' }));
    expect(group).toContainElement(screen.getByRole('button', { name: 'Cuenta' }));
    expect(group).not.toContainElement(screen.getByRole('status'));
  });

  it('works without an account control (local demo mode)', () => {
    render(<Topbar {...props} />);
    expect(screen.getByRole('button', { name: 'Cómo usar Fichas' })).toBeInTheDocument();
  });
});
