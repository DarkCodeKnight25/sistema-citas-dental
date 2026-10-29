import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { useBandeja, useClinica } from '../lib/consultas'
import { FilaRecordatorio } from './FilaRecordatorio'

export function Recordatorios() {
  const bandeja = useBandeja()
  const clinica = useClinica()
  const [pestana, setPestana] = useState<'porEnviar' | 'enviados'>('porEnviar')
  const porEnviar = bandeja.data?.porEnviar ?? []
  const enviados = bandeja.data?.enviadosHoy ?? []
  const lista = pestana === 'porEnviar' ? porEnviar : enviados

  return (
    <div className="pagina pagina-angosta">
      <header className="fila-titulo">
        <div>
          <h1>Recordatorios por WhatsApp</h1>
          <p className="hallazgo">
            Cada cita genera una confirmación al registrarse y un recordatorio 24 horas antes. Abre WhatsApp con el
            mensaje listo y marca si lo enviaste.
          </p>
        </div>
      </header>

      {clinica.data?.whatsappDemo && (
        <p className="aviso-demo">
          Modo demo: WhatsApp se abre sin destinatario para no escribir a números reales. En un consultorio, el mensaje
          va directo al celular del paciente.
        </p>
      )}

      <div className="pestanas pestanas-linea" role="tablist">
        <button role="tab" aria-selected={pestana === 'porEnviar'} onClick={() => setPestana('porEnviar')}>
          Por enviar <span className="num gris">{porEnviar.length}</span>
        </button>
        <button role="tab" aria-selected={pestana === 'enviados'} onClick={() => setPestana('enviados')}>
          Enviados hoy <span className="num gris">{enviados.length}</span>
        </button>
      </div>

      {bandeja.error ? (
        <div className="error-bloque">
          <CircleAlert size={16} /> {bandeja.error.message}
        </div>
      ) : bandeja.isPending ? (
        <ul className="lista-rec">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="fila-rec">
              <span className="esqueleto" style={{ width: 220 }} />
            </li>
          ))}
        </ul>
      ) : lista.length === 0 ? (
        <p className="vacio">
          {pestana === 'porEnviar' ? 'Todo enviado. Los siguientes recordatorios aparecerán 24 horas antes de cada cita.' : 'Hoy todavía no se envió ningún mensaje.'}
        </p>
      ) : (
        <ul className="lista-rec lista-rec-ancha">
          {lista.map((r) => (
            <FilaRecordatorio key={r.id} r={r} conMensaje />
          ))}
        </ul>
      )}
    </div>
  )
}
