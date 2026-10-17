import type { ReactNode } from 'react';

export type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
};

function Icon({
  children,
  size = 24,
  strokeWidth = 2,
  className,
  'aria-hidden': hidden = true,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={hidden}
    >
      {children}
    </svg>
  );
}

export const CollectionIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 8.5 L15.5 4.5 A1.5 1.5 0 0 1 17.5 5.5 L19.5 11.5" />
    <path d="M4 10.5h13a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4 10.5z" />
    <path d="M7 15h6" />
  </Icon>
);

export const NewExposureIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const ArchiveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 4.5h17v4h-17z" />
    <path d="M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-10" />
    <path d="M10 13h4" />
  </Icon>
);

export const DeleteIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6.5h16M9 6.5V4.5h6v2M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13M10 11v6M14 11v6" />
  </Icon>
);

export const HelpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.2c-.8.5-1.3 1-1.3 1.9M12 17v.5" />
  </Icon>
);

export const TextSizeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7V5h10v2M9 5v14M14 13v-1.5h6V13M17 11.5V19" />
  </Icon>
);

export const FullscreenIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Icon>
);

export const FilmstripIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5.5h16v13H4zM7 5.5v13M17 5.5v13M4 9h3M17 9h3M4 15h3M17 15h3" />
  </Icon>
);

export const GripIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 5.5l4 4L8 20H4v-4zM13 7l4 4" />
  </Icon>
);

export const HandIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.4 0 0 1 3 0V11M14 11.2V6a1.5 1.5 0 0 1 3 0v9c0 3.3-2.2 6-6 6h-1c-2 0-3-.7-4.2-2.2L5 13.6c-.7-.9-.5-1.9.3-2.4.8-.5 1.7-.3 2.4.4L8 13" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12.5l5 5L20 6" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const DotsIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="6" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="18" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const DuplicateIcon = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <rect
      x="9"
      y="3"
      width="11"
      height="11"
      rx="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="2.5 2.5"
    />
    <rect x="4" y="10" width="11" height="11" rx="2" fill="currentColor" />
  </svg>
);

export function MiniStack() {
  return (
    <span className="mini-stack" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
