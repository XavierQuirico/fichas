type BrandLogoProps = { size?: number; className?: string };

export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6.2 9.4C6 7.6 7.1 6.4 8.9 6.3L23.8 5.6c1.9-.1 3 1 3.1 2.8l.6 12.4c.1 1.8-1 3-2.8 3.1L9.9 24.6c-1.9.1-3.1-1-3.2-2.8Z"
        fill="rgba(51,42,34,0.18)"
        transform="translate(1.6 2.4) rotate(7 16 16)"
      />
      <path
        d="M6.2 9.4C6 7.6 7.1 6.4 8.9 6.3L23.8 5.6c1.9-.1 3 1 3.1 2.8l.6 12.4c.1 1.8-1 3-2.8 3.1L9.9 24.6c-1.9.1-3.1-1-3.2-2.8Z"
        fill="#FFF8F0"
        stroke="#C1592F"
        strokeWidth="1.6"
        transform="rotate(7 16 16)"
      />
      <path
        d="M11 15.5c3-.7 6 .3 8.5-.4M11.4 20c2-.5 3.3.1 5-.3"
        stroke="#C1592F"
        strokeWidth="2.4"
        strokeLinecap="round"
        transform="rotate(7 16 16)"
      />
      <circle cx="16.5" cy="7.2" r="3.3" fill="#C1592F" />
      <circle cx="15.4" cy="6.2" r="1" fill="#332A22" />
    </svg>
  );
}
