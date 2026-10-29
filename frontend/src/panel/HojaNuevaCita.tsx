import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Search, UserPlus } from 'lucide-react'
import { api, ErrorApi } from '../api/cliente'
import type { Cita, Disponibilidad, PacienteDetalle, PacienteResumen } from '../api/tipos'
import { useDoctores, useTratamientos } from '../lib/consultas'
import { celular, fechaLarga, hora, hoyLima } from '../lib/fechas'
import { useTostada } from '../ui/Tostada'
import { useHojas } from './Hojas'

interface Props {
  pacienteId?: number
  fecha?: string
  reprogramar?: Cita
}

/** Registrar una cita desde recepción, o mover una existente a otro día, hora o doctor. */
export function HojaNuevaCita({ pacienteId, fecha: fechaInicial, reprogramar }: Props) {
  const tratamientos = useTratamientos()
  const doctores = useDoctores()
  const cliente = useQueryClient()
  const tostada = useTostada()
  const abrir = useHojas()

  const [paciente, setPaciente] = useState<PacienteResumen | null>(reprogramar?.paciente ?? null)
  const [nuevo, setNuevo] = useState(false)
  const [datos, setDatos] = useState({ nombres: '', apellidos: '', dni: '', celular: '' })
  const [tratamientoId, setTratamientoId] = useState<number | ''>(reprogramar?.tratamientoId ?? '')
  const [doctorId, setDoctorId] = useState<number | ''>(reprogramar?.doctorId ?? '')
  const [fecha, setFecha] = useState(fechaInicial ?? reprogramar?.inicio.slice(0, 10) ?? hoyLima())
  const [horaElegida, setHora] = useState<string | null>(null)
  const [nota, setNota] = useState('')

  // Paciente que llega desde su ficha.
  const precargado = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => api<PacienteDetalle>(`/api/pacientes/${pacienteId}`),
    enabled: pacienteId != null && !reprogramar,
  })
  useEffect(() => {
    if (precargado.data) setPaciente(precargado.data)
  }, [precargado.data])

  const posibles = useMemo(
    () => doctores.data?.filter((d) => tratamientoId !== '' && d.tratamientoIds.includes(tratamientoId)) ?? [],
    [doctores.data, tratamientoId],
  )

  const disponibilidad = useQuery({
    queryKey: ['disp-panel', fecha, tratamientoId, doctorId],
    queryFn: () =>
      api<Disponibilidad>(
        `/api/citas/disponibilidad?fecha=${fecha}&tratamientoId=${tratamientoId}` + (doctorId !== '' ? `&doctorId=${doctorId}` : ''),
      ),
    enabled: tratamientoId !== '' && !!fecha,
  })

  const horas = useMemo(() => {
    const mapa = new Map<string, number[]>()
    disponibilidad.data?.doctores.forEach((d) =>
      d.horas.forEach((h) => mapa.set(h.slice(0, 5), [...(mapa.get(h.slice(0, 5)) ?? []), d.doctorId])),
    )
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [disponibilidad.data])

  useEffect(() => setHora(null), [fecha, tratamientoId, doctorId])

  const guardar = useMutation({
    mutationFn: () => {
      const inicio = `${fecha}T${horaElegida}:00`
      if (reprogramar) {
        return api<Cita>(`/api/citas/${reprogramar.id}/horario`, {
          metodo: 'PUT',
          cuerpo: { doctorId: doctorId === '' ? null : doctorId, inicio },
        })
      }
      return api<Cita>('/api/citas', {
        metodo: 'POST',
        cuerpo: {
          tratamientoId,
          doctorId: doctorId === '' ? null : doctorId,
          inicio,
          pacienteId: nuevo ? null : paciente?.id,
          paciente: nuevo ? datos : null,
          nota,
        },
      })
    },
    onSuccess: (c) => {
      cliente.invalidateQueries({ queryKey: ['citas'] })
      cliente.invalidateQueries({ queryKey: ['recordatorios'] })
      cliente.invalidateQueries({ queryKey: ['paciente'] })
      tostada({
        texto: reprogramar
          ? `Cita movida al ${fechaLarga(c.inicio)}, ${hora(c.inicio)}. Queda por confirmar.`
          : `Cita ${c.codigo} registrada para ${c.paciente.nombres.split(' ')[0]}.`,
      })
      abrir({ tipo: 'cita', cita: c })
    },
    onError: (e) => {
      if (e instanceof ErrorApi && e.estado === 409) {
        setHora(null)
        disponibilidad.refetch()
      }
    },
  })

  const pacienteListo = reprogramar || (nuevo ? datos.nombres && datos.apellidos && /^9\d{8}$/.test(datos.celular) : paciente)
  const listo = pacienteListo && tratamientoId !== '' && horaElegida

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (listo) guardar.mutate()
  }

  const errores = guardar.error instanceof ErrorApi ? guardar.error.campos : {}

  return (
    <form className="form-hoja" onSubmit={enviar}>
      {reprogramar ? (
        <div className="paciente-fijo">
          <strong>
            {reprogramar.paciente.nombres} {reprogramar.paciente.apellidos}
          </strong>
          <span>
            {reprogramar.tratamiento} · ahora el {fechaLarga(reprogramar.inicio)}, <span className="num">{hora(reprogramar.inicio)}</span>
          </span>
        </div>
      ) : (
        <fieldset className="grupo">
          <legend>Paciente</legend>
          {nuevo ? (
            <div className="campos-2">
              <label className="campo">
                <span>Nombres</span>
                <input className="entrada" required value={datos.nombres} onChange={(e) => setDatos({ ...datos, nombres: e.target.value })} />
              </label>
              <label className="campo">
                <span>Apellidos</span>
                <input className="entrada" required value={datos.apellidos} onChange={(e) => setDatos({ ...datos, apellidos: e.target.value })} />
              </label>
              <label className="campo">
                <span>Celular</span>
                <input
                  className="entrada num"
                  inputMode="numeric"
                  maxLength={9}
                  required
                  aria-invalid={!!errores['paciente.celular']}
                  value={datos.celular}
                  onChange={(e) => setDatos({ ...datos, celular: e.target.value.replace(/\D/g, '') })}
                />
                {errores['paciente.celular'] && <span className="error">{errores['paciente.celular']}</span>}
              </label>
              <label className="campo">
                <span>DNI (opcional)</span>
                <input
                  className="entrada num"
                  inputMode="numeric"
                  maxLength={8}
                  value={datos.dni}
                  onChange={(e) => setDatos({ ...datos, dni: e.target.value.replace(/\D/g, '') })}
                />
              </label>
              <button type="button" className="btn btn-texto btn-chico" onClick={() => setNuevo(false)}>
                Buscar un paciente registrado
              </button>
            </div>
          ) : (
            <BuscadorPaciente elegido={paciente} elegir={setPaciente} nuevo={() => setNuevo(true)} />
          )}
        </fieldset>
      )}

      <div className="campos-2">
        <label className="campo">
          <span>Tratamiento</span>
          <select
            className="entrada"
            value={tratamientoId}
            disabled={!!reprogramar}
            onChange={(e) => {
              const id = Number(e.target.value)
              setTratamientoId(id)
              if (doctorId !== '' && !doctores.data?.find((d) => d.id === doctorId)?.tratamientoIds.includes(id)) setDoctorId('')
            }}
          >
            <option value="" disabled>
              Elige…
            </option>
            {tratamientos.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} · {t.duracionMin} min
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Doctor</span>
          <select className="entrada" value={doctorId} onChange={(e) => setDoctorId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Cualquiera libre</option>
            {posibles.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span>Día</span>
          <input className="entrada num" type="date" required value={fecha} min={hoyLima()} onChange={(e) => setFecha(e.target.value)} />
        </label>
      </div>

      <fieldset className="grupo">
        <legend>Hora libre</legend>
        {tratamientoId === '' ? (
          <p className="vacio">Elige un tratamiento para ver las horas libres.</p>
        ) : disponibilidad.isPending ? (
          <div className="horas-panel">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="hora-panel esqueleto" />
            ))}
          </div>
        ) : disponibilidad.data?.feriado ? (
          <p className="vacio">Es feriado ({disponibilidad.data.feriado}). El consultorio no atiende.</p>
        ) : horas.length === 0 ? (
          <p className="vacio">No hay horas libres ese día{doctorId !== '' ? ' con este doctor' : ''}.</p>
        ) : (
          <div className="horas-panel" role="radiogroup" aria-label="Hora">
            {horas.map(([h, ids]) => (
              <button
                type="button"
                key={h}
                role="radio"
                aria-checked={h === horaElegida}
                className="hora-panel num"
                title={doctorId === '' ? ids.map((id) => doctores.data?.find((d) => d.id === id)?.nombre).join(', ') : undefined}
                onClick={() => setHora(h)}
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </fieldset>

      {!reprogramar && (
        <label className="campo">
          <span>Nota para el doctor (opcional)</span>
          <textarea className="entrada" maxLength={400} value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>
      )}

      {guardar.error && (
        <div className="error-bloque" role="alert">
          <CircleAlert size={16} /> {guardar.error.message}
        </div>
      )}

      <div className="pie-hoja">
        <button className="btn btn-primario" disabled={!listo || guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : reprogramar ? 'Mover cita' : 'Registrar cita'}
        </button>
        {horaElegida && (
          <span className="gris">
            {fechaLarga(fecha)}, <span className="num">{horaElegida}</span>
          </span>
        )}
      </div>
    </form>
  )
}

function BuscadorPaciente({
  elegido,
  elegir,
  nuevo,
}: {
  elegido: PacienteResumen | null
  elegir: (p: PacienteResumen | null) => void
  nuevo: () => void
}) {
  const [texto, setTexto] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = window.setTimeout(() => setQ(texto.trim()), 250)
    return () => window.clearTimeout(t)
  }, [texto])

  const resultados = useQuery({
    queryKey: ['buscar-paciente', q],
    queryFn: () => api<PacienteResumen[]>(`/api/pacientes?q=${encodeURIComponent(q)}`),
    enabled: q.length >= 2,
  })

  if (elegido) {
    return (
      <div className="paciente-fijo">
        <strong>
          {elegido.nombres} {elegido.apellidos}
        </strong>
        <span className="num">
          {celular(elegido.celular)} · DNI {elegido.dni ?? '—'}
        </span>
        <button type="button" className="btn btn-texto btn-chico" onClick={() => elegir(null)}>
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="buscador">
      <div className="entrada-icono">
        <Search size={15} aria-hidden="true" />
        <input
          className="entrada"
          placeholder="Nombre, DNI o celular"
          value={texto}
          autoFocus
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Buscar paciente"
        />
      </div>
      {q.length >= 2 && (
        <ul className="resultados">
          {resultados.data?.slice(0, 6).map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => elegir(p)}>
                <span>
                  {p.nombres} {p.apellidos}
                </span>
                <span className="num gris">{celular(p.celular)}</span>
              </button>
            </li>
          ))}
          {resultados.data?.length === 0 && <li className="gris resultado-vacio">Nadie con «{q}».</li>}
        </ul>
      )}
      <button type="button" className="btn btn-chico" onClick={nuevo}>
        <UserPlus size={14} /> Paciente nuevo
      </button>
    </div>
  )
}
