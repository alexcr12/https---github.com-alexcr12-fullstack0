import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = localStorage.getItem('powerfit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (username, password) => {
    const u = username ? username.trim().toLowerCase() : '';
    const p = password ? password.trim() : '';

    // 1. CLIENTE -> ROL CLIENTE
    if (u === 'cliente' && p === '123') {
      const data = { username: 'cliente', nombre: 'Joel Alexander', rol: 'cliente' };
      setUsuario(data);
      localStorage.setItem('powerfit_user', JSON.stringify(data));
      return { success: true, rol: 'cliente', usuario: data };
    }

    // 2. ADMIN -> ROL ADMIN
    if (u === 'admin' && p === 'admin123') {
      const data = { username: 'admin', nombre: 'Administrador', rol: 'admin' };
      setUsuario(data);
      localStorage.setItem('powerfit_user', JSON.stringify(data));
      return { success: true, rol: 'admin', usuario: data };
    }

    // 3. STAFF -> ROL STAFF
    if (u === 'staff' && p === 'staff123') {
      const data = { username: 'staff', nombre: 'Recepción Central', rol: 'staff' };
      setUsuario(data);
      localStorage.setItem('powerfit_user', JSON.stringify(data));
      return { success: true, rol: 'staff', usuario: data };
    }

    return { success: false, message: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('powerfit_user');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);