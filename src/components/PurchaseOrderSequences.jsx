import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, PlusCircle, Edit2, X
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Swal from 'sweetalert2';

const PurchaseOrderSequences = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    start_number: '',
    end_number: '',
    current_number: '',
    is_active: true
  });
  
  const [editingSequence, setEditingSequence] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch sequences
  const fetchSequences = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/purchase-order-sequences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setSequences(list);
      } else {
        console.error('Error fetching sequences:', data);
      }
    } catch (err) {
      console.error('Connection error fetching sequences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const startCreate = () => {
    setEditingSequence(null);
    setFormData({
      name: '',
      prefix: '',
      start_number: '',
      end_number: '',
      current_number: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const startEdit = (seqObj) => {
    setEditingSequence(seqObj);
    setFormData({
      name: seqObj.name,
      prefix: seqObj.prefix,
      start_number: seqObj.start_number.toString(),
      end_number: seqObj.end_number.toString(),
      current_number: seqObj.current_number.toString(),
      is_active: !!seqObj.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prefix.trim() || !formData.start_number || !formData.end_number || !formData.current_number) {
      Swal.fire('Campos obligatorios', 'Por favor complete todos los campos obligatorios.', 'warning');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    
    const isEdit = !!editingSequence;
    const url = isEdit ? `${apiUrl}/purchase-order-sequences/${editingSequence.id}` : `${apiUrl}/purchase-order-sequences`;
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
          prefix: formData.prefix.trim().toUpperCase(),
          start_number: parseInt(formData.start_number),
          end_number: parseInt(formData.end_number),
          current_number: parseInt(formData.current_number),
          is_active: formData.is_active
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire('Éxito', isEdit ? 'Secuencia actualizada correctamente.' : 'Secuencia creada correctamente.', 'success');
        setIsModalOpen(false);
        fetchSequences();
      } else {
        Swal.fire('Error', data.message || 'Ocurrió un error al guardar la secuencia.', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error de conexión', 'No se pudo comunicar con el servidor.', 'error');
    }
  };

  const filteredSequences = sequences.filter(seq => {
    const term = searchQuery.toLowerCase();
    return (
      seq.name?.toLowerCase().includes(term) ||
      seq.prefix?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>
      <Sidebar activeTab="purchase-order-sequences" />

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
                placeholder="Buscar por nombre o prefijo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                Tipos de Documento / Secuencias OC
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
                Defina los prefijos y rangos de numeración para sus órdenes de compra.
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
              Nuevo Tipo Documento
            </button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Secuencias Registradas</span>
              <span style={{ fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '9999px', fontWeight: '600' }}>
                {filteredSequences.length} Total
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Nombre</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Prefijo</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Rango</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Número Actual</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        Cargando secuencias...
                      </td>
                    </tr>
                  ) : filteredSequences.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                        No se encontraron secuencias de órdenes de compra.
                      </td>
                    </tr>
                  ) : (
                    filteredSequences.map(seq => (
                      <tr key={seq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{seq.name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{seq.prefix}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>{seq.start_number} - {seq.end_number}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{seq.current_number}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: seq.is_active ? '#ecfdf5' : '#fef2f2',
                            color: seq.is_active ? '#059669' : '#dc2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {seq.is_active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <button
                            onClick={() => startEdit(seq)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '6px'
                            }}
                            title="Editar Tipo Documento"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
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
            width: '500px',
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                {editingSequence ? 'Editar Secuencia OC' : 'Nueva Secuencia OC'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Nombre Secuencia / Tipo Documento *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej. Orden de Compra Nacional"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Prefijo *</label>
                <input
                  type="text"
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleInputChange}
                  placeholder="Ej. OCN"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Nro Inicial *</label>
                  <input
                    type="number"
                    name="start_number"
                    value={formData.start_number}
                    onChange={handleInputChange}
                    placeholder="1"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Nro Final *</label>
                  <input
                    type="number"
                    name="end_number"
                    value={formData.end_number}
                    onChange={handleInputChange}
                    placeholder="9999"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Nro Actual *</label>
                  <input
                    type="number"
                    name="current_number"
                    value={formData.current_number}
                    onChange={handleInputChange}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                    Esta secuencia se encuentra activa
                  </span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#ffffff' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 16px', border: 'none', borderRadius: '6px', color: '#ffffff', backgroundColor: '#e21a22', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderSequences;
