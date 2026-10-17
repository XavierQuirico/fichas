import type { ComponentProps } from 'react';
import type { ClerkProvider } from '@clerk/nextjs';

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>;

// Clerk's own components wear the app's colours and type. The values repeat
// the tokens in app/tokens.css because Clerk reads plain strings, not CSS variables.
const terracotta = '#c1592f';
const terracottaHover = '#a84a26';
const ink = '#332a22';
const inkSecondary = '#6b5f4f';
const paperLine = '#dedac4';

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: terracotta,
    colorText: ink,
    colorTextSecondary: inkSecondary,
    colorBackground: '#ffffff',
    colorInputBackground: '#fffdf7',
    colorInputText: ink,
    colorDanger: '#b33d3d',
    colorSuccess: '#4e8a57',
    borderRadius: '12px',
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    fontSize: '15px',
  },
  elements: {
    cardBox: { boxShadow: '0 4px 10px rgba(51, 42, 34, 0.12)', border: `1px solid ${paperLine}` },
    headerTitle: {
      fontFamily: 'Fredoka, "Nunito Sans", sans-serif',
      fontWeight: 600,
      fontSize: '26px',
    },
    formButtonPrimary: {
      backgroundColor: terracotta,
      boxShadow: 'none',
      fontWeight: 700,
      '&:hover, &:focus': { backgroundColor: terracottaHover },
    },
    formFieldInput: {
      borderColor: paperLine,
      '&:focus': { borderColor: terracotta, boxShadow: `0 0 0 3px #f3ddd1` },
    },
    footerActionLink: { color: terracotta, fontWeight: 700, '&:hover': { color: terracottaHover } },
    identityPreviewEditButton: { color: terracotta },
    // The account button next to the help button in the app's top bar.
    userButtonAvatarBox: { width: '40px', height: '40px' },
  },
};
