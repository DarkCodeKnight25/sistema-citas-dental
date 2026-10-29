import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, LogOut, Plus, Trash2 } from 'lucide-react'
import { api } from '../api/cliente'
import type { Doctor, Feriado, Horario, Tratamiento } from '../api/tipos'
import { fechaLarga, hoyLima, soles } from '../lib/fechas'
import { useSesion } from '../lib/sesion'
import { useTostada } from '../ui/Tostada'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function Ajustes() {
  const { usuario, salir } = useSesion()
  const admin = usuario?.rol === 'ADMIN'
  const [vista, setVista] = useState<'tratamientos' | 'horarios' | 'feriados'>('tratamientos')

  return (
    <div className="pagina pagina-angosta">
      <header className="fila-titulo">
        <div>
          <h1>Ajustes del consultorio</h1>
          <p className="hallazgo">
            {admin ? 'Los cambios se aplican de inmediato en la reserva en línea.' : 'Solo la administración puede editar estos datos.'}
          </p>
        </div>
        <button className="btn btn-texto btn-salir-cuenta" onClick={salir}>
          <LogOut size={15} /> Cerrar sesión ({usuario?.nombre})
        </button>
      </header>
      <div className="pestanas pestanas-linea" role="tablist">
        <button role="tab" aria-selected={vista === 'tratamientos'} onClick={() => setVista('tratamientos')}>
          Tratamientos
        </button>
        <button role="tab" aria-selected={vista === 'horarios'} onClick={() => setVista('horarios')}>
          Doctores y horarios
        </button>
        <button role="tab" aria-selected={vista === 'feriados'} onClick={() => setVista('feriados')}>
          Feriados
        </button>
      </div>
      {vista === 'tratamientos' && <Tratamientos admin={admin} />}
      {vista === 'horarios' && <Horarios admin={admin} />}
      {vista === 'feriados' && <Feriados admin={admin} />}
    </div>
  )
}

function Tratamientos({ admin }: { admin: boolean }) {
  const lista = useQuery({ queryKey: ['ajustes', 'tratamientos'], queryFn: () => api<Tratamiento[]>('/api/ajustes/tratamientos') })
  const [editando, setEditando] = useState<number | null>(null)

  if (lista.error) return <ErrorBloque mensaje={lista.error.message} />
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Tratamiento</th>
          <th className="der">Duración</th>
          <th className="der">Precio ref.</th>
          <th>Reserva en línea</th>
          {admin && <th className="der">Acción</th>}
        </tr>
      </thead>
      <tbody>
        {lista.data?.map((t) =>
          editando === t.id ? (
            <FilaEditarTratamiento key={t.id} t={t} cerrar={() => setEditando(null)} />
          ) : (
            <tr key={t.id}>
              <td>
                {t.nombre}
                <div className="gris sub">{t.descripcion}</div>
              </td>
              <td className="der num">{t.duracionMin} min</td>
              <td className="der num">{soles(t.precioRef)}</td>
              <td>{t.activo ? <span className="estado e-confirmada">Visible</span> : <span className="estado e-atendida">Oculto</span>}</td>
              {admin && (
                <td className="der">
                  <button className="btn btn-chico btn-texto" onClick={() => setEditando(t.id)}>
                    Editar
                  </button>
                </td>
              )}
            </tr>
          ),
        )}
      </tbody>
    </table>
  )
}

