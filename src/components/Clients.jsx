import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Edit2, Users, CheckCircle2, AlertTriangle, XCircle, MapPin
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Clients = ({ user, onLogout }) => {
  const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewingAddressesClient, setViewingAddressesClient] = useState(null);

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
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <Navbar user={user} onLogout={onLogout} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="dashboard-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '30px 40px'
        }}>
        
        {/* HEADER BAR */}
        

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
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => setViewingAddressesClient(client)}
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
                            <MapPin size={13} />
                            Direcciones
                          </button>
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
                        </div>
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

      {/* 5. MODAL POPUP (Ver Direcciones) */}
      {viewingAddressesClient && (
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
            maxWidth: '600px',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 className="title-font" style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#0f172a'
                }}>
                  Direcciones Registradas
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Cliente: <strong style={{ color: '#1e293b' }}>{viewingAddressesClient.name}</strong> ({viewingAddressesClient.email})
                </p>
              </div>
              <button
                onClick={() => setViewingAddressesClient(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                &times;
              </button>
            </div>

            {/* Address List Content */}
            <div style={{
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {!viewingAddressesClient.addresses || viewingAddressesClient.addresses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b'
                }}>
                  <MapPin size={36} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500' }}>Este cliente no tiene direcciones registradas.</p>
                </div>
              ) : (
                viewingAddressesClient.addresses.map((address) => (
                  <div
                    key={address.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      backgroundColor: address.is_primary ? '#f8fafc' : '#ffffff',
                      borderLeft: address.is_primary ? '4px solid #e21a22' : '1px solid #e2e8f0',
                      position: 'relative',
                      textAlign: 'left'
                    }}
                  >
                    {/* Primary Badge */}
                    {address.is_primary && (
                      <span style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#fee2e2',
                        color: '#e21a22',
                        padding: '2px 8px',
                        borderRadius: '9999px'
                      }}>
                        Principal
                      </span>
                    )}

                    {/* Alias / Title */}
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#0f172a',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <MapPin size={14} style={{ color: '#e21a22' }} />
                      {address.alias || 'Dirección'}
                    </h4>

                    {/* Recipient */}
                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                      <strong>Destinatario:</strong> {address.recipient_name} ({address.phone})
                    </div>

                    {/* Address Line 1 */}
                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                      <strong>Dirección:</strong> {address.address_line_1}
                      {address.address_line_2 && ` - ${address.address_line_2}`}
                    </div>

                    {/* Department / City */}
                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                      <strong>Ciudad/Depto:</strong> {address.city}, {address.department}
                    </div>

                    {/* Additional Info */}
                    {address.additional_info && (
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontStyle: 'italic',
                        marginTop: '8px',
                        backgroundColor: '#f1f5f9',
                        padding: '6px 10px',
                        borderRadius: '6px'
                      }}>
                        <strong>Info adicional:</strong> {address.additional_info}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setViewingAddressesClient(null)}
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
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      </div>
  );
};

export default Clients;
