import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LogOut, ChevronDown, PlusCircle,
  HelpCircle, Grid, Folder, User, CheckCircle2, AlertTriangle,
  XCircle, Filter, FileText, Layers, Car
} from 'lucide-react';
import Logo from './Logo';
import Sidebar from './Sidebar';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartView, setChartView] = useState('weekly'); // 'daily' or 'weekly'
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Sample data for the interactive bar chart
  const weeklyData = [
    { day: 'Lun', val: 50, label: '50%' },
    { day: 'Mar', val: 70, label: '70%' },
    { day: 'Mié', val: 85, label: '85%' },
    { day: 'Jue', val: 60, label: '60%' },
    { day: 'Vie', val: 95, label: '95%' },
    { day: 'Sáb', val: 78, label: '78%' },
    { day: 'Dom', val: 92, label: '92%', highlight: true }
  ];

  const dailyData = [
    { day: '06:00', val: 20, label: '20%' },
    { day: '09:00', val: 45, label: '45%' },
    { day: '12:00', val: 88, label: '88%' },
    { day: '15:00', val: 75, label: '75%' },
    { day: '18:00', val: 90, label: '90%' },
    { day: '21:00', val: 65, label: '65%' },
    { day: '24:00', val: 30, label: '30%', highlight: true }
  ];

  const currentChartData = chartView === 'weekly' ? weeklyData : dailyData;

  // Stock table data
  const stockLevels = [
    {
      sku: 'KP-009421',
      name: 'Sello hidráulico de 40 mm',
      category: 'Sellos y empaquetaduras',
      level: '1.402 unidades',
      status: 'STABLE',
      color: '#10b981'
    },
    {
      sku: 'KP-998124',
      name: 'Juego de brocas de tungsteno',
      category: 'Herramientas de corte',
      level: '12 unidades',
      status: 'CRITICAL',
      color: '#ef4444'
    },
    {
      sku: 'KP-112005',
      name: 'Panel indicador LED',
      category: 'Electrónica',
      level: '452 unidades',
      status: 'RESTOCKING',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f4f6f8',
      fontFamily: 'var(--font-sans)',
      width: '100vw'
    }}>

      {/* 1. SIDEBAR (Navigation Left Pane) */}
      <Sidebar activeTab="dashboard" />

      {/* Style tags for main layout responsiveness */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1023px) {
          .dashboard-main-content { padding: 20px !important; }
          .dashboard-grid-cards { grid-template-columns: 1fr !important; }
          .dashboard-split-row { grid-template-columns: 1fr !important; }
        }
      `}} />


      {/* 2. MAIN APP CONTAINER (Header + Content Scroll Pane) */}
      <div className="dashboard-main-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxHeight: '100vh',
        padding: '30px 40px'
      }}>

        {/* TOP BAR / HEADER */}
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
          {/* Brand Logo & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Logo height={42} />
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
                placeholder="Búsqueda rápida de inventario..."
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

          {/* Navigation Links, Notifications & User Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Nav tabs */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: activeTab === 'dashboard' ? '#e21a22' : '#64748b',
                  borderBottom: activeTab === 'dashboard' ? '2px solid #e21a22' : '2px solid transparent',
                  padding: '8px 0',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                Panel de Control
              </button>
              <button
                onClick={() => { setActiveTab('inventory'); alert('Módulo de Inventario en desarrollo.'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: activeTab === 'inventory' ? '#e21a22' : '#64748b',
                  borderBottom: activeTab === 'inventory' ? '2px solid #e21a22' : '2px solid transparent',
                  padding: '8px 0',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                Inventario
              </button>
              <button
                onClick={() => { setActiveTab('reports'); alert('Módulo de Reportes en desarrollo.'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: activeTab === 'reports' ? '#e21a22' : '#64748b',
                  borderBottom: activeTab === 'reports' ? '2px solid #e21a22' : '2px solid transparent',
                  padding: '8px 0',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                Reportes
              </button>
            </div>

            {/* Separator line */}
            <div style={{ width: '1px', height: '28px', backgroundColor: '#e2e8f0' }} />

            {/* Notification and Setting Quick Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#475569' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => alert('No tiene nuevas notificaciones.')}>
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#e21a22',
                  borderRadius: '50%',
                  border: '2px solid #ffffff'
                }}></span>
              </div>
              <Settings size={20} style={{ cursor: 'pointer' }} onClick={() => alert('Ajustes del sistema.')} />
            </div>

            {/* Profile Dropdown Component */}
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
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
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
                  <style dangerouslySetInnerHTML={{
                    __html: `
                    .dropdown-logout-btn:hover {
                      background-color: #fef2f2 !important;
                    }
                  `}} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* OPERATIONS OVERVIEW TITLE SECTION */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
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
              Resumen de Operaciones
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '450' }}>
              Monitoreo en tiempo real de activos industriales y flujo logístico.
            </p>
          </div>

          {/* System status badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '6px',
            padding: '6px 12px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#22c55e',
              borderRadius: '50%'
            }}></span>
            <span className="mono-font" style={{
              fontSize: '10px',
              fontWeight: '800',
              color: '#16a34a',
              letterSpacing: '1px'
            }}>
              SISTEMA OPERATIVO
            </span>
          </div>
        </div>

        {/* METRICS CARD GRID (3 CARDS) */}
        <div className="dashboard-grid-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '32px'
        }}>

          {/* CARD 1: Total Categories */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Red category icon box */}
              <div style={{
                backgroundColor: 'rgba(226, 26, 34, 0.06)',
                borderRadius: '8px',
                padding: '10px',
                color: '#e21a22'
              }}>
                <Folder size={20} />
              </div>
              <span className="mono-font" style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#22c55e'
              }}>
                ↗ +4.2%
              </span>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
                Total de categorías
              </p>
              <h3 className="mono-font" style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
                1.248
              </h3>
            </div>
            {/* Progress bar container */}
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e2e8f0',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px'
            }}>
              <div style={{ width: '60%', height: '100%', backgroundColor: '#e21a22' }}></div>
            </div>
          </div>

          {/* CARD 2: Active Users */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: 'rgba(226, 26, 34, 0.06)',
                borderRadius: '8px',
                padding: '10px',
                color: '#e21a22'
              }}>
                <User size={20} />
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '550' }}>
                Activo ahora
              </span>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
                Usuarios activos
              </p>
              <h3 className="mono-font" style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
                56
              </h3>
            </div>
            {/* Avatars listing */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
              ].map((img, idx) => (
                <div key={idx} style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  backgroundImage: `url(${img})`,
                  backgroundSize: 'cover',
                  marginLeft: idx === 0 ? '0' : '-8px',
                  zIndex: 3 - idx
                }} />
              ))}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                backgroundColor: '#e21a22',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: '800',
                marginLeft: '-8px',
                zIndex: 0
              }}>
                +53
              </div>
            </div>
          </div>

          {/* CARD 3: System Load */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: 'rgba(226, 26, 34, 0.06)',
                borderRadius: '8px',
                padding: '10px',
                color: '#e21a22'
              }}>
                <FileText size={20} />
              </div>
              <div style={{
                backgroundColor: '#f0fdf4',
                color: '#16a34a',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                99.9% Uptime
              </div>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
                Carga del sistema
              </p>
              <h3 className="mono-font" style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
                24.8%
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Próximo mantenimiento: <strong style={{ color: '#475569' }}>12 de marzo</strong>
            </p>
          </div>
        </div>

        {/* 3. SPLIT PANEL (Industrial Activity Chart + Recent Activities) */}
        <div className="dashboard-split-row" style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>

          {/* COLUMN 1: Industrial Activity Graph */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="title-font" style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                Actividad industrial
              </h3>
              {/* Daily/Weekly filter toggle */}
              <div style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                padding: '3px'
              }}>
                <button
                  onClick={() => setChartView('daily')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: chartView === 'daily' ? '#ffffff' : 'transparent',
                    color: chartView === 'daily' ? '#0f172a' : '#64748b',
                    boxShadow: chartView === 'daily' ? 'var(--shadow-sm)' : 'none',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  Diario
                </button>
                <button
                  onClick={() => setChartView('weekly')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: chartView === 'weekly' ? '#e21a22' : 'transparent',
                    color: chartView === 'weekly' ? '#ffffff' : '#64748b',
                    boxShadow: chartView === 'weekly' ? '0 2px 4px rgba(226,26,34,0.2)' : 'none',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  Semanal
                </button>
              </div>
            </div>

            {/* Custom chart representation */}
            <div style={{
              display: 'flex',
              height: '240px',
              position: 'relative',
              paddingTop: '20px',
              paddingLeft: '36px',
              paddingBottom: '30px'
            }}>
              {/* Y Axis Grid Labels */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: '20px',
                bottom: '30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#94a3b8',
                width: '24px',
                textAlign: 'right'
              }} className="mono-font">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {/* Horizontal grid lines */}
              <div style={{
                position: 'absolute',
                left: '36px',
                right: 0,
                top: '25px',
                bottom: '35px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                zIndex: 0
              }}>
                {[1, 2, 3, 4, 5].map((line) => (
                  <div key={line} style={{
                    width: '100%',
                    borderTop: '1px dashed #e2e8f0'
                  }} />
                ))}
              </div>

              {/* Bars mapping */}
              <div style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'space-around',
                alignItems: 'flex-end',
                zIndex: 1,
                paddingLeft: '10px',
                paddingRight: '10px'
              }}>
                {currentChartData.map((barItem, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    width: '32px'
                  }}>
                    {/* Visual Bar element */}
                    <div
                      style={{
                        width: '100%',
                        height: `${barItem.val}%`,
                        backgroundColor: barItem.highlight ? '#e21a22' : 'rgba(226, 26, 34, 0.12)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                      title={`${barItem.day}: ${barItem.label}`}
                    />

                    {/* X-axis text labels */}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: barItem.highlight ? '#e21a22' : '#64748b',
                      marginTop: '8px',
                      whiteSpace: 'nowrap'
                    }}>
                      {barItem.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Recent Activity List */}
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }}>
            <h3 className="title-font" style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#0f172a',
              padding: '20px 24px 12px 24px'
            }}>
              Actividades recientes
            </h3>

            {/* Scrollable list */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0 24px',
              gap: '18px',
              overflowY: 'auto',
              flex: 1
            }}>

              {/* Activity Item 1 */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'rgba(226, 26, 34, 0.05)',
                  color: '#e21a22',
                  padding: '8px',
                  borderRadius: '50%',
                  flexShrink: 0
                }}>
                  <Folder size={15} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' }}>
                    Llegó nuevo stock: Categoría 'Válvulas mecánicas'
                  </h4>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Recibido por el ID de usuario: 4429
                  </p>
                  <p className="mono-font" style={{ fontSize: '9px', fontWeight: '800', color: '#e21a22', marginTop: '4px' }}>
                    HACE 12 MINUTOS
                  </p>
                </div>
              </div>

              {/* Activity Item 2 */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  color: '#f59e0b',
                  padding: '8px',
                  borderRadius: '50%',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' }}>
                    Alerta de mantenimiento: Bomba del sector D-4
                  </h4>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Temperatura superó el umbral de 85°C
                  </p>
                  <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>
                    HACE 1 HORA
                  </p>
                </div>
              </div>

              {/* Activity Item 3 */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  color: '#10b981',
                  padding: '8px',
                  borderRadius: '50%',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' }}>
                    Sincronización de inventario completa
                  </h4>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Base de datos global actualizada en las 4 sedes.
                  </p>
                  <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>
                    HACE 3 HORAS
                  </p>
                </div>
              </div>

              {/* Activity Item 4 */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  padding: '8px',
                  borderRadius: '50%',
                  flexShrink: 0
                }}>
                  <XCircle size={15} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' }}>
                    Acceso denegado
                  </h4>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Intento no autorizado en la terminal TK-09.
                  </p>
                  <p style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>
                    AYER
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom full width button block */}
            <button
              onClick={() => alert('Cargando historial completo de actividad...')}
              style={{
                width: '100%',
                padding: '16px',
                border: 'none',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#e21a22',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'var(--transition-fast)'
              }}
              className="view-activity-btn"
            >
              Ver toda la actividad
            </button>
            <style dangerouslySetInnerHTML={{
              __html: `
              .view-activity-btn:hover {
                background-color: #f1f5f9 !important;
              }
            `}} />
          </div>
        </div>

        {/* 4. STOCK TABLE PANEL (Priority Stock Levels) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="title-font" style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
              Niveles de stock prioritarios
            </h3>
            <button
              onClick={() => alert('Abriendo filtros de inventario...')}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '6px' }}
            >
              <Filter size={14} />
              Filtrar
            </button>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th className="mono-font" style={{
                    padding: '12px 16px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    ID de SKU
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Nombre del componente
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Categoría
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Nivel actual
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((row, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'var(--transition-fast)'
                    }}
                    className="table-row-hover"
                  >
                    <td className="mono-font" style={{
                      padding: '16px',
                      fontSize: '12px',
                      color: '#475569'
                    }}>
                      {row.sku}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#0f172a'
                    }}>
                      {row.name}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '13px',
                      color: '#64748b'
                    }}>
                      {row.category}
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '13px',
                      color: '#475569'
                    }}>
                      {row.level}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: row.color,
                        letterSpacing: '0.2px'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: row.color,
                          display: 'inline-block'
                        }}></span>
                        {row.status === 'STABLE' && 'ESTABLE'}
                        {row.status === 'CRITICAL' && 'CRÍTICO'}
                        {row.status === 'RESTOCKING' && 'REABASTECIENDO'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <style dangerouslySetInnerHTML={{
              __html: `
              .table-row-hover:hover {
                background-color: #f8fafc !important;
              }
            `}} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
