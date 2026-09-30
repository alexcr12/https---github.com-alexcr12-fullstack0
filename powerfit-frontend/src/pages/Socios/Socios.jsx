import { useState, useEffect } from 'react';
import './Socios.css';
import { logInfo, logExito, logError } from '../../utils/logger';

const API = 'http://localhost:3000';

export default function Socios() {
  const [socios, setSocios] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ dni: '', nombres: '', telefono: '', email: '' });
  const [error, setError] = useState('');

  // Cargar socios desde la API al abrir la pantalla
  useEffect(() => {
    fetch(`${API}/socios`)
      .then((res) => res.json())
      .then((data) => {                                              
        setSocios(data);
        logInfo(`Se cargaron ${data.length} socios desde el servidor`); 
      })                                                             
      .catch(() => {                                                  
        setError('No se pudo conectar con el servidor. ¿Está corriendo npm run server?');
        logError('Fallo al cargar la lista de socios');              
      });
  }, []);

  // RF02: Búsqueda dinámica
  const sociosFiltrados = socios.filter((s) =>
    s.nombres.toLowerCase().includes(search.toLowerCase()) || s.dni.includes(search)
  );

  // RF04: Desactivación / Reactivación lógica
  const toggleEstado = async (socio) => {
    setError('');
    try {
      const res = await fetch(`${API}/socios/${socio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !socio.activo }),
      });
      if (!res.ok) return setError('No se pudo actualizar el socio.');
      setSocios(socios.map((s) => (s.id === socio.id ? { ...s, activo: !s.activo } : s)));
          logExito(`Socio "${socio.nombres}" fue ${socio.activo ? 'desactivado' : 'activado'}`);
    } catch {
      setError('No se pudo conectar con el servidor.');
      logError(`No se pudo actualizar el estado del socio "${socio.nombres}"`);
    }
  };

  // RF01: Registro de socio
  const handleRegistrar = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.dni || !formData.nombres) return;

    if (socios.some((s) => s.dni === formData.dni)) {
      return setError('Ya existe un socio con ese DNI.');
    }

    try {
      const res = await fetch(`${API}/socios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, activo: true }),
      });
      if (!res.ok) return setError('No se pudo registrar el socio.');

      const creado = await res.json();
      setSocios([...socios, creado]);
       logExito(`Se registró un nuevo socio: ${creado.nombres} (DNI ${creado.dni})`);
      setFormData({ dni: '', nombres: '', telefono: '', email: '' });
      setModalOpen(false);
    } catch {
      setError('No se pudo conectar con el servidor.');
      logError('No se pudo registrar el nuevo socio');
    }
  };

  return (
    <div className="socios-container">
      <div className="socios-header">
        <div>
          <h2>Gestión de Socios</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>Registro y administración del padrón de clientes</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Nuevo Socio
        </button>
      </div>

      <input
        type="text"
        className="socios-search"
        placeholder="Buscar por DNI o nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

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
                    <button className="btn-toggle" onClick={() => toggleEstado(s)}>
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