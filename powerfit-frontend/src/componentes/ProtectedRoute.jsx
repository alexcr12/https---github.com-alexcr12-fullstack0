import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Uso:
//   <ProtectedRoute><Layout /></ProtectedRoute>              -> solo exige sesión
//   <ProtectedRoute roles={['admin']}>...</ProtectedRoute>   -> exige sesión y rol
export default function ProtectedRoute({ children, roles }) {
  const { usuario } = useAuth();
  const location = useLocation();

  // Sin sesión: al login, recordando a dónde quería ir
  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Con sesión pero sin el rol permitido
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  // Funciona con children o como layout de rutas anidadas
  return children ?? <Outlet />;
}