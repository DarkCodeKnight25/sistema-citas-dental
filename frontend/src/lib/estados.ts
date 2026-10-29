import type { EstadoCita } from '../api/tipos'

export const ETIQUETA: Record<EstadoCita, string> = {
  PENDIENTE: 'Por confirmar',
  CONFIRMADA: 'Confirmada',
  EN_ATENCION: 'En atención',
  ATENDIDA: 'Atendida',
  NO_ASISTIO: 'No asistió',
  CANCELADA: 'Cancelada',
}

/** Clase CSS del estado: define la tinta y la marca del bloque en la agenda. */
export const CLASE: Record<EstadoCita, string> = {
  PENDIENTE: 'e-pendiente',
  CONFIRMADA: 'e-confirmada',
  EN_ATENCION: 'e-atencion',
  ATENDIDA: 'e-atendida',
  NO_ASISTIO: 'e-falto',
  CANCELADA: 'e-cancelada',
}

/** Acciones que recepción puede tomar desde cada estado, en el orden en que se muestran. */
export const SIGUIENTES: Record<EstadoCita, { estado: EstadoCita; texto: string }[]> = {
  PENDIENTE: [
    { estado: 'CONFIRMADA', texto: 'Confirmar' },
    { estado: 'EN_ATENCION', texto: 'Llegó: pasa al sillón' },
    { estado: 'NO_ASISTIO', texto: 'No asistió' },
  ],
  CONFIRMADA: [
    { estado: 'EN_ATENCION', texto: 'Llegó: pasa al sillón' },
    { estado: 'PENDIENTE', texto: 'Volver a por confirmar' },
    { estado: 'NO_ASISTIO', texto: 'No asistió' },
  ],
  EN_ATENCION: [{ estado: 'ATENDIDA', texto: 'Terminar atención' }],
  ATENDIDA: [],
  NO_ASISTIO: [],
  CANCELADA: [],
}

export const ACTIVAS: EstadoCita[] = ['PENDIENTE', 'CONFIRMADA', 'EN_ATENCION']
