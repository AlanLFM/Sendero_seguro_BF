import { useState } from 'react'
import Login from '../components/Login'
import Register from '../components/Register'
import tibLogo from '../assets/tib.png'

const LoginPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('login')

  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="overlay" />
        <div className="left-content">
          <div className="logo-box">
            <img src={tibLogo} alt="Logo Tib" className="logo-img" />
          </div>
          <h1 className="brand-title">Sendero Seguro<br />ESCOM</h1>
          <p className="brand-subtitle">
            Protegiendo nuestra comunidad academica a traves de la
            vigilancia colaborativa y tecnologia de vanguardia.
          </p>
          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span>SEGURIDAD</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span>COMUNIDAD</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span>RESPUESTA</span>
            </div>
          </div>
        </div>
        <button className="sos-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          SOS
        </button>
      </div>

      <div className="right-panel">
        <div className="form-card">
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Iniciar Sesion
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Registrarse
            </button>
          </div>

          {activeTab === 'login' ? (
            <Login onSwitchToRegister={() => setActiveTab('register')} onLoginSuccess={onLoginSuccess} />
          ) : (
            <Register onSwitchToLogin={() => setActiveTab('login')} onRegisterSuccess={onLoginSuccess} />
          )}
        </div>

        <div className="info-banner">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{flexShrink:0}}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>
            Eres nuevo? El registro requiere <strong>validacion de correo institucional
            @alumno.ipn.mx</strong> para garantizar la seguridad de la red.
          </p>
        </div>

        <div className="footer-links">
          <span>Plataforma Institucional para la Comunidad Politecnica</span>
          <div className="links">
            <a href="#">PRIVACIDAD</a>
            <a href="#">TERMINOS</a>
            <a href="#">AYUDA</a>
          </div>
        </div>

        <div className="sistemas-badge">
          <span className="dot" />
          SISTEMAS OPERATIVOS
        </div>
      </div>
    </div>
  )
}

export default LoginPage
