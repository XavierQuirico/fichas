const cards = [
  {
    className: 'auth-card-lemon',
    title: 'Empieza con la pregunta',
    body: 'Una frase, sin tecnicismos.',
  },
  { className: 'auth-card-blue', title: 'Tres ideas, no diez', body: 'Lo demás lo cuentas tú.' },
  { className: 'auth-card-mint', title: 'Cierra con calma', body: 'Una pausa y una sonrisa.' },
];

/**
 * Three cards that take turns leaving to the left, the way a card leaves when
 * you present. It is only decoration, so it is hidden from screen readers, and
 * the movement stops for people who ask for less motion (see auth.css).
 */
export function CardPreview() {
  return (
    <div className="auth-preview" aria-hidden="true">
      {cards.map((card) => (
        <div key={card.title} className={`auth-card ${card.className}`}>
          <strong>{card.title}</strong>
          <span>{card.body}</span>
        </div>
      ))}
    </div>
  );
}
