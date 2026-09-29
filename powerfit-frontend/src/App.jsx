import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./componentes/ProtectedRoute";
import Layout from "./componentes/Layout";

// Páginas
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Socios from "./pages/Socios/Socios";
import Catalogo from "./pages/Catalogo/Catalogo";
import Membresias from "./pages/Membresias/Membresias";
import Asistencias from "./pages/Asistencias/Asistencias";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Vista Pública para cualquier persona */}
          <Route path="/" element={<Home />} />

          {/* 2. Login para personal */}
          <Route path="/login" element={<Login />} />

          {/* 3. Panel de control privado (Admin y Staff) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="socios" element={<Socios />} />
            <Route path="membresias" element={<Membresias />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="asistencias" element={<Asistencias />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}