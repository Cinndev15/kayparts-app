import React, { useState } from 'react';
import { Mail, Lock, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email.trim() === '' || password.trim() === '') {
      setError('Por favor complete todos los campos.');
      setLoading(false);
      return;
    }

    let apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    // Autodetect production domain to prevent Mixed Content blockages (HTTPS requests to HTTP localhost)
    if (window.location.hostname.includes('kayparts.co') && apiUrl.startsWith('http://127.0.0.1')) {
      apiUrl = 'https://api.kayparts.co/api';
    }


    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstField = Object.keys(data.errors)[0];
          if (firstField && data.errors[firstField].length > 0) {
            throw new Error(data.errors[firstField][0]);
          }
        }
        throw new Error(data.message || 'Las credenciales proporcionadas son incorrectas.');
      }

      // Store sanctum token in LocalStorage
      localStorage.setItem('kayparts_token', data.access_token);

      onLoginSuccess({
        email: data.user?.email || email,
        name: data.user?.name || 'Administrador Kayparts',
        role: data.user?.role || 'Director de Operaciones'
      });

    } catch (err) {
      let msg = err.message || 'Error de conexión con el servidor.';
      if (msg === 'Failed to fetch' || msg === 'Load failed' || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = 'No se pudo conectar con el servidor. Por favor, asegúrese de que el servidor API esté corriendo y permita conexiones CORS desde el puerto de la aplicación.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#ffffff',
      overflow: 'hidden'
    }}>
      
      {/* LEFT COLUMN: Industrial Imagery & Slogans (Visible only on desktop) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        flex: '1.1',
        position: 'relative',
        background: 'url("https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=2070") center/cover no-repeat',
        padding: '60px',
        color: '#ffffff'
      }} className="login-left-pane">
        
        {/* Style tag to hide left pane on tablet/mobile views */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1023px) {
            .login-left-pane { display: none !important; }
          }
        `}} />
        
        {/* Dark Overlay to match screenshot grayscale feel */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 100%)',
          mixBlendMode: 'multiply',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          zIndex: 1
        }} />

        {/* Content on Left Side */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#e21a22',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 8px #e21a22'
            }}></span>
            <span className="mono-font" style={{
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#cbd5e1'
            }}>
              Operaciones Globales Activas
            </span>
          </div>

          <h2 className="title-font" style={{
            fontSize: '42px',
            fontWeight: '700',
            lineHeight: '1.15',
            color: '#ffffff',
            maxWidth: '480px',
            marginBottom: '10px',
            letterSpacing: '-0.5px'
          }}>
            Ingeniería de precisión.<br />Escala industrial.
          </h2>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form Portal */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 30px',
        position: 'relative'
      }}>
        
        {/* Spacer to center main form vertically */}
        <div />

        {/* Form Container */}
        <div style={{
          width: '100%',
          maxWidth: '420px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Brand Logo */}
          <div style={{ marginBottom: '32px' }}>
            <Logo height={72} />
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h1 className="title-font" style={{
              fontSize: '26px',
              fontWeight: '600',
              color: '#0f172a',
              marginBottom: '6px',
              letterSpacing: '-0.5px'
            }}>
              Acceso al Sistema
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              fontWeight: '450'
            }}>
              Portal de Planificación de Recursos Empresariales
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Corporate Email */}
            <div className="input-group">
              <label htmlFor="email" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: '#64748b' }} />
                Correo corporativo
              </label>
              <input
                id="email"
                type="email"
                placeholder="nombre@kayparts.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-control"
                required
                disabled={loading}
              />
            </div>

            {/* Access Key */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} style={{ color: '#64748b' }} />
                  Clave de acceso
                </label>
                <a
                  href="#"
                  className="mono-font"
                  onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#e21a22',
                    textDecoration: 'none',
                    letterSpacing: '0.2px',
                    textTransform: 'uppercase'
                  }}
                >
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control"
                required
                disabled={loading}
              />
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                id="remember"
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  accentColor: '#e21a22'
                }}
              />
              <label htmlFor="remember" style={{
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                Mantener sesión iniciada por 24 horas
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '6px',
                marginTop: '8px'
              }}
            >
              {loading ? 'Verificando...' : (
                <>
                  Ingresar al Panel <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Maintenance Notice Box */}
          <div style={{
            display: 'flex',
            gap: '12px',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            padding: '16px',
            width: '100%',
            marginTop: '32px',
            border: '1px solid #e2e8f0'
          }}>
            <Info size={18} style={{ color: '#475569', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ textAlign: 'left' }}>
              <p className="mono-font" style={{
                fontSize: '10px',
                fontWeight: '800',
                color: '#1e293b',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '4px'
              }}>
                Mantenimiento del Sistema
              </p>
              <p style={{
                fontSize: '12px',
                color: '#475569',
                lineHeight: '1.45'
              }}>
                Optimización de base de datos programada para las 22:00 GMT. El rendimiento puede variar.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '20px',
          width: '100%',
          maxWidth: '560px',
          margin: '30px auto 0 auto',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'none' }}>Soporte</a>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'none' }}>Estado</a>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#64748b', textDecoration: 'none' }}>Privacidad</a>
          </div>
          <div className="mono-font" style={{ textAlign: 'right' }}>
            <span>© 2024 Kayparts Industrial S.A.S. </span>
            <span style={{ color: '#94a3b8', marginLeft: '6px' }}>NODO SEGURO: 41.22.88.LX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
