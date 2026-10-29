import { useEffect, useMemo, useRef } from 'react'
import { useQueries } from '@tanstack/react-query'
import { api } from '../api/cliente'
import type { Cita, Doctor, Horario } from '../api/tipos'
import { CLASE, ETIQUETA } from '../lib/estados'
import { diaSemana, hora, minutosDelDia, minutosHora } from '../lib/fechas'
import { iniciales } from '../publico/Reserva'
import { useHojas } from './Hojas'

/** Eje del día: de 8:00 a 20:30; 30 minutos = 44 px. */
export const DESDE = 8 * 60
export const HASTA = 20 * 60 + 30
export const PX_MIN = 44 / 30

export function useHorarios(doctores: Doctor[] | undefined) {
  const consultas = useQueries({
    queries: (doctores ?? []).map((d) => ({
      queryKey: ['horario', d.id],
      queryFn: () => api<Horario[]>(`/api/ajustes/doctores/${d.id}/horario`),
      staleTime: 600_000,
    })),
  })
  return useMemo(() => {
    const mapa = new Map<number, Horario[]>()
    doctores?.forEach((d, i) => mapa.set(d.id, consultas[i]?.data ?? []))
    return mapa
  }, [doctores, consultas])
}

interface Props {
  fecha: string
  ahora: string
  citas: Cita[]
  doctores: Doctor[]
  horarios: Map<number, Horario[]>
  recientes: Set<number>
}

/** Agenda del día: una columna por doctor sobre el eje de horas, con el corte de almuerzo y la línea «Ahora». */
export function AgendaDia({ fecha, ahora, citas, doctores, horarios, recientes }: Props) {
  const abrir = useHojas()
  const caja = useRef<HTMLDivElement>(null)
  const esHoy = ahora.slice(0, 10) === fecha
  const minAhora = minutosDelDia(ahora)
  const dia = diaSemana(fecha)

  // Al abrir, la agenda se ubica una hora antes de ahora.
  useEffect(() => {
    if (!caja.current) return
    const objetivo = esHoy ? (minAhora - 60 - DESDE) * PX_MIN : (9 * 60 - DESDE) * PX_MIN
    caja.current.scrollTop = Math.max(0, objetivo)
  }, [fecha]) // eslint-disable-line react-hooks/exhaustive-deps

  const horas = []
  for (let m = DESDE; m < HASTA; m += 60) horas.push(m)

  const visibles = citas.filter((c) => c.estado !== 'CANCELADA')
  const alto = (HASTA - DESDE) * PX_MIN

  return (
    <div className="agenda" style={{ ['--columnas' as string]: doctores.length }}>
      <div className="agenda-cabeza">
        <div className="agenda-eje-esquina" />
        {doctores.map((d) => {
          const suyas = visibles.filter((c) => c.doctorId === d.id)
          const bloques = (horarios.get(d.id) ?? []).filter((h) => h.diaSemana === dia)
          return (
            <div key={d.id} className="agenda-doctor">
              <span className="inicial" style={{ ['--tinta' as string]: d.tinta }} aria-hidden="true">
                {iniciales(d.nombre)}
              </span>
              <span className="agenda-doctor-texto">
                <strong>{d.nombre}</strong>
                <small>
                  {bloques.length === 0
                    ? 'No atiende hoy'
                    : `${suyas.length} ${suyas.length === 1 ? 'cita' : 'citas'} · ${bloques.map((b) => `${b.horaInicio.slice(0, 5)}–${b.horaFin.slice(0, 5)}`).join(', ')}`}
                </small>
              </span>
            </div>
          )
        })}
      </div>

      <div className="agenda-cuerpo" ref={caja}>
        <div className="agenda-rejilla" style={{ height: alto }}>
          {Array.from({ length: (HASTA - DESDE) / 30 }, (_, i) => (
            <div key={i} className={'regla' + (i % 2 ? ' regla-media' : '')} style={{ top: i * 30 * PX_MIN }} aria-hidden="true" />
          ))}
          <div className="agenda-eje" aria-hidden="true">
            {horas.map((m) => (
              <span key={m} className="num" style={{ top: (m - DESDE) * PX_MIN }}>
                {String(m / 60).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {doctores.map((d) => {
            const bloques = (horarios.get(d.id) ?? []).filter((h) => h.diaSemana === dia)
            const libres = bloques.map((b) => [minutosHora(b.horaInicio), minutosHora(b.horaFin)] as const)
            return (
              <div key={d.id} className="agenda-columna" aria-label={`Citas de ${d.nombre}`} role="list">
                {/* Lo que no es horario de atención se ve rayado. */}
                {fueraDeHorario(libres).map(([a, b]) => (
                  <div key={a} className="agenda-cerrado" style={{ top: (a - DESDE) * PX_MIN, height: (b - a) * PX_MIN }} />
                ))}
                {visibles
                  .filter((c) => c.doctorId === d.id)
                  .map((c) => {
                    const inicio = minutosDelDia(c.inicio)
                    const fin = minutosDelDia(c.fin)
                    const h = (fin - inicio) * PX_MIN - 3
                    return (
                      <button
                        key={c.id}
                        role="listitem"
                        className={`bloque ${CLASE[c.estado]}${recientes.has(c.id) ? ' recien' : ''}${h < 52 ? ' bloque-bajo' : ''}`}
                        style={{ top: (inicio - DESDE) * PX_MIN + 1, height: h }}
                        onClick={() => abrir({ tipo: 'cita', cita: c })}
                        aria-label={`${hora(c.inicio)}, ${c.paciente.nombres} ${c.paciente.apellidos}, ${c.tratamiento}, ${ETIQUETA[c.estado]}`}
                      >
                        <span className="bloque-linea">
                          <span className="num bloque-hora">{hora(c.inicio)}</span>
                          <span className="bloque-paciente">
                            {c.paciente.nombres.split(' ')[0]} {c.paciente.apellidos.split(' ')[0]}
                          </span>
                        </span>
                        <span className="bloque-trat">{c.tratamiento}</span>
                      </button>
                    )
                  })}
              </div>
            )
          })}

          {esHoy && minAhora >= DESDE && minAhora <= HASTA && (
            <div className="agenda-ahora" style={{ top: (minAhora - DESDE) * PX_MIN }} aria-hidden="true">
              <span className="num">{ahora.slice(11, 16)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Intervalos del eje que quedan fuera de los bloques de atención. */
export function fueraDeHorario(libres: (readonly [number, number])[]): [number, number][] {
  const orden = [...libres].sort((a, b) => a[0] - b[0])
  const fuera: [number, number][] = []
  let cursor = DESDE
  for (const [a, b] of orden) {
    if (a > cursor) fuera.push([cursor, a])
    cursor = Math.max(cursor, b)
  }
  if (cursor < HASTA) fuera.push([cursor, HASTA])
  return fuera
}
