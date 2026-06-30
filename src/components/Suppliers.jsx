import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  Briefcase, Edit2, Info, CheckCircle2, XCircle, X
} from 'lucide-react';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';

const Suppliers = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data lists
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    identification_type: 'NIT',
    nit_or_cedula: '',
    razon_social: '',
    assigned_advisor: '',
    phone: '',
    whatsapp: '',
    department: '',
    city: '',
    address: '',
    email: '',
    status: 'active'
  });

  // Edit state tracker
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Success / error message states
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const showAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // Fetch departments list
  const fetchDepartments = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    try {
      const response = await fetch(`${apiUrl}/geo/departments`);
      const data = await response.json();
      if (response.ok) {
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch cities for a department ID
  const fetchCities = async (deptId) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    try {
      const response = await fetch(`${apiUrl}/geo/cities?department_id=${deptId}`);
      const data = await response.json();
      if (response.ok && data) {
        setCities(data.cities || []);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  // Fetch suppliers list on mount
  const fetchSuppliers = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setSuppliers(list);
      } else {
        console.error('Error fetching suppliers:', data);
      }
    } catch (err) {
      console.error('Connection error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchDepartments();
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

  // Handle department change in form
  const handleDepartmentChange = (e) => {
    const deptName = e.target.value;
    setFormData(prev => ({
      ...prev,
      department: deptName,
      city: '' // Clear city when department changes
    }));
    setCities([]);

    // Find the department ID
    const selectedDept = departments.find(d => d.name === deptName);
    if (selectedDept) {
      fetchCities(selectedDept.id);
    }
  };

  // Open modal for new supplier
  const startCreate = () => {
    setEditingSupplier(null);
    setFormData({
      identification_type: 'NIT',
      nit_or_cedula: '',
      razon_social: '',
      assigned_advisor: '',
      phone: '',
      whatsapp: '',
      department: '',
      city: '',
      address: '',
      email: '',
      status: 'active'
    });
    setCities([]);
    setIsModalOpen(true);
  };

  // Switch to editing mode (and open modal)
  const startEdit = async (supplierObj) => {
    setEditingSupplier(supplierObj);
    
    // Load cities if department is set
    if (supplierObj.department) {
      const matchedDept = departments.find(d => d.name === supplierObj.department);
      if (matchedDept) {
        await fetchCities(matchedDept.id);
      }
    }

    setFormData({
      identification_type: supplierObj.identification_type || 'NIT',
      nit_or_cedula: supplierObj.nit_or_cedula || '',
      razon_social: supplierObj.razon_social || '',
      assigned_advisor: supplierObj.assigned_advisor || '',
      phone: supplierObj.phone || '',
      whatsapp: supplierObj.whatsapp || '',
      department: supplierObj.department || '',
      city: supplierObj.city || '',
      address: supplierObj.address || '',
      email: supplierObj.email || '',
      status: supplierObj.status || 'active'
    });
    
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setAlertMsg(null);
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nit_or_cedula.trim() || !formData.razon_social.trim()) {
      showAlert('Por favor, complete todos los campos obligatorios.', 'error');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    const isEdit = !!editingSupplier;
    const url = isEdit ? `${apiUrl}/suppliers/${editingSupplier.id}` : `${apiUrl}/suppliers`;
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
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el proveedor.`);
      }

      Swal.fire({
        icon: 'success',
        title: `Proveedor ${isEdit ? 'Actualizado' : 'Creado'}`,
        text: `El proveedor se ha ${isEdit ? 'modificado' : 'guardado'} correctamente.`,
        confirmButtonColor: '#e21a22'
      });

      closeModal();
      fetchSuppliers();

    } catch (err) {
      showAlert(err.message || 'Error de conexión con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering
  const filteredSuppliers = suppliers.filter(item => 
    (item.razon_social || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.nit_or_cedula || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.assigned_advisor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR */}
      <Sidebar activeTab="suppliers" />

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
                placeholder="Buscar proveedor..."
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

        {/* TITLE AND TOP BUTTON BAR */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 className="title-font" style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '6px'
            }}>
              Catálogo de Proveedores
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Gestione la base de datos de proveedores y asesores comerciales asignados.
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
              boxShadow: 'var(--shadow-sm)',
              transition: 'background-color 0.2s'
            }}
            className="btn-create-hover"
          >
            <PlusCircle size={18} />
            Crear Proveedor
          </button>
          <style dangerouslySetInnerHTML={{ __html: `
            .btn-create-hover:hover {
              background-color: #b91c1c !important;
            }
          `}} />
        </div>

        {/* FULL WIDTH LIST TABLE */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', width: '100%' }}>
          
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
              Listado de Proveedores
            </span>
            <span style={{
              fontSize: '12px',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontWeight: '600'
            }}>
              {filteredSuppliers.length} Total
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
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>RAZÓN SOCIAL</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>TIPO DOC</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>NIT / CÉDULA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ASESOR ASIGNADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CIUDAD</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '100px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Cargando proveedores...
                    </td>
                  </tr>
                ) : paginatedSuppliers.length > 0 ? (
                  paginatedSuppliers.map((item) => (
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
                        <div>{item.razon_social}</div>
                        {item.email && <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>{item.email}</span>}
                      </td>

                      {/* Doc Type */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                        {item.identification_type || 'NIT'}
                      </td>

                      {/* NIT */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                        {item.nit_or_cedula}
                      </td>

                      {/* Advisor */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                        {item.assigned_advisor || 'No asignado'}
                      </td>

                      {/* City */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                        {item.city || 'No registrada'}
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
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
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
                          title="Editar proveedor"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No se encontraron proveedores.
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
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredSuppliers.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredSuppliers.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredSuppliers.length}</strong> registros
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

      </div>

      {/* 3. MODAL POPUP FORM */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            padding: '30px',
            position: 'relative',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes modalSlideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}} />
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
              }}
              className="modal-close-hover"
            >
              <X size={20} />
            </button>
            <style dangerouslySetInnerHTML={{ __html: `
              .modal-close-hover:hover {
                background-color: #f1f5f9;
                color: #0f172a;
              }
            `}} />

            {/* Modal Title */}
            <div style={{ marginBottom: '24px', paddingRight: '24px' }}>
              <h2 className="title-font" style={{
                fontSize: '20px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '4px'
              }}>
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Ingrese los detalles de identificación, localización y contacto del proveedor comercial.
              </p>
            </div>

            {/* Modal Alert Banner */}
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
                marginBottom: '20px'
              }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{alertMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Razón Social */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Razón Social *
                </label>
                <input
                  name="razon_social"
                  type="text"
                  placeholder="Ej. Distribuidora Automotriz S.A.S."
                  value={formData.razon_social}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Grid for ID Type & Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                {/* Tipo de Identificación */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Tipo Doc. *
                  </label>
                  <select
                    name="identification_type"
                    value={formData.identification_type}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                    required
                  >
                    <option value="NIT">NIT</option>
                    <option value="Cédula">Cédula</option>
                  </select>
                </div>

                {/* Número */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Nro. Identificación *
                  </label>
                  <input
                    name="nit_or_cedula"
                    type="text"
                    placeholder="Ej. 900123456-7"
                    value={formData.nit_or_cedula}
                    onChange={handleInputChange}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Grid for Advisor & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Assigned Advisor */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Asesor Asignado
                  </label>
                  <input
                    name="assigned_advisor"
                    type="text"
                    placeholder="Ej. Carlos Gomez"
                    value={formData.assigned_advisor}
                    onChange={handleInputChange}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  />
                </div>

                {/* Email */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Correo electrónico
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Ej. ventas@proveedor.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Grid for Geo Data (Department & City Selects) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Department dropdown */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Departamento
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleDepartmentChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Seleccione Departamento</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City dropdown */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Ciudad
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!formData.department}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Seleccione Ciudad</option>
                    {cities.map((city, index) => (
                      <option key={index} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Dirección
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="Ej. Avenida El Dorado # 60-15"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Grid for Phone & WhatsApp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Phone */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Teléfono
                  </label>
                  <input
                    name="phone"
                    type="text"
                    placeholder="Ej. 604 123 4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  />
                </div>

                {/* WhatsApp */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    WhatsApp
                  </label>
                  <input
                    name="whatsapp"
                    type="text"
                    placeholder="Ej. 300 123 4567"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="input-group" style={{ width: '50%', paddingRight: '8px' }}>
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
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    borderRadius: '6px',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    backgroundColor: '#e21a22',
                    color: '#ffffff',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Briefcase size={14} />
                  {editingSupplier ? 'Actualizar' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Suppliers;
