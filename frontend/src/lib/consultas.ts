import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/cliente'
import type { Cita, Clinica, Doctor, EstadoCita, Feriado, Recordatorio, Tratamiento } from '../api/tipos'

export function useClinica() {
  return useQuery({ queryKey: ['clinica'], queryFn: () => api<Clinica>('/api/publico/clinica'), staleTime: 600_000 })
}

export function useTratamientos() {
  return useQuery({
    queryKey: ['tratamientos'],
    queryFn: () => api<Tratamiento[]>('/api/publico/tratamientos'),
    staleTime: 600_000,
  })
}

export function useDoctores() {
  return useQuery({ queryKey: ['doctores'], queryFn: () => api<Doctor[]>('/api/publico/doctores'), staleTime: 600_000 })
}

export function useFeriados() {
  return useQuery({ queryKey: ['feriados'], queryFn: () => api<Feriado[]>('/api/publico/feriados'), staleTime: 600_000 })
}

export function useCitas(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['citas', desde, hasta],
    queryFn: () => api<Cita[]>(`/api/citas?desde=${desde}&hasta=${hasta}`),
    refetchInterval: 60_000,
  })
}

export interface Bandeja {
  porEnviar: Recordatorio[]
  enviadosHoy: Recordatorio[]
}

export function useBandeja(activa = true) {
  return useQuery({
    queryKey: ['recordatorios'],
    queryFn: () => api<Bandeja>('/api/recordatorios'),
    refetchInterval: 60_000,
    enabled: activa,
  })
}

export function useCambiarEstado() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoCita }) =>
      api<Cita>(`/api/citas/${id}/estado`, { metodo: 'PATCH', cuerpo: { estado } }),
    onSuccess: (cita) => {
      // Actualiza la cita en todas las listas cargadas para que la agenda cambie al instante.
      cliente.setQueriesData<Cita[]>({ queryKey: ['citas'] }, (lista) =>
        lista?.map((c) => (c.id === cita.id ? cita : c)),
      )
      cliente.invalidateQueries({ queryKey: ['recordatorios'] })
      cliente.invalidateQueries({ queryKey: ['paciente'] })
    },
  })
}

export function useMarcarEnviado() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<Recordatorio>(`/api/recordatorios/${id}/enviado`, { metodo: 'POST' }),
    onSuccess: () => cliente.invalidateQueries({ queryKey: ['recordatorios'] }),
  })
}
