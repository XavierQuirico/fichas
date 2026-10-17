import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { HelpIcon } from '@/components/icons';
import type { SaveStatus as Status } from '@/hooks/use-workspace-sync';
import { SaveStatus } from './save-status';

type TopbarProps = {
  status: Status;
  accountControl?: ReactNode;
  helpOpen: boolean;
  onHome: () => void;
  onHelp: () => void;
};

/**
 * Left to right: save status, help, account. The account menu sits at the far
 * right, where people look for it, and stays beside the other icon button.
 */
export function Topbar({ status, accountControl, helpOpen, onHome, onHelp }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={onHome} aria-label="Fichas, ir a mis exposiciones">
          <span className="brand-icon">
            <BrandLogo size={32} />
          </span>
          fichas<span className="brand-dot">.</span>
        </button>
        <div className="topbar-right">
          <SaveStatus status={status} />
          <div className="topbar-actions">
            <button
              className="icon-button help-button"
              onClick={onHelp}
              aria-label="Cómo usar Fichas"
              aria-haspopup="dialog"
              aria-expanded={helpOpen}
            >
              <HelpIcon size={21} />
            </button>
            {accountControl}
          </div>
        </div>
      </div>
    </header>
  );
}
