import { useState } from 'react'
import { Check, MessageCircle } from 'lucide-react'
import type { Recordatorio } from '../api/tipos'
import { useMarcarEnviado } from '../lib/consultas'
import { fechaCorta, hora, hoyLima } from '../lib/fechas'
import { useTostada } from '../ui/Tostada'

/**
 * Un mensaje por enviar. Recepción abre WhatsApp con el texto listo y, al volver,
 * confirma si lo envió; solo entonces queda registrado como enviado.
 */
export function FilaRecordatorio({ r, conMensaje = false }: { r: Recordatorio; conMensaje?: boolean }) {
  const [abierto, setAbierto] = useState(false)
  const marcar = useMarcarEnviado()
  const tostada = useTostada()
  const c = r.cita
  const dia = c.inicio.slice(0, 10) === hoyLima() ? 'hoy' : fechaCorta(c.inicio)

  return (
    <li className="fila-rec">
      <div className="fila-rec-texto">
        <strong>
          {c.paciente.nombres.split(' ')[0]} {c.paciente.apellidos.split(' ')[0]}
        </strong>
        <span>
          {r.tipo === 'CONFIRMACION' ? 'Confirmar cita' : 'Recordar cita'} · {dia}{' '}
          <span className="num">{hora(c.inicio)}</span>
        </span>
        {conMensaje && <p className="fila-rec-mensaje">{r.mensaje}</p>}
      </div>
      {r.estado === 'ENVIADO' ? (
        <span className="gris fila-rec-enviado">
          <Check size={14} /> <span className="num">{r.enviadoEn?.slice(11, 16)}</span>
        </span>
      ) : abierto ? (
        <span className="fila-rec-pregunta">
          <span>¿Se envió?</span>
          <button
            className="btn btn-chico btn-primario"
            disabled={marcar.isPending}
            onClick={() =>
              marcar.mutate(r.id, {
                onSuccess: () => tostada({ texto: `Mensaje a ${c.paciente.nombres.split(' ')[0]} registrado como enviado.` }),
                onError: (e) => tostada({ texto: e.message, mal: true }),
              })
            }
          >
            Sí
          </button>
          <button className="btn btn-chico btn-texto" onClick={() => setAbierto(false)}>
            No
          </button>
        </span>
      ) : (
        <a
          className="btn btn-chico btn-whatsapp"
          href={r.enlace}
          target="_blank"
          rel="noreferrer"
          onClick={() => setAbierto(true)}
          title={r.mensaje}
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      )}
    </li>
  )
}
