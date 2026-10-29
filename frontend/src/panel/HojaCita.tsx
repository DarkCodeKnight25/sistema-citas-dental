import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, MessageCircle, Phone, UserRound } from 'lucide-react'
import type { Cita } from '../api/tipos'
import { useCambiarEstado, useClinica, useDoctores } from '../lib/consultas'
import { CLASE, ETIQUETA, SIGUIENTES } from '../lib/estados'
import { celular, fechaLarga, hora } from '../lib/fechas'
import { puedeGestionar, useSesion } from '../lib/sesion'
import { enlaceCita } from '../lib/whatsapp'
import { useTostada } from '../ui/Tostada'
import { useHojas } from './Hojas'

export function HojaCita({ cita: inicial }: { cita: Cita }) {
  const [cita, setCita] = useState(inicial)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const { usuario } = useSesion()
  const doctores = useDoctores()
  const clinica = useClinica()
  const cambiar = useCambiarEstado()
  const tostada = useTostada()
  const abrir = useHojas()
  const gestiona = puedeGestionar(usuario)
  const doctor = doctores.data?.find((d) => d.id === cita.doctorId)

  function pasar(estado: Cita['estado']) {
    cambiar.mutate(
      { id: cita.id, estado },
      {
        onSuccess: (c) => {
          setCita(c)
          setConfirmarCancelar(false)
          tostada({ texto: `${c.paciente.nombres.split(' ')[0]}: ${ETIQUETA[c.estado].toLowerCase()}.` })
        },
        onError: (e) => tostada({ texto: e.message, mal: true }),
      },
    )
  }

  const enlace = enlaceCita(cita, clinica.data)

  const acciones = gestiona ? SIGUIENTES[cita.estado] : SIGUIENTES[cita.estado].filter((a) => a.estado === 'ATENDIDA')
  const sePuedeCancelar = gestiona && (cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA')

  return (
    <div className="detalle-cita">
      <div className="detalle-encabezado">
        <span className={`estado ${CLASE[cita.estado]}`}>{ETIQUETA[cita.estado]}</span>
        <span className="num detalle-codigo">{cita.codigo}</span>
      </div>

      <p className="detalle-hora">
        <span className="num">
          {hora(cita.inicio)}–{hora(cita.fin)}
        </span>
        <span>{fechaLarga(cita.inicio)}</span>
      </p>

      <dl className="lista-datos">
        <div>
          <dt>Paciente</dt>
          <dd>
            <Link to={`/panel/pacientes/${cita.paciente.id}`} onClick={() => abrir(null)} className="enlace-fuerte">
              {cita.paciente.nombres} {cita.paciente.apellidos}
            </Link>
          </dd>
        </div>
        <div>
          <dt>Celular</dt>
          <dd className="num">
            <Phone size={13} aria-hidden="true" /> {celular(cita.paciente.celular)}
          </dd>
        </div>
        <div>
          <dt>DNI</dt>
          <dd className="num">{cita.paciente.dni ?? '—'}</dd>
        </div>
        <div>
          <dt>Tratamiento</dt>
          <dd>
            {cita.tratamiento} <span className="gris num">· {cita.duracionMin} min</span>
          </dd>
        </div>
        <div>
          <dt>Doctor</dt>
          <dd className="con-inicial">
            {doctor && <span className="punto-doctor" style={{ background: doctor.tinta }} aria-hidden="true" />}
            {doctor?.nombre ?? '—'}
          </dd>
        </div>
        <div>
          <dt>Origen</dt>
          <dd>{cita.origen === 'WEB' ? 'Reserva en línea' : 'Registrada en recepción'}</dd>
        </div>
        {cita.nota && (
          <div>
            <dt>Nota</dt>
            <dd>{cita.nota}</dd>
          </div>
        )}
      </dl>

      {acciones.length > 0 && (
        <div className="detalle-acciones">
          {acciones.map((a, i) => (
            <button
              key={a.estado}
              className={'btn' + (i === 0 ? ' btn-primario' : '')}
              disabled={cambiar.isPending}
              onClick={() => pasar(a.estado)}
            >
              {a.texto}
            </button>
          ))}
        </div>
      )}

      <div className="detalle-acciones">
        <a className="btn btn-whatsapp" href={enlace} target="_blank" rel="noreferrer">
          <MessageCircle size={15} /> WhatsApp
        </a>
        {sePuedeCancelar && (
          <button className="btn" onClick={() => abrir({ tipo: 'reprogramar', cita })}>
            <CalendarClock size={15} /> Reprogramar
          </button>
        )}
        <Link className="btn btn-texto" to={`/panel/pacientes/${cita.paciente.id}`} onClick={() => abrir(null)}>
          <UserRound size={15} /> Ficha
        </Link>
      </div>

      {sePuedeCancelar && (
        <div className="zona-peligro">
          {!confirmarCancelar ? (
            <button className="btn btn-peligro" onClick={() => setConfirmarCancelar(true)}>
              Cancelar cita
            </button>
          ) : (
            <div className="confirmar-peligro" role="alert">
              <p>
                ¿Cancelar la cita de {cita.paciente.nombres.split(' ')[0]}? La hora queda libre para otro paciente.
              </p>
              <div>
                <button className="btn btn-peligro" disabled={cambiar.isPending} onClick={() => pasar('CANCELADA')}>
                  Sí, cancelar
                </button>
                <button className="btn btn-texto" onClick={() => setConfirmarCancelar(false)}>
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
