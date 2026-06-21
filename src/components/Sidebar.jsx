import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Folder, Layers, Car, User, PlusCircle, HelpCircle,
  Wrench, Calendar, Gauge, Tag, Percent, Package, ChevronDown, ChevronRight,
  Users, Truck, ClipboardList, PackageCheck
} from 'lucide-react';
import Logo from './Logo';

const Sidebar = ({ activeTab }) => {
  const navigate = useNavigate();

  // Child items under "Productos" submenu
  const productsSubtabs = ['products', 'categories', 'subcategories', 'product-brands', 'brands', 'models', 'years', 'displacements'];
  
  // Collapsible state: initialized to open if the current tab is one of the sub-tabs
  const [isProductsOpen, setIsProductsOpen] = useState(productsSubtabs.includes(activeTab));

  const getButtonStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: isActive ? '#f1f5f9' : 'transparent',
      color: isActive ? '#0f172a' : '#475569',
      fontWeight: isActive ? '700' : '500',
      fontSize: '14px',
      textAlign: 'left',
      transition: 'var(--transition-fast)'
    };
  };

  const getSubButtonStyle = (tabName) => {
    const isActive = activeTab === tabName;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: '100%',
      padding: '8px 12px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      backgroundColor: isActive ? '#f1f5f9' : 'transparent',
      color: isActive ? '#0f172a' : '#64748b',
      fontWeight: isActive ? '700' : '500',
      fontSize: '13px',
      textAlign: 'left',
      transition: 'var(--transition-fast)'
    };
  };

  const isAnyChildActive = productsSubtabs.includes(activeTab);

  const getGroupHeaderStyle = () => {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      color: isAnyChildActive ? '#0f172a' : '#475569',
      fontWeight: isAnyChildActive ? '700' : '550',
      fontSize: '14px',
      textAlign: 'left',
      transition: 'var(--transition-fast)'
    };
  };

  return (
    <aside className="dashboard-sidebar" style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '30px 20px',
      flexShrink: 0
    }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1023px) {
          .dashboard-sidebar { display: none !important; }
        }
        .sidebar-hover-btn:hover {
          background-color: rgba(15, 23, 42, 0.05) !important;
          color: #0f172a !important;
        }
      `}} />

      <div>
        <div style={{ marginBottom: '40px', paddingLeft: '8px' }}>
          <Logo height={42} />
        </div>

        {/* Sidebar Menu Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Panel de Control */}
          <button
            onClick={() => navigate('/dashboard')}
            style={getButtonStyle('dashboard')}
            className={activeTab !== 'dashboard' ? 'sidebar-hover-btn' : ''}
          >
            <Grid size={18} style={{ color: activeTab === 'dashboard' ? '#0f172a' : undefined }} />
            Panel de Control
          </button>

          {/* Pedidos */}
          <button
            onClick={() => navigate('/orders')}
            style={getButtonStyle('orders')}
            className={activeTab !== 'orders' ? 'sidebar-hover-btn' : ''}
          >
            <ClipboardList size={18} style={{ color: activeTab === 'orders' ? '#0f172a' : undefined }} />
            Pedidos
          </button>

          {/* Despachos */}
          <button
            onClick={() => navigate('/dispatches')}
            style={getButtonStyle('dispatches')}
            className={activeTab !== 'dispatches' ? 'sidebar-hover-btn' : ''}
          >
            <PackageCheck size={18} style={{ color: activeTab === 'dispatches' ? '#0f172a' : undefined }} />
            Despachos
          </button>

          {/* Group Header: Productos */}
          <div>
            <button
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              style={getGroupHeaderStyle()}
              className="sidebar-hover-btn"
            >
              <Package size={18} style={{ color: isAnyChildActive ? '#0f172a' : undefined }} />
              <span style={{ flex: 1 }}>Productos</span>
              {isProductsOpen ? (
                <ChevronDown size={14} style={{ color: '#64748b' }} />
              ) : (
                <ChevronRight size={14} style={{ color: '#64748b' }} />
              )}
            </button>

            {/* Collapsible Submenu */}
            {isProductsOpen && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingLeft: '16px',
                marginLeft: '12px',
                borderLeft: '1px solid #cbd5e1',
                marginTop: '4px',
                marginBottom: '4px'
              }}>
                <button
                  onClick={() => navigate('/products')}
                  style={getSubButtonStyle('products')}
                  className={activeTab !== 'products' ? 'sidebar-hover-btn' : ''}
                >
                  <Package size={16} style={{ color: activeTab === 'products' ? '#0f172a' : undefined }} />
                  Catálogo
                </button>

                <button
                  onClick={() => navigate('/categories')}
                  style={getSubButtonStyle('categories')}
                  className={activeTab !== 'categories' ? 'sidebar-hover-btn' : ''}
                >
                  <Folder size={16} style={{ color: activeTab === 'categories' ? '#0f172a' : undefined }} />
                  Categorías
                </button>

                <button
                  onClick={() => navigate('/subcategories')}
                  style={getSubButtonStyle('subcategories')}
                  className={activeTab !== 'subcategories' ? 'sidebar-hover-btn' : ''}
                >
                  <Layers size={16} style={{ color: activeTab === 'subcategories' ? '#0f172a' : undefined }} />
                  Subcategorías
                </button>

                <button
                  onClick={() => navigate('/product-brands')}
                  style={getSubButtonStyle('product-brands')}
                  className={activeTab !== 'product-brands' ? 'sidebar-hover-btn' : ''}
                >
                  <Tag size={16} style={{ color: activeTab === 'product-brands' ? '#0f172a' : undefined }} />
                  Marcas Productos
                </button>

                <button
                  onClick={() => navigate('/brands')}
                  style={getSubButtonStyle('brands')}
                  className={activeTab !== 'brands' ? 'sidebar-hover-btn' : ''}
                >
                  <Car size={16} style={{ color: activeTab === 'brands' ? '#0f172a' : undefined }} />
                  Marcas Vehículos
                </button>

                <button
                  onClick={() => navigate('/models')}
                  style={getSubButtonStyle('models')}
                  className={activeTab !== 'models' ? 'sidebar-hover-btn' : ''}
                >
                  <Wrench size={16} style={{ color: activeTab === 'models' ? '#0f172a' : undefined }} />
                  Modelos
                </button>

                <button
                  onClick={() => navigate('/years')}
                  style={getSubButtonStyle('years')}
                  className={activeTab !== 'years' ? 'sidebar-hover-btn' : ''}
                >
                  <Calendar size={16} style={{ color: activeTab === 'years' ? '#0f172a' : undefined }} />
                  Años
                </button>

                <button
                  onClick={() => navigate('/displacements')}
                  style={getSubButtonStyle('displacements')}
                  className={activeTab !== 'displacements' ? 'sidebar-hover-btn' : ''}
                >
                  <Gauge size={16} style={{ color: activeTab === 'displacements' ? '#0f172a' : undefined }} />
                  Cilindrajes
                </button>
              </div>
            )}
          </div>

          {/* Clientes */}
          <button
            onClick={() => navigate('/clients')}
            style={getButtonStyle('clients')}
            className={activeTab !== 'clients' ? 'sidebar-hover-btn' : ''}
          >
            <Users size={18} style={{ color: activeTab === 'clients' ? '#0f172a' : undefined }} />
            Clientes
          </button>

          {/* Transportadoras */}
          <button
            onClick={() => navigate('/carriers')}
            style={getButtonStyle('carriers')}
            className={activeTab !== 'carriers' ? 'sidebar-hover-btn' : ''}
          >
            <Truck size={18} style={{ color: activeTab === 'carriers' ? '#0f172a' : undefined }} />
            Transportadoras
          </button>

          {/* Impuestos */}
          <button
            onClick={() => navigate('/taxes')}
            style={getButtonStyle('taxes')}
            className={activeTab !== 'taxes' ? 'sidebar-hover-btn' : ''}
          >
            <Percent size={18} style={{ color: activeTab === 'taxes' ? '#0f172a' : undefined }} />
            Impuestos
          </button>

          {/* Perfil */}
          <button
            onClick={() => navigate('/profile')}
            style={getButtonStyle('profile')}
            className={activeTab !== 'profile' ? 'sidebar-hover-btn' : ''}
          >
            <User size={18} style={{ color: activeTab === 'profile' ? '#0f172a' : undefined }} />
            Perfil
          </button>
        </nav>
      </div>

      {/* Bottom Report / Help */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={() => alert('Creando nuevo reporte operacional...')}
          className="btn"
          style={{
            backgroundColor: '#e21a22',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            justifyContent: 'center',
            fontWeight: '600',
            width: '100%'
          }}
        >
          <PlusCircle size={18} />
          Nuevo reporte
        </button>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert('Abriendo el centro de ayuda de Kayparts...'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#475569',
            textDecoration: 'none',
            paddingLeft: '12px',
            fontWeight: '500'
          }}
        >
          <HelpCircle size={16} />
          Centro de ayuda
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
