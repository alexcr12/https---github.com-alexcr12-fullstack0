import { useState } from 'react';
import './Socios.css';

const initialSocios = [
  { id: 1, dni: '74125896', nombres: 'Carlos Mendoza', telefono: '987654321', email: 'carlos@test.com', activo: true },
  { id: 2, dni: '45896321', nombres: 'Andrea Quispe', telefono: '912345678', email: 'andrea@test.com', activo: true },
  { id: 3, dni: '78965412', nombres: 'Renzo Salazar', telefono: '945612378', email: 'renzo@test.com', activo: false }
];

export default function Socios() {
  const [socios, setSocios] = useState(initialSocios);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ dni: '', nombres: '', telefono: '', email: '' });

  // RF02: Búsqueda dinámica
  const sociosFiltrados = socios.filter((s) =>
    s.nombres.toLowerCase().includes(search.toLowerCase()) || s.dni.includes(search)
  );

  // RF04: Desactivación / Reactivación lógica
  const toggleEstado = (id) => {
    setSocios(socios.map(s => s.id === id ? { ...s, activo: !s.activo } : s));
  };

  // RF01: Registro de socio
  const handleRegistrar = (e) => {
    e.preventDefault();
    if (!formData.dni || !formData.nombres) return;

    const nuevo = {
      id: Date.now(),
      ...formData,
      activo: true
    };
    setSocios([...socios, nuevo]);
    setFormData({ dni: '', nombres: '', telefono: '', email: '' });
    setModalOpen(false);
  };

  return (
    <div className="socios-container">
      <div className="socios-header">
        <div>
          <h2>Gestión de Socios</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>Registro y administración del padrón de clientes</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Nuevo Socio (RF01)
        </button>
      </div>

      <input
        type="text"
        className="socios-search"
        placeholder="Buscar por DNI o nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombres y Apellidos</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sociosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                  No se encontraron socios registrados.
                </td>
              </tr>
            ) : (
              sociosFiltrados.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.dni}</strong></td>
                  <td>{s.nombres}</td>
                  <td>{s.telefono}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={`badge ${s.activo ? 'active' : 'inactive'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-toggle" onClick={() => toggleEstado(s.id)}>
                      {s.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registrar Nuevo Socio</h3>
            <form onSubmit={handleRegistrar}>
              <div className="form-group">
                <label>Documento de Identidad (DNI)</label>
                <input
                  type="text"
                  maxLength="8"
                  required
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Nombres Completos</label>
                <input
                  type="text"
                  required
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}