import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  FileText, Edit2, Info, CheckCircle2, XCircle, Trash2, X
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Swal from 'sweetalert2';

const Articles = ({ user, onLogout }) => {
  const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data lists
  const [articles, setArticles] = useState([]);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for Create/Edit
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [readTime, setReadTime] = useState('5 min');
  const [author, setAuthor] = useState('KayParts Tech');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);

  // Edit state tracker
  const [editingArticle, setEditingArticle] = useState(null);

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

  // Fetch articles on mount
  const fetchArticles = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    try {
      const response = await fetch(`${apiUrl}/articles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data) {
        const list = Array.isArray(data) ? data : (data.data || []);
        setArticles(list);
      } else {
        console.error('Error fetching articles:', data);
      }
    } catch (err) {
      console.error('Connection error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Open modal for new article
  const startCreate = () => {
    setEditingArticle(null);
    setTitle('');
    setCategory('');
    setReadTime('5 min');
    setAuthor('KayParts Tech');
    setExcerpt('');
    setContent('');
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Switch to editing mode (and open modal)
  const startEdit = (articleObj) => {
    setEditingArticle(articleObj);
    setTitle(articleObj.title || '');
    setCategory(articleObj.category || '');
    setReadTime(articleObj.read_time || '5 min');
    setAuthor(articleObj.author || 'KayParts Tech');
    setExcerpt(articleObj.excerpt || '');
    setContent(articleObj.content || '');
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Cancel edit mode and close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setTitle('');
    setCategory('');
    setReadTime('5 min');
    setAuthor('KayParts Tech');
    setExcerpt('');
    setContent('');
    setImageFile(null);
    setAlertMsg(null);
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !category.trim() || !content.trim()) {
      showAlert('El título, categoría y contenido son campos obligatorios.', 'error');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    
    const isEdit = !!editingArticle;
    const url = isEdit ? `${apiUrl}/articles/${editingArticle.id}` : `${apiUrl}/articles`;
    
    const form = new FormData();
    if (isEdit) {
      form.append('_method', 'PUT');
    }
    form.append('title', title.trim());
    form.append('category', category.trim());
    form.append('read_time', readTime.trim());
    form.append('author', author.trim());
    form.append('excerpt', excerpt.trim());
    form.append('content', content.trim());
    if (imageFile) {
      form.append('image', imageFile);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: form
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstErrKey = Object.keys(data.errors)[0];
          throw new Error(data.errors[firstErrKey][0]);
        }
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el artículo.`);
      }

      Swal.fire({
        icon: 'success',
        title: `Artículo ${isEdit ? 'actualizado' : 'creado'}`,
        text: `El artículo ha sido ${isEdit ? 'modificado' : 'publicado'} de forma exitosa.`,
        confirmButtonColor: '#e21a22'
      });
      
      closeModal();
      fetchArticles();

    } catch (err) {
      showAlert(err.message || 'Error de conexión con el servidor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete article
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: '¡No podrá revertir esta acción!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e21a22',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('kayparts_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

      try {
        const response = await fetch(`${apiUrl}/articles/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          Swal.fire('¡Eliminado!', 'El artículo ha sido eliminado.', 'success');
          fetchArticles();
        } else {
          Swal.fire('Error', 'No se pudo eliminar el artículo.', 'error');
        }
      } catch (err) {
        Swal.fire('Error de conexión', 'No se pudo comunicar con el servidor.', 'error');
      }
    }
  };

  // Client-side filtering
  const filteredArticles = articles.filter(item => 
    (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.author || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

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
      <Sidebar activeTab="articles" />

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
              Gestión de Noticias y Blog
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Cree, actualice y publique artículos para la sección informativa de Kayparts.
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
            Publicar Artículo
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
              Listado de Artículos
            </span>
            <span style={{
              fontSize: '12px',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontWeight: '600'
            }}>
              {filteredArticles.length} Total
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
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ARTÍCULO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CATEGORÍA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>TIEMPO DE LECTURA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '120px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Cargando artículos...
                    </td>
                  </tr>
                ) : paginatedArticles.length > 0 ? (
                  paginatedArticles.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff'
                      }}
                      className="table-row-hover"
                    >
                      {/* Title & Image */}
                      <td style={{ padding: '20px 24px', fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.image_path ? (
                            <img
                              src={item.image_path.startsWith('http') ? item.image_path : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://127.0.0.1:8000'}/uploads/${item.image_path}`}
                              alt={item.title}
                              style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                            />
                          ) : (
                              <div style={{ width: '44px', height: '44px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={16} style={{ color: '#94a3b8' }} />
                            </div>
                          )}
                          <div>
                            <div>{item.title}</div>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>Por: {item.author || 'KayParts Tech'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {item.category}
                        </span>
                      </td>

                      {/* Read Time */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#475569' }}>
                        {item.read_time || '5 min'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
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
                            title="Editar artículo"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              padding: '6px',
                              borderRadius: '6px',
                              transition: 'var(--transition-fast)'
                            }}
                            className="btn-delete-hover"
                            title="Eliminar artículo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No se encontraron artículos.
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
              .btn-delete-hover:hover {
                background-color: #fee2e2;
                color: #ef4444 !important;
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
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredArticles.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredArticles.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredArticles.length}</strong> registros
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
                {editingArticle ? 'Editar Artículo Informativo' : 'Publicar Nuevo Artículo'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Complete la información básica y el contenido detallado para el blog informativo.
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
              
              {/* Title */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Título del artículo *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Guía de mantenimiento de frenos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-control"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  required
                />
              </div>

              {/* Grid for Category, Author & Read Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Category */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Categoría / Etiqueta *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mecánica, Consejos"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                    required
                  />
                </div>

                {/* Author */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Autor
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                {/* Read Time */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Tiempo de lectura estimado
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 5 min"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="input-control"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
                  />
                </div>

                {/* Image Upload */}
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                    Imagen de portada
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    style={{ fontSize: '13px', color: '#475569', width: '100%' }}
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Resumen corto (Excerpt)
                </label>
                <textarea
                  placeholder="Escriba un breve resumen para la tarjeta informativa..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', minHeight: '60px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Content */}
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  Contenido completo *
                </label>
                <textarea
                  placeholder="Redacte la noticia o entrada del blog aquí..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none', minHeight: '150px', fontFamily: 'inherit' }}
                  required
                />
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
                  <FileText size={14} />
                  {editingArticle ? 'Actualizar' : 'Guardar Artículo'}
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

export default Articles;
