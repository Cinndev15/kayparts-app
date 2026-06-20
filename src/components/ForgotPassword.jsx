import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (email.trim() === '') {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || data.message || 'No se pudo enviar el correo de recuperación.');
      }
    } catch (err) {
      console.error('Error sending reset link:', err);
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
      
      {/* LEFT COLUMN: Industrial Imagery & Slogans (Visible only on desktop, identical to Login) */}
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
                  Recuperar Contraseña
                </h1>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '450',
                  lineHeight: '1.4'
                }}>
                  Ingresa tu correo electrónico corporativo y te enviaremos las instrucciones de recuperación.
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

              {/* Form */}
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
                  {loading ? 'Enviando...' : (
                    <>
                      Enviar Instrucciones <ArrowRight size={16} />
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
                Enlace Enviado
              </h1>
              
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '32px'
              }}>
                Hemos enviado las instrucciones para restablecer tu contraseña al correo:<br />
                <strong style={{ color: '#1e293b' }}>{email}</strong>.<br />
                Revisa tu bandeja de entrada o la carpeta de correo no deseado.
              </p>
            </div>
          )}

          {/* Back to Login Link */}
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
            <span>© 2024 Kayparts Industrial S.A.S. </span>
            <span style={{ color: '#94a3b8', marginLeft: '6px' }}>NODO SEGURO: 41.22.88.LX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
