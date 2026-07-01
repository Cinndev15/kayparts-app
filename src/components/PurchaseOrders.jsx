import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, PlusCircle, Edit2, Eye, Mail, Trash2, X, Plus, Trash
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Swal from 'sweetalert2';

const PurchaseOrders = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal open states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [editingPo, setEditingPo] = useState(null);

  // Form states for Create/Edit PO
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery_date: '',
    notes: '',
    terms: '',
    items: []
  });

  // Individual item input state inside create/edit form
  const [itemInput, setItemInput] = useState({
    product_id: '',
    description: '',
    quantity: '1',
    unit: 'Unidad',
    unit_price: '',
    tax_rate: '19'
  });

  // Fetch purchase orders
  const fetchPurchaseOrders = async (page = 1) => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/purchase-orders?page=${page}&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        setPurchaseOrders(data.data || []);
        setMeta(data.meta || { current_page: 1, last_page: 1, total: 0 });
      } else {
        console.error('Error fetching POs:', data);
      }
    } catch (err) {
      console.error('Connection error fetching POs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch helpers (suppliers and products)
  const fetchHelpers = async () => {
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      // Fetch suppliers
      const supRes = await fetch(`${apiUrl}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const supData = await supRes.json();
      if (supRes.ok) {
        setSuppliers(Array.isArray(supData) ? supData : (supData.data || []));
      }

      // Fetch products
      const prodRes = await fetch(`${apiUrl}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      if (prodRes.ok) {
        setProducts(Array.isArray(prodData) ? prodData : (prodData.data || []));
      }
    } catch (err) {
      console.error('Error fetching helpers for PO creation:', err);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders(currentPage);
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchHelpers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;

    // If product is selected, auto-fill name and price
    if (name === 'product_id' && value !== '') {
      const selectedProduct = products.find(p => p.id.toString() === value);
      if (selectedProduct) {
        setItemInput(prev => ({
          ...prev,
          product_id: value,
          description: selectedProduct.name,
          unit_price: selectedProduct.price || ''
        }));
        return;
      }
    }

    setItemInput(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddItem = () => {
    if (!itemInput.description.trim()) {
      Swal.fire('Error', 'Ingrese una descripción o seleccione un producto.', 'warning');
      return;
    }
    if (!itemInput.quantity || parseFloat(itemInput.quantity) <= 0) {
      Swal.fire('Error', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }
    if (!itemInput.unit_price || parseFloat(itemInput.unit_price) < 0) {
      Swal.fire('Error', 'El precio unitario no puede ser negativo.', 'warning');
      return;
    }

    const qty = parseFloat(itemInput.quantity);
    const price = parseFloat(itemInput.unit_price);
    const taxRate = parseFloat(itemInput.tax_rate);
    const subtotal = qty * price;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const newItem = {
      product_id: itemInput.product_id ? parseInt(itemInput.product_id) : null,
      description: itemInput.description.trim(),
      quantity: qty,
      unit: itemInput.unit,
      unit_price: price,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      subtotal: total
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset item input
    setItemInput({
      product_id: '',
      description: '',
      quantity: '1',
      unit: 'Unidad',
      unit_price: '',
      tax_rate: '19'
    });
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const startCreate = () => {
    setEditingPo(null);
    setFormData({
      supplier_id: '',
      expected_delivery_date: '',
      notes: '',
      terms: '',
      items: []
    });
    setIsCreateModalOpen(true);
  };

  const startEdit = (poObj) => {
    setEditingPo(poObj);
    
    // Format date
    let formattedDate = poObj.expected_delivery_date || '';

    setFormData({
      supplier_id: poObj.supplier_id.toString(),
      expected_delivery_date: formattedDate,
      notes: poObj.notes || '',
      terms: poObj.terms || '',
      items: (poObj.items || []).map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit: item.unit || 'Unidad',
        unit_price: parseFloat(item.unit_price),
        tax_rate: parseFloat(item.tax_rate),
        tax_amount: parseFloat(item.tax_amount),
        subtotal: parseFloat(item.subtotal)
      }))
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      Swal.fire('Campos obligatorios', 'Seleccione un proveedor.', 'warning');
      return;
    }
    if (formData.items.length === 0) {
      Swal.fire('Campos obligatorios', 'Debe agregar al menos un ítem a la orden de compra.', 'warning');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    
    const isEdit = !!editingPo;
    const url = isEdit ? `${apiUrl}/purchase-orders/${editingPo.id}` : `${apiUrl}/purchase-orders`;
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
          supplier_id: parseInt(formData.supplier_id),
          expected_delivery_date: formData.expected_delivery_date || null,
          notes: formData.notes.trim() || null,
          terms: formData.terms.trim() || null,
          items: formData.items
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire('Éxito', isEdit ? 'Orden de compra editada correctamente.' : 'Orden de compra creada como borrador.', 'success');
        setIsCreateModalOpen(false);
        fetchPurchaseOrders(currentPage);
      } else {
        Swal.fire('Error', data.message || 'No se pudo guardar la orden de compra.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo comunicar con el servidor.', 'error');
    }
  };

  const handleSendEmail = async (poId) => {
    Swal.fire({
      title: 'Enviando Correo...',
      text: 'Por favor espere mientras enviamos la orden de compra al proveedor.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/purchase-orders/${poId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire('Enviado', data.message || 'La orden de compra ha sido enviada exitosamente por correo electrónico.', 'success');
        fetchPurchaseOrders(currentPage);
      } else {
        Swal.fire('Error', data.message || 'No se pudo enviar la orden de compra.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    }
  };

  const handleDeletePo = async (poId) => {
    const result = await Swal.fire({
      title: '¿Eliminar Borrador?',
      text: 'Esta acción eliminará de forma permanente esta orden de compra. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e21a22',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/purchase-orders/${poId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire('Eliminado', 'La orden de compra ha sido eliminada con éxito.', 'success');
        fetchPurchaseOrders(currentPage);
      } else {
        Swal.fire('Error', data.message || 'No se pudo eliminar la orden de compra.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    }
  };

  const handleViewPo = async (po) => {
    setSelectedPo(po);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/purchase-orders/${po.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setSelectedPo(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic values inside Form
  const calcFormTotals = () => {
    let subtotal = 0;
    let tax = 0;
    formData.items.forEach(item => {
      const base = item.quantity * item.unit_price;
      subtotal += base;
      tax += base * (item.tax_rate / 100);
    });
    const total = subtotal + tax;
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const formTotals = calcFormTotals();

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>
      <Sidebar activeTab="purchase-orders" />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <Navbar user={user} onLogout={onLogout} />

        <div className="dashboard-main-content" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '30px 40px'
        }}>
          {/* Local Page Search */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} />
              <input
                type="text"
                placeholder="Buscar por número..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  color: '#1e293b'
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 className="title-font" style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                Órdenes de Compra
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
                Cree borradores de órdenes de compra, envíelas por correo a proveedores y gestione su recepción.
              </p>
            </div>

            <button
              onClick={startCreate}
              style={{
                backgroundColor: '#e21a22',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <PlusCircle size={18} />
              Crear Orden de Compra
            </button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Listado de Órdenes</span>
              <span style={{ fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '9999px', fontWeight: '600' }}>
                {meta.total} Órdenes
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Nro de OC</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Proveedor</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Entrega Estimada</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        Cargando órdenes de compra...
                      </td>
                    </tr>
                  ) : purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron órdenes de compra.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map(po => (
                      <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{po.po_number}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{po.supplier?.razon_social}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>NIT: {po.supplier?.nit_or_cedula}</div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{new Date(po.issue_date).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                          {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1e293b', fontWeight: '700', textAlign: 'right' }}>
                          ${parseFloat(po.total_amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: po.status === 'draft' ? '#cbd5e1' : po.status === 'sent' ? '#e0f2fe' : '#d1fae5',
                            color: po.status === 'draft' ? '#475569' : po.status === 'sent' ? '#0369a1' : '#065f46'
                          }}>
                            {po.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleViewPo(po)}
                              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }}
                              title="Ver Detalles"
                            >
                              <Eye size={16} />
                            </button>
                            {po.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => startEdit(po)}
                                  style={{ background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '4px' }}
                                  title="Editar Borrador"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePo(po.id)}
                                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                  title="Eliminar Borrador"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            {po.status !== 'cancelled' && (
                              <button
                                onClick={() => handleSendEmail(po.id)}
                                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                                title="Enviar al Proveedor (Correo)"
                              >
                                <Mail size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {meta.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', gap: '8px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '13px', alignSelf: 'center', color: '#475569' }}>
                  Página {currentPage} de {meta.last_page}
                </span>
                <button
                  disabled={currentPage === meta.last_page}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', opacity: currentPage === meta.last_page ? 0.5 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE/EDIT PO MODAL */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '900px',
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingPo ? `Editar Orden de Compra: ${editingPo.po_number}` : 'Nueva Orden de Compra'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Basic Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Proveedor *</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  >
                    <option value="">-- Seleccione Proveedor --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.razon_social} (NIT: {sup.nit_or_cedula})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Fecha Esperada de Entrega</label>
                  <input
                    type="date"
                    name="expected_delivery_date"
                    value={formData.expected_delivery_date}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Ítems de la Orden</h4>
                
                {/* Item Input Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Seleccionar Producto</label>
                    <select
                      name="product_id"
                      value={itemInput.product_id}
                      onChange={handleItemInputChange}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                    >
                      <option value="">-- Manual / Sin Producto --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Descripción *</label>
                    <input
                      type="text"
                      name="description"
                      value={itemInput.description}
                      onChange={handleItemInputChange}
                      placeholder="Nombre del ítem"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Cant *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={itemInput.quantity}
                      onChange={handleItemInputChange}
                      min="1"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Precio Unit *</label>
                    <input
                      type="number"
                      name="unit_price"
                      value={itemInput.unit_price}
                      onChange={handleItemInputChange}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>IVA %</label>
                    <input
                      type="number"
                      name="tax_rate"
                      value={itemInput.tax_rate}
                      onChange={handleItemInputChange}
                      placeholder="19"
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Items Table */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '10px 12px' }}>Descripción</th>
                        <th style={{ padding: '10px 12px', textItems: 'center' }}>Cant</th>
                        <th style={{ padding: '10px 12px', textItems: 'center' }}>Unidad</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Vlr Unitario</th>
                        <th style={{ padding: '10px 12px', textItems: 'center' }}>IVA</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No se han agregado ítems a la orden de compra.</td>
                        </tr>
                      ) : (
                        formData.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px' }}>{item.description}</td>
                            <td style={{ padding: '10px 12px', textItems: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 12px', textItems: 'center' }}>{item.unit}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>${parseFloat(item.unit_price).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textItems: 'center' }}>{item.tax_rate}%</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>${parseFloat(item.subtotal).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Form Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginTop: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#475569' }}>Subtotal Base: <span style={{ fontWeight: '700', color: '#1e293b' }}>${parseFloat(formTotals.subtotal).toLocaleString()}</span></div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>IVA Acumulado: <span style={{ fontWeight: '700', color: '#1e293b' }}>${parseFloat(formTotals.tax).toLocaleString()}</span></div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#e21a22' }}>Total Orden: ${parseFloat(formTotals.total).toLocaleString()}</div>
                </div>
              </div>

              {/* Notes and Terms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Términos y Condiciones (Plazos de pago, etc.)</label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Ej. Pago a 30 días contra entrega de factura."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Observaciones</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Ej. Entregar en la bodega norte."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', color: '#ffffff', backgroundColor: '#e21a22', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Guardar Borrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO DETAIL MODAL */}
      {selectedPo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '800px',
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '850', color: '#0f172a', margin: 0 }}>
                  Orden de Compra: {selectedPo.po_number}
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: selectedPo.status === 'draft' ? '#cbd5e1' : selectedPo.status === 'sent' ? '#e0f2fe' : '#d1fae5',
                  color: selectedPo.status === 'draft' ? '#475569' : selectedPo.status === 'sent' ? '#0369a1' : '#065f46',
                  marginTop: '6px',
                  display: 'inline-block'
                }}>
                  {selectedPo.status.toUpperCase()}
                </span>
              </div>
              <button onClick={() => setSelectedPo(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>Información del Proveedor</h4>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Proveedor:</span> {selectedPo.supplier?.razon_social}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>NIT/Cédula:</span> {selectedPo.supplier?.nit_or_cedula}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Email:</span> {selectedPo.supplier?.email || 'N/A'}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Celular:</span> {selectedPo.supplier?.phone || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>Detalles del Pedido</h4>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Fecha Emisión:</span> {new Date(selectedPo.issue_date).toLocaleDateString()}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Entrega Estimada:</span> {selectedPo.expected_delivery_date ? new Date(selectedPo.expected_delivery_date).toLocaleDateString() : 'Por confirmar'}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Creador por:</span> {selectedPo.creator?.name || 'Sistema'}</p>
                </div>
              </div>

              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>Ítems Solicitados</h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px' }}>Descripción</th>
                      <th style={{ padding: '10px 16px', textItems: 'center' }}>Cant</th>
                      <th style={{ padding: '10px 16px', textItems: 'center' }}>Unidad</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>P. Unitario</th>
                      <th style={{ padding: '10px 16px', textItems: 'center' }}>IVA</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPo.items || []).map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 16px' }}>{item.description}</td>
                        <td style={{ padding: '10px 16px', textItems: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 16px', textItems: 'center' }}>{item.unit || 'Unidad'}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>${parseFloat(item.unit_price).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', textItems: 'center' }}>{item.tax_rate}%</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '600' }}>${parseFloat(item.subtotal).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#475569' }}>Subtotal: <span style={{ fontWeight: '700', color: '#1e293b' }}>${parseFloat(selectedPo.subtotal).toLocaleString()}</span></div>
                <div style={{ fontSize: '13px', color: '#475569' }}>IVA: <span style={{ fontWeight: '700', color: '#1e293b' }}>${parseFloat(selectedPo.tax_amount).toLocaleString()}</span></div>
                <div style={{ fontSize: '16px', fontWeight: '850', color: '#e21a22' }}>Total Orden: ${parseFloat(selectedPo.total_amount).toLocaleString()}</div>
              </div>

              {selectedPo.terms && (
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#475569', margin: '0 0 4px' }}>Términos y Condiciones</h5>
                  <p style={{ fontSize: '13px', margin: 0, color: '#475569' }}>{selectedPo.terms}</p>
                </div>
              )}

              {selectedPo.notes && (
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#475569', margin: '0 0 4px' }}>Observaciones</h5>
                  <p style={{ fontSize: '13px', margin: 0, color: '#475569' }}>{selectedPo.notes}</p>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setSelectedPo(null)}
                style={{ padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff' }}
              >
                Cerrar
              </button>
              {selectedPo.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    const poId = selectedPo.id;
                    setSelectedPo(null);
                    handleSendEmail(poId);
                  }}
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', color: '#ffffff', backgroundColor: '#2563eb', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Mail size={16} />
                  Enviar por Correo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
