import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Grid, Folder, User, CheckCircle2, AlertTriangle,
  XCircle, Filter, Trash2, Edit2, UploadCloud, Layers, Car
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Subcategories = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subcategories');
    const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating a new subcategory
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newImgFile, setNewImgFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form states for editing an existing subcategory
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editImgFile, setEditImgFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const editFileInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data lists
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to close modal and reset fields
  const closeModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setNewDesc('');
    setNewCategoryId('');
    setNewImgFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Helper to open edit modal
  const openEditModal = (sub) => {
    setEditingSubcategory(sub);
    setEditName(sub.name);
    setEditDesc(sub.description || '');
    setEditCategoryId(sub.category_id || '');
    setEditImgFile(null);
    setEditPreviewUrl(sub.image);
  };

  // Helper to close edit modal and reset fields
  const closeEditModal = () => {
    setEditingSubcategory(null);
    setEditName('');
    setEditDesc('');
    setEditCategoryId('');
    setEditImgFile(null);
    if (editPreviewUrl && editPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditPreviewUrl(null);
  };

  // Fetch subcategories & categories from Laravel API on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('kayparts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      try {
        // Fetch categories for the select selector dropdown
        const catRes = await fetch(`${apiUrl}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const catData = await catRes.json();
        if (catRes.ok && catData.data) {
          setCategories(catData.data);
        }

        // Fetch subcategories
        const subRes = await fetch(`${apiUrl}/subcategories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const subData = await subRes.json();
        if (subRes.ok && subData.data) {
          const mapped = subData.data.map(sub => ({
            id: `SUB-${sub.id}`,
            image: sub.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120',
            name: sub.name,
            description: sub.description || '',
            category_id: sub.category_id,
            category_name: sub.category_name || 'Sin categoría',
            status: 'OPERATIONAL' // Mock status matching mockup
          }));
          setSubcategories(mapped);
        }
      } catch (err) {
        console.error('Error fetching subcategories data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle creating a subcategory (Multipart API upload)
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor ingrese el nombre de la subcategoría.');
      return;
    }
    if (!newCategoryId) {
      alert('Por favor seleccione una categoría padre.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('category_id', newCategoryId);
    if (newDesc) {
      formData.append('description', newDesc);
    }
    if (newImgFile) {
      formData.append('image', newImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/subcategories`, {
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
        throw new Error(data.message || 'Error al crear la subcategoría.');
      }

      const created = data.data;
      const newSub = {
        id: `SUB-${created.id}`,
        image: created.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120',
        name: created.name,
        description: created.description || '',
        category_id: created.category_id,
        category_name: created.category_name || categories.find(c => c.id === parseInt(newCategoryId))?.name || 'Categoría',
        status: 'OPERATIONAL'
      };

      setSubcategories([newSub, ...subcategories]);
      closeModal();

    } catch (err) {
      alert(err.message || 'Error de conexión al intentar crear la subcategoría.');
    }
  };

  // Handle updating a subcategory (PUT spoofing)
  const handleUpdateSubcategory = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Por favor ingrese el nombre de la subcategoría.');
      return;
    }
    if (!editCategoryId) {
      alert('Por favor seleccione una categoría padre.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const numericId = editingSubcategory.id.replace('SUB-', '');

    const formData = new FormData();
    formData.append('_method', 'PUT'); // Spoof method for Laravel file-uploads
    formData.append('name', editName);
    formData.append('category_id', editCategoryId);
    formData.append('description', editDesc || '');
    if (editImgFile) {
      formData.append('image', editImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/subcategories/${numericId}`, {
        method: 'POST', // POST method spoofing PUT
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
        throw new Error(data.message || 'Error al actualizar la subcategoría.');
      }

      const updated = data.data;
      const updatedList = subcategories.map(sub => {
        if (sub.id === editingSubcategory.id) {
          return {
            ...sub,
            name: updated.name,
            description: updated.description || '',
            category_id: updated.category_id,
            category_name: updated.category_name || categories.find(c => c.id === parseInt(editCategoryId))?.name || 'Categoría',
            image: updated.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120'
          };
        }
        return sub;
      });

      setSubcategories(updatedList);
      closeEditModal();

    } catch (err) {
      alert(err.message || 'Error de conexión al intentar actualizar la subcategoría.');
    }
  };

  // Filter subcategories by search bar query
  const filteredSubcategories = subcategories.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubcategories = filteredSubcategories.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>
      
      {/* 1. SIDEBAR (Navigation Left Pane - Subcategories is active) */}
      <Sidebar activeTab="subcategories" />
      
      {/* Style tags for main layout responsiveness */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
          .dashboard-split-row { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* 2. MAIN APP CONTAINER (Header + Content Scroll Pane) */}
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
                placeholder="Buscar..."
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
        
        {/* HEADER */}
        

        {/* TITLE AND CREATE NEW SUBCATEGORY BUTTON */}
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
              Gestión de Subcategorías
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Gestione subclasificaciones específicas y asocie repuestos a sus categorías padre correspondientes.
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
            Crear subcategoría
          </button>
        </div>

        {/* DATA CONTAINER */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          
          {loading ? (
            <div style={{ padding: '80px 40px', textAlign: 'center', color: '#64748b' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #cbd5e1',
                borderTopColor: '#e21a22',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px auto'
              }} />
              <span>Cargando subcategorías...</span>
            </div>
          ) : (
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
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CATEGORÍA PADRE</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>DESCRIPCIÓN</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                    <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubcategories.length > 0 ? (
                    paginatedSubcategories.map((sub) => (
                      <tr
                        key={sub.id}
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff'
                        }}
                        className="table-row-hover"
                      >
                        {/* Image */}
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            backgroundImage: `url(${sub.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid #e2e8f0'
                          }} />
                        </td>

                        {/* Name */}
                        <td style={{ padding: '20px 24px', fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                          {sub.name}
                        </td>

                        {/* Parent Category */}
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#1e40af',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {sub.category_name}
                          </span>
                        </td>

                        {/* Description */}
                        <td style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', lineHeight: '1.4', maxWidth: '300px' }}>
                          {sub.description || <em style={{ color: '#cbd5e1' }}>Sin descripción</em>}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            fontWeight: '800',
                            letterSpacing: '0.2px',
                            color: '#10b981'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981'
                            }}></span>
                            OPERATIVO
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', color: '#64748b' }}>
                            <button
                              onClick={() => openEditModal(sub)}
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
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron subcategorías que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <style dangerouslySetInnerHTML={{
                __html: `
                .table-row-hover:hover {
                  background-color: #f8fafc !important;
                }
              `}} />
            </div>
          )}

          {/* TABLE FOOTER / PAGINATION */}
          {!loading && (
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
                Mostrando <strong style={{ color: '#1e293b' }}>{filteredSubcategories.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredSubcategories.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredSubcategories.length}</strong> subcategorías
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
          )}
        </div>

      </div>

      {/* 3. MODAL POPUP (Crear nueva subcategoría) */}
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
          padding: '16px'
        }}>
          
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-premium)',
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
                Crear Nueva Subcategoría
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Ingrese los detalles para clasificar repuestos en un subgrupo de inventario.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateSubcategory}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Parent Category selector dropdown */}
                <div className="input-group">
                  <label htmlFor="sub-cat-parent" className="input-label">
                    Categoría Padre *
                  </label>
                  <select
                    id="sub-cat-parent"
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="input-control"
                    style={{ padding: '10px 12px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    required
                  >
                    <option value="">Seleccione una categoría...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Name */}
                <div className="input-group">
                  <label htmlFor="sub-cat-name" className="input-label">
                    Nombre de la subcategoría *
                  </label>
                  <input
                    id="sub-cat-name"
                    type="text"
                    placeholder="Ej. Brocas de tungsteno"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="sub-cat-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="sub-cat-desc"
                    placeholder="Ej. Accesorios de perforación y corte de alto rendimiento."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
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
                    id="sub-img"
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
                              fileInputRef.current.value = '';
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
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
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
                  Guardar subcategoría
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 4. EDIT POPUP (Editar subcategoría) */}
      {editingSubcategory && (
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
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-premium)',
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
                Editar Subcategoría
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Actualice los detalles de la subcategoría seleccionada.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleUpdateSubcategory}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Parent Category selector dropdown */}
                <div className="input-group">
                  <label htmlFor="edit-sub-cat-parent" className="input-label">
                    Categoría Padre *
                  </label>
                  <select
                    id="edit-sub-cat-parent"
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="input-control"
                    style={{ padding: '10px 12px', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    required
                  >
                    <option value="">Seleccione una categoría...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Name */}
                <div className="input-group">
                  <label htmlFor="edit-sub-cat-name" className="input-label">
                    Nombre de la subcategoría *
                  </label>
                  <input
                    id="edit-sub-cat-name"
                    type="text"
                    placeholder="Ej. Brocas de tungsteno"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="edit-sub-cat-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="edit-sub-cat-desc"
                    placeholder="Ej. Accesorios de perforación y corte de alto rendimiento."
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
                    id="edit-sub-img"
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
                              editFileInputRef.current.value = '';
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
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
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
      </div>
  );
};

export default Subcategories;
