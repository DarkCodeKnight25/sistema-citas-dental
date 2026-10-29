import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, Search } from 'lucide-react'
import { api } from '../api/cliente'
import type { PacienteResumen } from '../api/tipos'
import { celular } from '../lib/fechas'

export function Pacientes() {
  const [texto, setTexto] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = window.setTimeout(() => setQ(texto.trim()), 250)
    return () => window.clearTimeout(t)
  }, [texto])

  const lista = useQuery({
    queryKey: ['pacientes', q],
    queryFn: () => api<PacienteResumen[]>(`/api/pacientes?q=${encodeURIComponent(q)}`),
    placeholderData: (previo) => previo,
  })

  return (
    <div className="pagina pagina-angosta">
      <header className="fila-titulo">
        <div>
          <h1>Pacientes</h1>
          <p className="hallazgo">Busca por nombre, DNI o celular. Se muestran hasta 50 resultados.</p>
        </div>
      </header>

      <div className="entrada-icono buscador-grande">
        <Search size={15} aria-hidden="true" />
        <input
          className="entrada"
          placeholder="Ej.: Quispe, 4512… o 987…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Buscar paciente"
          autoFocus
        />
      </div>

      {lista.error ? (
        <div className="error-bloque">
          <CircleAlert size={16} /> {lista.error.message}
        </div>
      ) : (
        <table className="tabla">
          <caption className="sr-only">Pacientes</caption>
          <thead>
            <tr>
              <th>Paciente</th>
              <th className="der">DNI</th>
              <th className="der">Celular</th>
            </tr>
          </thead>
          <tbody>
            {lista.isPending &&
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i}>
                  <td>
                    <span className="esqueleto" style={{ width: 180 }} />
                  </td>
                  <td />
                  <td />
                </tr>
              ))}
            {lista.data?.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={`/panel/pacientes/${p.id}`} className="enlace-fila">
                    {p.apellidos}, {p.nombres}
                  </Link>
                </td>
                <td className="der num">{p.dni ?? <span className="gris">—</span>}</td>
                <td className="der num">{celular(p.celular)}</td>
              </tr>
            ))}
            {lista.data?.length === 0 && (
              <tr>
                <td colSpan={3} className="gris">
                  Nadie coincide con «{q}». Revisa la ortografía o busca por celular.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
