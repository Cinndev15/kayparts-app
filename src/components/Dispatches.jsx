import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, Info, PackageCheck, Edit2, Eye, X, PlusCircle, MapPin
} from 'lucide-react';
import Sidebar from './Sidebar';

const Dispatches = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Data lists
  const [dispatches, setDispatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    order_id: '',
    carrier_id: '',
    tracking_number: '',
    responsible_person: '',
    status: 'recibido',
    dispatch_date: '',
    notes: ''
  });
  
  // Edit state tracker
  const [editingDispatch, setEditingDispatch] = useState(null);

  // Details Modal and Milestones form
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [newMilestone, setNewMilestone] = useState({
    status: 'recibido',
    location: '',
    description: ''
  });
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

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

  // Helper to get API URL
  const getApiUrl = () => {
    let apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    if (window.location.hostname.includes('kayparts.co') && apiUrl.startsWith('http://127.0.0.1')) {
      apiUrl = 'https://api.kayparts.co/api';
    }
    return apiUrl;
  };

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();

    try {
      // 1. Fetch Dispatches
      const dispatchRes = await fetch(`${apiUrl}/dispatches?per_page=100`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const dispatchData = await dispatchRes.json();
      if (dispatchRes.ok && dispatchData) {
        setDispatches(Array.isArray(dispatchData) ? dispatchData : (dispatchData.data || []));
      }

      // 2. Fetch Orders (for dropdown selection)
      const orderRes = await fetch(`${apiUrl}/orders`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const orderData = await orderRes.json();
      if (orderRes.ok && orderData) {
        setOrders(Array.isArray(orderData) ? orderData : (orderData.data || []));
      }

      // 3. Fetch Carriers (for dropdown selection)
      const carrierRes = await fetch(`${apiUrl}/carriers?per_page=100`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const carrierData = await carrierRes.json();
      if (carrierRes.ok && carrierData) {
        setCarriers(Array.isArray(carrierData) ? carrierData : (carrierData.data || []));
      }

    } catch (err) {
      console.error('Connection error fetching dispatches/relations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch milestones for selected dispatch
  const fetchMilestones = async (dispatchId) => {
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/dispatches/${dispatchId}/tracking`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data) {
        setMilestones(data.data || []);
      }
    } catch (e) {
      console.error('Error fetching milestones:', e);
    }
  };

  useEffect(() => {
    if (selectedDispatch) {
      fetchMilestones(selectedDispatch.id);
      setNewMilestone({
        status: selectedDispatch.status || 'recibido',
        location: '',
        description: ''
      });
    } else {
      setMilestones([]);
    }
  }, [selectedDispatch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Switch to editing mode
  const startEdit = (dispatchObj) => {
    setEditingDispatch(dispatchObj);
    
    // Format dispatch_date for datetime-local input
    let formattedDate = '';
    if (dispatchObj.dispatch_date) {
      const d = new Date(dispatchObj.dispatch_date);
      // YYYY-MM-DDThh:mm
      formattedDate = d.toISOString().substring(0, 16);
    }

    setFormData({
      order_id: dispatchObj.order_id.toString(),
      carrier_id: dispatchObj.carrier_id.toString(),
      tracking_number: dispatchObj.tracking_number,
      responsible_person: dispatchObj.responsible_person,
      status: dispatchObj.status || 'recibido',
      dispatch_date: formattedDate,
      notes: dispatchObj.notes || ''
    });
  };

  // Cancel edit mode and reset form
  const cancelEdit = () => {
    setEditingDispatch(null);
    setFormData({
      order_id: '',
      carrier_id: '',
      tracking_number: '',
      responsible_person: '',
      status: 'recibido',
      dispatch_date: '',
      notes: ''
    });
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.order_id) {
      showAlert('Por favor, seleccione un pedido.', 'error');
      return;
    }
    if (!formData.carrier_id) {
      showAlert('Por favor, seleccione una transportadora.', 'error');
      return;
    }
    if (!formData.tracking_number.trim()) {
      showAlert('Por favor, ingrese el número de guía.', 'error');
      return;
    }
    if (!formData.responsible_person.trim()) {
      showAlert('Por favor, ingrese la persona responsable.', 'error');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();
    
    const isEdit = !!editingDispatch;
    const url = isEdit ? `${apiUrl}/dispatches/${editingDispatch.id}` : `${apiUrl}/dispatches`;
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
          order_id: parseInt(formData.order_id),
          carrier_id: parseInt(formData.carrier_id),
          tracking_number: formData.tracking_number.trim(),
          responsible_person: formData.responsible_person.trim(),
          status: formData.status,
          dispatch_date: formData.dispatch_date ? new Date(formData.dispatch_date) : null,
          notes: formData.notes.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el despacho.`);
      }

      showAlert(`Despacho ${isEdit ? 'actualizado' : 'registrado'} correctamente.`, 'success');
      cancelEdit();
      fetchData();

    } catch (err) {
      showAlert(err.message || 'Error de conexión con el servidor.', 'error');
    }
  };

  // Handle adding a milestone (Dispatch Tracking)
  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestone.status) return;

    setSubmittingMilestone(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();

    try {
      const response = await fetch(`${apiUrl}/dispatches/${selectedDispatch.id}/tracking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status: newMilestone.status,
          location: newMilestone.location.trim() || null,
          description: newMilestone.description.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh milestones list
        fetchMilestones(selectedDispatch.id);
        
        // Update selected dispatch status locally
        setSelectedDispatch(prev => ({
          ...prev,
          status: newMilestone.status
        }));

        // Reset milestone form
        setNewMilestone({
          status: newMilestone.status,
          location: '',
          description: ''
        });

        showAlert('Hito de seguimiento registrado correctamente.', 'success');
        
        // Refresh dispatches list behind modal
        fetchData();
      } else {
        throw new Error(data.message || 'Error al guardar el seguimiento.');
      }
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setSubmittingMilestone(false);
    }
  };

  // Client-side filtering
  const filteredDispatches = dispatches.filter(item => {
    const orderNum = item.order?.order_number || '';
    const carrierName = item.carrier?.name || '';
    const trackingNum = item.tracking_number || '';
    const resp = item.responsible_person || '';

    const matchesSearch = 
      orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trackingNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resp.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Client-side pagination
  const totalPages = Math.ceil(filteredDispatches.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDispatches = filteredDispatches.slice(startIndex, endIndex);

  // Status badge styling helper
  const getStatusBadgeStyle = (status) => {
    const base = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '700'
    };

    switch (status) {
      case 'entregado':
        return { ...base, backgroundColor: '#d1fae5', color: '#065f46', dotColor: '#10b981' };
      case 'en_transito':
        return { ...base, backgroundColor: '#e0f2fe', color: '#075985', dotColor: '#0ea5e9' };
      case 'despachado':
        return { ...base, backgroundColor: '#dbeafe', color: '#1e40af', dotColor: '#3b82f6' };
      case 'alistamiento':
        return { ...base, backgroundColor: '#fef3c7', color: '#92400e', dotColor: '#f59e0b' };
      case 'recibido':
        return { ...base, backgroundColor: '#f3e8ff', color: '#6b21a8', dotColor: '#a855f7' };
      case 'devuelto':
        return { ...base, backgroundColor: '#ffedd5', color: '#9a3412', dotColor: '#f97316' };
      case 'cancelado':
      default:
        return { ...base, backgroundColor: '#f1f5f9', color: '#475569', dotColor: '#94a3b8' };
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
      <Sidebar activeTab="dispatches" />

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
                placeholder="Buscar despacho por guía o pedido..."
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
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{alertMsg}</span>
          </div>
        )}

        {/* TITLE AND DESCRIPTION */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="title-font" style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '6px'
          }}>
            Proceso de Despachos (Envíos)
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
            Registre los despachos de pedidos con su transportadora, asigne números de guía, y controle los hitos de seguimiento del paquete.
          </p>
        </div>

        {/* SPLIT PANE ROW */}
        <div className="dashboard-split-row" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* COLUMN 1: DISPATCHES LIST TABLE */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            
            {/* TABLE BAR */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Registro de Envíos
              </span>
              
              {/* STATUS FILTER BUTTONS */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {['all', 'recibido', 'alistamiento', 'despachado', 'en_transito', 'entregado'].map((status) => {
                  const isActive = statusFilter === status;
                  const labelMap = {
                    all: 'Todos',
                    recibido: 'Recibido',
                    alistamiento: 'Alistamiento',
                    despachado: 'Despachado',
                    en_transito: 'En Tránsito',
                    entregado: 'Entregado'
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#e21a22' : '#ffffff',
                        color: isActive ? '#ffffff' : '#64748b',
                        borderColor: isActive ? '#e21a22' : '#cbd5e1'
                      }}
                    >
                      {labelMap[status]}
                    </button>
                  );
                })}
              </div>
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
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>PEDIDO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>TRANSPORTADORA</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>GUÍA / SEGUIMIENTO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>RESPONSABLE</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Cargando despachos...
                      </td>
                    </tr>
                  ) : paginatedDispatches.length > 0 ? (
                    paginatedDispatches.map((item) => {
                      const badge = getStatusBadgeStyle(item.status);
                      return (
                        <tr
                          key={item.id}
                          style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
                          className="table-row-hover"
                        >
                          {/* Order Number */}
                          <td style={{ padding: '20px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                            {item.order?.order_number || `ID: ${item.order_id}`}
                          </td>

                          {/* Carrier */}
                          <td style={{ padding: '20px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>
                            {item.carrier?.name || `ID: ${item.carrier_id}`}
                          </td>

                          {/* Tracking Number */}
                          <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                            {item.tracking_number}
                          </td>

                          {/* Responsible */}
                          <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                            {item.responsible_person}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '20px 24px' }}>
                            <span style={badge}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.dotColor }} />
                              {item.status.toUpperCase()}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => setSelectedDispatch(item)}
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
                                title="Ver Seguimiento"
                              >
                                <Eye size={16} />
                              </button>
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
                                title="Editar Despacho"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron despachos.
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
                Mostrando <strong style={{ color: '#1e293b' }}>{filteredDispatches.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredDispatches.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredDispatches.length}</strong> registros
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
                {editingDispatch ? 'Editar Despacho' : 'Registrar Despacho'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {editingDispatch ? 'Modifique los campos correspondientes.' : 'Asocie pedidos a transportadoras para iniciar la guía de viaje.'}
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Order Select */}
              <div className="input-group">
                <label htmlFor="dispatch-order" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Pedido *
                </label>
                <select
                  id="dispatch-order"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff', outline: 'none' }}
                  required
                  disabled={!!editingDispatch}
                >
                  <option value="">Seleccione un pedido...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} - {o.customer_name} (${parseFloat(o.total_amount).toLocaleString('es-CO')} COP)
                    </option>
                  ))}
                </select>
              </div>

              {/* Carrier Select */}
              <div className="input-group">
                <label htmlFor="dispatch-carrier" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Transportadora *
                </label>
                <select
                  id="dispatch-carrier"
                  name="carrier_id"
                  value={formData.carrier_id}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff', outline: 'none' }}
                  required
                >
                  <option value="">Seleccione una transportadora...</option>
                  {carriers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tracking Number */}
              <div className="input-group">
                <label htmlFor="dispatch-tracking" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Número de Guía (Tracking) *
                </label>
                <input
                  id="dispatch-tracking"
                  name="tracking_number"
                  type="text"
                  placeholder="Ej. TRK90012348A"
                  value={formData.tracking_number}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Responsible Person */}
              <div className="input-group">
                <label htmlFor="dispatch-responsible" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Responsable del Despacho *
                </label>
                <input
                  id="dispatch-responsible"
                  name="responsible_person"
                  type="text"
                  placeholder="Ej. Juan Pérez (Bodega)"
                  value={formData.responsible_person}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Status Select */}
              <div className="input-group">
                <label htmlFor="dispatch-status" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Estado Inicial *
                </label>
                <select
                  id="dispatch-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', backgroundColor: '#ffffff', outline: 'none' }}
                  required
                >
                  <option value="recibido">Recibido (En espera)</option>
                  <option value="alistamiento">Alistamiento (Empacando)</option>
                  <option value="despachado">Despachado</option>
                  <option value="en_transito">En Tránsito</option>
                  <option value="entregado">Entregado</option>
                  <option value="devuelto">Devuelto</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Dispatch Date */}
              <div className="input-group">
                <label htmlFor="dispatch-date" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Fecha y Hora Despacho
                </label>
                <input
                  id="dispatch-date"
                  name="dispatch_date"
                  type="datetime-local"
                  value={formData.dispatch_date}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Notes */}
              <div className="input-group">
                <label htmlFor="dispatch-notes" className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Notas / Observaciones
                </label>
                <textarea
                  id="dispatch-notes"
                  name="notes"
                  rows="3"
                  placeholder="Instrucciones adicionales para la transportadora o notas internas..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '6px', backgroundColor: '#e21a22', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '8px' }}
                >
                  <PackageCheck size={14} />
                  {editingDispatch ? 'Actualizar Despacho' : 'Registrar Despacho'}
                </button>

                {editingDispatch && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>

      </div>

      {/* TRACKING HISTORY AND MILESTONES MODAL */}
      {selectedDispatch && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 999, padding: '20px'
        }}>
          {/* MODAL BODY */}
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            width: '100%', maxWidth: '780px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PackageCheck size={20} style={{ color: '#e21a22' }} />
                  Seguimiento de Guía: {selectedDispatch.tracking_number}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Pedido {selectedDispatch.order?.order_number || `ID: ${selectedDispatch.order_id}`} | Transportadora: {selectedDispatch.carrier?.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedDispatch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Row: Add Milestone Form */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase' }}>
                  Registrar Hito de Seguimiento (Milestone)
                </h4>
                
                <form onSubmit={handleAddMilestone} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  {/* Milestone Status */}
                  <div className="input-group" style={{ gridColumn: 'span 1' }}>
                    <label htmlFor="milestone-status" style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>ESTADO *</label>
                    <select
                      id="milestone-status"
                      value={newMilestone.status}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                      required
                    >
                      <option value="recibido">Recibido (En espera)</option>
                      <option value="alistamiento">Alistamiento (Empacando)</option>
                      <option value="despachado">Despachado</option>
                      <option value="en_transito">En Tránsito</option>
                      <option value="entregado">Entregado</option>
                      <option value="devuelto">Devuelto</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="input-group" style={{ gridColumn: 'span 1' }}>
                    <label htmlFor="milestone-location" style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>UBICACIÓN / CIUDAD</label>
                    <input
                      id="milestone-location"
                      type="text"
                      placeholder="Ej. Centro Distribución Bogotá, Oficina Central"
                      value={newMilestone.location}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, location: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  {/* Description */}
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="milestone-description" style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>DESCRIPCIÓN / DETALLE</label>
                    <textarea
                      id="milestone-description"
                      rows="2"
                      placeholder="Ej. Paquete recibido en la bodega de reparto."
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="submit"
                      disabled={submittingMilestone}
                      style={{
                        padding: '10px 18px', backgroundColor: '#e21a22', color: '#ffffff',
                        border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <PlusCircle size={14} />
                      Agregar Hito
                    </button>
                  </div>

                </form>
              </div>

              {/* Row: Milestone List (Timeline) */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', textTransform: 'uppercase' }}>
                  Historial de Seguimiento
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '20px' }}>
                  {/* Vertical Timeline Line */}
                  <div style={{ position: 'absolute', left: '6px', top: '10px', bottom: '10px', width: '2px', backgroundColor: '#e2e8f0' }} />

                  {milestones.length > 0 ? (
                    milestones.map((m, idx) => {
                      const dotStyle = getStatusBadgeStyle(m.status);
                      return (
                        <div key={m.id || idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {/* Timeline Dot */}
                          <div style={{
                            position: 'absolute', left: '-19px', top: '4px', width: '10px', height: '10px',
                            borderRadius: '50%', backgroundColor: dotStyle.dotColor, border: '2px solid #ffffff',
                            boxShadow: '0 0 0 2px ' + dotStyle.dotColor
                          }} />

                          {/* Milestone content */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={dotStyle}>
                                {m.status.toUpperCase()}
                              </span>
                              {m.location && (
                                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <MapPin size={12} />
                                  {m.location}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {new Date(m.created_at || new Date()).toLocaleString('es-ES')}
                            </span>
                          </div>
                          
                          {m.description && (
                            <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                              {m.description}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '10px 0' }}>
                      No se han registrado hitos en el historial de este despacho.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', padding: '16px 24px',
              borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
            }}>
              <button
                onClick={() => setSelectedDispatch(null)}
                style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dispatches;
