import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, Edit2, Info, Truck
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Carriers = ({ user, onLogout }) => {
  const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'active'
  });
  
  // Edit state tracker
  const [editingCarrier, setEditingCarrier] = useState(null);

  // Success / error message states
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success'); // 'success' | 'error'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Helper to trigger temporary alerts
  const showAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    // Clear alert after 5 seconds
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // Helper to get API URL
  const getApiUrl = () => {
    let apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    if (window.location.hostname.includes('kayparts.co') && apiUrl.startsWith('http://127.0.0.1')) {
      apiUrl = 'https://api.kayparts.co/api';
    }
    return apiUrl;
  };

  // Fetch carriers on mount
  const fetchCarriers = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();

    try {
      const response = await fetch(`${apiUrl}/carriers?per_page=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setCarriers(list);
      } else {
        console.error('Error fetching carriers:', data);
      }
    } catch (err) {
      console.error('Connection error fetching carriers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Switch to editing mode
  const startEdit = (carrierObj) => {
    setEditingCarrier(carrierObj);
    setFormData({
      name: carrierObj.name,
      phone: carrierObj.phone || '',
      email: carrierObj.email || '',
      status: carrierObj.status || 'active'
    });
  };

  // Cancel edit mode and reset form
  const cancelEdit = () => {
    setEditingCarrier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      status: 'active'
    });
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showAlert('Por favor, ingrese el nombre de la transportadora.', 'error');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();
    
    const isEdit = !!editingCarrier;
    const url = isEdit ? `${apiUrl}/carriers/${editingCarrier.id}` : `${apiUrl}/carriers`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          status: formData.status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstErrKey = Object.keys(data.errors)[0];
          throw new Error(data.errors[firstErrKey][0]);
        }
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'crear'} la transportadora.`);
      }

      showAlert(`Transportadora ${isEdit ? 'actualizada' : 'creada'} correctamente.`, 'success');
      
      // Reset form and refresh list
      cancelEdit();
      fetchCarriers();

    } catch (err) {
      showAlert(err.message || 'Error de conexión con el servidor.', 'error');
    }
  };

  // Client-side filtering
  const filteredCarriers = carriers.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredCarriers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCarriers = filteredCarriers.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR */}
      <Sidebar activeTab="carriers" />

      {/* Style tags for split layout responsiveness */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
          .dashboard-split-row { grid-template-columns: 1fr !important; }
        }
      `}} />

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
        

        {/* TITLE AND DESCRIPTION */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="title-font" style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '6px'
          }}>
            Gestión de Transportadoras
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
            Gestione las empresas transportadoras asociadas para el despacho y entrega de pedidos.
          </p>
        </div>

        {/* SPLIT PANE ROW */}
        <div className="dashboard-split-row" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* COLUMN 1: CARRIERS LIST TABLE */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            
            {/* TABLE BAR */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Listado de Transportadoras
              </span>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: '600'
              }}>
                {filteredCarriers.length} Total
              </span>
            </div>

            {/* TABLE CONTAINER */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>NOMBRE</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>TELÉFONO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>EMAIL</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '100px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Cargando transportadoras...
                      </td>
                    </tr>
                  ) : paginatedCarriers.length > 0 ? (
                    paginatedCarriers.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff'
                        }}
                        className="table-row-hover"
                      >
                        {/* Name */}
                        <td style={{ padding: '20px 24px', fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>
                          {item.name}
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                          {item.phone || '-'}
                        </td>

                        {/* Email */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                          {item.email || '-'}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '20px 24px' }}>
                          {item.status === 'active' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                              ACTIVO
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                              INACTIVO
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                          <button
                            onClick={() => startEdit(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#475569',
                              padding: '6px',
                              borderRadius: '6px',
                              transition: 'var(--transition-fast)'
                            }}
                            className="btn-edit-hover"
                            title="Editar transportadora"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron transportadoras.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <style dangerouslySetInnerHTML={{ __html: `
                .table-row-hover:hover {
                  background-color: #f8fafc !important;
                }
                .btn-edit-hover:hover {
                  background-color: #f1f5f9;
                  color: #e21a22 !important;
                }
              `}} />
            </div>

            {/* TABLE FOOTER / PAGINATION */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '16px 24px',
              fontSize: '13px',
              color: '#64748b'
            }}>
              <div>
                Mostrando <strong style={{ color: '#1e293b' }}>{filteredCarriers.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredCarriers.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredCarriers.length}</strong> registros
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
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: (currentPage === totalPages || totalPages === 0) ? '#cbd5e1' : '#64748b',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: (currentPage === totalPages || totalPages === 0) ? 'default' : 'pointer',
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

          {/* COLUMN 2: CREATE / EDIT FORM */}
          <div className="card" style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            
            <div>
              <h2 className="title-font" style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '4px'
              }}>
                {editingCarrier ? 'Editar Transportadora' : 'Crear Transportadora'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {editingCarrier ? 'Modifique los campos correspondientes.' : 'Ingrese los datos básicos para la nueva empresa.'}
              </p>
            </div>

            {/* ALERTS BANNERS */}
            {alertMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '550',
                backgroundColor: alertType === 'success' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${alertType === 'success' ? '#a7f3d0' : '#fecaca'}`,
                color: alertType === 'success' ? '#065f46' : '#991b1b',
                transition: 'all 0.3s ease'
              }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{alertMsg}</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Name field */}
              <div className="input-group">
                <label htmlFor="carrier-name" className="input-label" style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Nombre *
                </label>
                <input
                  id="carrier-name"
                  name="name"
                  type="text"
                  placeholder="Ej. Servientrega, DHL"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {/* Phone field */}
              <div className="input-group">
                <label htmlFor="carrier-phone" className="input-label" style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Teléfono
                </label>
                <input
                  id="carrier-phone"
                  name="phone"
                  type="text"
                  placeholder="Ej. +57 300 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email field */}
              <div className="input-group">
                <label htmlFor="carrier-email" className="input-label" style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Correo electrónico
                </label>
                <input
                  id="carrier-email"
                  name="email"
                  type="email"
                  placeholder="Ej. info@servientrega.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Status field */}
              <div className="input-group">
                <label htmlFor="carrier-status" className="input-label" style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Estado *
                </label>
                <select
                  id="carrier-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                  required
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              {/* Form buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '10px'
              }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    backgroundColor: '#e21a22',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Truck size={14} />
                  {editingCarrier ? 'Actualizar Transportadora' : 'Guardar Transportadora'}
                </button>

                {editingCarrier && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
      </div>
  );
};

export default Carriers;
