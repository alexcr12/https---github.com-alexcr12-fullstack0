import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    // Redirige al login si no tiene sesión activa
    return <Navigate to="/login" replace />;
  }

  return children;
}