function FilaEditarTratamiento({ t, cerrar }: { t: Tratamiento; cerrar: () => void }) {
  const [f, setF] = useState({ ...t, descripcion: t.descripcion ?? '' })
  const cliente = useQueryClient()
  const tostada = useTostada()
  const guardar = useMutation({
    mutationFn: () => api<Tratamiento>(`/api/ajustes/tratamientos/${t.id}`, { metodo: 'PUT', cuerpo: f }),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['ajustes', 'tratamientos'] })
      cliente.invalidateQueries({ queryKey: ['tratamientos'] })
      tostada({ texto: `${f.nombre} actualizado.` })
      cerrar()
    },
    onError: (e) => tostada({ texto: e.message, mal: true }),
  })
  return (
    <tr className="fila-edicion">
      <td>
        <input className="entrada" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} aria-label="Nombre" />
      </td>
      <td className="der">
        <input
          className="entrada num corta"
          type="number"
          min={15}
          max={240}
          step={15}
          value={f.duracionMin}
          onChange={(e) => setF({ ...f, duracionMin: Number(e.target.value) })}
          aria-label="Duración en minutos"
        />
      </td>
      <td className="der">
        <input
          className="entrada num corta"
          type="number"
          min={0}
          step={10}
          value={f.precioRef}
          onChange={(e) => setF({ ...f, precioRef: Number(e.target.value) })}
          aria-label="Precio referencial en soles"
        />
      </td>
      <td>
        <label className="casilla">
          <input type="checkbox" checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Visible
        </label>
      </td>
      <td className="der acciones-fila">
        <button className="btn btn-chico btn-primario" disabled={guardar.isPending} onClick={() => guardar.mutate()}>
          Guardar
        </button>
        <button className="btn btn-chico btn-texto" onClick={cerrar}>
          Cancelar
        </button>
      </td>
    </tr>
  )
}

