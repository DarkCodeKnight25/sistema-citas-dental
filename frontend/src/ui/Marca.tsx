/** Marca de Dental Qori: una Q trazada con la misma línea de 1 px de acento que marca las selecciones. */
export function Marca({ tam = 28 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 32 32" aria-hidden="true" className="marca">
      <circle cx="15" cy="15" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M19.5 19.5 25 25" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="15" cy="15" r="2.4" fill="currentColor" />
    </svg>
  )
}
