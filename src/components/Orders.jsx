import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, Info, ClipboardList, Eye, X, CheckCircle
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Orders = ({ user, onLogout }) => {
  const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Data lists
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Success / error message states
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success'); // 'success' | 'error'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();

    try {
      const response = await fetch(`${apiUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setOrders(list);
      } else {
        console.error('Error fetching orders:', data);
      }
    } catch (err) {
      console.error('Connection error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Update order status on the backend
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = getApiUrl();

    try {
      const response = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Estado del pedido actualizado correctamente.', 'success');
        
        // Refresh selected order in modal
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({
            ...prev,
            status: newStatus
          }));
        }

        // Refresh list
        fetchOrders();
      } else {
        throw new Error(data.message || 'Error al actualizar el estado del pedido.');
      }
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Client-side filtering
  const filteredOrders = orders.filter(item => {
    const matchesSearch = 
      (item.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Client-side pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

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
      case 'paid':
        return {
          ...base,
          backgroundColor: '#d1fae5',
          color: '#065f46',
          dotColor: '#10b981'
        };
      case 'processing':
        return {
          ...base,
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          dotColor: '#3b82f6'
        };
      case 'pending':
        return {
          ...base,
          backgroundColor: '#fef3c7',
          color: '#92400e',
          dotColor: '#f59e0b'
        };
      case 'failed':
        return {
          ...base,
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          dotColor: '#ef4444'
        };
      case 'cancelled':
      default:
        return {
          ...base,
          backgroundColor: '#f1f5f9',
          color: '#475569',
          dotColor: '#94a3b8'
        };
    }
  };

  // Helper to parse address JSON
  const renderShippingAddress = (shippingAddressStrOrObj) => {
    if (!shippingAddressStrOrObj) return 'Retiro en tienda / No registrado';
    
    let addr = shippingAddressStrOrObj;
    if (typeof shippingAddressStrOrObj === 'string') {
      try {
        addr = JSON.parse(shippingAddressStrOrObj);
      } catch (e) {
        return shippingAddressStrOrObj;
      }
    }

    return (
      <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
        <strong>Destinatario:</strong> {addr.recipient_name || addr.name || selectedOrder?.customer_name}<br />
        <strong>Dirección:</strong> {addr.address_line1 || addr.address || ''} {addr.address_line2 || ''}<br />
        <strong>Ciudad/Detalle:</strong> {addr.city || ''}, {addr.state || ''} {addr.postal_code || addr.zip || ''}<br />
        <strong>Teléfono:</strong> {addr.phone || selectedOrder?.customer_phone || '-'}
      </div>
    );
  };

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
      <Sidebar activeTab="orders" />

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
            Gestión de Pedidos
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
            Visualice los pedidos registrados por los clientes, supervise los pagos y modifique los estados correspondientes.
          </p>
        </div>

        {/* FILTER BAR AND LIST */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          
          {/* SEARCH & FILTERS HEADER */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                Listado de Pedidos
              </span>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: '600'
              }}>
                {filteredOrders.length} Total
              </span>
            </div>

            {/* STATUS FILTER BUTTONS */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'pending', 'processing', 'paid', 'failed', 'cancelled'].map((status) => {
                const isActive = statusFilter === status;
                const labelMap = {
                  all: 'Todos',
                  pending: 'Pendientes',
                  processing: 'Procesando',
                  paid: 'Pagados',
                  failed: 'Fallidos',
                  cancelled: 'Cancelados'
                };
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#e21a22' : '#ffffff',
                      color: isActive ? '#ffffff' : '#64748b',
                      borderColor: isActive ? '#e21a22' : '#cbd5e1',
                      transition: 'all 0.2s'
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
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>NÚMERO PEDIDO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CLIENTE</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>EMAIL</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>FECHA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>TOTAL</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>PAGO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '100px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Cargando pedidos...
                    </td>
                  </tr>
                ) : paginatedOrders.length > 0 ? (
                  paginatedOrders.map((item) => {
                    const badge = getStatusBadgeStyle(item.status);
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff'
                        }}
                        className="table-row-hover"
                      >
                        {/* Order Number */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                          {item.order_number}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>
                          {item.customer_name}
                        </td>

                        {/* Email */}
                        <td style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b' }}>
                          {item.customer_email}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '20px 24px', fontSize: '13px', color: '#64748b' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: '20px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>
                          ${parseFloat(item.total_amount).toLocaleString('es-CO', { minimumFractionDigits: 0 })} COP
                        </td>

                        {/* Payment Method */}
                        <td style={{ padding: '20px 24px', fontSize: '13px', color: '#475569' }}>
                          {item.payment_method || 'Bold'}
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
                          <button
                            onClick={() => setSelectedOrder(item)}
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
                            title="Ver Detalles"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No se encontraron pedidos.
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
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredOrders.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredOrders.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredOrders.length}</strong> registros
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

      </div>

      {/* DETAILS MODAL OVERLAY */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          {/* MODAL BODY */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={20} style={{ color: '#e21a22' }} />
                  Pedido {selectedOrder.order_number}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Registrado el {new Date(selectedOrder.created_at).toLocaleString('es-ES')}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '50%'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Row 1: Status & Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Client Info */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', textTransform: 'uppercase' }}>Información del Cliente</h4>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                    <strong>Nombre:</strong> {selectedOrder.customer_name}<br />
                    <strong>Email:</strong> {selectedOrder.customer_email}<br />
                    <strong>Teléfono:</strong> {selectedOrder.customer_phone || 'Sin registrar'}
                  </div>
                </div>

                {/* Status and Action */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', textTransform: 'uppercase' }}>Estado y Transacción</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#475569' }}>ID Transacción:</span>{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '600' }}>
                        {selectedOrder.bold_transaction_id || 'N/A'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Estado actual:</span>
                      <span style={getStatusBadgeStyle(selectedOrder.status)}>
                        {selectedOrder.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      <label htmlFor="modal-status-select" style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>ACTUALIZAR ESTADO:</label>
                      <select
                        id="modal-status-select"
                        value={selectedOrder.status}
                        disabled={updatingStatus}
                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">Pendiente (Pending)</option>
                        <option value="processing">Procesando (Processing)</option>
                        <option value="paid">Pagado (Paid)</option>
                        <option value="failed">Fallido (Failed)</option>
                        <option value="cancelled">Cancelado (Cancelled)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Shipping Address */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '10px', textTransform: 'uppercase' }}>Dirección de Envío</h4>
                {renderShippingAddress(selectedOrder.shipping_address)}
              </div>

              {/* Row 3: Items Table */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', margin: 0 }}>Ítems del Pedido</h4>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>PRODUCTO</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>VALOR UNIT.</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>CANT.</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>
                            {item.product_name}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>
                            ${parseFloat(item.unit_price).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0f172a', textAlign: 'right', fontWeight: '700' }}>
                            ${parseFloat(item.subtotal).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          No hay items asociados a este pedido.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Subtotals & Totals summary */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>Impuestos:</span>
                      <span>${parseFloat(selectedOrder.tax_amount || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>Envío:</span>
                      <span>${parseFloat(selectedOrder.shipping_cost || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                      <span>Total Pedido:</span>
                      <span>${parseFloat(selectedOrder.total_amount).toLocaleString('es-CO', { minimumFractionDigits: 0 })} COP</span>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
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

export default Orders;
