import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      const token = localStorage.getItem('kayparts_token');
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      try {
        const response = await fetch(`${apiUrl}/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok && data && data.data) {
          // Count orders with status 'pending'
          const count = data.data.filter(order => order.status === 'pending').length;
          setPendingCount(count);
        }
      } catch (err) {
        console.error('Error fetching pending orders count:', err);
      }
    };

    fetchPendingOrdersCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingOrdersCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: '0',
      zIndex: 900,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 40px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      width: '100%',
      backdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      flexShrink: 0
    }}>
      {/* Left: Navigation Options */}
      <div style={{ display: 'flex', gap: '30px' }}>
        <button
          onClick={() => navigate('/orders')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            color: '#475569',
            cursor: 'pointer',
            padding: '8px 0',
            borderBottom: '2px solid transparent',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          className="nav-link-hover"
        >
          Pedidos
          {pendingCount > 0 && (
            <span style={{
              backgroundColor: '#e21a22',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '9999px',
              lineHeight: '1',
              display: 'inline-block'
            }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/dispatches')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            color: '#475569',
            cursor: 'pointer',
            padding: '8px 0',
            borderBottom: '2px solid transparent',
            transition: 'all 0.2s'
          }}
          className="nav-link-hover"
        >
          Despachos
        </button>
        <button
          onClick={() => navigate('/products')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            color: '#475569',
            cursor: 'pointer',
            padding: '8px 0',
            borderBottom: '2px solid transparent',
            transition: 'all 0.2s'
          }}
          className="nav-link-hover"
        >
          Productos
        </button>
      </div>

      {/* Right: Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
              Admin
            </span>
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
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              padding: '6px',
              zIndex: 1000
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
      <style dangerouslySetInnerHTML={{ __html: `
        .nav-link-hover:hover {
          color: #e21a22 !important;
        }
      `}} />
    </header>
  );
};

export default Navbar;
