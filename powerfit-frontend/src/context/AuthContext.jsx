import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const API = 'http://localhost:3000';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = localStorage.getItem('powerfit_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    try {
      const params = new URLSearchParams({
        username: username.trim().toLowerCase(),
        password: password.trim(),
      });
      const res = await fetch(`${API}/usuarios?${params}`);
      if (!res.ok) throw new Error('Error del servidor');

      const lista = await res.json();
      if (lista.length === 0) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
      }

      // La contraseña nunca se guarda en el estado ni en localStorage
      const { password: _, ...data } = lista[0];
      setUsuario(data);
      localStorage.setItem('powerfit_user', JSON.stringify(data));
      return { success: true, rol: data.rol, usuario: data };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor' };
    }
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