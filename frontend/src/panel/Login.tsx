import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSesion } from '../lib/sesion'
import { Marca } from '../ui/Marca'

const DEMO = [
  { email: 'recepcion@dentalqori.demo', rol: 'Recepción', que: 'agenda, citas y recordatorios' },
  { email: 'doctor@dentalqori.demo', rol: 'Doctor', que: 'su agenda y notas clínicas' },
  { email: 'admin@dentalqori.demo', rol: 'Administración', que: 'todo, incluidos los ajustes' },
]

export function Login() {
  const { entrar } = useSesion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function ingresar(correo: string, clave: string) {
    setEnviando(true)
    setError(null)
    try {
      await entrar(correo, clave)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    ingresar(email, password)
  }

  return (
    <div className="login">
      <div className="login-caja">
        <div className="login-marca">
          <Marca tam={32} />
          <div>
            <h1>Panel de Dental Qori</h1>
            <p>Agenda, pacientes y recordatorios por WhatsApp.</p>
          </div>
        </div>

        <form onSubmit={enviar} className="login-form">
          <label className="campo">
            <span>Correo</span>
            <input className="entrada" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input className="entrada" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && (
            <p className="error-reserva" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primario" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="login-demo">
          <h2>Entrar a la demo</h2>
          <p>Los datos son ficticios y se reinician cada día. Contraseña de las tres cuentas: <span className="num">demo1234</span></p>
          <ul>
            {DEMO.map((d) => (
              <li key={d.email}>
                <button className="login-demo-fila" disabled={enviando} onClick={() => ingresar(d.email, 'demo1234')}>
                  <strong>{d.rol}</strong>
                  <span>{d.que}</span>
                  <span className="num">{d.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Link to="/" className="btn btn-texto btn-chico login-volver">
          <ArrowLeft size={14} /> Página de reservas
        </Link>
      </div>
    </div>
  )
}
