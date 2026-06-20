import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Edit2, Users, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import Logo from './Logo';
import Sidebar from './Sidebar';

const Clients = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Success/Error notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states for creating a new client
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Form states for editing an existing client
  const [editingClient, setEditingClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Clients list state
  const [clients, setClients] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Helpers to close modals and reset fields
  const closeModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewPassword('');
    setErrorMessage('');
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone || '');
    setEditPassword('');
    setErrorMessage('');
  };

  const closeEditModal = () => {
    setEditingClient(null);
    setEditName('');
    setEditEmail('');
    setEditPhone('');
    setEditPassword('');
    setErrorMessage('');
  };

  // Fetch clients from Laravel API on mount
  const fetchClients = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.data) {
        setClients(data.data);
      } else {
        console.error('Error in response:', data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Show temporary success banner
  const triggerSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // Handle creating a client
  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setErrorMessage('Por favor ingrese todos los campos requeridos (*).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone || null,
          password: newPassword
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
        throw new Error(data.message || 'Error al crear el cliente.');
      }

      triggerSuccess('¡Cliente creado exitosamente!');
      closeModal();
      fetchClients();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle editing a client
  const handleEditClient = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      setErrorMessage('Nombre y Correo electrónico son campos requeridos.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    const requestBody = {
      name: editName,
      email: editEmail,
      phone: editPhone || null
    };

    if (editPassword.trim()) {
      requestBody.password = editPassword;
    }

    try {
      const response = await fetch(`${apiUrl}/users/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstField = Object.keys(data.errors)[0];
          if (firstField && data.errors[firstField].length > 0) {
            throw new Error(data.errors[firstField][0]);
          }
        }
        throw new Error(data.message || 'Error al actualizar el cliente.');
      }

      triggerSuccess('¡Cliente actualizado exitosamente!');
      closeEditModal();
      fetchClients();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering logic
  const filteredClients = clients.filter(client => {
    const q = searchQuery.toLowerCase();
    const matchesName = client.name ? client.name.toLowerCase().includes(q) : false;
    const matchesEmail = client.email ? client.email.toLowerCase().includes(q) : false;
    const matchesPhone = client.phone ? client.phone.toLowerCase().includes(q) : false;
    return matchesName || matchesEmail || matchesPhone;
  });

  // Client-side pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  
  // Adjust current page if it overflows due to search
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [searchQuery, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#f4f6f8',
      overflow: 'hidden'
    }}>
      {/* 1. SIDEBAR */}
      <Sidebar activeTab="clients" />

      {/* 2. MAIN CONTENT AREA */}
      <div className="dashboard-main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxHeight: '100vh',
        padding: '30px 40px'
      }}>
        
        {/* HEADER BAR */}
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
          {/* Header Left Branding & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.3px'
            }}>
              Kayparts Industrial
            </span>
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
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Right Area Nav & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#64748b',
                  borderBottom: '2px solid transparent',
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
              >
                Panel de Control
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#e21a22',
                  borderBottom: '2px solid #e21a22',
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
              >
                Clientes
              </button>
              <button
                onClick={() => { alert('Módulo de Reportes en desarrollo.'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#64748b',
                  borderBottom: '2px solid transparent',
                  padding: '8px 0',
                  cursor: 'pointer'
                }}
              >
                Reportes
              </button>
            </div>

            <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />

            {/* Support and config */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
              <Bell size={20} style={{ cursor: 'pointer' }} onClick={() => alert('No tiene notificaciones.')} />
              <Settings size={20} style={{ cursor: 'pointer' }} onClick={() => alert('Ajustes.')} />
            </div>

            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500', cursor: 'pointer' }} onClick={() => alert('Contacto de soporte.')}>
              Soporte
            </span>

            {/* Profile Dropdown */}
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

        {/* NOTIFICATION BANNERS */}
        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '14px 20px',
            color: '#047857',
            fontSize: '14px',
            fontWeight: '550',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(4, 120, 87, 0.05)'
          }}>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            {successMessage}
          </div>
        )}

        {/* MAIN TITLE BAR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 className="title-font" style={{
              fontSize: '26px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.5px'
            }}>
              Administración de Clientes
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              Listado y edición de los clientes registrados en la plataforma.
            </p>
          </div>
        </div>

        {/* DATA CONTAINER CARD */}
        <div className="card" style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* SEARCH & FILTERS HEADER */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#475569',
                backgroundColor: '#f1f5f9',
                padding: '6px 12px',
                borderRadius: '6px'
              }}>
                Clientes: {filteredClients.length}
              </span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn"
              style={{
                backgroundColor: '#e21a22',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              <PlusCircle size={16} />
              Nuevo Cliente
            </button>
          </div>

          {/* TABLE DISPLAY */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <th style={{
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Nombre
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Correo Electrónico
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Teléfono
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Fecha Registro
                  </th>
                  <th style={{
                    padding: '16px 24px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textAlign: 'center',
                    width: '100px'
                  }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        width: '32px',
                        height: '32px',
                        border: '3px solid #cbd5e1',
                        borderTopColor: '#e21a22',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '10px'
                      }} />
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Cargando clientes...</div>
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{
                      padding: '60px 24px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '14px'
                    }}>
                      <Users size={32} style={{ color: '#94a3b8', marginBottom: '12px', opacity: 0.7 }} />
                      <p>No se encontraron clientes registrados.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map(client => (
                    <tr
                      key={client.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#0f172a'
                      }}>
                        {client.name}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: '#475569'
                      }}>
                        {client.email}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '14px',
                        color: client.phone ? '#475569' : '#94a3b8',
                        fontStyle: client.phone ? 'normal' : 'italic'
                      }}>
                        {client.phone || 'Sin registrar'}
                      </td>
                      <td style={{
                        padding: '16px 24px',
                        fontSize: '13px',
                        color: '#64748b'
                      }}>
                        {client.created_at ? new Date(client.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td style={{
                        padding: '12px 24px',
                        textAlign: 'center'
                      }}>
                        <button
                          onClick={() => openEditModal(client)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0f172a';
                            e.currentTarget.style.color = '#0f172a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#475569';
                          }}
                        >
                          <Edit2 size={13} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER / PAGINATION */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            padding: '16px 24px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <div>
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredClients.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredClients.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredClients.length}</strong> clientes
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                style={{
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}
                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  style={{
                    border: pageNum === currentPage ? 'none' : '1px solid #cbd5e1',
                    backgroundColor: pageNum === currentPage ? '#e21a22' : '#ffffff',
                    color: pageNum === currentPage ? '#ffffff' : '#64748b',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: pageNum === currentPage ? '700' : '600'
                  }}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                style={{
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}
                onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. MODAL POPUP (Crear Nuevo Cliente) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleUp {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}} />

            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 className="title-font" style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                Nuevo Cliente
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Ingrese los datos para registrar un nuevo cliente en la plataforma.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateClient}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {errorMessage && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#b91c1c',
                    fontSize: '13px',
                    fontWeight: '550'
                  }}>
                    <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div className="input-group">
                  <label htmlFor="cli-name" className="input-label">
                    Nombre completo *
                  </label>
                  <input
                    id="cli-name"
                    type="text"
                    placeholder="Ej. Carlos Mendoza"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Email */}
                <div className="input-group">
                  <label htmlFor="cli-email" className="input-label">
                    Correo electrónico *
                  </label>
                  <input
                    id="cli-email"
                    type="email"
                    placeholder="carlos@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="input-group">
                  <label htmlFor="cli-phone" className="input-label">
                    Teléfono / Celular
                  </label>
                  <input
                    id="cli-phone"
                    type="text"
                    placeholder="+57 300 123 4567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="input-control"
                  />
                </div>

                {/* Password */}
                <div className="input-group">
                  <label htmlFor="cli-pass" className="input-label">
                    Contraseña *
                  </label>
                  <input
                    id="cli-pass"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{
                padding: '16px 24px 24px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                backgroundColor: '#f8fafc'
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                  className="sidebar-hover-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#e21a22',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Guardando...' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL POPUP (Editar Cliente) */}
      {editingClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            display: 'flex',
            flexDirection: 'column'
          }}>

            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 className="title-font" style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                Editar Cliente
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Edite los detalles del cliente seleccionado.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleEditClient}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {errorMessage && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#b91c1c',
                    fontSize: '13px',
                    fontWeight: '550'
                  }}>
                    <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name */}
                <div className="input-group">
                  <label htmlFor="edit-cli-name" className="input-label">
                    Nombre completo *
                  </label>
                  <input
                    id="edit-cli-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Email */}
                <div className="input-group">
                  <label htmlFor="edit-cli-email" className="input-label">
                    Correo electrónico *
                  </label>
                  <input
                    id="edit-cli-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="input-group">
                  <label htmlFor="edit-cli-phone" className="input-label">
                    Teléfono / Celular
                  </label>
                  <input
                    id="edit-cli-phone"
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="input-control"
                  />
                </div>

                {/* Password (Optional) */}
                <div className="input-group">
                  <label htmlFor="edit-cli-pass" className="input-label">
                    Nueva contraseña
                  </label>
                  <input
                    id="edit-cli-pass"
                    type="password"
                    placeholder="Dejar en blanco para mantener la actual"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="input-control"
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Solo llene este campo si desea cambiar la contraseña del cliente.
                  </span>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{
                padding: '16px 24px 24px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                backgroundColor: '#f8fafc'
              }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                  className="sidebar-hover-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#e21a22',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
