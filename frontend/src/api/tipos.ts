// Contratos de la API (ver backend/.../web/Dtos.java). Fechas en hora local de Lima, sin zona.

export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'EN_ATENCION' | 'ATENDIDA' | 'NO_ASISTIO' | 'CANCELADA'
export type Rol = 'ADMIN' | 'RECEPCION' | 'DOCTOR'

export interface Doctor {
  id: number
  nombre: string
  especialidad: string
  tinta: string
  activo: boolean
  tratamientoIds: number[]
  /** Días con horario (1 = lunes); solo lo llena la API pública. */
  dias: number[]
}

export interface Tratamiento {
  id: number
  nombre: string
  descripcion: string | null
  duracionMin: number
  precioRef: number
  activo: boolean
}

export interface PacienteResumen {
  id: number
  nombres: string
  apellidos: string
  dni: string | null
  celular: string
}

export interface Cita {
  id: number
  codigo: string
  inicio: string
  fin: string
  estado: EstadoCita
  origen: 'WEB' | 'RECEPCION'
  nota: string | null
  paciente: PacienteResumen
  doctorId: number
  tratamientoId: number
  tratamiento: string
  duracionMin: number
  actualizadoEn: string
}

export interface Disponibilidad {
  fecha: string
  feriado: string | null
  doctores: { doctorId: number; horas: string[] }[]
}

export interface Clinica {
  nombre: string
  direccion: string
  referencia: string
  celular: string
  whatsappDemo: boolean
  anticipacionWebMin: number
  ahora: string
}

export interface Feriado {
  fecha: string
  nombre: string
}

export interface DatosPaciente {
  nombres: string
  apellidos: string
  dni: string
  celular: string
}

export interface ReservaHecha {
  codigo: string
  inicio: string
  fin: string
  doctor: string
  tratamiento: string
  precioRef: number
  paciente: string
  direccion: string
  referencia: string
  whatsappClinica: string
}

export interface Recordatorio {
  id: number
  tipo: 'CONFIRMACION' | 'RECORDATORIO'
  estado: 'PENDIENTE' | 'ENVIADO' | 'OMITIDO'
  programadoPara: string
  enviadoEn: string | null
  enviadoPor: string | null
  cita: Cita
  mensaje: string
  enlace: string
}

export interface Nota {
  id: number
  texto: string
  creadoEn: string
  doctorId: number
  doctor: string
}

export interface PacienteDetalle extends PacienteResumen {
  fechaNac: string | null
  alergias: string | null
  creadoEn: string
  citas: Cita[]
  notas: Nota[]
}

export interface Usuario {
  email: string
  nombre: string
  rol: Rol
  doctorId: number | null
}

export interface Horario {
  id: number
  diaSemana: number
  horaInicio: string
  horaFin: string
}
