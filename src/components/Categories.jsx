import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Grid, Folder, User, CheckCircle2, AlertTriangle,
  XCircle, Filter, Trash2, Edit2, UploadCloud, Layers, Car
} from 'lucide-react';
import Logo from './Logo';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';

const Categories = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating a new category
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImgFile, setNewImgFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states for editing an existing category
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImgFile, setEditImgFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const editFileInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Categories list state
  const [categories, setCategories] = useState([]);

  // Helper to close modal and reset fields
  const closeModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setNewDesc('');
    setNewImgFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Helper to open edit modal
  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditImgFile(null);
    setEditPreviewUrl(cat.image);
  };

  // Helper to close edit modal and reset fields
  const closeEditModal = () => {
    setEditingCategory(null);
    setEditName('');
    setEditDesc('');
    setEditImgFile(null);
    if (editPreviewUrl && !editPreviewUrl.startsWith('http') && !editPreviewUrl.startsWith('/uploads') && !editPreviewUrl.startsWith('blob:')) {
      // Safely check and only revoke if it's a blob object URL generated locally
    } else if (editPreviewUrl && editPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditPreviewUrl(null);
  };

  // Fetch categories from Laravel API on mount
  React.useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('kayparts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      try {
        const response = await fetch(`${apiUrl}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        if (response.ok && data.data) {
          const mapped = data.data.map(cat => ({
            id: `CAT-${cat.id}`,
            image: cat.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120',
            name: cat.name,
            description: cat.description || '',
            count: '0 unidades', // Mock value
            status: 'OPERATIONAL' // Mock value
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle creating a category (Multipart API upload)
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingrese el nombre de la categoría.',
        confirmButtonColor: '#e21a22'
      });
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    const formData = new FormData();
    formData.append('name', newName);
    if (newDesc) {
      formData.append('description', newDesc);
    }
    if (newImgFile) {
      formData.append('image', newImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstField = Object.keys(data.errors)[0];
          if (firstField && data.errors[firstField].length > 0) {
            throw new Error(data.errors[firstField][0]);
          }
        }
        throw new Error(data.message || 'Error al crear la categoría.');
      }

      const createdCategory = data.data;

      const newCategory = {
        id: `CAT-${createdCategory.id}`,
        image: createdCategory.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120',
        name: createdCategory.name,
        description: createdCategory.description || '',
        count: '0 unidades',
        status: 'OPERATIONAL'
      };

      setCategories([newCategory, ...categories]);
      closeModal();

      Swal.fire({
        icon: 'success',
        title: '¡Creado!',
        text: 'La categoría ha sido creada correctamente.',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al crear',
        text: err.message || 'Error de conexión al intentar crear la categoría.',
        confirmButtonColor: '#e21a22'
      });
    }
  };

  // Handle updating a category (Multipart API upload with PUT spoofing)
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingrese el nombre de la categoría.',
        confirmButtonColor: '#e21a22'
      });
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const numericId = editingCategory.id.replace('CAT-', '');

    const formData = new FormData();
    formData.append('_method', 'PUT'); // Spoof PUT method for Laravel file uploads
    formData.append('name', editName);
    formData.append('description', editDesc || '');
    if (editImgFile) {
      formData.append('image', editImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/categories/${numericId}`, {
        method: 'POST', // POST request required for PHP file-upload method spoofing
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstField = Object.keys(data.errors)[0];
          if (firstField && data.errors[firstField].length > 0) {
            throw new Error(data.errors[firstField][0]);
          }
        }
        throw new Error(data.message || 'Error al actualizar la categoría.');
      }

      const updatedCategory = data.data;

      const updatedList = categories.map(cat => {
        if (cat.id === editingCategory.id) {
          return {
            ...cat,
            name: updatedCategory.name,
            description: updatedCategory.description || '',
            image: updatedCategory.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120',
          };
        }
        return cat;
      });

      setCategories(updatedList);
      closeEditModal();

      Swal.fire({
        icon: 'success',
        title: '¡Actualizado!',
        text: 'La categoría ha sido actualizada correctamente.',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al actualizar',
        text: err.message || 'Error de conexión al intentar actualizar la categoría.',
        confirmButtonColor: '#e21a22'
      });
    }
  };

  // Delete category handler (API call)
  const handleDeleteCategory = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea eliminar esta categoría?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e21a22',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const numericId = id.replace('CAT-', '');
      const token = localStorage.getItem('kayparts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      try {
        const response = await fetch(`${apiUrl}/categories/${numericId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          setCategories(categories.filter(cat => cat.id !== id));
          Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'La categoría ha sido eliminada correctamente.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          const data = await response.json();
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: data.message || 'Error al eliminar la categoría.',
            confirmButtonColor: '#e21a22'
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'Error de conexión al intentar eliminar la categoría.',
          confirmButtonColor: '#e21a22'
        });
      }
    }
  };

  // Filter categories by search input
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset current page to 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>
      
      {/* 1. SIDEBAR (Navigation Left Pane - Categories is active) */}
      <Sidebar activeTab="categories" />
      
      {/* Style tags for main layout responsiveness */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
          .dashboard-split-row { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* 2. MAIN CONTENT APP AREA */}
      <div className="dashboard-main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxHeight: '100vh',
        padding: '30px 40px'
      }}>
        
        {/* HEADER BAR (Kayparts Industrial Text branding) */}
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
                placeholder="Buscar categorías..."
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

        {/* TITLE AND CREATE NEW CATEGORY BUTTON */}
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
              Gestión de Categorías
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Gestione la clasificación de repuestos industriales y la jerarquía de inventario.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '6px'
            }}
          >
            <PlusCircle size={16} />
            Crear categoría
          </button>
        </div>

        {/* CATEGORY TABLE LIST */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', width: '100px' }}>IMAGEN</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>NOMBRE</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CANTIDAD ARTÍCULOS</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.length > 0 ? (
                  paginatedCategories.map((cat, idx) => (
                    <tr
                      key={cat.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff'
                      }}
                      className="table-row-hover"
                    >
                      {/* Image column */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          backgroundImage: `url(${cat.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid #e2e8f0'
                        }} />
                      </td>

                      {/* Name & description column */}
                      <td style={{ padding: '20px 24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                          {cat.name}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                          {cat.description}
                        </p>
                      </td>

                      {/* Item Count column */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                        {cat.count}
                      </td>

                      {/* Status pill column */}
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          letterSpacing: '0.2px',
                          color: cat.status === 'OPERATIONAL' ? '#10b981' : cat.status === 'MAINTENANCE' ? '#f59e0b' : '#ef4444'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: cat.status === 'OPERATIONAL' ? '#10b981' : cat.status === 'MAINTENANCE' ? '#f59e0b' : '#ef4444'
                          }}></span>
                          {cat.status === 'OPERATIONAL' && 'OPERATIVO'}
                          {cat.status === 'MAINTENANCE' && 'MANTENIMIENTO'}
                          {cat.status === 'IN_PROGRESS' && 'EN PROCESO'}
                        </div>
                      </td>

                      {/* Actions column */}
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', color: '#64748b' }}>
                          <button
                            onClick={() => openEditModal(cat)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No se encontraron categorías que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <style dangerouslySetInnerHTML={{ __html: `
              .table-row-hover:hover {
                background-color: #f8fafc !important;
              }
            `}} />
          </div>

          {/* TABLE FOOTER / PAGINATION */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            padding: '16px 24px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <div>
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredCategories.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredCategories.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredCategories.length}</strong> categorías
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
                disabled={currentPage === totalPages}
                style={{
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'default' : 'pointer',
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

      {/* 3. MODAL POPUP (Crear nueva categoría) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Styles for animations inside the modal */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleUp {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}} />

            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 className="title-font" style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                Crear Nueva Categoría
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Ingrese los detalles del nuevo grupo de clasificación de inventario.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateCategory}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Category Name */}
                <div className="input-group">
                  <label htmlFor="cat-name" className="input-label">
                    Nombre de la categoría *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    placeholder="Ej. Conexiones neumáticas"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="cat-desc" className="input-label">
                    Descripción *
                  </label>
                  <textarea
                    id="cat-desc"
                    placeholder="Ej. Acoples rápidos, mangueras flexibles y carcasas de presión."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="input-control"
                    rows="3"
                    style={{ resize: 'none', lineHeight: '1.5' }}
                    required
                  />
                </div>

                {/* Image upload selector (Dropzone style matching user's mockup) */}
                <div className="input-group">
                  <label className="input-label">
                    Subir imagen de representación
                  </label>
                  
                  {/* Hidden input file */}
                  <input
                    id="cat-img"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewImgFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    style={{ display: 'none' }}
                  />

                  {/* Dropzone Container */}
                  <div
                    onClick={() => fileInputRef.current.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        setNewImgFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    style={{
                      border: isDragging ? '2px dashed #E31B23' : '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '24px',
                      backgroundColor: isDragging ? '#fef2f2' : '#f8fafc',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      position: 'relative',
                      minHeight: '140px',
                      overflow: 'hidden'
                    }}
                  >
                    {previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt="Vista previa"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '160px',
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }}
                        />
                        {/* Remove button floating on top-right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering file selection
                            setNewImgFile(null);
                            URL.revokeObjectURL(previewUrl);
                            setPreviewUrl(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''; // Reset uploader input
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                          title="Eliminar imagen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <UploadCloud
                          size={40}
                          style={{
                            color: isDragging ? '#E31B23' : '#94a3b8',
                            transition: 'color 0.2s'
                          }}
                        />
                        <div>
                          <p style={{
                            fontWeight: '600',
                            fontSize: '15px',
                            color: '#0f172a',
                            margin: '0 0 2px 0'
                          }}>
                            Buscar archivos
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: 0
                          }}>
                            Arrastre y suelte archivos aquí
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '6px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 18px', borderRadius: '6px' }}
                >
                  Guardar categoría
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 className="title-font" style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a'
              }}>
                Editar Categoría
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Actualice los detalles de la categoría seleccionada.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleUpdateCategory}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Category Name */}
                <div className="input-group">
                  <label htmlFor="edit-cat-name" className="input-label">
                    Nombre de la categoría *
                  </label>
                  <input
                    id="edit-cat-name"
                    type="text"
                    placeholder="Ej. Conexiones neumáticas"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="edit-cat-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="edit-cat-desc"
                    placeholder="Ej. Acoples rápidos, mangueras flexibles y carcasas de presión."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="input-control"
                    rows="3"
                    style={{ resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                {/* Image upload selector (Dropzone style) */}
                <div className="input-group">
                  <label className="input-label">
                    Subir imagen de representación
                  </label>
                  
                  {/* Hidden input file */}
                  <input
                    id="edit-cat-img"
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditImgFile(file);
                        setEditPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    style={{ display: 'none' }}
                  />

                  {/* Dropzone Container */}
                  <div
                    onClick={() => editFileInputRef.current.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsEditDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsEditDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsEditDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        setEditImgFile(file);
                        setEditPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    style={{
                      border: isEditDragging ? '2px dashed #E31B23' : '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '24px',
                      backgroundColor: isEditDragging ? '#fef2f2' : '#f8fafc',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      position: 'relative',
                      minHeight: '140px',
                      overflow: 'hidden'
                    }}
                  >
                    {editPreviewUrl ? (
                      <>
                        <img
                          src={editPreviewUrl}
                          alt="Vista previa"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '160px',
                            objectFit: 'contain',
                            borderRadius: '4px'
                          }}
                        />
                        {/* Remove button floating on top-right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid triggering file selection
                            setEditImgFile(null);
                            if (editPreviewUrl && editPreviewUrl.startsWith('blob:')) {
                              URL.revokeObjectURL(editPreviewUrl);
                            }
                            setEditPreviewUrl(null);
                            if (editFileInputRef.current) {
                              editFileInputRef.current.value = ''; // Reset uploader input
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                          title="Eliminar imagen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <UploadCloud
                          size={40}
                          style={{
                            color: isEditDragging ? '#E31B23' : '#94a3b8',
                            transition: 'color 0.2s'
                          }}
                        />
                        <div>
                          <p style={{
                            fontWeight: '600',
                            fontSize: '15px',
                            color: '#0f172a',
                            margin: '0 0 2px 0'
                          }}>
                            Buscar archivos
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#64748b',
                            margin: 0
                          }}>
                            Arrastre y suelte archivos aquí
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '6px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 18px', borderRadius: '6px' }}
                >
                  Guardar cambios
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Categories;
