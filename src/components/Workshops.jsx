import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  Wrench, Edit2, Info, CheckCircle2, XCircle
} from 'lucide-react';
import Sidebar from './Sidebar';

const Workshops = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data lists
  const [workshops, setWorkshops] = useState([]);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    workshop_name: '',
    nit: '',
    owner_name: '',
    email: '',
    phone: '',
    department: '',
    city: '',
    address: '',
    specialties: '',
    status: 'pending'
  });

  // Edit state tracker
  const [editingWorkshop, setEditingWorkshop] = useState(null);

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
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // Fetch workshop applications on mount
  const fetchWorkshops = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/workshop-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setWorkshops(list);
      } else {
        console.error('Error fetching technical centers:', data);
      }
    } catch (err) {
      console.error('Connection error fetching technical centers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
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
  const startEdit = (workshopObj) => {
    setEditingWorkshop(workshopObj);
    setFormData({
      workshop_name: workshopObj.workshop_name || '',
      nit: workshopObj.nit || '',
      owner_name: workshopObj.owner_name || '',
      email: workshopObj.email || '',
      phone: workshopObj.phone || '',
      department: workshopObj.department || '',
      city: workshopObj.city || '',
      address: workshopObj.address || '',
      specialties: workshopObj.specialties || '',
      status: workshopObj.status || 'pending'
    });
  };

  // Cancel edit mode and reset form
  const cancelEdit = () => {
    setEditingWorkshop(null);
    setFormData({
      workshop_name: '',
      nit: '',
      owner_name: '',
      email: '',
      phone: '',
      department: '',
      city: '',
      address: '',
      specialties: '',
      status: 'pending'
    });
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (
      !formData.workshop_name.trim() ||
      !formData.owner_name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.department.trim() ||
      !formData.city.trim() ||
      !formData.address.trim()
    ) {
      showAlert('Por favor, complete todos los campos obligatorios.', 'error');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    const isEdit = !!editingWorkshop;
    const url = isEdit ? `${apiUrl}/workshop-applications/${editingWorkshop.id}` : `${apiUrl}/workshop-applications`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstErrKey = Object.keys(data.errors)[0];
          throw new Error(data.errors[firstErrKey][0]);
        }
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'registrar'} el centro técnico.`);
      }

      showAlert(`Centro técnico ${isEdit ? 'actualizado' : 'registrado'} correctamente.`, 'success');
      cancelEdit();
      fetchWorkshops();

    } catch (err) {
      showAlert(err.message || 'Error de conexión con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering
  const filteredWorkshops = workshops.filter(item => 
    (item.workshop_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.owner_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredWorkshops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWorkshops = filteredWorkshops.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR */}
      <Sidebar activeTab="workshops" />

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
                placeholder="Buscar centro técnico..."
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
                onClick={() => navigate('/products')}
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
                Inventario
              </button>
            </div>

            <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />

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
            Gestión de Centros Técnicos
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
            Gestione y apruebe las solicitudes y registros de centros técnicos / talleres aliados.
          </p>
        </div>

        {/* SPLIT PANE ROW */}
        <div className="dashboard-split-row" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* COLUMN 1: LIST TABLE */}
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
                Listado de Centros y Talleres
              </span>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: '600'
              }}>
                {filteredWorkshops.length} Total
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
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CENTRO TÉCNICO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>PROPIETARIO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CIUDAD</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '100px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Cargando centros técnicos...
                      </td>
                    </tr>
                  ) : paginatedWorkshops.length > 0 ? (
                    paginatedWorkshops.map((item) => (
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
                          <div>{item.workshop_name}</div>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>{item.email}</span>
                        </td>

                        {/* Owner */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                          {item.owner_name}
                        </td>

                        {/* City */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                          {item.city}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '20px 24px' }}>
                          {item.status === 'approved' ? (
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
                              APROBADO
                            </span>
                          ) : item.status === 'rejected' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                              RECHAZADO
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                              PENDIENTE
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
                            title="Editar taller"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron centros técnicos.
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
                Mostrando <strong style={{ color: '#1e293b' }}>{filteredWorkshops.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredWorkshops.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredWorkshops.length}</strong> registros
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
                {editingWorkshop ? 'Editar Centro Técnico' : 'Crear Centro Técnico'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {editingWorkshop ? 'Modifique los campos correspondientes.' : 'Ingrese los datos básicos para el nuevo taller.'}
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
              
              {/* Workshop Name */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Nombre del taller *
                </label>
                <input
                  name="workshop_name"
                  type="text"
                  placeholder="Ej. Taller Mecánico Express"
                  value={formData.workshop_name}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* NIT */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  NIT / Identificación
                </label>
                <input
                  name="nit"
                  type="text"
                  placeholder="Ej. 900.123.456-7"
                  value={formData.nit}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Owner Name */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Nombre del propietario *
                </label>
                <input
                  name="owner_name"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formData.owner_name}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Email */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Correo electrónico *
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="Ej. juan@taller.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Phone */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Teléfono *
                </label>
                <input
                  name="phone"
                  type="text"
                  placeholder="Ej. 300 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Department */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Departamento *
                </label>
                <input
                  name="department"
                  type="text"
                  placeholder="Ej. Antioquia"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* City */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Ciudad *
                </label>
                <input
                  name="city"
                  type="text"
                  placeholder="Ej. Medellín"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Address */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Dirección *
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="Ej. Calle 10 # 50-20"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Specialties */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Especialidades
                </label>
                <textarea
                  name="specialties"
                  placeholder="Ej. Frenos, Suspensión, Alineación"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Status Selector */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Estado *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                  required
                >
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
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
                  disabled={submitting}
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
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Wrench size={14} />
                  {editingWorkshop ? 'Actualizar Taller' : 'Guardar Taller'}
                </button>

                {editingWorkshop && (
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

export default Workshops;
