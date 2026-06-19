import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Trash2, Edit2, UploadCloud, Info, Package, Star, ArrowRight, X
} from 'lucide-react';
import Sidebar from './Sidebar';
import Swal from 'sweetalert2';

const Products = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  // Profile dropdown and search states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalError, setModalError] = useState('');
  
  // Sub-tabs inside the Create/Edit modal
  // Options: 'general', 'technical', 'compatibility', 'images'
  const [activeFormTab, setActiveFormTab] = useState('general');

  // Master lists loaded from backend
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [productBrands, setProductBrands] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [vehicleYears, setVehicleYears] = useState([]);
  const [vehicleDisplacements, setVehicleDisplacements] = useState([]);
  const [taxes, setTaxes] = useState([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Local search inside the multi-select models list
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Form inputs state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    brand_id: '',
    category_id: '',
    subcategory_id: '',
    status: 'active', // active, inactive, draft
    condition: 'new', // new, used, refurbished
    spare_type: '', // original, homologado, etc.
    position: '', // delantero, trasero, etc.
    side: '', // izquierdo, derecho, etc.
    transmission: '', // automatica, manual, etc.
    reference: '', // codigo de fabricante
    is_featured: false
  });

  // Pivot selections
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedDisplacements, setSelectedDisplacements] = useState([]);
  const [selectedTaxes, setSelectedTaxes] = useState([]);

  // Image files to upload (new files)
  // Structure: { file, previewUrl, label: 'OTRA', is_primary: boolean, id: string }
  const [newImageFiles, setNewImageFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Existing images (when editing)
  // Structure: { id, image_url, label, is_principal: boolean }
  const [existingImages, setExistingImages] = useState([]);

  // Fetch all master data on mount
  const fetchMasterData = async () => {
    setLoading(true);
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      // Fetch products list
      const prodRes = await fetch(`${apiUrl}/products?per_page=100`, { headers });
      const prodData = await prodRes.json();
      if (prodRes.ok && prodData.data) {
        setProducts(prodData.data);
      }

      // Fetch categories
      const catRes = await fetch(`${apiUrl}/categories`, { headers });
      const catData = await catRes.json();
      if (catRes.ok && catData.data) {
        setCategories(catData.data);
      }

      // Fetch subcategories
      const subRes = await fetch(`${apiUrl}/subcategories`, { headers });
      const subData = await subRes.json();
      if (subRes.ok && subData.data) {
        setSubcategories(subData.data);
      }

      // Fetch product brands
      const brandRes = await fetch(`${apiUrl}/product-brands`, { headers });
      const brandData = await brandRes.json();
      if (brandRes.ok && brandData.data) {
        setProductBrands(brandData.data);
      }

      // Fetch vehicle models
      const modelRes = await fetch(`${apiUrl}/vehicle-models`, { headers });
      const modelData = await modelRes.json();
      if (modelRes.ok && modelData.data) {
        setVehicleModels(modelData.data);
      }

      // Fetch vehicle years
      const yearRes = await fetch(`${apiUrl}/vehicle-years`, { headers });
      const yearData = await yearRes.json();
      if (yearRes.ok && yearData) {
        setVehicleYears(yearData.data || yearData);
      }

      // Fetch vehicle displacements
      const dispRes = await fetch(`${apiUrl}/vehicle-displacements`, { headers });
      const dispData = await dispRes.json();
      if (dispRes.ok && dispData) {
        setVehicleDisplacements(dispData.data || dispData);
      }

      // Fetch taxes
      const taxRes = await fetch(`${apiUrl}/taxes`, { headers });
      const taxData = await taxRes.json();
      if (taxRes.ok && taxData) {
        setTaxes(taxData.data || taxData);
      }

    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Filter subcategories reactively based on selected category in form
  const filteredSubcategories = subcategories.filter(sub => 
    sub.category_id === parseInt(formData.category_id)
  );

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Form input changes handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Helper to open creation modal
  const openCreateModal = () => {
    setActiveFormTab('general');
    setFormData({
      sku: '',
      name: '',
      description: '',
      price: '',
      stock: '',
      brand_id: '',
      category_id: '',
      subcategory_id: '',
      status: 'active',
      condition: 'new',
      spare_type: '',
      position: '',
      side: '',
      transmission: '',
      reference: '',
      is_featured: false
    });
    setSelectedModels([]);
    setSelectedYears([]);
    setSelectedDisplacements([]);
    setSelectedTaxes([]);
    setNewImageFiles([]);
    setExistingImages([]);
    setModalError('');
    setIsModalOpen(true);
  };

  // Helper to close creation modal and clean resource URLs
  const closeModal = () => {
    setIsModalOpen(false);
    newImageFiles.forEach(img => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setNewImageFiles([]);
    setModalError('');
  };

  // Helper to open edit modal
  const openEditModal = async (product) => {
    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';

    try {
      const response = await fetch(`${apiUrl}/products/${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.data) {
        const fullProduct = data.data;
        setEditingProduct(fullProduct);
        setActiveFormTab('general');
        setFormData({
          sku: fullProduct.sku || '',
          name: fullProduct.name || '',
          description: fullProduct.description || '',
          price: fullProduct.price ? fullProduct.price.toString() : '',
          stock: fullProduct.stock ? fullProduct.stock.toString() : '',
          brand_id: fullProduct.brand_id ? fullProduct.brand_id.toString() : '',
          category_id: fullProduct.category_id ? fullProduct.category_id.toString() : '',
          subcategory_id: fullProduct.subcategory_id ? fullProduct.subcategory_id.toString() : '',
          status: fullProduct.status || 'active',
          condition: fullProduct.condition || 'new',
          spare_type: fullProduct.spare_type || '',
          position: fullProduct.position || '',
          side: fullProduct.side || '',
          transmission: fullProduct.transmission || '',
          reference: fullProduct.reference || '',
          is_featured: !!fullProduct.is_featured
        });

        // Populate pivot arrays (extracting numeric IDs)
        setSelectedModels(fullProduct.vehicleModels ? fullProduct.vehicleModels.map(m => m.id) : (fullProduct.vehicle_models ? fullProduct.vehicle_models.map(m => m.id) : []));
        setSelectedYears(fullProduct.vehicleYears ? fullProduct.vehicleYears.map(y => y.id) : (fullProduct.vehicle_years ? fullProduct.vehicle_years.map(y => y.id) : []));
        setSelectedDisplacements(fullProduct.vehicleDisplacements ? fullProduct.vehicleDisplacements.map(d => d.id) : (fullProduct.vehicle_displacements ? fullProduct.vehicle_displacements.map(d => d.id) : []));
        setSelectedTaxes(fullProduct.taxes ? fullProduct.taxes.map(t => t.id) : []);
        
        // Populate existing images
        setExistingImages(fullProduct.images ? fullProduct.images.map(img => ({
          id: img.id,
          image_url: img.image_url,
          label: img.label || 'OTRA',
          is_principal: !!img.is_primary || !!img.is_principal
        })) : []);

        setNewImageFiles([]);
        setModalError('');
        setIsModalOpen(true); 
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron recuperar los detalles del producto.',
          confirmButtonColor: '#e21a22'
        });
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'Error de conexión al cargar los detalles del producto.',
        confirmButtonColor: '#e21a22'
      });
    }
  };

  // Helper to close edit modal
  const closeEditModal = () => {
    setEditingProduct(null);
    newImageFiles.forEach(img => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setNewImageFiles([]);
    setModalError('');
  };

  // Toggle checks in list arrays
  const handleTogglePivot = (id, targetList, setTargetList) => {
    if (targetList.includes(id)) {
      setTargetList(targetList.filter(item => item !== id));
    } else {
      setTargetList([...targetList, id]);
    }
  };

  // File drop/select handlers for gallery
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (files) => {
    const newItems = Array.from(files).map((file, index) => {
      const id = `${Date.now()}-${index}-${Math.random()}`;
      return {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        label: 'OTRA',
        // Set first new image as primary if there are no existing images and no other primary in queue
        is_primary: newImageFiles.length === 0 && existingImages.filter(img => img.is_principal).length === 0 && index === 0
      };
    });
    setNewImageFiles(prev => [...prev, ...newItems]);
  };

  const removeNewFile = (id) => {
    const item = newImageFiles.find(img => img.id === id);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setNewImageFiles(prev => prev.filter(img => img.id !== id));
  };

  const handleNewFileLabelChange = (id, val) => {
    setNewImageFiles(prev => prev.map(img => 
      img.id === id ? { ...img, label: val } : img
    ));
  };

  const setNewFileAsPrimary = (id) => {
    // Reset other primary flags in queue and database preview list
    setNewImageFiles(prev => prev.map(img => 
      img.id === id ? { ...img, is_primary: true } : { ...img, is_primary: false }
    ));
    setExistingImages(prev => prev.map(img => ({
      ...img,
      is_principal: false
    })));
  };

  const setExistingFileAsPrimary = (id) => {
    // Set an existing database image as primary
    setExistingImages(prev => prev.map(img => 
      img.id === id ? { ...img, is_principal: true } : { ...img, is_principal: false }
    ));
    // Reset all new upload primary flags
    setNewImageFiles(prev => prev.map(img => ({
      ...img,
      is_primary: false
    })));
  };

  // Submit Product creation / update
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.sku.trim()) {
      setModalError('Por favor ingrese el código SKU del producto.');
      return;
    }
    if (!formData.name.trim()) {
      setModalError('Por favor ingrese el nombre del producto.');
      return;
    }
    if (!formData.price || isNaN(formData.price)) {
      setModalError('Por favor ingrese un precio numérico válido.');
      return;
    }
    if (!formData.stock || isNaN(formData.stock)) {
      setModalError('Por favor ingrese una cantidad de stock válida.');
      return;
    }
    if (!formData.category_id) {
      setModalError('Por favor seleccione la categoría del producto.');
      return;
    }

    const token = localStorage.getItem('kayparts_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.kayparts.co/api';
    const isEdit = !!editingProduct;
    
    const url = isEdit ? `${apiUrl}/products/${editingProduct.id}` : `${apiUrl}/products`;

    // Construct FormData
    const bodyFormData = new FormData();
    
    // Method Spoofing if editing
    if (isEdit) {
      bodyFormData.append('_method', 'PUT');
    }

    // Append text fields
    bodyFormData.append('sku', formData.sku.trim());
    bodyFormData.append('name', formData.name.trim());
    bodyFormData.append('description', formData.description || '');
    bodyFormData.append('price', parseFloat(formData.price));
    bodyFormData.append('stock', parseInt(formData.stock));
    bodyFormData.append('status', formData.status);
    bodyFormData.append('condition', formData.condition);
    bodyFormData.append('is_featured', formData.is_featured ? '1' : '0');
    
    if (formData.brand_id) bodyFormData.append('brand_id', formData.brand_id);
    if (formData.category_id) bodyFormData.append('category_id', formData.category_id);
    if (formData.subcategory_id) bodyFormData.append('subcategory_id', formData.subcategory_id);
    
    bodyFormData.append('spare_type', formData.spare_type || '');
    bodyFormData.append('position', formData.position || '');
    bodyFormData.append('side', formData.side || '');
    bodyFormData.append('transmission', formData.transmission || '');
    bodyFormData.append('reference', formData.reference || '');

    // Append relationship lists (JSON encoded arrays)
    bodyFormData.append('model_ids', JSON.stringify(selectedModels));
    bodyFormData.append('vehicle_year_ids', JSON.stringify(selectedYears));
    bodyFormData.append('vehicle_displacement_ids', JSON.stringify(selectedDisplacements));
    bodyFormData.append('tax_ids', JSON.stringify(selectedTaxes));

    // Append new uploaded images
    newImageFiles.forEach((img, idx) => {
      bodyFormData.append('images', img.file);
      bodyFormData.append('image_labels', img.label);
    });

    // Handle primary image index relative to new files uploaded
    const primaryIndexInQueue = newImageFiles.findIndex(img => img.is_primary);
    if (primaryIndexInQueue !== -1) {
      bodyFormData.append('principal_image_index', primaryIndexInQueue);
    } else {
      bodyFormData.append('principal_image_index', -1);
    }

    // Existing primary file id to preserve primary setting if no new file is set as primary
    const existingPrimary = existingImages.find(img => img.is_principal);
    if (existingPrimary) {
      bodyFormData.append('existing_principal_image_id', existingPrimary.id);
    }

    try {
      const response = await fetch(url, {
        method: 'POST', // Method spoofing (POST with _method=PUT) is required for file uploads in PHP
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: bodyFormData
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstField = Object.keys(data.errors)[0];
          if (firstField && data.errors[firstField].length > 0) {
            throw new Error(data.errors[firstField][0]);
          }
        }
        throw new Error(data.message || `Error al ${isEdit ? 'actualizar' : 'crear'} el producto.`);
      }

      // Close modal and reload data
      if (isEdit) {
        closeEditModal();
      } else {
        closeModal();
      }
      
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
        title: `Producto ${isEdit ? 'actualizado' : 'creado'} correctamente.`
      });

      fetchMasterData();

    } catch (err) {
      setModalError(err.message || 'Error al enviar la solicitud al servidor.');
    }
  };

  // Client-side search filters
  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.reference || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Filter vehicle models based on internal search query in tab
  const filteredModels = vehicleModels.filter(m => {
    const brandName = m.brand?.name || '';
    const modelName = m.name || '';
    const full = `${brandName} ${modelName}`.toLowerCase();
    return full.includes(modelSearchQuery.toLowerCase());
  });

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR */}
      <Sidebar activeTab="products" />

      {/* Responsive layout adjustment */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
        }
        .form-tab-btn {
          border: none;
          background: none;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .form-tab-btn.active {
          color: #e21a22;
          border-bottom-color: #e21a22;
        }
        .form-tab-btn:hover:not(.active) {
          color: #0f172a;
          background-color: #f8fafc;
        }
        .checkbox-container-box {
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid #cbd5e1;
          padding: 10px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background-color: #ffffff;
        }
        .checkbox-item-label {
          display: flex;
          alignItems: center;
          gap: 8px;
          font-size: 13px;
          color: #334155;
          cursor: pointer;
          user-select: none;
          padding: 4px 6px;
          border-radius: 4px;
          transition: background-color 0.15s;
        }
        .checkbox-item-label:hover {
          background-color: #f1f5f9;
        }
        .checkbox-item-label input {
          width: 15px;
          height: 15px;
          accent-color: #e21a22;
          cursor: pointer;
        }
        .thumbnail-card {
          position: relative;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .thumbnail-img-box {
          height: 80px;
          border-radius: 6px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          position: relative;
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
                placeholder="Buscar productos por SKU o Nombre..."
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

        {/* TITLE AND CREATE BUTTON */}
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
              Catálogo de Productos
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Gestione los repuestos, componentes mecánicos e inventario general.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="btn btn-primary"
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '6px'
            }}
          >
            <PlusCircle size={16} />
            Crear producto
          </button>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', width: '90px' }}>PORTADA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', width: '120px' }}>SKU</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>PRODUCTO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>CATEGORÍA</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>MARCA PROD.</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>PRECIO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>STOCK</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>ESTADO</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', width: '100px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      Cargando catálogo de productos...
                    </td>
                  </tr>
                ) : paginatedProducts.length > 0 ? (
                  paginatedProducts.map((p) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff'
                      }}
                      className="table-row-hover"
                    >
                      {/* Portada */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          backgroundImage: `url(${p.main_image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=120'})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          border: '1px solid #e2e8f0'
                        }} />
                      </td>

                      {/* SKU */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#475569', fontWeight: '600' }}>
                        {p.sku}
                      </td>

                      {/* Nombre / Ref */}
                      <td style={{ padding: '20px 24px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>
                          {p.name}
                        </h4>
                        {p.reference && (
                          <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            Ref: {p.reference}
                          </span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                        {p.category?.name || 'Sin categoría'}
                      </td>

                      {/* Marca Producto */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                        {p.brand?.name || 'Sin marca'}
                      </td>

                      {/* Precio */}
                      <td style={{ padding: '20px 24px', fontSize: '14px', color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                        ${parseFloat(p.price || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '20px 24px', fontSize: '13px', fontWeight: '600', color: p.stock <= 5 ? '#ef4444' : '#1e293b' }}>
                        {p.stock} unds
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          letterSpacing: '0.2px',
                          color: p.status === 'active' ? '#10b981' : p.status === 'draft' ? '#f59e0b' : '#ef4444'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: p.status === 'active' ? '#10b981' : p.status === 'draft' ? '#f59e0b' : '#ef4444'
                          }}></span>
                          {p.status === 'active' ? 'ACTIVO' : p.status === 'draft' ? 'BORRADOR' : 'INACTIVO'}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <button
                          onClick={() => openEditModal(p)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}
                          title="Editar producto"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                      No se encontraron productos en el catálogo.
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
              Mostrando <strong style={{ color: '#1e293b' }}>{filteredProducts.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredProducts.length)}</strong> de <strong style={{ color: '#1e293b' }}>{filteredProducts.length}</strong> productos
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

      {/* 3. MULTITAB MODAL POPUP (Crear y Editar) */}
      {(isModalOpen || !!editingProduct) && (
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
            maxWidth: '820px',
            maxHeight: '90vh',
            boxShadow: 'var(--shadow-premium)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 12px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 className="title-font" style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#0f172a'
                }}>
                  {editingProduct ? `Editar Producto: ${editingProduct.sku}` : 'Crear Nuevo Producto'}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Complete los campos en las diferentes pestañas técnicas.
                </p>
              </div>
              <button 
                onClick={editingProduct ? closeEditModal : closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div style={{
              display: 'flex',
              padding: '0 24px',
              borderBottom: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              gap: '4px'
            }}>
              <button
                type="button"
                className={`form-tab-btn ${activeFormTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveFormTab('general')}
              >
                1. Info Básica
              </button>
              <button
                type="button"
                className={`form-tab-btn ${activeFormTab === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveFormTab('technical')}
              >
                2. Ficha Técnica
              </button>
              <button
                type="button"
                className={`form-tab-btn ${activeFormTab === 'compatibility' ? 'active' : ''}`}
                onClick={() => setActiveFormTab('compatibility')}
              >
                3. Compatibilidad ({selectedModels.length + selectedYears.length} items)
              </button>
              <button
                type="button"
                className={`form-tab-btn ${activeFormTab === 'images' ? 'active' : ''}`}
                onClick={() => setActiveFormTab('images')}
              >
                4. Impuestos y Fotos ({newImageFiles.length + existingImages.length} fotos)
              </button>
            </div>

            {/* Modal Form content */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* Main scrollable body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                {modalError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    color: '#ef4444',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textAlign: 'left',
                    marginBottom: '20px'
                  }}>
                    {modalError}
                  </div>
                )}

                {/* TAB 1: GENERAL INFO */}
                {activeFormTab === 'general' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* SKU */}
                    <div className="input-group">
                      <label htmlFor="prod-sku" className="input-label">Código SKU *</label>
                      <input
                        id="prod-sku"
                        name="sku"
                        type="text"
                        placeholder="Ej. KP-8947-SH"
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="input-control"
                        required
                      />
                    </div>

                    {/* Nombre */}
                    <div className="input-group">
                      <label htmlFor="prod-name" className="input-label">Nombre comercial *</label>
                      <input
                        id="prod-name"
                        name="name"
                        type="text"
                        placeholder="Ej. Bomba de Freno Hidráulica"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input-control"
                        required
                      />
                    </div>

                    {/* Referencia */}
                    <div className="input-group">
                      <label htmlFor="prod-ref" className="input-label">Referencia fabricante</label>
                      <input
                        id="prod-ref"
                        name="reference"
                        type="text"
                        placeholder="Ej. 191201-B"
                        value={formData.reference}
                        onChange={handleInputChange}
                        className="input-control"
                      />
                    </div>

                    {/* Precio */}
                    <div className="input-group">
                      <label htmlFor="prod-price" className="input-label">Precio base *</label>
                      <input
                        id="prod-price"
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 150000"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="input-control"
                        required
                      />
                    </div>

                    {/* Stock */}
                    <div className="input-group">
                      <label htmlFor="prod-stock" className="input-label">Unidades en stock *</label>
                      <input
                        id="prod-stock"
                        name="stock"
                        type="number"
                        placeholder="Ej. 24"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className="input-control"
                        required
                      />
                    </div>

                    {/* Marca de producto */}
                    <div className="input-group">
                      <label htmlFor="prod-brand" className="input-label">Marca fabricante (Catálogo)</label>
                      <select
                        id="prod-brand"
                        name="brand_id"
                        value={formData.brand_id}
                        onChange={handleInputChange}
                        className="input-control"
                      >
                        <option value="">-- Ninguna / Genérica --</option>
                        {productBrands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Categoría */}
                    <div className="input-group">
                      <label htmlFor="prod-category" className="input-label">Categoría principal *</label>
                      <select
                        id="prod-category"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="input-control"
                        required
                      >
                        <option value="">-- Seleccione categoría --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategoría */}
                    <div className="input-group">
                      <label htmlFor="prod-subcat" className="input-label">Subcategoría asociada</label>
                      <select
                        id="prod-subcat"
                        name="subcategory_id"
                        value={formData.subcategory_id}
                        onChange={handleInputChange}
                        className="input-control"
                        disabled={!formData.category_id}
                      >
                        <option value="">-- Ninguna --</option>
                        {filteredSubcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Condición */}
                    <div className="input-group">
                      <label htmlFor="prod-condition" className="input-label">Condición física</label>
                      <select
                        id="prod-condition"
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        className="input-control"
                      >
                        <option value="new">Nuevo (Garantizado)</option>
                        <option value="used">Usado (De despiece)</option>
                        <option value="refurbished">Reconstruido (Refurbished)</option>
                      </select>
                    </div>

                    {/* Estado */}
                    <div className="input-group">
                      <label htmlFor="prod-status" className="input-label">Estado de publicación</label>
                      <select
                        id="prod-status"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="input-control"
                      >
                        <option value="active">Activo (Visible en tienda)</option>
                        <option value="inactive">Inactivo (Desactivado)</option>
                        <option value="draft">Borrador (Edición preliminar)</option>
                      </select>
                    </div>

                    {/* Destacado */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
                      <input
                        id="prod-featured"
                        name="is_featured"
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={handleInputChange}
                        style={{ width: '18px', height: '18px', accentColor: '#e21a22', cursor: 'pointer' }}
                      />
                      <label htmlFor="prod-featured" style={{ fontSize: '13px', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
                        Destacar producto (Aparece en ofertas y recomendados en portada)
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: TECHNICAL DETAILS */}
                {activeFormTab === 'technical' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Spare Type */}
                      <div className="input-group">
                        <label htmlFor="prod-spare" className="input-label">Tipo de repuesto</label>
                        <input
                          id="prod-spare"
                          name="spare_type"
                          type="text"
                          placeholder="Ej. Original, Homologado, Genérico"
                          value={formData.spare_type}
                          onChange={handleInputChange}
                          className="input-control"
                        />
                      </div>

                      {/* Position */}
                      <div className="input-group">
                        <label htmlFor="prod-position" className="input-label">Posición mecánica</label>
                        <input
                          id="prod-position"
                          name="position"
                          type="text"
                          placeholder="Ej. Delantero, Trasero, N/A"
                          value={formData.position}
                          onChange={handleInputChange}
                          className="input-control"
                        />
                      </div>

                      {/* Side */}
                      <div className="input-group">
                        <label htmlFor="prod-side" className="input-label">Lado del vehículo</label>
                        <input
                          id="prod-side"
                          name="side"
                          type="text"
                          placeholder="Ej. Izquierdo, Derecho, Ambos"
                          value={formData.side}
                          onChange={handleInputChange}
                          className="input-control"
                        />
                      </div>

                      {/* Transmission */}
                      <div className="input-group">
                        <label htmlFor="prod-trans" className="input-label">Tipo de transmisión compatible</label>
                        <input
                          id="prod-trans"
                          name="transmission"
                          type="text"
                          placeholder="Ej. Automática, Mecánica, Ambos"
                          value={formData.transmission}
                          onChange={handleInputChange}
                          className="input-control"
                        />
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="input-group">
                      <label htmlFor="prod-desc" className="input-label">Descripción técnica comercial</label>
                      <textarea
                        id="prod-desc"
                        name="description"
                        rows="5"
                        placeholder="Describa el repuesto detallando dimensiones, materiales, compatibilidades específicas o recomendaciones..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="input-control"
                        style={{ fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: VEHICLE COMPATIBILITY */}
                {activeFormTab === 'compatibility' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Models selection (with search) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                          Modelos de Vehículos Compatibles *
                        </span>
                        <div style={{ position: 'relative', width: '220px' }}>
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="text"
                            placeholder="Buscar modelo..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px 6px 28px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="checkbox-container-box">
                        {filteredModels.length > 0 ? (
                          filteredModels.map(m => {
                            const isChecked = selectedModels.includes(m.id);
                            return (
                              <label
                                key={m.id}
                                className="checkbox-item-label"
                                style={{
                                  backgroundColor: isChecked ? '#e2e8f0' : '#f8fafc',
                                  color: isChecked ? '#0f172a' : '#94a3b8',
                                  fontWeight: isChecked ? '700' : '450',
                                  border: isChecked ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePivot(m.id, selectedModels, setSelectedModels)}
                                  style={{
                                    accentColor: '#e21a22',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span style={{ color: isChecked ? '#0f172a' : '#94a3b8' }}>{m.brand?.name || 'Vehículo'}</span>
                                <span style={{ color: isChecked ? '#475569' : '#cbd5e1', fontSize: '12px' }}>{m.name}</span>
                              </label>
                            );
                          })
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                            No se encontraron modelos.
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                        Seleccionados: {selectedModels.length} modelos de vehículo.
                      </span>
                    </div>

                    {/* Years & Displacements row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      
                      {/* Years compatibility */}
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                          Años de Compatibilidad
                        </span>
                        <div className="checkbox-container-box" style={{ maxHeight: '150px' }}>
                          {vehicleYears.map(y => {
                            const isChecked = selectedYears.includes(y.id);
                            return (
                              <label
                                key={y.id}
                                className="checkbox-item-label"
                                style={{
                                  backgroundColor: isChecked ? '#e2e8f0' : '#f8fafc',
                                  color: isChecked ? '#0f172a' : '#94a3b8',
                                  fontWeight: isChecked ? '700' : '450',
                                  border: isChecked ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePivot(y.id, selectedYears, setSelectedYears)}
                                  style={{
                                    accentColor: '#e21a22',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{y.year}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Displacements compatibility */}
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                          Cilindrajes / Cilindradas
                        </span>
                        <div className="checkbox-container-box" style={{ maxHeight: '150px' }}>
                          {vehicleDisplacements.map(d => {
                            const isChecked = selectedDisplacements.includes(d.id);
                            return (
                              <label
                                key={d.id}
                                className="checkbox-item-label"
                                style={{
                                  backgroundColor: isChecked ? '#e2e8f0' : '#f8fafc',
                                  color: isChecked ? '#0f172a' : '#94a3b8',
                                  fontWeight: isChecked ? '700' : '450',
                                  border: isChecked ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePivot(d.id, selectedDisplacements, setSelectedDisplacements)}
                                  style={{
                                    accentColor: '#e21a22',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span>{d.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* TAB 4: TAXES & GALLERY */}
                {activeFormTab === 'images' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Taxes selection */}
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                        Impuestos Aplicables (IVA / Tasas)
                      </span>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {taxes.map(t => (
                          <label 
                            key={t.id} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: '#f1f5f9',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: selectedTaxes.includes(t.id) ? '1.5px solid #e21a22' : '1.5px solid transparent'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTaxes.includes(t.id)}
                              onChange={() => handleTogglePivot(t.id, selectedTaxes, setSelectedTaxes)}
                              style={{ width: '16px', height: '16px', accentColor: '#e21a22', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{t.name}</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Tasa: {parseFloat(t.rate)}%</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Drag and drop gallery uploader */}
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
                        Galería de Fotos del Producto
                      </span>

                      {/* Dropzone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        style={{
                          border: isDragging ? '2px dashed #E31B23' : '2px dashed #cbd5e1',
                          backgroundColor: isDragging ? '#fef2f2' : '#f8fafc',
                          padding: '30px',
                          borderRadius: '12px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px'
                        }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                        <UploadCloud size={32} style={{ color: isDragging ? '#E31B23' : '#64748b' }} />
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                            Arrastre y suelte múltiples imágenes aquí
                          </p>
                          <p style={{ fontSize: '12px', color: '#64748b' }}>
                            o haga clic para examinar archivos locales (formatos JPG, PNG, WEBP)
                          </p>
                        </div>
                      </div>

                      {/* Images Preview Grid (Existing + New Files) */}
                      {(existingImages.length > 0 || newImageFiles.length > 0) && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: '16px',
                          marginTop: '20px'
                        }}>
                          
                          {/* 1. Render Existing Images */}
                          {existingImages.map((img) => (
                            <div key={`existing-${img.id}`} className="thumbnail-card" style={{
                              borderColor: img.is_principal ? '#e21a22' : '#cbd5e1',
                              backgroundColor: img.is_principal ? '#fef2f2' : '#ffffff'
                            }}>
                              <div className="thumbnail-img-box" style={{ backgroundImage: `url(${img.image_url})` }} />
                              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textAlign: 'center', backgroundColor: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>
                                Guardada: {img.label}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setExistingFileAsPrimary(img.id)}
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    color: img.is_principal ? '#e21a22' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}
                                >
                                  <Star size={12} fill={img.is_principal ? '#e21a22' : 'none'} />
                                  {img.is_principal ? 'Portada' : 'Portada'}
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* 2. Render New Uploads */}
                          {newImageFiles.map((img) => (
                            <div key={`new-${img.id}`} className="thumbnail-card" style={{
                              borderColor: img.is_primary ? '#e21a22' : '#cbd5e1',
                              backgroundColor: img.is_primary ? '#fef2f2' : '#ffffff'
                            }}>
                              <div className="thumbnail-img-box" style={{ backgroundImage: `url(${img.previewUrl})` }}>
                                <button
                                  type="button"
                                  onClick={() => removeNewFile(img.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#ef4444'
                                  }}
                                  title="Remover imagen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {/* Label Input */}
                              <input
                                type="text"
                                placeholder="Etiqueta (ej. Portada)"
                                value={img.label}
                                onChange={(e) => handleNewFileLabelChange(img.id, e.target.value)}
                                style={{
                                  padding: '4px 6px',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  outline: 'none'
                                }}
                              />

                              {/* Primary toggle */}
                              <button
                                type="button"
                                onClick={() => setNewFileAsPrimary(img.id)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  color: img.is_primary ? '#e21a22' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: '700'
                                }}
                              >
                                <Star size={12} fill={img.is_primary ? '#e21a22' : 'none'} />
                                {img.is_primary ? 'Portada' : 'Fijar portada'}
                              </button>
                            </div>
                          ))}

                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>

              {/* Modal Actions Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  {activeFormTab !== 'images' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['general', 'technical', 'compatibility', 'images'];
                        const nextIdx = tabs.indexOf(activeFormTab) + 1;
                        setActiveFormTab(tabs[nextIdx]);
                      }}
                      className="btn btn-secondary"
                      style={{
                        padding: '10px 18px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Siguiente pestaña
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Ficha de producto lista
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={editingProduct ? closeEditModal : closeModal}
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px', borderRadius: '6px' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '10px 18px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Package size={14} />
                    {editingProduct ? 'Actualizar producto' : 'Guardar producto'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
