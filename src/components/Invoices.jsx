import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, FileText, Eye, Printer, XCircle, X
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Swal from 'sweetalert2';

const Invoices = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected invoice for detail modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Fetch invoices
  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/invoices?page=${page}&search=${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        setInvoices(data.data || []);
        setMeta(data.meta || { current_page: 1, last_page: 1, total: 0 });
      } else {
        console.error('Error fetching invoices:', data);
      }
    } catch (err) {
      console.error('Connection error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, searchQuery]);

  // Cancel invoice
  const handleCancelInvoice = async (invoiceId) => {
    const result = await Swal.fire({
      title: '¿Anular Factura?',
      text: '¿Está seguro de que desea anular esta factura de venta? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e21a22',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, Anular',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/invoices/${invoiceId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        Swal.fire('Anulada', 'La factura ha sido anulada con éxito.', 'success');
        fetchInvoices(currentPage);
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(prev => ({ ...prev, status: 'cancelled' }));
        }
      } else {
        Swal.fire('Error', data.message || 'No se pudo anular la factura.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
    }
  };

  // Open invoice detail and fetch items
  const handleViewInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/invoices/${invoice.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setSelectedInvoice(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Print Invoice
  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const itemsRows = (invoice.items || []).map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${item.product_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">$${parseFloat(item.unit_price).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${item.tax_rate}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">$${parseFloat(item.subtotal).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura ${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header-table { width: 100%; margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .items-table th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }
            .totals-table { width: 40%; margin-left: auto; margin-top: 20px; border-collapse: collapse; }
            .totals-table td { padding: 8px 10px; font-size: 13px; }
            .badge-cancelled { color: red; font-weight: bold; border: 2px solid red; padding: 5px 10px; display: inline-block; transform: rotate(-5deg); margin-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <table class="header-table">
            <tr>
              <td>
                <h1 style="margin: 0; color: #0f172a; font-size: 26px; font-weight: 800;">KAYPARTS</h1>
                <p style="margin: 4px 0; font-size: 13px; color: #64748b;">Repuestos Online & Industrial</p>
              </td>
              <td style="text-align: right;">
                <h2 style="margin: 0; color: #e21a22; font-size: 20px;">FACTURA DE VENTA</h2>
                <p style="margin: 4px 0; font-size: 15px; font-weight: 700; font-family: monospace;">Nro: ${invoice.invoice_number}</p>
                ${invoice.status === 'cancelled' ? '<div class="badge-cancelled">ANULADA</div>' : ''}
              </td>
            </tr>
          </table>

          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin-bottom: 24px;" />

          <table style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td style="width: 50%; vertical-align: top; font-size: 13px;">
                <strong style="color: #0f172a;">Cliente:</strong> ${invoice.customer_name}<br />
                <strong style="color: #0f172a;">NIT/Cédula:</strong> ${invoice.customer_nit_or_cedula || 'N/A'}<br />
                <strong style="color: #0f172a;">Email:</strong> ${invoice.customer_email}<br />
              </td>
              <td style="width: 50%; vertical-align: top; font-size: 13px; text-align: right;">
                <strong style="color: #0f172a;">Fecha Emisión:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}<br />
                <strong style="color: #0f172a;">Método Pago:</strong> ${invoice.payment_method}<br />
                <strong style="color: #0f172a;">Pedido Asoc:</strong> #${invoice.order?.order_number || invoice.order_id}<br />
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cant</th>
                <th style="text-align: right;">P. Unitario</th>
                <th style="text-align: center;">IVA</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <table class="totals-table">
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right; font-weight: 600;">$${parseFloat(invoice.subtotal).toLocaleString()}</td>
            </tr>
            <tr>
              <td>IVA:</td>
              <td style="text-align: right; font-weight: 600;">$${parseFloat(invoice.tax_amount).toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px solid #cbd5e1;">
              <td style="font-weight: 700; font-size: 15px;">TOTAL:</td>
              <td style="text-align: right; font-weight: 700; font-size: 15px; color: #e21a22;">$${parseFloat(invoice.total_amount).toLocaleString()}</td>
            </tr>
          </table>

          <div style="margin-top: 50px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            ${invoice.resolution ? `
              Resolución DIAN Nro. ${invoice.resolution.resolution_number} del ${invoice.resolution.resolution_date}. 
              Prefijo: ${invoice.resolution.prefix} del Rango ${invoice.resolution.start_number} al ${invoice.resolution.end_number}. 
              Vence el ${invoice.resolution.expiry_date}.
            ` : 'Resolución de facturación DIAN.'}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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
      <Sidebar activeTab="invoices" />

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
                placeholder="Buscar por factura, cliente..."
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
                Facturas de Venta
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
                Visualice, imprima y anule facturas emitidas de pedidos despachados.
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Listado de Facturas</span>
              <span style={{ fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '9999px', fontWeight: '600' }}>
                {meta.total} Emitidas
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Nro Factura</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Pedido Ref</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        Cargando facturas...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron facturas emitidas.
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', fontFamily: 'var(--font-mono)' }}>{inv.order?.order_number || `#${inv.order_id}`}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{inv.customer_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{inv.customer_email}</div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{new Date(inv.issue_date).toLocaleDateString()}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#1e293b', fontWeight: '700', textAlign: 'right' }}>
                          ${parseFloat(inv.total_amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: inv.status === 'issued' ? '#e0f2fe' : '#fee2e2',
                            color: inv.status === 'issued' ? '#0369a1' : '#b91c1c'
                          }}>
                            {inv.status === 'issued' ? 'EMITIDA' : 'ANULADA'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleViewInvoice(inv)}
                              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }}
                              title="Ver Detalle"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handlePrint(inv)}
                              style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', padding: '4px' }}
                              title="Imprimir Factura"
                            >
                              <Printer size={16} />
                            </button>
                            {inv.status === 'issued' && (
                              <button
                                onClick={() => handleCancelInvoice(inv.id)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                title="Anular Factura"
                              >
                                <XCircle size={16} />
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

      {/* DETAIL MODAL */}
      {selectedInvoice && (
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
            width: '650px',
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Factura de Venta: {selectedInvoice.invoice_number}
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: selectedInvoice.status === 'issued' ? '#e0f2fe' : '#fee2e2',
                  color: selectedInvoice.status === 'issued' ? '#0369a1' : '#b91c1c',
                  marginTop: '6px',
                  display: 'inline-block'
                }}>
                  {selectedInvoice.status === 'issued' ? 'EMITIDA' : 'ANULADA'}
                </span>
              </div>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>Información del Cliente</h4>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Nombre:</span> {selectedInvoice.customer_name}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Email:</span> {selectedInvoice.customer_email}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Identificación/Cel:</span> {selectedInvoice.customer_nit_or_cedula || 'N/A'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>Detalles de la Factura</h4>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Fecha Emisión:</span> {new Date(selectedInvoice.issue_date).toLocaleString()}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Medio de Pago:</span> {selectedInvoice.payment_method}</p>
                  <p style={{ fontSize: '13px', margin: '4px 0', color: '#1e293b' }}><span style={{ fontWeight: '600' }}>Pedido Ref:</span> #{selectedInvoice.order?.order_number || selectedInvoice.order_id}</p>
                </div>
              </div>

              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>Productos Facturados</h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Producto</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textItems: 'center' }}>Cant</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>P. Unit</th>
                      <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedInvoice.items || []).map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 16px', fontSize: '13px', color: '#0f172a' }}>{item.product_name}</td>
                        <td style={{ padding: '10px 16px', fontSize: '13px', color: '#475569', textItems: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 16px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>${parseFloat(item.unit_price).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', fontSize: '13px', color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>${parseFloat(item.subtotal).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', color: '#475569' }}>Subtotal Base: <span style={{ fontWeight: '700', color: '#1e293b' }}>${parseFloat(selectedInvoice.subtotal).toLocaleString()}</span></div>
                <div style={{ fontSize: '13px', color: '#475569' }}>Impuestos (IVA): <span style={{ fontWeight: '700', color: '#1e293b' }}>${parseFloat(selectedInvoice.tax_amount).toLocaleString()}</span></div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#e21a22' }}>Total Facturado: ${parseFloat(selectedInvoice.total_amount).toLocaleString()}</div>
              </div>

              {selectedInvoice.resolution && (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>
                  <div style={{ fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Información de la Resolución DIAN</div>
                  Resolución Nro. {selectedInvoice.resolution.resolution_number} del {selectedInvoice.resolution.resolution_date}.<br />
                  Prefijo: {selectedInvoice.resolution.prefix} | Rango autorizado: {selectedInvoice.resolution.start_number} - {selectedInvoice.resolution.end_number} | Vence: {selectedInvoice.resolution.expiry_date}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                style={{ padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff' }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handlePrint(selectedInvoice)}
                style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', color: '#ffffff', backgroundColor: '#0369a1', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer size={16} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
