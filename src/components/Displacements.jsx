import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Edit2
} from 'lucide-react';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';

const Displacements = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form states for creating a new displacement
  const [newName, setNewName] = useState('');

  // Form states for editing an existing displacement
  const [editingDisplacement, setEditingDisplacement] = useState(null);
  const [editName, setEditName] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data lists
  const [displacements, setDisplacements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to close modal and reset fields
  const closeModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setModalError('');
  };

  // Helper to open edit modal
  const openEditModal = (disp) => {
    setEditingDisplacement(disp);
    setEditName(disp.name);
    setModalError('');
  };

  // Helper to close edit modal and reset fields
  const closeEditModal = () => {
    setEditingDisplacement(null);
    setEditName('');
    setModalError('');
  };

  // Fetch displacements on mount
  useEffect(() => {
    const fetchDisplacements = async () => {
      const token = localStorage.getItem('kayparts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      try {
        const response = await fetch(`${apiUrl}/vehicle-displacements`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        if (response.ok && data) {
          const list = Array.isArray(data) ? data : (data.data || []);
          const mapped = list.map(item => ({
            id: item.id,
            name: item.name
          }));
          setDisplacements(mapped);
        }
      } catch (err) {
        console.error('Error fetching displacements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDisplacements();
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle creating a displacement
  const handleCreateDisplacement = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setModalError('Por favor ingrese el cilindraje.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/vehicle-displacements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.name) {
          throw new Error(data.errors.name[0]);
        }
        throw new Error(data.message || 'Error al crear el cilindraje.');
      }

      const created = data.data || data;
      const newDisp = {
        id: created.id,
        name: created.name
      };

      setDisplacements([newDisp, ...displacements].sort((a, b) => a.name.localeCompare(b.name)));
      closeModal();

      // Show success toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });
      Toast.fire({
        icon: 'success',
        title: 'Cilindraje creado correctamente'
      });

    } catch (err) {
      setModalError(err.message || 'Error de conexión al intentar crear el cilindraje.');
    }
  };

  // Handle updating a displacement
  const handleUpdateDisplacement = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setModalError('Por favor ingrese el cilindraje.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/vehicle-displacements/${editingDisplacement.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: editName })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.name) {
          throw new Error(data.errors.name[0]);
        }
        throw new Error(data.message || 'Error al actualizar el cilindraje.');
      }

      const updated = data.data || data;
      const updatedList = displacements.map(item => {
        if (item.id === editingDisplacement.id) {
          return {
            ...item,
            name: updated.name
          };
        }
        return item;
      }).sort((a, b) => a.name.localeCompare(b.name));

      setDisplacements(updatedList);
      closeEditModal();

      // Show success toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });
      Toast.fire({
        icon: 'success',
        title: 'Cilindraje actualizado correctamente'
      });

    } catch (err) {
      setModalError(err.message || 'Error de conexión al intentar actualizar el cilindraje.');
    }
  };

  // Client-side filtering
  const filteredDisplacements = displacements.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredDisplacements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDisplacements = filteredDisplacements.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR */}
      <Sidebar activeTab="displacements" />

      {/* Style tags for main layout responsiveness */}
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
                placeholder="Buscar cilindraje..."
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

        {/* TITLE */}
        <div style={{
          marginBottom: '32px'
        }}>
          <h1 className="title-font" style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '6px'
          }}>
            Gestión de Cilindrajes de Vehículos
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
            Gestione los cilindrajes y motorizaciones para los repuestos del catálogo.
          </p>
        </div>

        {/* TWO-COLUMN GRID */}
        <div className="dashboard-split-row" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* LEFT COLUMN: DISPLACEMENTS TABLE LIST */}
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
                Listado de Cilindrajes
              </span>
              <span style={{
                fontSize: '12px',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontWeight: '600'
              }}>
                {filteredDisplacements.length} Total
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CILINDRAJE / MOTOR</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="2" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Cargando cilindrajes...
                      </td>
                    </tr>
                  ) : paginatedDisplacements.length > 0 ? (
                    paginatedDisplacements.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff'
                        }}
                        className="table-row-hover"
                      >
                        {/* Name column */}
                        <td style={{ padding: '20px 24px', fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>
                          {item.name}
                        </td>

                        {/* Actions column */}
                        <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                          <button
                            onClick={() => openEditModal(item)}
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
                            title="Editar cilindraje"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron cilindrajes que coincidan con la búsqueda.
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
                Mostrando <strong style={{ color: '#1e293b' }}>{filteredDisplacements.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredDisplacements.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredDisplacements.length}</strong> cilindrajes
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

          {/* RIGHT COLUMN: STATIC FORM CARD */}
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
            {editingDisplacement ? (
              /* EDIT DISPLACEMENT FORM */
              <form onSubmit={handleUpdateDisplacement} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <h3 className="title-font" style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    Editar Cilindraje de Vehículo
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Actualice el valor del cilindraje o motorización.
                  </p>
                </div>

                {modalError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    color: '#ef4444',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}>
                    {modalError}
                  </div>
                )}

                <div className="input-group">
                  <label htmlFor="edit-disp-name" className="input-label" style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Cilindraje / Motor *
                  </label>
                  <input
                    id="edit-disp-name"
                    type="text"
                    placeholder="Ej. 2.0L o 1600cc"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                    <PlusCircle size={14} />
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
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
                </div>
              </form>
            ) : (
              /* CREATE DISPLACEMENT FORM */
              <form onSubmit={handleCreateDisplacement} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <h3 className="title-font" style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    Crear Nuevo Cilindraje
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    Ingrese el cilindraje o motorización.
                  </p>
                </div>

                {modalError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    color: '#ef4444',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}>
                    {modalError}
                  </div>
                )}

                <div className="input-group">
                  <label htmlFor="disp-name" className="input-label" style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#475569',
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Cilindraje / Motor *
                  </label>
                  <input
                    id="disp-name"
                    type="text"
                    placeholder="Ej. 2.0L o 1600cc"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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
                    <PlusCircle size={14} />
                    Guardar cilindraje
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Displacements;

