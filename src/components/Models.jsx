import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Trash2, Edit2, UploadCloud, X, ArrowRight
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Swal from 'sweetalert2';
import defaultImage from '../assets/FOTO.png';

const Models = ({ user, onLogout }) => {
  const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');

  // Import catalog state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState('');

  // Form states for creating a new model
  const [newName, setNewName] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  const [newYearFrom, setNewYearFrom] = useState('');
  const [newYearTo, setNewYearTo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIsActive, setNewIsActive] = useState('1');
  const [newImgFile, setNewImgFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form states for editing an existing model
  const [editingModel, setEditingModel] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBrandId, setEditBrandId] = useState('');
  const [editYearFrom, setEditYearFrom] = useState('');
  const [editYearTo, setEditYearTo] = useState('');
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
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to close modal and reset fields
  const closeModal = () => {
    setIsModalOpen(false);
    setNewName('');
    setNewBrandId('');
    setNewYearFrom('');
    setNewYearTo('');
    setNewDesc('');
    setNewIsActive('1');
    setNewImgFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setModalError('');
  };

  // Helper to open edit modal
  const openEditModal = (model) => {
    setEditingModel(model);
    setEditName(model.name);
    setEditBrandId(model.brand_id || '');
    setEditYearFrom(model.year_from || '');
    setEditYearTo(model.year_to || '');
    setEditDesc(model.description || '');
    setEditIsActive(model.is_active ? '1' : '0');
    setEditImgFile(null);
    setEditPreviewUrl(model.image);
    setModalError('');
  };

  // Helper to close edit modal and reset fields
  const closeEditModal = () => {
    setEditingModel(null);
    setEditName('');
    setEditBrandId('');
    setEditYearFrom('');
    setEditYearTo('');
    setEditDesc('');
    setEditIsActive('1');
    setEditImgFile(null);
    if (editPreviewUrl && editPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editPreviewUrl);
    }
    setEditPreviewUrl(null);
    setModalError('');
  };

  const openImportModal = () => {
    setImportFile(null);
    setImporting(false);
    setImportErrors([]);
    setImportSuccessMessage('');
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    setImportErrors([]);
    setImportSuccessMessage('');
  };

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    try {
      const res = await fetch(`${apiUrl}/vehicle-models/import-template`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vehicle_models_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al descargar la plantilla de importación.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar descargar la plantilla.');
    }
  };

  const handleExportBrands = async () => {
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    try {
      const res = await fetch(`${apiUrl}/brands/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marcas_vehiculos_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al exportar el listado de marcas.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al intentar exportar marcas.');
    }
  };

  const handleImportModels = async (e) => {
    e.preventDefault();
    if (!importFile) {
      alert('Por favor seleccione un archivo CSV.');
      return;
    }
    setImporting(true);
    setImportErrors([]);
    setImportSuccessMessage('');
    
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    try {
      const res = await fetch(`${apiUrl}/vehicle-models/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImportSuccessMessage(data.message);
        fetchData();
        if (data.errors && data.errors.length > 0) {
          setImportErrors(data.errors);
        } else {
          setTimeout(() => {
            closeImportModal();
            Swal.fire({
              icon: 'success',
              title: 'Importación Exitosa',
              text: data.message,
              confirmButtonColor: '#e21a22'
            });
          }, 1500);
        }
      } else {
        if (data.errors) {
          setImportErrors(data.errors);
        } else {
          alert(data.message || 'Error al importar los modelos.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al importar modelos.');
    } finally {
      setImporting(false);
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const brandRes = await fetch(`${apiUrl}/brands`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const brandData = await brandRes.json();
      if (brandRes.ok && brandData.data) {
        setBrands(brandData.data);
      }

      const modelRes = await fetch(`${apiUrl}/vehicle-models`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const modelData = await modelRes.json();
      if (modelRes.ok && modelData.data) {
        const mapped = modelData.data.map(m => ({
          id: `MDL-${m.id}`,
          image: m.image_url || defaultImage,
          name: m.name,
          brand_id: m.brand_id,
          brand_name: m.brand?.name || m.brand_name || 'Sin marca',
          year_from: m.year_from || '',
          year_to: m.year_to || '',
          description: m.description || '',
          is_active: m.is_active === 1 || m.is_active === true || m.is_active === '1'
        }));
        setModels(mapped);
      }
    } catch (err) {
      console.error('Error fetching models data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle creating a model (Multipart API upload)
  const handleCreateModel = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setModalError('Por favor ingrese el nombre del modelo.');
      return;
    }
    if (!newBrandId) {
      setModalError('Por favor seleccione una marca.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('brand_id', newBrandId);
    if (newYearFrom) formData.append('year_from', newYearFrom);
    if (newYearTo) formData.append('year_to', newYearTo);
    formData.append('description', newDesc || '');
    formData.append('is_active', newIsActive);
    if (newImgFile) {
      formData.append('image', newImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/vehicle-models`, {
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
        throw new Error(data.message || 'Error al crear el modelo.');
      }

      const created = data.data;

      const newModel = {
        id: `MDL-${created.id}`,
        image: created.image_url || defaultImage,
        name: created.name,
        brand_id: created.brand_id,
        brand_name: brands.find(b => b.id === parseInt(created.brand_id))?.name || created.brand_name || 'Sin marca',
        year_from: created.year_from || '',
        year_to: created.year_to || '',
        description: created.description || '',
        is_active: created.is_active === 1 || created.is_active === true || created.is_active === '1'
      };

      setModels([newModel, ...models]);
      closeModal();

      // Show beautiful success Toast instead of blocking overlay
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
        title: 'Modelo creado correctamente'
      });

    } catch (err) {
      setModalError(err.message || 'Error de conexión al intentar crear el modelo.');
    }
  };

  // Handle updating a model (Multipart API upload with PUT spoofing)
  const handleUpdateModel = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setModalError('Por favor ingrese el nombre del modelo.');
      return;
    }
    if (!editBrandId) {
      setModalError('Por favor seleccione una marca.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const numericId = editingModel.id.replace('MDL-', '');

    const formData = new FormData();
    formData.append('_method', 'PUT'); // Spoof PUT method for Laravel file uploads
    formData.append('name', editName);
    formData.append('brand_id', editBrandId);
    formData.append('year_from', editYearFrom || '');
    formData.append('year_to', editYearTo || '');
    formData.append('description', editDesc || '');
    formData.append('is_active', editIsActive);
    if (editImgFile) {
      formData.append('image', editImgFile);
    }

    try {
      const response = await fetch(`${apiUrl}/vehicle-models/${numericId}`, {
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
        throw new Error(data.message || 'Error al actualizar el modelo.');
      }

      const updated = data.data;

      const updatedList = models.map(m => {
        if (m.id === editingModel.id) {
          return {
            ...m,
            name: updated.name,
            brand_id: updated.brand_id,
            brand_name: brands.find(b => b.id === parseInt(updated.brand_id))?.name || updated.brand_name || 'Sin marca',
            year_from: updated.year_from || '',
            year_to: updated.year_to || '',
            description: updated.description || '',
            image: updated.image_url || defaultImage,
            is_active: updated.is_active === 1 || updated.is_active === true || updated.is_active === '1'
          };
        }
        return m;
      });

      setModels(updatedList);
      closeEditModal();

      // Show beautiful success Toast instead of blocking overlay
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
        title: 'Modelo actualizado correctamente'
      });

    } catch (err) {
      setModalError(err.message || 'Error de conexión al intentar actualizar el modelo.');
    }
  };

  // Client-side search filtering
  const filteredModels = models.filter(m => 
    (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.year_from || '').toString().includes(searchQuery) ||
    (m.year_to || '').toString().includes(searchQuery)
  );

  // Client-side pagination logic
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

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
      <Sidebar activeTab="models" />

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
        
        {/* HEADER BAR */}
        

        {/* TITLE AND CREATE NEW BUTTON */}
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
              Gestión de Modelos de Vehículos
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Gestione los modelos y líneas de automotores del catálogo.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={openImportModal}
              className="btn"
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '700',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              <UploadCloud size={16} />
              Cargar modelos
            </button>

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
              Crear modelo
            </button>
          </div>
        </div>

        {/* TABLE LIST */}
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
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>MARCA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Cargando modelos...
                    </td>
                  </tr>
                ) : paginatedModels.length > 0 ? (
                  paginatedModels.map((model) => (
                    <tr
                      key={model.id}
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
                          backgroundImage: `url(${model.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid #e2e8f0'
                        }} />
                      </td>

                      {/* Name column */}
                      <td style={{ padding: '20px 24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                          {model.name}
                        </h4>
                      </td>

                      {/* Brand column */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                        {model.brand_name}
                      </td>

                      {/* Description column */}
                      <td style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', lineHeight: '1.4', maxWidth: '280px' }}>
                        {model.description || 'Sin descripción'}
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
                          color: model.is_active ? '#10b981' : '#ef4444'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: model.is_active ? '#10b981' : '#ef4444'
                          }}></span>
                          {model.is_active ? 'ACTIVO' : 'INACTIVO'}
                        </div>
                      </td>

                      {/* Actions column */}
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', color: '#64748b' }}>
                          <button
                            onClick={() => openEditModal(model)}
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
                      No se encontraron modelos que coincidan con la búsqueda.
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
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredModels.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredModels.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredModels.length}</strong> modelos
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

      {/* 3. MODAL POPUP (Crear nuevo modelo) */}
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
                Crear Nuevo Modelo
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Ingrese los detalles del nuevo modelo de vehículo.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateModel}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
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
                {/* Model Name */}
                <div className="input-group">
                  <label htmlFor="model-name" className="input-label">
                    Nombre del modelo *
                  </label>
                  <input
                    id="model-name"
                    type="text"
                    placeholder="Ej. Tracker"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Brand selection */}
                <div className="input-group">
                  <label htmlFor="model-brand" className="input-label">
                    Marca asociada *
                  </label>
                  <select
                    id="model-brand"
                    value={newBrandId}
                    onChange={(e) => setNewBrandId(e.target.value)}
                    className="input-control"
                    required
                  >
                    <option value="">Seleccione una marca</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>



                {/* Description */}
                <div className="input-group">
                  <label htmlFor="model-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="model-desc"
                    placeholder="Ej. SUV compacta de tracción delantera..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="input-control"
                    rows="3"
                    style={{ resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                {/* State selector */}
                <div className="input-group">
                  <label htmlFor="model-status" className="input-label">
                    Estado *
                  </label>
                  <select
                    id="model-status"
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
                    Subir imagen de representación
                  </label>
                  
                  {/* Hidden input file */}
                  <input
                    id="model-img"
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
                  Guardar modelo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {editingModel && (
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
                Editar Modelo de Vehículo
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                Actualice los detalles del modelo seleccionado.
              </p>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleUpdateModel}>
              <div style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
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
                {/* Model Name */}
                <div className="input-group">
                  <label htmlFor="edit-model-name" className="input-label">
                    Nombre del modelo *
                  </label>
                  <input
                    id="edit-model-name"
                    type="text"
                    placeholder="Ej. Tracker"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-control"
                    required
                  />
                </div>

                {/* Brand Selection */}
                <div className="input-group">
                  <label htmlFor="edit-model-brand" className="input-label">
                    Marca asociada *
                  </label>
                  <select
                    id="edit-model-brand"
                    value={editBrandId}
                    onChange={(e) => setEditBrandId(e.target.value)}
                    className="input-control"
                    required
                  >
                    <option value="">Seleccione una marca</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>



                {/* Description */}
                <div className="input-group">
                  <label htmlFor="edit-model-desc" className="input-label">
                    Descripción
                  </label>
                  <textarea
                    id="edit-model-desc"
                    placeholder="Ej. Detalle del modelo..."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="input-control"
                    rows="3"
                    style={{ resize: 'none', lineHeight: '1.5' }}
                  />
                </div>

                {/* State Selector */}
                <div className="input-group">
                  <label htmlFor="edit-model-status" className="input-label">
                    Estado *
                  </label>
                  <select
                    id="edit-model-status"
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
                    Subir imagen de representación
                  </label>
                  
                  {/* Hidden input file */}
                  <input
                    id="edit-model-img"
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

      {/* 4. CSV IMPORT MODAL */}
      {isImportModalOpen && (
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
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '750', color: '#0f172a' }}>Importar Modelos desde CSV</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Carga masiva de modelos de vehículos</p>
              </div>
              <button 
                onClick={closeImportModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportModels}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Download Template Section */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>1. Descargue los recursos base</h4>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Descargue la plantilla oficial. También puede exportar el listado de marcas para obtener los IDs correctos (columna brand_id).
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        backgroundColor: '#334155',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <PlusCircle size={14} />
                      Plantilla CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportBrands}
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '6px',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <UploadCloud size={14} />
                      Exportar Marcas
                    </button>
                  </div>
                </div>

                {/* Upload File Input */}
                <div>
                  <label className="input-label" style={{ fontWeight: '700', marginBottom: '8px' }}>2. Seleccione el archivo CSV *</label>
                  <div style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: importFile ? '#f0fdf4' : '#ffffff',
                    borderColor: importFile ? '#22c55e' : '#cbd5e1',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => document.getElementById('csv-model-file-input').click()}
                  >
                    <UploadCloud size={32} style={{ color: importFile ? '#22c55e' : '#94a3b8', margin: '0 auto 8px' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block' }}>
                      {importFile ? importFile.name : 'Haga clic para examinar su equipo'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Solo se admiten archivos .csv estructurados
                    </span>
                    <input
                      id="csv-model-file-input"
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={(e) => setImportFile(e.target.files[0] || null)}
                      required
                    />
                  </div>
                </div>

                {/* Success Message */}
                {importSuccessMessage && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {importSuccessMessage}
                  </div>
                )}

                {/* Error Console */}
                {importErrors.length > 0 && (
                  <div>
                    <label className="input-label" style={{ fontWeight: '700', color: '#b91c1c', marginBottom: '6px' }}>Errores encontrados:</label>
                    <div style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {importErrors.map((err, idx) => (
                        <div key={idx} style={{ fontSize: '11px', color: '#991b1b', fontFamily: 'var(--font-mono)' }}>
                          • {err}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={closeImportModal}
                  className="btn btn-secondary"
                  disabled={importing}
                  style={{ padding: '10px 18px', borderRadius: '6px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={importing || !importFile}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: (importing || !importFile) ? 'not-allowed' : 'pointer',
                    opacity: (importing || !importFile) ? 0.6 : 1
                  }}
                >
                  {importing ? 'Importando...' : 'Iniciar Importación'}
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

export default Models;
