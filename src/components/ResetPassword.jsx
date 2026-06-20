import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from './Logo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
    } else {
      setError('Enlace de recuperación inválido o incompleto.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !token) {
      setError('Faltan parámetros indispensables (email/token) en la URL.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          token: token,
          password: password,
          password_confirmation: passwordConfirmation
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || 'No se pudo restablecer la contraseña.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Error de conexión con el servidor. Por favor intente más tarde.');
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
        
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1023px) {
            .login-left-pane { display: none !important; }
          }
        `}} />
        
        {/* Dark Overlay */}
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

        {/* Content */}
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
              Acceso Seguro Encriptado
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

      {/* RIGHT COLUMN: Password Reset Portal */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 30px',
        position: 'relative'
      }}>
        
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

          {!submitted ? (
            <>
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <h1 className="title-font" style={{
                  fontSize: '26px',
                  fontWeight: '600',
                  color: '#0f172a',
                  marginBottom: '6px',
                  letterSpacing: '-0.5px'
                }}>
                  Nueva Contraseña
                </h1>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '450',
                  lineHeight: '1.4'
                }}>
                  Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta corporativa.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
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

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Email (Read Only Display) */}
                <div className="input-group" style={{ opacity: 0.8 }}>
                  <label className="input-label">Correo electrónico</label>
                  <input
                    type="text"
                    value={email}
                    className="input-control"
                    disabled
                    style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                  />
                </div>

                {/* Password */}
                <div className="input-group">
                  <label htmlFor="password" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} style={{ color: '#64748b' }} />
                    Nueva contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-control"
                    required
                    disabled={loading || !token}
                  />
                </div>

                {/* Password Confirmation */}
                <div className="input-group">
                  <label htmlFor="password_confirmation" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} style={{ color: '#64748b' }} />
                    Confirmar nueva contraseña
                  </label>
                  <input
                    id="password_confirmation"
                    type="password"
                    placeholder="Repita la contraseña"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="input-control"
                    required
                    disabled={loading || !token}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !token}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontSize: '15px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    marginTop: '8px'
                  }}
                >
                  {loading ? 'Procesando...' : (
                    <>
                      Restablecer Contraseña <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* SUCCESS VIEW */
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                padding: '16px',
                borderRadius: '50%',
                display: 'inline-flex',
                marginBottom: '24px'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <h1 className="title-font" style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#0f172a',
                marginBottom: '12px'
              }}>
                ¡Contraseña Restablecida!
              </h1>
              
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '32px'
              }}>
                Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px 20px', fontWeight: '600' }}
              >
                Ir al Inicio de Sesión
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          {!submitted && (
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '32px',
                transition: 'var(--transition-fast)'
              }}
              className="back-btn-hover"
            >
              <ArrowLeft size={16} />
              Regresar al inicio de sesión
            </button>
          )}
          <style dangerouslySetInnerHTML={{ __html: `
            .back-btn-hover:hover {
              color: #e21a22 !important;
            }
          `}} />
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
            <span>© 2026 Kayparts S.A.S. </span>
            <span style={{ color: '#94a3b8', marginLeft: '6px' }}>NODO SEGURO: 41.22.88.LX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
