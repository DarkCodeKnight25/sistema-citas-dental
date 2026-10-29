import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CalendarX, Check, CircleAlert, MapPin, MessageCircle, RotateCcw } from 'lucide-react'
import { api, ErrorApi } from '../api/cliente'
import type { DatosPaciente, Disponibilidad, ReservaHecha } from '../api/tipos'
import { useClinica, useDoctores, useFeriados, useTratamientos } from '../lib/consultas'
import { celular, diaCorto, diaSemana, fechaLarga, hoyLima, soles, sumarDias } from '../lib/fechas'
import { Marca } from '../ui/Marca'
import './reserva.css'

const DIAS_VISIBLES = 14
const VACIO: DatosPaciente = { nombres: '', apellidos: '', dni: '', celular: '' }

export function Reserva() {
  const clinica = useClinica()
  const tratamientos = useTratamientos()
  const doctores = useDoctores()
  const feriados = useFeriados()
  const cliente = useQueryClient()

  const [tratamientoId, setTratamientoId] = useState<number | null>(null)
  const [doctorId, setDoctorId] = useState<number | 'cualquiera' | null>(null)
  const [fecha, setFecha] = useState(hoyLima())
  const [hora, setHora] = useState<string | null>(null)
  const [datos, setDatos] = useState<DatosPaciente>(VACIO)
  const [nota, setNota] = useState('')
  const [tocado, setTocado] = useState<Record<string, boolean>>({})
  const [hecha, setHecha] = useState<ReservaHecha | null>(null)

  const tratamiento = tratamientos.data?.find((t) => t.id === tratamientoId)
  const posibles = useMemo(
    () => doctores.data?.filter((d) => tratamientoId != null && d.tratamientoIds.includes(tratamientoId)) ?? [],
    [doctores.data, tratamientoId],
  )
  const doctor = typeof doctorId === 'number' ? doctores.data?.find((d) => d.id === doctorId) : undefined

  // Si el tratamiento cambia y el doctor elegido no lo hace, se vuelve a elegir.
  useEffect(() => {
    if (typeof doctorId === 'number' && !posibles.some((d) => d.id === doctorId)) setDoctorId(null)
    setHora(null)
  }, [tratamientoId]) // eslint-disable-line react-hooks/exhaustive-deps

  const dias = useMemo(() => Array.from({ length: DIAS_VISIBLES }, (_, i) => sumarDias(hoyLima(), i)), [])
  const feriadoDe = (f: string) => feriados.data?.find((x) => x.fecha === f)?.nombre
  // Días en que el doctor elegido (o alguno que haga el tratamiento) tiene horario.
  const diasConHorario = new Set((doctor ? [doctor] : posibles).flatMap((d) => d.dias))
  const cerrado = (f: string) => !diasConHorario.has(diaSemana(f))

  // Si el día elegido no tiene atención con este doctor, salta al primer día que sí.
  useEffect(() => {
    if (doctorId == null || diasConHorario.size === 0) return
    if (!cerrado(fecha) && !feriadoDe(fecha)) return
    const abierto = dias.find((f) => !cerrado(f) && !feriadoDe(f))
    if (abierto) setFecha(abierto)
  }, [doctorId, tratamientoId, doctores.data, feriados.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const listoParaHoras = tratamientoId != null && doctorId != null
  const disponibilidad = useQuery({
    queryKey: ['disponibilidad', fecha, tratamientoId, doctorId],
    queryFn: () =>
      api<Disponibilidad>(
        `/api/publico/disponibilidad?fecha=${fecha}&tratamientoId=${tratamientoId}` +
          (typeof doctorId === 'number' ? `&doctorId=${doctorId}` : ''),
      ),
    enabled: listoParaHoras,
  })

  const horas = useMemo(() => {
    const todas = new Set<string>()
    disponibilidad.data?.doctores.forEach((d) => d.horas.forEach((h) => todas.add(h.slice(0, 5))))
    return [...todas].sort()
  }, [disponibilidad.data])

  const errores = validar(datos)
  const completo = listoParaHoras && hora != null && Object.keys(errores).length === 0

  const reservar = useMutation({
    mutationFn: () =>
      api<ReservaHecha>('/api/publico/reservas', {
        metodo: 'POST',
        cuerpo: {
          tratamientoId,
          doctorId: typeof doctorId === 'number' ? doctorId : null,
          inicio: `${fecha}T${hora}:00`,
          paciente: datos,
          nota,
        },
      }),
    onSuccess: (r) => {
      setHecha(r)
      window.scrollTo({ top: 0 })
    },
    onError: (e) => {
      if (e instanceof ErrorApi && e.estado === 409) {
        setHora(null)
        cliente.invalidateQueries({ queryKey: ['disponibilidad'] })
      }
    },
  })

  const refHoras = useRef<HTMLElement>(null)
  const refDatos = useRef<HTMLElement>(null)

  if (hecha) {
    return (
      <Marco nombre={clinica.data?.nombre}>
        <Confirmacion
          r={hecha}
          demo={clinica.data?.whatsappDemo ?? true}
          otra={() => {
            setHecha(null)
            setHora(null)
            setDatos(VACIO)
            setNota('')
            setTocado({})
            reservar.reset()
          }}
        />
      </Marco>
    )
  }

  const errorCarga = tratamientos.error ?? doctores.error

  return (
    <Marco nombre={clinica.data?.nombre}>
      <div className="reserva">
        <div className="reserva-pasos">
          <header className="reserva-cabeza">
            <h1>Reserva tu cita</h1>
            <p>Elige el tratamiento, el doctor y la hora. Te confirmamos por WhatsApp; no necesitas crear una cuenta.</p>
          </header>

          {errorCarga && (
            <div className="error-bloque">
              <CircleAlert size={16} /> {errorCarga.message}
              <button className="btn btn-texto" onClick={() => location.reload()}>
                Reintentar
              </button>
            </div>
          )}

          <section className="paso" aria-labelledby="p-tratamiento">
            <h2 id="p-tratamiento">Tratamiento</h2>
            <div className="opciones" role="radiogroup" aria-labelledby="p-tratamiento">
              {tratamientos.isPending &&
                Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="opcion esqueleto-opcion">
                    <span className="esqueleto" style={{ width: '45%' }} />
                  </div>
                ))}
              {tratamientos.data?.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={t.id === tratamientoId}
                  className="opcion"
                  onClick={() => setTratamientoId(t.id)}
                >
                  <span className="opcion-texto">
                    <strong>{t.nombre}</strong>
                    <small>{t.descripcion}</small>
                  </span>
                  <span className="opcion-cifras">
                    <span className="num">{soles(t.precioRef)}</span>
                    <small className="num">{t.duracionMin} min</small>
                  </span>
                </button>
              ))}
            </div>
            <p className="nota-paso">Precios referenciales. El monto final lo confirma el doctor después de evaluarte.</p>
          </section>

          <section className="paso" aria-labelledby="p-doctor" data-bloqueado={tratamientoId == null}>
            <h2 id="p-doctor">Doctor</h2>
            {tratamientoId == null ? (
              <p className="espera">Primero elige un tratamiento.</p>
            ) : (
              <div className="opciones" role="radiogroup" aria-labelledby="p-doctor">
                <button
                  role="radio"
                  aria-checked={doctorId === 'cualquiera'}
                  className="opcion"
                  onClick={() => {
                    setDoctorId('cualquiera')
                    setHora(null)
                  }}
                >
                  <span className="opcion-texto">
                    <strong>Cualquiera con horario libre</strong>
                    <small>Te mostramos todas las horas disponibles</small>
                  </span>
                </button>
                {posibles.map((d) => (
                  <button
                    key={d.id}
                    role="radio"
                    aria-checked={d.id === doctorId}
                    className="opcion"
                    onClick={() => {
                      setDoctorId(d.id)
                      setHora(null)
                    }}
                  >
                    <span className="inicial" style={{ ['--tinta' as string]: d.tinta }} aria-hidden="true">
                      {iniciales(d.nombre)}
                    </span>
                    <span className="opcion-texto">
                      <strong>{d.nombre}</strong>
                      <small>{d.especialidad}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="paso" aria-labelledby="p-hora" ref={refHoras} data-bloqueado={!listoParaHoras}>
            <h2 id="p-hora">Día y hora</h2>
            {!listoParaHoras ? (
              <p className="espera">Elige tratamiento y doctor para ver las horas libres.</p>
            ) : (
              <>
                <div className="dias" role="listbox" aria-label="Día">
                  {dias.map((f) => {
                    const feriado = feriadoDe(f)
                    const sinAtencion = !feriado && cerrado(f)
                    return (
                      <button
                        key={f}
                        role="option"
                        aria-selected={f === fecha}
                        className="dia"
                        disabled={!!feriado || sinAtencion}
                        title={feriado ? `Feriado: ${feriado}` : sinAtencion ? 'No hay atención este día' : undefined}
                        onClick={() => {
                          setFecha(f)
                          setHora(null)
                        }}
                      >
                        <span>{diaCorto(f)}</span>
                        <strong className="num">{Number(f.slice(8, 10))}</strong>
                        {feriado ? <small>feriado</small> : sinAtencion ? <small>cerrado</small> : null}
                      </button>
                    )
                  })}
                </div>
                <p className="fecha-elegida">{fechaLarga(fecha)}</p>
                {disponibilidad.isPending ? (
                  <div className="horas">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="hora esqueleto" />
                    ))}
                  </div>
                ) : disponibilidad.error ? (
                  <div className="error-bloque">
                    <CircleAlert size={16} /> {disponibilidad.error.message}
                  </div>
                ) : horas.length === 0 ? (
                  <div className="sin-horas">
                    <CalendarX size={18} />
                    <span>
                      {disponibilidad.data?.feriado
                        ? `Es feriado (${disponibilidad.data.feriado}).`
                        : fecha === hoyLima()
                          ? 'Ya no quedan horas libres hoy.'
                          : 'No hay horas libres este día.'}
                    </span>
                    {fecha !== dias[dias.length - 1] && (
                      <button className="btn btn-chico" onClick={() => setFecha(sumarDias(fecha, 1))}>
                        Ver el día siguiente <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                ) : (
                  <GruposHoras horas={horas} elegida={hora} elegir={(h) => setHora(h)} />
                )}
              </>
            )}
          </section>

          <section className="paso" aria-labelledby="p-datos" ref={refDatos}>
            <h2 id="p-datos">Tus datos</h2>
            <div className="formulario">
              <Campo
                etiqueta="Nombres"
                valor={datos.nombres}
                error={tocado.nombres ? errores.nombres : undefined}
                cambiar={(v) => setDatos({ ...datos, nombres: v })}
                salir={() => setTocado({ ...tocado, nombres: true })}
                autocompletar="given-name"
              />
              <Campo
                etiqueta="Apellidos"
                valor={datos.apellidos}
                error={tocado.apellidos ? errores.apellidos : undefined}
                cambiar={(v) => setDatos({ ...datos, apellidos: v })}
                salir={() => setTocado({ ...tocado, apellidos: true })}
                autocompletar="family-name"
              />
              <Campo
                etiqueta="Celular con WhatsApp"
                valor={datos.celular}
                prefijo="+51"
                numerico
                max={9}
                ayuda="Aquí te llega la confirmación."
                error={tocado.celular ? errores.celular : undefined}
                cambiar={(v) => setDatos({ ...datos, celular: v.replace(/\D/g, '') })}
                salir={() => setTocado({ ...tocado, celular: true })}
                autocompletar="tel-national"
              />
              <Campo
                etiqueta="DNI (opcional)"
                valor={datos.dni}
                numerico
                max={8}
                ayuda="Nos ayuda a encontrar tu historia si ya viniste antes."
                error={tocado.dni ? errores.dni : undefined}
                cambiar={(v) => setDatos({ ...datos, dni: v.replace(/\D/g, '') })}
                salir={() => setTocado({ ...tocado, dni: true })}
              />
              <label className="campo campo-ancho">
                <span>¿Algo que debamos saber? (opcional)</span>
                <textarea
                  className="entrada"
                  maxLength={400}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Por ejemplo: tengo dolor en una muela de abajo."
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="resumen" aria-label="Tu reserva">
          <h2>Tu reserva</h2>
          <dl>
            <div>
              <dt>Tratamiento</dt>
              <dd>{tratamiento ? tratamiento.nombre : <span className="falta">Sin elegir</span>}</dd>
            </div>
            <div>
              <dt>Doctor</dt>
              <dd>
                {doctorId === 'cualquiera' ? 'Cualquiera libre' : doctor ? doctor.nombre : <span className="falta">Sin elegir</span>}
              </dd>
            </div>
            <div>
              <dt>Cuándo</dt>
              <dd>
                {hora ? (
                  <>
                    {fechaLarga(fecha)} · <span className="num">{hora}</span>
                  </>
                ) : (
                  <span className="falta">Sin elegir</span>
                )}
              </dd>
            </div>
            {tratamiento && (
              <div>
                <dt>Referencial</dt>
                <dd className="num">
                  {soles(tratamiento.precioRef)} · {tratamiento.duracionMin} min
                </dd>
              </div>
            )}
          </dl>
          {reservar.error && (
            <p className="error-reserva" role="alert">
              {reservar.error.message}
            </p>
          )}
          <button
            className="btn btn-primario btn-reservar"
            disabled={!completo || reservar.isPending}
            onClick={() => {
              setTocado({ nombres: true, apellidos: true, celular: true, dni: true })
              if (completo) reservar.mutate()
            }}
          >
            {reservar.isPending ? 'Reservando…' : 'Reservar cita'}
          </button>
          {!completo && (
            <p className="pendiente-texto">
              {!listoParaHoras
                ? 'Falta elegir tratamiento y doctor.'
                : hora == null
                  ? 'Falta elegir la hora.'
                  : 'Completa tus datos para reservar.'}
            </p>
          )}
        </aside>
      </div>
    </Marco>
  )
}

function GruposHoras({ horas, elegida, elegir }: { horas: string[]; elegida: string | null; elegir: (h: string) => void }) {
  const manana = horas.filter((h) => h < '13:00')
  const tarde = horas.filter((h) => h >= '13:00')
  return (
    <div className="grupos-horas">
      {[
        ['Mañana', manana],
        ['Tarde', tarde],
      ].map(([titulo, lista]) =>
        (lista as string[]).length === 0 ? null : (
          <div key={titulo as string}>
            <h3>{titulo as string}</h3>
            <div className="horas" role="radiogroup" aria-label={titulo as string}>
              {(lista as string[]).map((h) => (
                <button key={h} role="radio" aria-checked={h === elegida} className="hora num" onClick={() => elegir(h)}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

function Campo(p: {
  etiqueta: string
  valor: string
  cambiar: (v: string) => void
  salir: () => void
  error?: string
  ayuda?: string
  prefijo?: string
  numerico?: boolean
  max?: number
  autocompletar?: string
}) {
  return (
    <label className="campo">
      <span>{p.etiqueta}</span>
      <span className={p.prefijo ? 'con-prefijo' : undefined}>
        {p.prefijo && <span className="prefijo num">{p.prefijo}</span>}
        <input
          className={'entrada' + (p.numerico ? ' num' : '')}
          value={p.valor}
          inputMode={p.numerico ? 'numeric' : undefined}
          maxLength={p.max}
          autoComplete={p.autocompletar}
          aria-invalid={!!p.error}
          onChange={(e) => p.cambiar(e.target.value)}
          onBlur={p.salir}
        />
      </span>
      {p.error ? <span className="error">{p.error}</span> : p.ayuda ? <small>{p.ayuda}</small> : null}
    </label>
  )
}

function Confirmacion({ r, demo, otra }: { r: ReservaHecha; demo: boolean; otra: () => void }) {
  const texto = `Hola, reservé una cita en la web. Código ${r.codigo}, ${fechaLarga(r.inicio)} a las ${r.inicio.slice(11, 16)}.`
  const enlace = demo
    ? `https://wa.me/?text=${encodeURIComponent(texto)}`
    : `https://wa.me/51${r.whatsappClinica}?text=${encodeURIComponent(texto)}`
  return (
    <div className="confirmacion">
      <p className="confirmacion-ok">
        <Check size={18} /> Cita registrada
      </p>
      <h1>
        {r.paciente}, te esperamos el {fechaLarga(r.inicio)} a las <span className="num">{r.inicio.slice(11, 16)}</span>.
      </h1>
      <div className="ticket">
        <div className="ticket-codigo">
          <span>Código de reserva</span>
          <strong className="num">{r.codigo}</strong>
        </div>
        <dl>
          <div>
            <dt>Tratamiento</dt>
            <dd>{r.tratamiento}</dd>
          </div>
          <div>
            <dt>Doctor</dt>
            <dd>{r.doctor}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd className="num">
              {r.inicio.slice(11, 16)} – {r.fin.slice(11, 16)}
            </dd>
          </div>
          <div>
            <dt>Referencial</dt>
            <dd className="num">{soles(r.precioRef)}</dd>
          </div>
        </dl>
        <p className="ticket-lugar">
          <MapPin size={16} /> {r.direccion}, {r.referencia}
        </p>
      </div>
      <p className="confirmacion-siguiente">
        Te escribiremos por WhatsApp para confirmar. Si no puedes venir, avísanos con tiempo para dar el espacio a otro
        paciente.
      </p>
      <div className="confirmacion-acciones">
        <a className="btn btn-whatsapp" href={enlace} target="_blank" rel="noreferrer">
          <MessageCircle size={16} /> Escribir al consultorio
        </a>
        <button className="btn btn-texto" onClick={otra}>
          <RotateCcw size={14} /> Reservar otra cita
        </button>
      </div>
      {demo && (
        <p className="nota-demo">
          Es una demo: el enlace abre WhatsApp sin destinatario y el número{' '}
          <span className="num">+51 {celular(r.whatsappClinica)}</span> no es real.
        </p>
      )}
    </div>
  )
}

function Marco({ nombre, children }: { nombre?: string; children: React.ReactNode }) {
  return (
    <div className="publico">
      <header className="barra-publica">
        <a href="/" className="marca-texto">
          <Marca tam={26} />
          <span>
            <strong>{nombre ?? 'Dental Qori'}</strong>
            <small>Santa Anita, Lima</small>
          </span>
        </a>
        <Link to="/panel" className="btn btn-texto btn-chico">
          Recepción <ArrowRight size={14} />
        </Link>
      </header>
      <p className="franja-demo">
        Demo de un sistema de citas: el consultorio, los doctores y los pacientes son ficticios.
      </p>
      <main>{children}</main>
      <footer className="pie-publico">
        Sistema de citas hecho por{' '}
        <a href="https://github.com/DarkCodeKnight25" target="_blank" rel="noreferrer">
          David Vega
        </a>
        . Atención lunes a sábado; el horario depende de cada doctor.
      </footer>
    </div>
  )
}

function validar(d: DatosPaciente): Record<string, string> {
  const e: Record<string, string> = {}
  if (!d.nombres.trim()) e.nombres = 'Escribe tus nombres.'
  if (!d.apellidos.trim()) e.apellidos = 'Escribe tus apellidos.'
  if (!/^9\d{8}$/.test(d.celular)) e.celular = 'El celular tiene 9 dígitos y empieza con 9.'
  if (d.dni && !/^\d{8}$/.test(d.dni)) e.dni = 'El DNI tiene 8 dígitos.'
  return e
}

export function iniciales(nombre: string) {
  return nombre
    .replace(/^(Dra?\.)\s+/, '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}
