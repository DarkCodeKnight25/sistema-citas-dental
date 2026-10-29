import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, MessageCircle, Plus } from 'lucide-react'
import type { Cita, EstadoCita } from '../api/tipos'
import { useBandeja, useCambiarEstado, useCitas, useClinica, useDoctores } from '../lib/consultas'
import { CLASE, ETIQUETA } from '../lib/estados'
import { ahoraLima, fechaLarga, hora, minutosEntre, relativo, sumarDias } from '../lib/fechas'
import { puedeGestionar, useSesion } from '../lib/sesion'
import { enlaceCita } from '../lib/whatsapp'
import { useTostada } from '../ui/Tostada'
import { AgendaDia, useHorarios } from './Agenda'
import { FilaRecordatorio } from './FilaRecordatorio'
import { useHojas } from './Hojas'

const ORDEN_CONTEO: EstadoCita[] = ['PENDIENTE', 'CONFIRMADA', 'EN_ATENCION', 'ATENDIDA', 'NO_ASISTIO']

/** Pantalla principal de recepción: ¿quién sigue, quién falta confirmar y a quién hay que recordarle? */
export function Hoy() {
  const ahora = useAhora()
  const hoy = ahora.slice(0, 10)
  const manana = sumarDias(hoy, 1)
  const { usuario } = useSesion()
  const gestiona = puedeGestionar(usuario)
  const abrir = useHojas()

  const citas = useCitas(hoy, manana)
  const doctores = useDoctores()
  const horarios = useHorarios(doctores.data)
  const bandeja = useBandeja(gestiona)
  const recientes = useCambiosRecientes(citas.data)

  const deHoy = useMemo(() => citas.data?.filter((c) => c.inicio.startsWith(hoy)) ?? [], [citas.data, hoy])
  const deManana = useMemo(() => citas.data?.filter((c) => c.inicio.startsWith(manana)) ?? [], [citas.data, manana])

  // Un doctor solo ve su columna; recepción ve a todos. En el celular, un doctor por vista.
  const movil = useEsMovil()
  const [doctorMovil, setDoctorMovil] = useState<number | null>(null)
  const visibles = useMemo(() => {
    const lista = doctores.data ?? []
    return usuario?.rol === 'DOCTOR' && usuario.doctorId ? lista.filter((d) => d.id === usuario.doctorId) : lista
  }, [doctores.data, usuario])
  const elegidoMovil = visibles.find((d) => d.id === doctorMovil) ?? visibles[0]
  const columnas = movil && elegidoMovil ? [elegidoMovil] : visibles

  const conteo = useMemo(() => {
    const c = Object.fromEntries(ORDEN_CONTEO.map((e) => [e, 0])) as Record<EstadoCita, number>
    deHoy.forEach((x) => {
      if (x.estado in c) c[x.estado]++
    })
    return c
  }, [deHoy])

  // El siguiente paciente de hoy; si ya no queda nadie, el primero de mañana.
  const siguiente = useMemo(
    () =>
      [...deHoy, ...deManana]
        .filter((c) => (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && minutosEntre(ahora, c.inicio) > -20)
        .sort((a, b) => a.inicio.localeCompare(b.inicio))[0],
    [deHoy, deManana, ahora],
  )
  const enSillon = deHoy.filter((c) => c.estado === 'EN_ATENCION')
  const mananaSinConfirmar = deManana.filter((c) => c.estado === 'PENDIENTE').length
  const porEnviar = bandeja.data?.porEnviar ?? []

  const hallazgo = [
    conteo.PENDIENTE > 0 && `${conteo.PENDIENTE} ${conteo.PENDIENTE === 1 ? 'cita' : 'citas'} de hoy sin confirmar`,
    mananaSinConfirmar > 0 && `${mananaSinConfirmar} de mañana sin confirmar`,
    gestiona && porEnviar.length > 0 && `${porEnviar.length} ${porEnviar.length === 1 ? 'mensaje' : 'mensajes'} por enviar`,
  ].filter(Boolean)

  return (
    <div className="pagina pagina-hoy">
      <header className="fila-titulo">
        <div>
          <h1>
            Hoy <span className="titulo-fecha">{fechaLarga(hoy)}</span>
          </h1>
          <p className="hallazgo">
            {citas.isPending
              ? 'Cargando la agenda…'
              : hallazgo.length
                ? hallazgo.join(' · ')
                : `${deHoy.length} citas hoy y todo confirmado.`}
          </p>
        </div>
        {gestiona && (
          <button className="btn btn-primario" onClick={() => abrir({ tipo: 'nueva', fecha: hoy })}>
            <Plus size={16} /> Nueva cita
          </button>
        )}
      </header>

      <div className="hoy-rejilla">
        <div className="hoy-principal">
          <Siguiente cita={siguiente} ahora={ahora} enSillon={enSillon} gestiona={gestiona} cargando={citas.isPending} />

          {citas.error ? (
            <div className="error-bloque" role="alert">
              <CircleAlert size={16} /> No se pudo cargar la agenda. {citas.error.message}
              <button className="btn btn-texto btn-chico" onClick={() => citas.refetch()}>
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {movil && visibles.length > 1 && (
                <div className="pestanas pestanas-movil" role="tablist" aria-label="Doctor">
                  {visibles.map((d) => (
                    <button key={d.id} role="tab" aria-selected={d.id === elegidoMovil?.id} onClick={() => setDoctorMovil(d.id)}>
                      <span className="punto-doctor" style={{ background: d.tinta }} aria-hidden="true" />
                      {d.nombre.replace(/^Dra?\. /, '').split(' ')[0]}{' '}
                      <span className="num gris">{deHoy.filter((c) => c.doctorId === d.id && c.estado !== 'CANCELADA').length}</span>
                    </button>
                  ))}
                </div>
              )}
              <AgendaDia fecha={hoy} ahora={ahora} citas={deHoy} doctores={columnas} horarios={horarios} recientes={recientes} />
            </>
          )}
        </div>

        <aside className="hoy-lateral">
          <section aria-labelledby="t-estado">
            <h2 id="t-estado" className="titulo-bloque">
              Estado del día
            </h2>
            <dl className="conteo">
              {ORDEN_CONTEO.map((e) => (
                <div key={e}>
                  <dt>
                    <span className={`estado ${CLASE[e]}`}>{ETIQUETA[e]}</span>
                  </dt>
                  <dd className="num">{citas.isPending ? <span className="esqueleto" style={{ width: 18 }} /> : conteo[e]}</dd>
                </div>
              ))}
              <div className="conteo-total">
                <dt>Total de hoy</dt>
                <dd className="num">{deHoy.filter((c) => c.estado !== 'CANCELADA').length}</dd>
              </div>
            </dl>
          </section>

          {gestiona && (
            <section aria-labelledby="t-rec">
              <div className="titulo-bloque-fila">
                <h2 id="t-rec" className="titulo-bloque">
                  Por enviar por WhatsApp
                </h2>
                <span className="num gris">{porEnviar.length}</span>
              </div>
              {bandeja.error ? (
                <div className="error-bloque">
                  <CircleAlert size={16} /> No se pudieron cargar los mensajes.
                </div>
              ) : porEnviar.length === 0 && !bandeja.isPending ? (
                <p className="vacio">
                  <MessageCircle size={14} aria-hidden="true" /> No hay mensajes pendientes. Los recordatorios aparecen 24 horas
                  antes de cada cita.
                </p>
              ) : (
                <ul className="lista-rec">
                  {porEnviar.slice(0, 6).map((r) => (
                    <FilaRecordatorio key={r.id} r={r} />
                  ))}
                </ul>
              )}
              {porEnviar.length > 6 && (
                <Link to="/panel/recordatorios" className="btn btn-chico ver-todos">
                  Ver los {porEnviar.length}
                </Link>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

function Siguiente({
  cita,
  ahora,
  enSillon,
  gestiona,
  cargando,
}: {
  cita: Cita | undefined
  ahora: string
  enSillon: Cita[]
  gestiona: boolean
  cargando: boolean
}) {
  const abrir = useHojas()
  const cambiar = useCambiarEstado()
  const tostada = useTostada()
  const clinica = useClinica()

  if (cargando) {
    return (
      <section className="siguiente" aria-label="Siguiente paciente">
        <span className="esqueleto" style={{ width: 96, height: 32 }} />
        <span className="esqueleto" style={{ width: 240, height: 18 }} />
      </section>
    )
  }

  return (
    <section className="siguiente" aria-labelledby="t-siguiente">
      <h2 id="t-siguiente" className="sr-only">
        Siguiente paciente
      </h2>
      {cita ? (
        <>
          <div className="siguiente-hora">
            <span className="num">{hora(cita.inicio)}</span>
            <small>{cita.inicio.startsWith(ahora.slice(0, 10)) ? relativo(ahora, cita.inicio) : 'mañana, primer paciente'}</small>
          </div>
          <button className="siguiente-quien" onClick={() => abrir({ tipo: 'cita', cita })}>
            <strong>
              {cita.paciente.nombres} {cita.paciente.apellidos}
            </strong>
            <span>
              {cita.tratamiento} · <span className={`estado ${CLASE[cita.estado]}`}>{ETIQUETA[cita.estado]}</span>
            </span>
          </button>
          {gestiona && (
            <div className="siguiente-acciones">
              {cita.inicio.startsWith(ahora.slice(0, 10)) && (
                <button
                  className="btn btn-primario"
                  disabled={cambiar.isPending}
                  onClick={() =>
                    cambiar.mutate(
                      { id: cita.id, estado: 'EN_ATENCION' },
                      {
                        onSuccess: (c) => tostada({ texto: `${c.paciente.nombres.split(' ')[0]} pasó al sillón.` }),
                        onError: (e) => tostada({ texto: e.message, mal: true }),
                      },
                    )
                  }
                >
                  Llegó
                </button>
              )}
              {cita.estado === 'PENDIENTE' && (
                <button
                  className="btn"
                  disabled={cambiar.isPending}
                  onClick={() =>
                    cambiar.mutate(
                      { id: cita.id, estado: 'CONFIRMADA' },
                      {
                        onSuccess: (c) => tostada({ texto: `Cita de ${c.paciente.nombres.split(' ')[0]} confirmada.` }),
                        onError: (e) => tostada({ texto: e.message, mal: true }),
                      },
                    )
                  }
                >
                  Confirmar
                </button>
              )}
              <a className="btn btn-whatsapp" href={enlaceCita(cita, clinica.data)} target="_blank" rel="noreferrer">
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
          )}
        </>
      ) : (
        <p className="siguiente-vacio">No quedan pacientes por llegar hoy.</p>
      )}
      {enSillon.length > 0 && (
        <p className="en-sillon">
          <span className="estado e-atencion">En atención</span>
          {enSillon.map((c) => (
            <button key={c.id} className="btn btn-texto btn-chico" onClick={() => abrir({ tipo: 'cita', cita: c })}>
              {c.paciente.nombres.split(' ')[0]} {c.paciente.apellidos.split(' ')[0]}
            </button>
          ))}
        </p>
      )}
    </section>
  )
}

/** La hora de Lima, actualizada cada 30 segundos para mover la línea «Ahora». */
function useAhora() {
  const [ahora, setAhora] = useState(ahoraLima())
  useEffect(() => {
    const t = window.setInterval(() => setAhora(ahoraLima()), 30_000)
    return () => window.clearInterval(t)
  }, [])
  return ahora
}

/** Citas cuyo estado acaba de cambiar: reciben la animación de la banda de estado. */
function useCambiosRecientes(citas: Cita[] | undefined) {
  const previos = useRef(new Map<number, EstadoCita>())
  const [recientes, setRecientes] = useState(new Set<number>())
  useEffect(() => {
    if (!citas) return
    const cambiadas = citas.filter((c) => previos.current.has(c.id) && previos.current.get(c.id) !== c.estado).map((c) => c.id)
    citas.forEach((c) => previos.current.set(c.id, c.estado))
    if (cambiadas.length === 0) return
    setRecientes(new Set(cambiadas))
    const t = window.setTimeout(() => setRecientes(new Set()), 700)
    return () => window.clearTimeout(t)
  }, [citas])
  return recientes
}

/** Ancho de celular: la agenda muestra un doctor por vez. */
function useEsMovil() {
  const consulta = '(max-width: 760px)'
  const [movil, setMovil] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const m = window.matchMedia(consulta)
    const cambio = () => setMovil(m.matches)
    m.addEventListener('change', cambio)
    return () => m.removeEventListener('change', cambio)
  }, [])
  return movil
}
