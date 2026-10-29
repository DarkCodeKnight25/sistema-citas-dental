import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, Plus, TriangleAlert } from 'lucide-react'
import { api } from '../api/cliente'
import type { Nota, PacienteDetalle } from '../api/tipos'
import { useDoctores } from '../lib/consultas'
import { CLASE, ETIQUETA } from '../lib/estados'
import { celular, fechaCorta, hora, hoyLima } from '../lib/fechas'
import { puedeGestionar, useSesion } from '../lib/sesion'
import { useTostada } from '../ui/Tostada'
import { useHojas } from './Hojas'

export function FichaPaciente() {
  const { id } = useParams()
  const { usuario } = useSesion()
  const abrir = useHojas()
  const doctores = useDoctores()
  const [pestana, setPestana] = useState<'citas' | 'notas'>('citas')

  const ficha = useQuery({
    queryKey: ['paciente', Number(id)],
    queryFn: () => api<PacienteDetalle>(`/api/pacientes/${id}`),
  })

  if (ficha.error) {
    return (
      <div className="pagina pagina-angosta">
        <div className="error-bloque">
          <CircleAlert size={16} /> {ficha.error.message}
        </div>
      </div>
    )
  }

  const p = ficha.data
  const hoy = hoyLima()
  const proximas = p?.citas.filter((c) => c.inicio.slice(0, 10) >= hoy && c.estado !== 'CANCELADA') ?? []
  const atendidas = p?.citas.filter((c) => c.estado === 'ATENDIDA').length ?? 0
  const faltas = p?.citas.filter((c) => c.estado === 'NO_ASISTIO').length ?? 0
  const puedeNotar = usuario?.rol === 'ADMIN' || usuario?.rol === 'DOCTOR'

  return (
    <div className="pagina pagina-angosta">
      <Link to="/panel/pacientes" className="btn btn-texto btn-chico volver">
        <ArrowLeft size={14} /> Pacientes
      </Link>
      <header className="fila-titulo">
        <div>
          <h1>{p ? `${p.nombres} ${p.apellidos}` : <span className="esqueleto" style={{ width: 260, height: 26 }} />}</h1>
          {p && (
            <p className="hallazgo">
              {atendidas} {atendidas === 1 ? 'atención' : 'atenciones'}
              {faltas > 0 && ` · ${faltas} ${faltas === 1 ? 'falta' : 'faltas'}`}
              {proximas.length > 0 && ` · próxima: ${fechaCorta(proximas[proximas.length - 1].inicio)}`}
            </p>
          )}
        </div>
        {p && puedeGestionar(usuario) && (
          <button className="btn btn-primario" onClick={() => abrir({ tipo: 'nueva', pacienteId: p.id })}>
            <Plus size={16} /> Nueva cita
          </button>
        )}
      </header>

      {p && (
        <>
          {p.alergias && (
            <p className="alerta-alergia" role="note">
              <TriangleAlert size={16} /> Alergia: <strong>{p.alergias}</strong>
            </p>
          )}
          <dl className="datos-ficha">
            <div>
              <dt>DNI</dt>
              <dd className="num">{p.dni ?? '—'}</dd>
            </div>
            <div>
              <dt>Celular</dt>
              <dd className="num">{celular(p.celular)}</dd>
            </div>
            <div>
              <dt>Nacimiento</dt>
              <dd className="num">{p.fechaNac ? `${p.fechaNac} (${edad(p.fechaNac, hoy)} años)` : '—'}</dd>
            </div>
            <div>
              <dt>Paciente desde</dt>
              <dd className="num">{p.creadoEn.slice(0, 10)}</dd>
            </div>
          </dl>

          <div className="pestanas pestanas-linea" role="tablist">
            <button role="tab" aria-selected={pestana === 'citas'} onClick={() => setPestana('citas')}>
              Citas <span className="num gris">{p.citas.length}</span>
            </button>
            <button role="tab" aria-selected={pestana === 'notas'} onClick={() => setPestana('notas')}>
              Notas clínicas <span className="num gris">{p.notas.length}</span>
            </button>
          </div>

          {pestana === 'citas' ? (
            p.citas.length === 0 ? (
              <p className="vacio">Todavía no tiene citas.</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th className="der">Fecha</th>
                    <th className="der">Hora</th>
                    <th>Tratamiento</th>
                    <th>Doctor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {p.citas.map((c) => (
                    <tr key={c.id} className="fila-clic" onClick={() => abrir({ tipo: 'cita', cita: c })}>
                      <td className="der num">{c.inicio.slice(0, 10)}</td>
                      <td className="der num">{hora(c.inicio)}</td>
                      <td>
                        <button className="enlace-fila" onClick={() => abrir({ tipo: 'cita', cita: c })}>
                          {c.tratamiento}
                        </button>
                      </td>
                      <td>{doctores.data?.find((d) => d.id === c.doctorId)?.nombre ?? '—'}</td>
                      <td>
                        <span className={`estado ${CLASE[c.estado]}`}>{ETIQUETA[c.estado]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <Notas pacienteId={p.id} notas={p.notas} puedeNotar={puedeNotar} />
          )}
        </>
      )}
    </div>
  )
}

function Notas({ pacienteId, notas, puedeNotar }: { pacienteId: number; notas: Nota[]; puedeNotar: boolean }) {
  const [texto, setTexto] = useState('')
  const [doctorId, setDoctorId] = useState<number | ''>('')
  const { usuario } = useSesion()
  const doctores = useDoctores()
  const cliente = useQueryClient()
  const tostada = useTostada()
  const necesitaDoctor = usuario?.rol === 'ADMIN'

  const guardar = useMutation({
    mutationFn: () =>
      api<Nota>(`/api/pacientes/${pacienteId}/notas`, {
        metodo: 'POST',
        cuerpo: { texto, doctorId: doctorId === '' ? null : doctorId },
      }),
    onSuccess: () => {
      setTexto('')
      cliente.invalidateQueries({ queryKey: ['paciente', pacienteId] })
      tostada({ texto: 'Nota guardada en la historia.' })
    },
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (texto.trim()) guardar.mutate()
  }

  return (
    <div className="notas">
      {puedeNotar && (
        <form className="nota-form" onSubmit={enviar}>
          <label className="campo">
            <span>Nueva nota</span>
            <textarea
              className="entrada"
              maxLength={2000}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Hallazgos, procedimiento realizado e indicaciones."
            />
          </label>
          <div className="nota-form-pie">
            {necesitaDoctor && (
              <select className="entrada" value={doctorId} onChange={(e) => setDoctorId(Number(e.target.value))} aria-label="Doctor que firma" required>
                <option value="" disabled>
                  Doctor que firma…
                </option>
                {doctores.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            )}
            <button className="btn btn-primario" disabled={!texto.trim() || guardar.isPending || (necesitaDoctor && doctorId === '')}>
              Guardar nota
            </button>
          </div>
          {guardar.error && <p className="error">{guardar.error.message}</p>}
        </form>
      )}
      {notas.length === 0 ? (
        <p className="vacio">Sin notas clínicas todavía.</p>
      ) : (
        <ol className="lista-notas">
          {notas.map((n) => (
            <li key={n.id}>
              <p>{n.texto}</p>
              <span className="gris">
                {n.doctor} · <span className="num">{n.creadoEn.slice(0, 10)} {n.creadoEn.slice(11, 16)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function edad(nacimiento: string, hoy: string) {
  const [a, m, d] = nacimiento.split('-').map(Number)
  const [ha, hm, hd] = hoy.split('-').map(Number)
  return ha - a - (hm < m || (hm === m && hd < d) ? 1 : 0)
}
