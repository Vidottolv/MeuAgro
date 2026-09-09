export function authBrand({
  eyebrow = 'Meu Agro',
  title =
    'Cultive informação. Colha decisões melhores.',
  description =
    'Gerencie propriedades, plantios, estoque e colheitas em um só lugar.',
} = {}) {
  return `
    <header class="auth-brand">
      <div
        class="brand__mark"
        aria-hidden="true"
      >
        🌱
      </div>

      <div>
        <p class="brand__eyebrow">
          ${eyebrow}
        </p>

        <h1 class="auth-brand__title">
          ${title}
        </h1>

        <p class="auth-brand__description">
          ${description}
        </p>
      </div>
    </header>
  `;
}
