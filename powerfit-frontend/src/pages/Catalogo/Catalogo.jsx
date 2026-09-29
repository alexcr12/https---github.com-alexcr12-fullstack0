import { useState, useEffect } from 'react';
import './Catalogo.css';

const API = 'http://localhost:3000';

export default function Catalogo() {
  const [activeTab, setActiveTab] = useState('productos');
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');

  // Estados de modales
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);

  // Form states
  const [formProd, setFormProd] = useState({ nombre: '', categoriaId: '', precio: '' });
  const [formCat, setFormCat] = useState({ nombre: '' });

  // Cargar categorías y productos desde la API
  useEffect(() => {
    Promise.all([
      fetch(`${API}/categorias`).then((res) => res.json()),
      fetch(`${API}/productos`).then((res) => res.json()),
    ])
      .then(([cats, prods]) => {
        setCategorias(cats);
        setProductos(prods);
      })
      .catch(() => setError('No se pudo conectar con el servidor. ¿Está corriendo npm run server?'));
  }, []);

  // Abrir el modal de producto con la primera categoría seleccionada
  const abrirModalProducto = () => {
    setError('');
    setFormProd({ nombre: '', categoriaId: categorias[0]?.id ?? '', precio: '' });
    setModalProductoOpen(true);
  };

  // RF13: Desactivar / Activar producto (Regla 2)
  const toggleEstadoProducto = async (prod) => {
    setError('');
    try {
      const res = await fetch(`${API}/productos/${prod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !prod.activo }),
      });
      if (!res.ok) return setError('No se pudo actualizar el producto.');
      setProductos(
        productos.map((p) => (p.id === prod.id ? { ...p, activo: !p.activo } : p))
      );
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  // RF10: Registrar producto
  const handleRegistrarProducto = async (e) => {
    e.preventDefault();
    setError('');
    if (!formProd.nombre || !formProd.precio || !formProd.categoriaId) return;

    try {
      const res = await fetch(`${API}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formProd.nombre,
          categoriaId: String(formProd.categoriaId),
          precio: parseFloat(formProd.precio),
          activo: true,
        }),
      });
      if (!res.ok) return setError('No se pudo registrar el producto.');

      const creado = await res.json();
      setProductos([...productos, creado]);
      setModalProductoOpen(false);
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  // RF07: Registrar categoría
  const handleRegistrarCategoria = async (e) => {
    e.preventDefault();
    setError('');
    if (!formCat.nombre) return;

    try {
      const res = await fetch(`${API}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: formCat.nombre }),
      });
      if (!res.ok) return setError('No se pudo registrar la categoría.');

      const creada = await res.json();
      setCategorias([...categorias, creada]);
      setFormCat({ nombre: '' });
      setModalCategoriaOpen(false);
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  // Los ids que devuelve json-server son texto, se comparan como texto
  const getCategoriaNombre = (catId) => {
    const cat = categorias.find((c) => String(c.id) === String(catId));
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
          <button className="btn-primary" onClick={abrirModalProducto}>
            + Nuevo Producto
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => {
              setError('');
              setModalCategoriaOpen(true);
            }}
          >
            + Nueva Categoría
          </button>
        )}
      </div>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      <div className="catalogo-tabs">
        <button
          className={`tab-btn ${activeTab === 'productos' ? 'active' : ''}`}
          onClick={() => setActiveTab('productos')}
        >
          Productos / Servicios
        </button>
        <button
          className={`tab-btn ${activeTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          Categorías
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
                  onClick={() => toggleEstadoProducto(prod)}
                >
                  {prod.activo ? 'Desactivar' : 'Habilitar'}
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
                    {productos.filter((p) => String(p.categoriaId) === String(cat.id)).length} ítems
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