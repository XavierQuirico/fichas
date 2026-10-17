import { esMX } from '@clerk/localizations';

// The stock Spanish text addresses people as "usted" and has a typo in the
// sign-up footer. Fichas talks to people as "tú", so the entry screens are
// rewritten here and everything else keeps the stock translation.
export const localization = {
  ...esMX,
  signIn: {
    ...esMX.signIn,
    start: {
      ...esMX.signIn?.start,
      title: 'Te damos la bienvenida',
      subtitle: 'Entra para seguir con tus fichas',
      actionText: '¿Aún no tienes cuenta?',
      actionLink: 'Crea una',
    },
  },
  signUp: {
    ...esMX.signUp,
    start: {
      ...esMX.signUp?.start,
      title: 'Crea tu cuenta',
      subtitle: 'Te lleva menos de un minuto',
      actionText: '¿Ya tienes cuenta?',
      actionLink: 'Entra',
    },
  },
};
