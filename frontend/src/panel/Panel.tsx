import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarClock, CalendarDays, LogOut, MessageCircle, Settings, Users } from 'lucide-react'
import { useSesion, puedeGestionar } from '../lib/sesion'
import { useBandeja } from '../lib/consultas'
import { Marca } from '../ui/Marca'
import { ProveedorTostada } from '../ui/Tostada'
import { Login } from './Login'
import { Hoy } from './Hoy'
import { Semana } from './Semana'
import { Pacientes } from './Pacientes'
import { FichaPaciente } from './FichaPaciente'
import { Recordatorios } from './Recordatorios'
import { Ajustes } from './Ajustes'
import { ProveedorHojas } from './Hojas'
import './panel.css'

export default function Panel() {
  const { usuario, cargando } = useSesion()
  if (cargando) return <div className="cargando-panel" aria-busy="true" />
  if (!usuario) return <Login />

  return (
    <ProveedorTostada>
      <ProveedorHojas>
        <div className="shell">
          <Riel />
          <main className="lienzo">
            <Routes>
              <Route index element={<Hoy />} />
              <Route path="semana" element={<Semana />} />
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="pacientes/:id" element={<FichaPaciente />} />
              <Route path="recordatorios" element={puedeGestionar(usuario) ? <Recordatorios /> : <Navigate to="/panel" />} />
              <Route path="ajustes" element={<Ajustes />} />
              <Route path="*" element={<Navigate to="/panel" replace />} />
            </Routes>
          </main>
        </div>
      </ProveedorHojas>
    </ProveedorTostada>
  )
}

function Riel() {
  const { usuario, salir } = useSesion()
  const gestiona = puedeGestionar(usuario)
  const bandeja = useBandeja(gestiona)
  const porEnviar = bandeja.data?.porEnviar.length ?? 0

  const enlaces = [
    { a: '/panel', icono: CalendarClock, texto: 'Hoy', fin: true },
    { a: '/panel/semana', icono: CalendarDays, texto: 'Semana' },
    { a: '/panel/pacientes', icono: Users, texto: 'Pacientes' },
    ...(gestiona
      ? [{ a: '/panel/recordatorios', icono: MessageCircle, texto: 'Recordatorios', cuenta: porEnviar }]
      : []),
  ]

  return (
    <nav className="riel" aria-label="Secciones del panel">
      <a href="/" className="riel-marca" title="Dental Qori · ver la página de reservas">
        <Marca tam={28} />
        <span className="sr-only">Dental Qori, página de reservas</span>
      </a>
      <ul>
        {enlaces.map(({ a, icono: Icono, texto, fin, cuenta }) => (
          <li key={a}>
            <NavLink to={a} end={fin} className="riel-item" title={texto} aria-label={cuenta ? `${texto}: ${cuenta} por enviar` : texto}>
              <Icono size={18} strokeWidth={1.6} />
              <span className="riel-texto">{texto}</span>
              {cuenta ? <span className="riel-cuenta num">{cuenta}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
      <ul className="riel-abajo">
        <li>
          <NavLink to="/panel/ajustes" className="riel-item" title="Ajustes" aria-label="Ajustes">
            <Settings size={18} strokeWidth={1.6} />
            <span className="riel-texto">Ajustes</span>
          </NavLink>
        </li>
        <li className="riel-salir">
          <button className="riel-item" onClick={salir} title={`Salir (${usuario?.nombre})`} aria-label={`Cerrar sesión de ${usuario?.nombre}`}>
            <LogOut size={18} strokeWidth={1.6} />
            <span className="riel-texto">Salir</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
