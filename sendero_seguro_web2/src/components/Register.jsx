import { useState } from 'react'
import { api } from '../lib/api'

function PasswordStrength({ password }) {
  const getStrength = (p) => {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }
  if (!password) return null
  const score = getStrength(password)
  const labels = ['', 'Debil', 'Regular', 'Buena', 'Fuerte']
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e']
  return (
    <div style={{marginTop:'6px'}}>
      <div style={{display:'flex',gap:'3px',marginBottom:'4px'}}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex:1, height:'3px', borderRadius:'99px',
            background: i <= score ? colors[score] : 'var(--gray-200)',
            transition:'background 0.3s'
          }}/>
        ))}
      </div>
      <span style={{fontSize:'0.67rem',color:colors[score],fontWeight:600}}>{labels[score]}</span>
    </div>
  )
}

function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const [form, setForm] = useState({ nombre:'', boleta:'', correo:'', password:'', confirmPassword:'' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const validate = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido'
    if (!form.boleta.trim()) errs.boleta = 'La boleta es requerida'
    if (!form.correo.endsWith('@alumno.ipn.mx')) errs.correo = 'Debe ser un correo @alumno.ipn.mx'
    if (form.password.length < 8) errs.password = 'Minimo 8 caracteres'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contrasenas no coinciden'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    try {
      await api.post('/auth/register', {
        boleta: form.boleta,
        nombreCompleto: form.nombre,
        correo: form.correo,
        password: form.password,
      })
      if (onRegisterSuccess) {
        onRegisterSuccess({ boleta: form.boleta })
      }
      if (onSwitchToLogin) {
        onSwitchToLogin()
      }
    } catch (err) {
      setErrors({ form: err.message || 'No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ show }) => show ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const eyeStyle = {position:'absolute',right:'10px',background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)',display:'flex',padding:'4px',transition:'color 0.2s'}

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errors.form && <div className="field-error">{errors.form}</div>}
      <div className="field-group">
        <label className="field-label">Nombre completo</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <input type="text" className={`input-field ${errors.nombre ? 'error' : ''}`} placeholder="Nombre y apellidos" value={form.nombre} onChange={update('nombre')} />
        </div>
        {errors.nombre && <span className="field-error"> {errors.nombre}</span>}
      </div>

      <div className="field-group">
        <label className="field-label">Numero de boleta</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
          </span>
          <input type="text" className={`input-field ${errors.boleta ? 'error' : ''}`} placeholder="Ej: 2023630001" value={form.boleta} onChange={update('boleta')} />
        </div>
        {errors.boleta && <span className="field-error"> {errors.boleta}</span>}
      </div>

      <div className="field-group">
        <label className="field-label">Correo institucional</label>
        <div className="input-wrapper">
          <span className="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          <input type="email" className={`input-field ${errors.correo ? 'error' : ''}`} placeholder="usuario@alumno.ipn.mx" value={form.correo} onChange={update('correo')} />
        </div>
        {errors.correo && <span className="field-error"> {errors.correo}</span>}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Contrasena</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input type={showPass ? 'text' : 'password'} className={`input-field ${errors.password ? 'error' : ''}`} placeholder="••••••••" value={form.password} onChange={update('password')} style={{paddingRight:'38px'}} />
            <button type="button" onClick={() => setShowPass(v => !v)} style={eyeStyle}><EyeIcon show={showPass} /></button>
          </div>
          <PasswordStrength password={form.password} />
          {errors.password && <span className="field-error"> {errors.password}</span>}
        </div>

        <div className="field-group">
          <label className="field-label">Confirmar</label>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input type={showConfirm ? 'text' : 'password'} className={`input-field ${errors.confirmPassword ? 'error' : ''}`} placeholder="••••••••" value={form.confirmPassword} onChange={update('confirmPassword')} style={{paddingRight:'38px'}} />
            <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeStyle}><EyeIcon show={showConfirm} /></button>
          </div>
          {errors.confirmPassword && <span className="field-error"> {errors.confirmPassword}</span>}
        </div>
      </div>

      <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
        {loading ? <span className="spinner" /> : 'Crear Cuenta'}
      </button>
    </form>
  )
}

export default Register
