export function loader({
  label = 'Carregando…',
} = {}) {
  return `
    <div
      class="page-loader"
      role="status"
      aria-live="polite"
    >
      <span class="page-loader__spinner"></span>
      <span>${label}</span>
    </div>
  `;
}
