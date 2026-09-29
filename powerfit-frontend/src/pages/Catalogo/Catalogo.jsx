import { useState } from 'react';
import './Catalogo.css';

const initialCategorias = [
  { id: 1, nombre: 'Acceso Base' },
  { id: 2, nombre: 'Amenities / Zona Húmeda' },
  { id: 3, nombre: 'Entrenamiento & Clases' },
  { id: 4, nombre: 'Servicios Adicionales' }
];

const initialProductos = [
  { id: 1, nombre: 'Pase Libre Musculación', categoriaId: 1, precio: 90.00, activo: true },
  { id: 2, nombre: 'Acceso a Sauna Húmedo y Seco', categoriaId: 2, precio: 35.00, activo: true },
  { id: 3, nombre: 'Clases de Spinning & Crossfit', categoriaId: 3, precio: 45.00, activo: true },
  { id: 4, nombre: 'Casillero Personal Exclusivo', categoriaId: 4, precio: 25.00, activo: true },
  { id: 5, nombre: 'Evaluación Nutricional Mensual', categoriaId: 4, precio: 30.00, activo: false }
];

export default function Catalogo() {
  const [activeTab, setActiveTab] = useState('productos');
  const [categorias, setCategorias] = useState(initialCategorias);
  const [productos, setProductos] = useState(initialProductos);

  // Estados de modales
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);

  // Form states
  const [formProd, setFormProd] = useState({ nombre: '', categoriaId: 1, precio: '' });
  const [formCat, setFormCat] = useState({ nombre: '' });

  // RF13: Desactivar / Activar producto (Regla 2)
  const toggleEstadoProducto = (id) => {
    setProductos(
      productos.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p))
    );
  };

  // RF10: Registrar producto
  const handleRegistrarProducto = (e) => {
    e.preventDefault();
    if (!formProd.nombre || !formProd.precio) return;

    const nuevo = {
      id: Date.now(),
      nombre: formProd.nombre,
      categoriaId: parseInt(formProd.categoriaId),
      precio: parseFloat(formProd.precio),
      activo: true
    };

    setProductos([...productos, nuevo]);
    setFormProd({ nombre: '', categoriaId: 1, precio: '' });
    setModalProductoOpen(false);
  };

  // RF07: Registrar categoría
  const handleRegistrarCategoria = (e) => {
    e.preventDefault();
    if (!formCat.nombre) return;

    const nueva = {
      id: Date.now(),
      nombre: formCat.nombre
    };

    setCategorias([...categorias, nueva]);
    setFormCat({ nombre: '' });
    setModalCategoriaOpen(false);
  };

  const getCategoriaNombre = (catId) => {
    const cat = categorias.find((c) => c.id === catId);
    return cat ? cat.nombre : 'Sin categoría';
  };

  return (
    <div className="catalogo-container">
      <div className="catalogo-header">
        <div>
          <h2>Catálogo de Servicios y Categorías</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Administración de ítems vendibles y agrupaciones para membresías
          </p>
        </div>

        {activeTab === 'productos' ? (
          <button className="btn-primary" onClick={() => setModalProductoOpen(true)}>
            + Nuevo Producto (RF10)
          </button>
        ) : (
          <button className="btn-primary" onClick={() => setModalCategoriaOpen(true)}>
            + Nueva Categoría (RF07)
          </button>
        )}
      </div>

      <div className="catalogo-tabs">
        <button
          className={`tab-btn ${activeTab === 'productos' ? 'active' : ''}`}
          onClick={() => setActiveTab('productos')}
        >
          Productos / Servicios (RF11)
        </button>
        <button
          className={`tab-btn ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          Categorías (RF08)
        </button>
      </div>

      {activeTab === 'productos' ? (
        <div className="catalogo-grid">
          {productos.map((prod) => (
            <div
              key={prod.id}
              className={`product-card ${!prod.activo ? 'disabled' : ''}`}
            >
              <div>
                <div className="product-header">
                  <span className="product-category-tag">
                    {getCategoriaNombre(prod.categoriaId)}
                  </span>
                  <span className={`badge ${prod.activo ? 'active' : 'inactive'}`}>
                    {prod.activo ? 'Disponible' : 'Desactivado'}
                  </span>
                </div>
                <h4 style={{ margin: '0.75rem 0 0.25rem 0' }}>{prod.nombre}</h4>
                <p className="product-price">S/ {prod.precio.toFixed(2)}</p>
              </div>

              <div className="product-actions">
                <button
                  className="btn-toggle"
                  onClick={() => toggleEstadoProducto(prod.id)}
                >
                  {prod.activo ? 'Desactivar (RF13)' : 'Habilitar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre de la Categoría</th>
                <th>Total Productos Asociados</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id}>
                  <td>#{cat.id}</td>
                  <td><strong>{cat.nombre}</strong></td>
                  <td>
                    {productos.filter((p) => p.categoriaId === cat.id).length} ítems
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar Producto */}
      {modalProductoOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registrar Producto / Servicio</h3>
            <form onSubmit={handleRegistrarProducto}>
              <div className="form-group">
                <label>Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Acceso a Piscina"
                  value={formProd.nombre}
                  onChange={(e) => setFormProd({ ...formProd, nombre: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={formProd.categoriaId}
                  onChange={(e) => setFormProd({ ...formProd, categoriaId: e.target.value })}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '6px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#fff'
                  }}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Precio Mensual (S/)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formProd.precio}
                  onChange={(e) => setFormProd({ ...formProd, precio: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModalProductoOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Categoría */}
      {modalCategoriaOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registrar Nueva Categoría</h3>
            <form onSubmit={handleRegistrarCategoria}>
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Nutrición y Salud"
                  value={formCat.nombre}
                  onChange={(e) => setFormCat({ ...formCat, nombre: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModalCategoriaOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}