function Horarios({ admin }: { admin: boolean }) {
  const doctores = useQuery({ queryKey: ['ajustes', 'doctores'], queryFn: () => api<Doctor[]>('/api/ajustes/doctores') })
  const [elegido, setElegido] = useState<number | null>(null)
  const actual = elegido ?? doctores.data?.[0]?.id ?? null

  if (doctores.error) return <ErrorBloque mensaje={doctores.error.message} />
  return (
    <div className="ajustes-doble">
      <ul className="lista-doctores" role="listbox" aria-label="Doctor">
        {doctores.data?.map((d) => (
          <li key={d.id}>
            <button role="option" aria-selected={d.id === actual} onClick={() => setElegido(d.id)}>
              <span className="punto-doctor" style={{ background: d.tinta }} aria-hidden="true" />
              <span>
                <strong>{d.nombre}</strong>
                <small>{d.especialidad}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {actual != null && <EditorHorario key={actual} doctorId={actual} admin={admin} />}
    </div>
  )
}

type Bloque = { diaSemana: number; horaInicio: string; horaFin: string }

function EditorHorario({ doctorId, admin }: { doctorId: number; admin: boolean }) {
  const cliente = useQueryClient()
  const tostada = useTostada()
  const horario = useQuery({ queryKey: ['horario', doctorId], queryFn: () => api<Horario[]>(`/api/ajustes/doctores/${doctorId}/horario`) })
  const [bloques, setBloques] = useState<Bloque[]>([])
  useEffect(() => {
    if (horario.data) setBloques(horario.data.map((h) => ({ diaSemana: h.diaSemana, horaInicio: h.horaInicio.slice(0, 5), horaFin: h.horaFin.slice(0, 5) })))
  }, [horario.data])

  const guardar = useMutation({
    mutationFn: () => api<Horario[]>(`/api/ajustes/doctores/${doctorId}/horario`, { metodo: 'PUT', cuerpo: bloques }),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ['horario', doctorId] })
      tostada({ texto: 'Horario guardado. Las citas ya registradas no se mueven.' })
    },
    onError: (e) => tostada({ texto: e.message, mal: true }),
  })

  const cambiar = (i: number, campo: keyof Bloque, valor: string | number) =>
    setBloques(bloques.map((b, j) => (j === i ? { ...b, [campo]: valor } : b)))

  return (
    <div className="editor-horario">
      <h2 className="titulo-bloque">Bloques de atención por semana</h2>
      {horario.isPending ? (
        <span className="esqueleto" style={{ width: 240 }} />
      ) : (
        <>
          {bloques.length === 0 && <p className="vacio">Sin bloques: este doctor no aparece en la reserva en línea.</p>}
          <ul className="bloques">
            {bloques
              .map((b, i) => ({ b, i }))
              .sort((x, y) => x.b.diaSemana - y.b.diaSemana || x.b.horaInicio.localeCompare(y.b.horaInicio))
              .map(({ b, i }) => (
                <li key={i}>
                  <select className="entrada" value={b.diaSemana} disabled={!admin} onChange={(e) => cambiar(i, 'diaSemana', Number(e.target.value))} aria-label="Día">
                    {DIAS.map((d, k) => (
                      <option key={d} value={k + 1}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <input className="entrada num" type="time" step={1800} value={b.horaInicio} disabled={!admin} onChange={(e) => cambiar(i, 'horaInicio', e.target.value)} aria-label="Desde" />
                  <span className="gris">a</span>
                  <input className="entrada num" type="time" step={1800} value={b.horaFin} disabled={!admin} onChange={(e) => cambiar(i, 'horaFin', e.target.value)} aria-label="Hasta" />
                  {admin && (
                    <button className="btn btn-texto btn-chico" onClick={() => setBloques(bloques.filter((_, j) => j !== i))} aria-label="Quitar bloque">
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
          </ul>
          {admin && (
            <div className="pie-hoja">
              <button className="btn btn-chico" onClick={() => setBloques([...bloques, { diaSemana: 1, horaInicio: '09:00', horaFin: '13:00' }])}>
                <Plus size={14} /> Agregar bloque
              </button>
              <button className="btn btn-primario" disabled={guardar.isPending} onClick={() => guardar.mutate()}>
                Guardar horario
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Feriados({ admin }: { admin: boolean }) {
  const cliente = useQueryClient()
  const tostada = useTostada()
  const lista = useQuery({ queryKey: ['ajustes', 'feriados'], queryFn: () => api<Feriado[]>('/api/ajustes/feriados') })
  const [nuevo, setNuevo] = useState({ fecha: '', nombre: '' })
  const hoy = hoyLima()
  const proximos = lista.data?.filter((f) => f.fecha >= hoy) ?? []

  const refrescar = () => {
    cliente.invalidateQueries({ queryKey: ['ajustes', 'feriados'] })
    cliente.invalidateQueries({ queryKey: ['feriados'] })
  }
  const agregar = useMutation({
    mutationFn: () => api<Feriado>('/api/ajustes/feriados', { metodo: 'POST', cuerpo: nuevo }),
    onSuccess: () => {
      refrescar()
      tostada({ texto: `Feriado del ${fechaLarga(nuevo.fecha)} agregado.` })
      setNuevo({ fecha: '', nombre: '' })
    },
    onError: (e) => tostada({ texto: e.message, mal: true }),
  })
  const borrar = useMutation({
    mutationFn: (fecha: string) => api<void>(`/api/ajustes/feriados/${fecha}`, { metodo: 'DELETE' }),
    onSuccess: refrescar,
    onError: (e) => tostada({ texto: e.message, mal: true }),
  })

  function enviar(e: FormEvent) {
    e.preventDefault()
    agregar.mutate()
  }

  if (lista.error) return <ErrorBloque mensaje={lista.error.message} />
  return (
    <>
      {admin && (
        <form className="form-feriado" onSubmit={enviar}>
          <label className="campo">
            <span>Fecha</span>
            <input className="entrada num" type="date" required min={hoy} value={nuevo.fecha} onChange={(e) => setNuevo({ ...nuevo, fecha: e.target.value })} />
          </label>
          <label className="campo">
            <span>Motivo</span>
            <input className="entrada" required maxLength={120} placeholder="Ej.: Vacaciones del consultorio" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          </label>
          <button className="btn btn-primario" disabled={agregar.isPending}>
            Agregar día sin atención
          </button>
        </form>
      )}
      <table className="tabla">
        <thead>
          <tr>
            <th className="der">Fecha</th>
            <th>Día</th>
            <th>Motivo</th>
            {admin && <th className="der">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {proximos.map((f) => (
            <tr key={f.fecha}>
              <td className="der num">{f.fecha}</td>
              <td>{fechaLarga(f.fecha).split(' ')[0]}</td>
              <td>{f.nombre}</td>
              {admin && (
                <td className="der">
                  <button className="btn btn-chico btn-texto" disabled={borrar.isPending} onClick={() => borrar.mutate(f.fecha)} aria-label={`Quitar ${f.nombre}`}>
                    <Trash2 size={14} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function ErrorBloque({ mensaje }: { mensaje: string }) {
  return (
    <div className="error-bloque">
      <CircleAlert size={16} /> {mensaje}
    </div>
  )
}
