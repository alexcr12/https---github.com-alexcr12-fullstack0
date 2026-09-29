import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/socios', label: 'Socios' },
  { path: '/admin/membresias', label: 'Membresías' },
  { path: '/admin/catalogo', label: 'Catálogo ' },
  { path: '/admin/asistencias', label: 'Asistencias ' },
];

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>PowerFit <span>GYM</span></h2>
          <small>Panel de Control</small>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1' }}>
            <strong>{usuario?.nombre || 'Usuario'}</strong>
          </p>
          <span className="badge active" style={{ textTransform: 'uppercase' }}>
            Rol: {usuario?.rol}
          </span>
          <button
            onClick={handleLogout}
            style={{
              marginTop: '1rem',
              width: '100%',
              background: 'none',
              border: '1px solid #475569',
              color: '#f87171',
              padding: '0.4rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}