import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Reserva } from './publico/Reserva'
import { AvisoDespertar } from './ui/AvisoDespertar'

// El panel no se descarga para quien solo viene a reservar desde el celular.
const Panel = lazy(() => import('./panel/Panel'))

export default function App() {
  return (
    <>
      <AvisoDespertar />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Reserva />} />
          <Route path="/panel/*" element={<Panel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
