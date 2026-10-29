import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleAlert, Plus } from 'lucide-react'
import { useCitas, useDoctores, useFeriados } from '../lib/consultas'
import { CLASE, ETIQUETA } from '../lib/estados'
import { ahoraLima, diaCorto, diaSemana, fechaCorta, hora, lunesDe, minutosDelDia, minutosHora, sumarDias } from '../lib/fechas'
import { puedeGestionar, useSesion } from '../lib/sesion'
import { DESDE, HASTA, PX_MIN, fueraDeHorario, useHorarios } from './Agenda'
import { useHojas } from './Hojas'

/** Semana de lunes a sábado; cada día se divide en un carril por doctor. */
export function Semana() {
  const hoy = ahoraLima().slice(0, 10)
  const [lunes, setLunes] = useState(lunesDe(hoy))
  const [filtro, setFiltro] = useState<number | 'todos'>('todos')
  const { usuario } = useSesion()
  const abrir = useHojas()
  const doctores = useDoctores()
  const feriados = useFeriados()
  const horarios = useHorarios(doctores.data)
  const sabado = sumarDias(lunes, 5)
  const citas = useCitas(lunes, sabado)

  const dias = Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i))
  const carriles = useMemo(
    () => (doctores.data ?? []).filter((d) => filtro === 'todos' || d.id === filtro),
    [doctores.data, filtro],
  )
  const visibles = (citas.data ?? []).filter((c) => c.estado !== 'CANCELADA' && (filtro === 'todos' || c.doctorId === filtro))
  const total = visibles.length
  const porConfirmar = visibles.filter((c) => c.estado === 'PENDIENTE').length
  const horas: number[] = []
  for (let m = DESDE; m < HASTA; m += 60) horas.push(m)

  return (
    <div className="pagina">
      <header className="fila-titulo">
        <div>
          <h1>Semana</h1>
          <p className="hallazgo">
            {citas.isPending
              ? 'Cargando…'
              : `${total} ${total === 1 ? 'cita' : 'citas'} del ${fechaCorta(lunes)} al ${fechaCorta(sabado)} · ${porConfirmar} por confirmar`}
          </p>
        </div>
        {puedeGestionar(usuario) && (
          <button className="btn btn-primario" onClick={() => abrir({ tipo: 'nueva' })}>
            <Plus size={16} /> Nueva cita
          </button>
        )}
      </header>

      <div className="barra-filtros">
        <div className="pestanas" role="tablist" aria-label="Doctor">
          <button role="tab" aria-selected={filtro === 'todos'} onClick={() => setFiltro('todos')}>
            Todos
          </button>
          {doctores.data?.map((d) => (
            <button key={d.id} role="tab" aria-selected={filtro === d.id} onClick={() => setFiltro(d.id)}>
              <span className="punto-doctor" style={{ background: d.tinta }} aria-hidden="true" />
              {d.nombre}
            </button>
          ))}
        </div>
        <div className="navegar-semana">
          <button className="btn btn-chico" onClick={() => setLunes(sumarDias(lunes, -7))} aria-label="Semana anterior">
            <ChevronLeft size={15} />
          </button>
          <button className="btn btn-chico" disabled={lunes === lunesDe(hoy)} onClick={() => setLunes(lunesDe(hoy))}>
            Esta semana
          </button>
          <button className="btn btn-chico" onClick={() => setLunes(sumarDias(lunes, 7))} aria-label="Semana siguiente">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {citas.error ? (
        <div className="error-bloque">
          <CircleAlert size={16} /> {citas.error.message}
        </div>
      ) : (
        <div className="semana">
          <div className="semana-cabeza">
            <div />
            {dias.map((d) => {
              const feriado = feriados.data?.find((f) => f.fecha === d)
              return (
                <div key={d} className={'semana-dia' + (d === hoy ? ' es-hoy' : '')}>
                  <span>{diaCorto(d)}</span>
                  <strong className="num">{Number(d.slice(8))}</strong>
                  {feriado && <small title={feriado.nombre}>Feriado</small>}
                </div>
              )
            })}
          </div>
          <div className="semana-cuerpo">
            <div className="semana-rejilla" style={{ height: (HASTA - DESDE) * PX_MIN * 0.75 }}>
              {horas.map((m) => (
                <div key={m} className="regla" style={{ top: (m - DESDE) * PX_MIN * 0.75 }} aria-hidden="true" />
              ))}
              <div className="agenda-eje" aria-hidden="true">
                {horas.map((m) => (
                  <span key={m} className="num" style={{ top: (m - DESDE) * PX_MIN * 0.75 }}>
                    {String(m / 60).padStart(2, '0')}:00
                  </span>
                ))}
              </div>
              {dias.map((d) => (
                <div key={d} className={'semana-col' + (d === hoy ? ' es-hoy' : '')} style={{ ['--carriles' as string]: carriles.length }}>
                  {carriles.map((doc, i) => (
                    <div key={doc.id} className="semana-carril" style={{ gridColumn: i + 1 }}>
                      {/* Horas sin atención (almuerzo, días libres, feriados) rayadas, como en la agenda del día. */}
                      {(feriados.data?.some((f) => f.fecha === d)
                        ? [[DESDE, HASTA] as [number, number]]
                        : fueraDeHorario(
                            (horarios.get(doc.id) ?? [])
                              .filter((h) => h.diaSemana === diaSemana(d))
                              .map((h) => [minutosHora(h.horaInicio), minutosHora(h.horaFin)] as const),
                          )
                      ).map(([a, b]) => (
                        <div
                          key={a}
                          className="agenda-cerrado"
                          style={{ top: (a - DESDE) * PX_MIN * 0.75, height: (b - a) * PX_MIN * 0.75 }}
                          aria-hidden="true"
                        />
                      ))}
                      {visibles
                        .filter((c) => c.doctorId === doc.id && c.inicio.startsWith(d))
                        .map((c) => {
                          const top = (minutosDelDia(c.inicio) - DESDE) * PX_MIN * 0.75
                          const alto = (minutosDelDia(c.fin) - minutosDelDia(c.inicio)) * PX_MIN * 0.75 - 2
                          return (
                            <button
                              key={c.id}
                              className={`mini ${CLASE[c.estado]}`}
                              style={{ top, height: alto, ['--tinta' as string]: doc.tinta }}
                              onClick={() => abrir({ tipo: 'cita', cita: c })}
                              title={`${hora(c.inicio)} ${c.paciente.nombres} ${c.paciente.apellidos} · ${c.tratamiento} · ${doc.nombre}`}
                              aria-label={`${diaCorto(d)} ${hora(c.inicio)}, ${c.paciente.nombres} ${c.paciente.apellidos}, ${doc.nombre}, ${ETIQUETA[c.estado]}`}
                            >
                              <span className="num">{hora(c.inicio)}</span>
                              {carriles.length === 1 && <span className="mini-nombre">{c.paciente.apellidos.split(' ')[0]}</span>}
                            </button>
                          )
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="leyenda">
        <span className="estado e-pendiente">Por confirmar</span> borde punteado ·{' '}
        <span className="estado e-confirmada">Confirmada</span> sólida · <span className="estado e-atendida">Atendida</span> atenuada ·{' '}
        <span className="estado e-falto">No asistió</span> rayada. El color del borde izquierdo es el del doctor.
      </p>
    </div>
  )
}
