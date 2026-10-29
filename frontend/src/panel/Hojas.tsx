import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Cita } from '../api/tipos'
import { HojaCita } from './HojaCita'
import { HojaNuevaCita } from './HojaNuevaCita'

/** Hojas laterales del panel: detalle de una cita, nueva cita y reprogramación. */
export type Hoja =
  | { tipo: 'cita'; cita: Cita }
  | { tipo: 'nueva'; pacienteId?: number; fecha?: string }
  | { tipo: 'reprogramar'; cita: Cita }

const Contexto = createContext<(h: Hoja | null) => void>(() => {})

export function ProveedorHojas({ children }: { children: ReactNode }) {
  const [hoja, setHoja] = useState<Hoja | null>(null)
  const abrir = useCallback((h: Hoja | null) => setHoja(h), [])

  return (
    <Contexto.Provider value={abrir}>
      {children}
      {hoja && (
        <MarcoHoja
          titulo={hoja.tipo === 'cita' ? 'Cita' : hoja.tipo === 'nueva' ? 'Nueva cita' : 'Reprogramar cita'}
          cerrar={() => setHoja(null)}
        >
          {hoja.tipo === 'cita' && <HojaCita cita={hoja.cita} />}
          {hoja.tipo === 'nueva' && <HojaNuevaCita pacienteId={hoja.pacienteId} fecha={hoja.fecha} />}
          {hoja.tipo === 'reprogramar' && <HojaNuevaCita reprogramar={hoja.cita} />}
        </MarcoHoja>
      )}
    </Contexto.Provider>
  )
}

export function useHojas() {
  return useContext(Contexto)
}

function MarcoHoja({ titulo, cerrar, children }: { titulo: string; cerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', tecla)
    return () => {
      window.removeEventListener('keydown', tecla)
      previo?.focus?.()
    }
  }, [cerrar])

  return (
    <div className="hoja-fondo" onMouseDown={(e) => e.target === e.currentTarget && cerrar()}>
      <div className="hoja" role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={ref}>
        <div className="hoja-cabeza">
          <h2>{titulo}</h2>
          <button className="btn btn-texto" onClick={cerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="hoja-cuerpo">{children}</div>
      </div>
    </div>
  )
}
