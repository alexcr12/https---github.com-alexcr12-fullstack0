import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HomeNav({ 
  onOpenLogin, 
  onOpenRegistro, 
  cartCount, 
  onOpenCart 
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { usuario, logout } = useAuth(); // Obtenemos el usuario y el logout

  return (
    <>
      <header className="home-nav">
        <div className="nav-left-group">
          <button 
            className="btn-hamburger" 
            title="Menú de Navegación"
            onClick={() => setDrawerOpen(true)}
            onMouseEnter={() => setDrawerOpen(true)}
          >
            ☰
          </button>
          
          <a href="#inicio" className="brand-link">
            <div className="brand-text-container">
              <h2>PowerFit <span>GYM</span></h2>
              <span className="brand-tagline">Club & Fitness Center</span>
            </div>
          </a>
        </div>

        <div className="nav-right-group">
          <button className="btn-cart-nav" onClick={onOpenCart}>
            🛒 Carrito
            {cartCount > 0 && (
              <span className="cart-count-badge">{cartCount}</span>
            )}
          </button>

          {/* SI EL USUARIO ESTÁ LOGUEADO */}
          {usuario ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.9rem' }}>
                Bienvenido, {usuario.nombre}!
              </span>
              <button 
                className="btn-nav-login" 
                onClick={logout}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            /* SI NO ESTÁ LOGUEADO MUESTRA LOS BOTONES */
            <>
              <button className="btn-nav-login" onClick={onOpenLogin}>
                Iniciar Sesión
              </button>
              <button className="btn-nav-registro" onClick={onOpenRegistro}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      {/* MENÚ LATERAL (DRAWER) */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div 
            className="drawer-content" 
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setDrawerOpen(false)}
          >
            <div>
              <div className="drawer-header">
                <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.2rem' }}>PowerFit GYM</h3>
                <button className="btn-remove-item" onClick={() => setDrawerOpen(false)}>✕</button>
              </div>

              <div className="drawer-links">
                <a href="#inicio" onClick={() => setDrawerOpen(false)}> Inicio</a>
                <a href="#sedes" onClick={() => setDrawerOpen(false)}> Nuestras Sedes</a>
                <a href="#simulador" onClick={() => setDrawerOpen(false)}> Cotizador de Membresías</a>
                <a href="#tienda" onClick={() => setDrawerOpen(false)}> Suplementos y Artículos</a>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                PowerFit GYM - Lima Metropolitana 2026
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}