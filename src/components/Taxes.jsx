import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, Percent, Edit2, Info
} from 'lucide-react';
import Sidebar from './Sidebar';

const Taxes = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    is_active: true
  });
  
  // Edit state tracker
  const [editingTax, setEditingTax] = useState(null);

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

  // Fetch taxes on mount
  const fetchTaxes = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/taxes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        setTaxes(data);
      } else {
        console.error('Error fetching taxes:', data);
      }
    } catch (err) {
      console.error('Connection error fetching taxes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Switch to editing mode
  const startEdit = (taxObj) => {
    setEditingTax(taxObj);
    setFormData({
      name: taxObj.name,
      rate: taxObj.rate.toString(),
      is_active: !!taxObj.is_active
    });
  };

  // Cancel edit mode and reset form
  const cancelEdit = () => {
    setEditingTax(null);
    setFormData({
      name: '',
      rate: '',
      is_active: true
    });
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showAlert('Por favor, ingrese el nombre del impuesto.', 'error');
      return;
    }
    if (formData.rate === '') {
      showAlert('Por favor, ingrese el porcentaje de la tasa.', 'error');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    
    const isEdit = !!editingTax;
    const url = isEdit ? `${apiUrl}/taxes/${editingTax.id}` : `${apiUrl}/taxes`;
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
          rate: parseFloat(formData.rate),
          is_active: formData.is_active
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Extract first validation error
          const firstErrKey = Object.keys(data.errors)[0];
          throw new Error(data.errors[firstErrKey][0]);
        }
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el impuesto.`);
      }

      showAlert(`Impuesto ${isEdit ? 'actualizado' : 'creado'} correctamente.`, 'success');
      
      // Reset form and refresh list
      cancelEdit();
      fetchTaxes();

    } catch (err) {
      showAlert(err.message || 'Error de conexión con el servidor.', 'error');
    }
  };

  // Client-side filtering
  const filteredTaxes = taxes.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.rate || '').toString().includes(searchQuery)
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredTaxes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTaxes = filteredTaxes.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR */}
      <Sidebar activeTab="taxes" />

      {/* Style tags for split layout responsiveness */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
          .dashboard-split-row { grid-template-columns: 1fr !important; }
        }
      `}} />

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
          {/* Header Left Text & Search */}
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
                placeholder="Buscar impuesto por nombre..."
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
                Inventario
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

        {/* TITLE AND DESCRIPTION */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="title-font" style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '6px'
          }}>
            Gestión de Impuestos
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
            Gestione las tasas impositivas y cargos aplicables a los productos del catálogo.
          </p>
        </div>

        {/* SPLIT PANE ROW */}
        <div className="dashboard-split-row" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* COLUMN 1: TAXES LIST TABLE */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            
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
                Listado de Tasas y Cargos
              </span>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: '600'
              }}>
                {filteredTaxes.length} Total
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
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>NOMBRE DEL IMPUESTO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>TASA / PORCENTAJE</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '100px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Cargando impuestos...
                      </td>
                    </tr>
                  ) : paginatedTaxes.length > 0 ? (
                    paginatedTaxes.map((item) => (
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

                        {/* Rate */}
                        <td style={{ padding: '20px 24px', fontSize: '15px', color: '#0f172a', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                          {parseFloat(item.rate).toFixed(2)}%
                        </td>

                        {/* Status */}
                        <td style={{ padding: '20px 24px' }}>
                          {item.is_active ? (
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
                            title="Editar impuesto"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron impuestos que coincidan con los criterios.
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
                Mostrando <strong style={{ color: '#1e293b' }}>{filteredTaxes.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredTaxes.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredTaxes.length}</strong> registros
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
                      backgroundColor: pageNum === currentPage ? '#E31B23' : '#ffffff',
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
                {editingTax ? 'Editar Impuesto' : 'Crear Nuevo Impuesto'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {editingTax ? 'Modifique los campos correspondientes.' : 'Ingrese los datos básicos para el nuevo cargo.'}
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
                <label htmlFor="tax-name" className="input-label" style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Nombre del impuesto *
                </label>
                <input
                  id="tax-name"
                  name="name"
                  type="text"
                  placeholder="Ej. IVA 19% o ReteICA"
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

              {/* Rate / Percentage field */}
              <div className="input-group">
                <label htmlFor="tax-rate" className="input-label" style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#475569',
                  marginBottom: '6px',
                  display: 'block'
                }}>
                  Porcentaje de la tasa *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="tax-rate"
                    name="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej. 19.00"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="input-control"
                    style={{
                      width: '100%',
                      padding: '10px 32px 10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#0f172a',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)'
                    }}
                    required
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    fontSize: '13px',
                    color: '#64748b',
                    fontWeight: '700'
                  }}>
                    %
                  </span>
                </div>
              </div>

              {/* Status checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                <input
                  id="tax-active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#e21a22',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="tax-active" style={{
                  fontSize: '13px',
                  color: '#475569',
                  fontWeight: '550',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  Impuesto activo y disponible
                </label>
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
                  <Percent size={14} />
                  {editingTax ? 'Actualizar Impuesto' : 'Guardar Impuesto'}
                </button>

                {editingTax && (
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
  );
};

export default Taxes;
