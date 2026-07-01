import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Grid, Folder, User, CheckCircle2, AlertTriangle,
  XCircle, Filter, Trash2, Edit2, UploadCloud, Layers, Car
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Brands = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('brands');
    const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating a new brand
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsActive, setNewIsActive] = useState('1'); // '1' = Active, '0' = Inactive
  const [newImgFile, setNewImgFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form states for editing an existing brand
  const [editingBrand, setEditingBrand] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsActive, setEditIsActive] = useState('1');
  const [editImgFile, setEditImgFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const editFileInputRef = useRef(null);
  const [isEditDragging, setIsEditDragging] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data lists
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to close modal and reset fields
  const closeModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setNewLocation('');
    setNewDesc('');
    setNewIsActive('1');
    setNewImgFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Helper to open edit modal
  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setEditName(brand.name);
    setEditLocation(brand.location || '');
    setEditDesc(brand.description || '');
    setEditIsActive(brand.is_active ? '1' : '0');
    setEditImgFile(null);
    setEditPreviewUrl(brand.image);
  };

  // Helper to close edit modal and reset fields
  const closeEditModal = () => {
    setEditingBrand(null);
    setEditName('');
    setEditLocation('');
    setEditDesc('');
    setEditIsActive('1');
    setEditImgFile(null);
    if (editPreviewUrl && editPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditPreviewUrl(null);
  };

  // Fetch brands from Laravel API on mount
  useEffect(() => {
    const fetchBrands = async () => {
      const token = localStorage.getItem('kayparts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      try {
        const response = await fetch(`${apiUrl}/brands`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        if (response.ok && data.data) {
          const mapped = data.data.map(brand => ({
            id: `BRD-${brand.id}`,
            image: brand.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=120',
            name: brand.name,
            description: brand.description || '',
            location: brand.location || '',
            is_active: brand.is_active === 1 || brand.is_active === true || brand.is_active === '1'
          }));
          setBrands(mapped);
        }
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle creating a brand (Multipart API upload)
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Por favor ingrese el nombre de la marca.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('location', newLocation || '');
    formData.append('description', newDesc || '');
    formData.append('is_active', newIsActive);
    if (newImgFile) {
      formData.append('image', newImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/brands`, {
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
        throw new Error(data.message || 'Error al crear la marca.');
      }

      const createdBrand = data.data;

      const newBrand = {
        id: `BRD-${createdBrand.id}`,
        image: createdBrand.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=120',
        name: createdBrand.name,
        description: createdBrand.description || '',
        location: createdBrand.location || '',
        is_active: createdBrand.is_active === 1 || createdBrand.is_active === true || createdBrand.is_active === '1'
      };

      setBrands([newBrand, ...brands]);
      closeModal();

    } catch (err) {
      alert(err.message || 'Error de conexión al intentar crear la marca.');
    }
  };

  // Handle updating a brand (Multipart API upload with PUT spoofing)
  const handleUpdateBrand = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Por favor ingrese el nombre de la marca.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const numericId = editingBrand.id.replace('BRD-', '');

    const formData = new FormData();
    formData.append('_method', 'PUT'); // Spoof PUT method for Laravel file uploads
    formData.append('name', editName);
    formData.append('location', editLocation || '');
    formData.append('description', editDesc || '');
    formData.append('is_active', editIsActive);
    if (editImgFile) {
      formData.append('image', editImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/brands/${numericId}`, {
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
        throw new Error(data.message || 'Error al actualizar la marca.');
      }

      const updatedBrand = data.data;

      const updatedList = brands.map(b => {
        if (b.id === editingBrand.id) {
          return {
            ...b,
            name: updatedBrand.name,
            description: updatedBrand.description || '',
            location: updatedBrand.location || '',
            image: updatedBrand.image_url || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=120',
            is_active: updatedBrand.is_active === 1 || updatedBrand.is_active === true || updatedBrand.is_active === '1'
          };
        }
        return b;
      });

      setBrands(updatedList);
      closeEditModal();

    } catch (err) {
      alert(err.message || 'Error de conexión al intentar actualizar la marca.');
    }
  };

  // Client-side search filtering
  const filteredBrands = brands.filter(brand => 
    (brand.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (brand.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination logic
  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBrands = filteredBrands.slice(startIndex, endIndex);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR (Navigation Left Pane) */}
      <Sidebar activeTab="brands" />
      
      {/* Style tags for main layout responsiveness */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
          .dashboard-split-row { grid-template-columns: 1fr !important; }
        }
      `}} />

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
        

        {/* TITLE AND CREATE NEW BRAND BUTTON */}
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
              Gestión de Marcas de Vehículos
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Gestione las marcas y fabricantes de automotores del catálogo.
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
            Crear marca
          </button>
        </div>

        {/* BRANDS TABLE LIST */}
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
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ORIGEN / PROCEDENCIA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Cargando marcas...
                    </td>
                  </tr>
                ) : paginatedBrands.length > 0 ? (
                  paginatedBrands.map((brand) => (
                    <tr
                      key={brand.id}
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
                          backgroundImage: `url(${brand.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid #e2e8f0'
                        }} />
                      </td>

                      {/* Name column */}
                      <td style={{ padding: '20px 24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                          {brand.name}
                        </h4>
                      </td>

                      {/* Origin / Location column */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                        {brand.location || 'Sin especificar'}
                      </td>

                      {/* Description column */}
                      <td style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', lineHeight: '1.4', maxWidth: '300px' }}>
                        {brand.description || 'Sin descripción'}
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
                          color: brand.is_active ? '#10b981' : '#ef4444'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: brand.is_active ? '#10b981' : '#ef4444'
                          }}></span>
                          {brand.is_active ? 'ACTIVO' : 'INACTIVO'}
                        </div>
                      </td>

                      {/* Actions column */}
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', color: '#64748b' }}>
                          <button
                            onClick={() => openEditModal(brand)}
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
                      No se encontraron marcas que coincidan con la búsqueda.
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
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredBrands.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredBrands.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredBrands.length}</strong> marcas
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

      {/* 3. MODAL POPUP (Crear nueva marca) */}
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
                Crear Nueva Marca
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Ingrese los detalles del nuevo fabricante de vehículos.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateBrand}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Brand Name */}
                <div className="input-group">
                  <label htmlFor="brand-name" className="input-label">
                    Nombre de la marca *
                  </label>
                  <input
                    id="brand-name"
                    type="text"
                    placeholder="Ej. Chevrolet"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Brand Origin / Location */}
                <div className="input-group">
                  <label htmlFor="brand-location" className="input-label">
                    Origen / Procedencia
                  </label>
                  <input
                    id="brand-location"
                    type="text"
                    placeholder="Ej. Estados Unidos"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="input-control"
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="brand-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="brand-desc"
                    placeholder="Ej. Fabricante de vehículos con amplia presencia en el mercado nacional..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="input-control"
                    rows="3"
                    style={{ resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                {/* State selector */}
                <div className="input-group">
                  <label htmlFor="brand-status" className="input-label">
                    Estado *
                  </label>
                  <select
                    id="brand-status"
                    value={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.value)}
                    className="input-control"
                    required
                  >
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>

                {/* Image upload selector (Dropzone style) */}
                <div className="input-group">
                  <label className="input-label">
                    Subir imagen de la marca
                  </label>
                  
                  {/* Hidden input file */}
                  <input
                    id="brand-img"
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
                  Guardar marca
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
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
                Editar Marca de Vehículo
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Actualice los detalles de la marca seleccionada.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleUpdateBrand}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}>
                {/* Brand Name */}
                <div className="input-group">
                  <label htmlFor="edit-brand-name" className="input-label">
                    Nombre de la marca *
                  </label>
                  <input
                    id="edit-brand-name"
                    type="text"
                    placeholder="Ej. Chevrolet"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Origin / Location */}
                <div className="input-group">
                  <label htmlFor="edit-brand-location" className="input-label">
                    Origen / Procedencia
                  </label>
                  <input
                    id="edit-brand-location"
                    type="text"
                    placeholder="Ej. Estados Unidos"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="input-control"
                  />
                </div>

                {/* Description */}
                <div className="input-group">
                  <label htmlFor="edit-brand-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="edit-brand-desc"
                    placeholder="Ej. Detalle del fabricante..."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="input-control"
                    rows="3"
                    style={{ resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                {/* State selector */}
                <div className="input-group">
                  <label htmlFor="edit-brand-status" className="input-label">
                    Estado *
                  </label>
                  <select
                    id="edit-brand-status"
                    value={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.value)}
                    className="input-control"
                    required
                  >
                    <option value="1">Activo</option>
                    <option value="0">Inactivo</option>
                  </select>
                </div>

                {/* Image upload selector (Dropzone style) */}
                <div className="input-group">
                  <label className="input-label">
                    Subir imagen de la marca
                  </label>
                  
                  {/* Hidden input file */}
                  <input
                    id="edit-brand-img"
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
      </div>
  );
};

export default Brands;
