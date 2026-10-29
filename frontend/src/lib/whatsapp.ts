import type { Cita, Clinica } from '../api/tipos'
import { fechaLarga, hora } from './fechas'

/**
 * Enlace wa.me con un mensaje sobre la cita. En modo demo no lleva número:
 * WhatsApp pide elegir el contacto y nunca se escribe a un celular real.
 */
export function enlaceCita(cita: Cita, clinica: Clinica | undefined): string {
  const nombre = cita.paciente.nombres.split(' ')[0]
  const texto = `Hola ${nombre}, te escribimos de ${clinica?.nombre ?? 'Dental Qori'} sobre tu cita del ${fechaLarga(cita.inicio)} a las ${hora(cita.inicio)} (código ${cita.codigo}). ¿Nos confirmas tu asistencia?`
  const destino = clinica?.whatsappDemo === false ? `51${cita.paciente.celular}` : ''
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`
}
