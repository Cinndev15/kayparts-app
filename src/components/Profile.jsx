import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Bell, Settings, LogOut, ChevronDown, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import Sidebar from './Sidebar';
import Logo from './Logo';

const Profile = ({ user, onUserUpdate, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    password_confirmation: ''
  });

  const [loading, setLoading] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre y el correo electrónico son obligatorios.',
        confirmButtonColor: '#e21a22'
      });
      return;
    }

    if (formData.password) {
      if (formData.password.length < 8) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La contraseña nueva debe tener al menos 8 caracteres.',
          confirmButtonColor: '#e21a22'
        });
        return;
      }
      if (formData.password !== formData.password_confirmation) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Las contraseñas no coinciden.',
          confirmButtonColor: '#e21a22'
        });
        return;
      }
    }

    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim()
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`${apiUrl}/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.user) {
        Swal.fire({
          icon: 'success',
          title: '¡Perfil Actualizado!',
          text: 'Tus datos de usuario se han actualizado correctamente.',
          confirmButtonColor: '#e21a22'
        });
        
        // Update parent state
        if (onUserUpdate) {
          onUserUpdate(data.user);
        }
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          password: '',
          password_confirmation: ''
        }));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: data.message || 'No se pudo actualizar el perfil.',
          confirmButtonColor: '#e21a22'
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'Error al conectar con el servidor.',
        confirmButtonColor: '#e21a22'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>
      
      {/* 1. SIDEBAR */}
      <Sidebar activeTab="profile" />

      {/* Responsive Layout Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .profile-main-content { padding: 20px !important; }
          .profile-form-grid { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* 2. MAIN CONTAINER */}
      <div className="profile-main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxHeight: '100vh',
        padding: '30px 40px'
      }}>
        
        {/* HEADER */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Logo height={42} />
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                placeholder="Búsqueda rápida de inventario..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none',
                  color: '#1e293b'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => alert('No tiene nuevas notificaciones.')}>
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#e21a22',
                  borderRadius: '50%',
                  border: '2px solid #ffffff'
                }}></span>
              </div>
              <Settings size={20} style={{ cursor: 'pointer' }} onClick={() => alert('Ajustes del sistema.')} />
            </div>

            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: '2px solid #e2e8f0',
                  backgroundImage: 'url("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                  {user?.name || 'Admin'}
                </span>
                <ChevronDown size={14} style={{ color: '#64748b' }} />
              </div>

              {showProfileDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '180px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 100
                }}>
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#64748b',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: '4px'
                  }}>
                    {user?.email || 'admin@kayparts.com'}
                  </div>
                  <button
                    onClick={onLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    className="dropdown-logout-btn"
                  >
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
          padding: '30px'
        }}>
          <div style={{
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '20px',
            marginBottom: '30px'
          }}>
            <h2 className="title-font" style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={24} style={{ color: '#e21a22' }} />
              Perfil del Usuario
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Administra tus datos personales y credenciales de acceso de forma segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="profile-form-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              
              {/* Left Column: General info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Información Básica
                </h3>

                <div className="input-group">
                  <label htmlFor="name" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} style={{ color: '#64748b' }} />
                    Nombre Completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="input-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} style={{ color: '#64748b' }} />
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="phone" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} style={{ color: '#64748b' }} />
                    Teléfono / Celular
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    className="input-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Right Column: Security info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  Seguridad (Nueva Contraseña)
                </h3>

                <div className="input-group">
                  <label htmlFor="password" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} style={{ color: '#64748b' }} />
                    Nueva Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres (dejar en blanco para no cambiar)"
                    className="input-control"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="password_confirmation" className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} style={{ color: '#64748b' }} />
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    placeholder="Repita la nueva contraseña"
                    className="input-control"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '20px',
              marginTop: '10px'
            }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '12px 24px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Save size={18} />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Profile;
