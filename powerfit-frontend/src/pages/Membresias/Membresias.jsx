import { useState, useEffect } from 'react';
import './Membresias.css';

const API = 'http://localhost:3000';

export default function Membresias() {
  const [socios, setSocios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [error, setError] = useState('');

  const [modoCrear, setModoCrear] = useState(false);
  const [socioId, setSocioId] = useState('');
  const [idsSeleccionados, setIdsSeleccionados] = useState([]);

  // Cargar socios, productos y membresías desde la API
  useEffect(() => {
    Promise.all([
      fetch(`${API}/socios`).then((res) => res.json()),
      fetch(`${API}/productos`).then((res) => res.json()),
      fetch(`${API}/membresias`).then((res) => res.json()),
    ])
      .then(([s, p, m]) => {
        setSocios(s);
        setProductos(p);
        setMembresias([...m].reverse()); // las más recientes primero
      })
      .catch(() => setError('No se pudo conectar con el servidor. ¿Está corriendo npm run server?'));
  }, []);

  // Regla 2: Solo productos activos se pueden seleccionar
  const productosDisponibles = productos.filter((p) => p.activo);

  // Solo socios activos pueden contratar
  const sociosActivos = socios.filter((s) => s.activo);
  const socioSeleccionado =
    sociosActivos.find((s) => String(s.id) === String(socioId)) ?? sociosActivos[0];

  const productosSeleccionados = productosDisponibles.filter((p) =>
    idsSeleccionados.includes(String(p.id))
  );

  // Abrir / cerrar el modo de contratación
  const handleToggleModo = () => {
    setError('');
    if (!modoCrear && productosDisponibles.length > 0) {
      setIdsSeleccionados([String(productosDisponibles[0].id)]);
    }
    setModoCrear(!modoCrear);
  };

  // Toggle checkbox de producto
  const handleToggleProducto = (producto) => {
    const id = String(producto.id);
    if (idsSeleccionados.includes(id)) {
      if (idsSeleccionados.length === 1) {
        alert('Una membresía debe incluir al menos un servicio base.');
        return;
      }
      setIdsSeleccionados(idsSeleccionados.filter((x) => x !== id));
    } else {
      setIdsSeleccionados([...idsSeleccionados, id]);
    }
  };

  // Lógica de Negocio: Subtotal, Descuentos y Pases
  const cantProductos = productosSeleccionados.length;
  const subtotal = productosSeleccionados.reduce((acc, p) => acc + p.precio, 0);

  // Regla 4: Descuento del 15% por 4 o más productos
  const aplicaDescuento = cantProductos >= 4;
  const montoDescuento = aplicaDescuento ? subtotal * 0.15 : 0;
  const totalPagar = subtotal - montoDescuento;

  // Regla 1: Límite de invitados (1 producto = 2 pases, >=2 productos = 5 pases)
  const pasesBase = cantProductos >= 2 ? 5 : 2;

  // Regla 5: Bono de bienvenida (+1 pase si es su primera membresía)
  const tieneHistorial = socioSeleccionado
    ? membresias.some((m) => String(m.socioId) === String(socioSeleccionado.id))
    : false;
  const esPrimeraVez = socioSeleccionado ? !tieneHistorial : false;
  const bonoBienvenida = esPrimeraVez ? 1 : 0;
  const totalPasesInvitado = pasesBase + bonoBienvenida;

  // Nombre del socio y de los servicios a partir de sus ids
  const getSocio = (id) => socios.find((s) => String(s.id) === String(id));
  const getNombreProducto = (id) => {
    const prod = productos.find((p) => String(p.id) === String(id));
    return prod ? prod.nombre : 'Servicio eliminado';
  };

  // Confirmar y registrar la membresía (RF14)
  const handleContratar = async () => {
    setError('');
    if (!socioSeleccionado || productosSeleccionados.length === 0) return;

    try {
      const res = await fetch(`${API}/membresias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: String(socioSeleccionado.id),
          productoIds: productosSeleccionados.map((p) => String(p.id)),
          total: Number(totalPagar.toFixed(2)),
          pases: totalPasesInvitado,
          estado: 'Activa',
        }),
      });
      if (!res.ok) return setError('No se pudo registrar la membresía.');

      const creada = await res.json();
      setMembresias([creada, ...membresias]);
      alert(`¡Membresía generada exitosamente para ${socioSeleccionado.nombres}!`);
      setModoCrear(false);
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  // RF16: Cancelación de membresía
  const handleCancelarMembresia = async (id) => {
    if (!confirm('¿Estás seguro de cancelar esta membresía?')) return;
    setError('');

    try {
      const res = await fetch(`${API}/membresias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Cancelada' }),
      });
      if (!res.ok) return setError('No se pudo cancelar la membresía.');

      setMembresias(
        membresias.map((m) => (m.id === id ? { ...m, estado: 'Cancelada' } : m))
      );
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
  };

  return (
    <div className="membresias-container">
      <div className="membresias-header">
        <div>
          <h2>Membresías y Contratos</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Contratación multiproducto, descuentos automáticos y emisión de pases
          </p>
        </div>
        <button className="btn-primary" onClick={handleToggleModo}>
          {modoCrear ? 'Ver Listado' : '+ Contratar Membresía'}
        </button>
      </div>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {modoCrear ? (
        <div className="wizard-layout">
          {/* Lado izquierdo: Selección */}
          <div>
            <div className="step-box">
              <h3>Paso 1: Seleccionar Socio</h3>
              <select
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  color: '#fff'
                }}
                value={socioSeleccionado?.id ?? ''}
                onChange={(e) => setSocioId(e.target.value)}
              >
                {sociosActivos.map((s) => {
                  const nuevo = !membresias.some((m) => String(m.socioId) === String(s.id));
                  return (
                    <option key={s.id} value={s.id}>
                      {s.nombres} - DNI: {s.dni} {nuevo ? '(Nuevo socio)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="step-box">
              <h3>Paso 2: Paquete de Servicios (Regla 2: Solo Activos)</h3>
              <div className="product-selection-list">
                {productosDisponibles.map((prod) => {
                  const isChecked = idsSeleccionados.includes(String(prod.id));
                  return (
                    <div
                      key={prod.id}
                      className={`product-select-item ${isChecked ? 'selected' : ''}`}
                      onClick={() => handleToggleProducto(prod)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Manejado por el div contenedor
                        />
                        <span>{prod.nombre}</span>
                      </div>
                      <strong>S/ {prod.precio.toFixed(2)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lado derecho: Liquidación y Reglas de Negocio */}
          <div className="checkout-summary">
            <h3>Resumen de Contrato</h3>

            <div className="summary-row">
              <span style={{ color: '#94a3b8' }}>Socio Titular:</span>
              <strong>{socioSeleccionado ? socioSeleccionado.nombres : '—'}</strong>
            </div>

            <div className="summary-row">
              <span style={{ color: '#94a3b8' }}>Servicios seleccionados:</span>
              <span>{cantProductos} ítem(s)</span>
            </div>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>

            {aplicaDescuento ? (
              <div className="summary-row discount">
                <span>Descuento Paquete (15% - Regla 4):</span>
                <span>- S/ {montoDescuento.toFixed(2)}</span>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                * Selecciona 4 o más servicios para obtener 15% OFF
              </div>
            )}

            <div className="summary-total">
              <span>Total a Pagar:</span>
              <span>S/ {totalPagar.toFixed(2)}</span>
            </div>

            {/* Banner Regla 1 y Regla 5 */}
            <div className="info-banner">
              <strong>Pases de Invitado Otorgados: {totalPasesInvitado}</strong>
              <div style={{ marginTop: '0.25rem' }}>
                {cantProductos >= 2
                  ? '• Límite ampliado: 5 pases (2+ servicios contratados)'
                  : '• Límite estándar: 2 pases (1 solo servicio)'}
              </div>
            </div>

            {esPrimeraVez && (
              <div className="promo-badge">
                🎉 Regla 5 Aplicada: <strong>+1 Pase de bienvenida adicional</strong> por ser su primera membresía en el club.
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
              onClick={handleContratar}
              disabled={!socioSeleccionado || cantProductos === 0}
            >
              Confirmar y Registrar Membresía
            </button>
          </div>
        </div>
      ) : (
        /* RF15: Listado histórico de membresías */
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Socio</th>
                <th>Servicios Contratados</th>
                <th>Pases Emitibles</th>
                <th>Monto Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {membresias.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>
                    Aún no hay membresías registradas.
                  </td>
                </tr>
              ) : (
                membresias.map((m) => {
                  const socio = getSocio(m.socioId);
                  return (
                    <tr key={m.id}>
                      <td><strong>#{m.id}</strong></td>
                      <td>
                        {socio ? socio.nombres : 'Socio no encontrado'} <br/>
                        <small style={{ color: '#64748b' }}>DNI: {socio ? socio.dni : '—'}</small>
                      </td>
                      <td>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                          {m.productoIds.map((pid) => (
                            <li key={pid}>{getNombreProducto(pid)}</li>
                          ))}
                        </ul>
                      </td>
                      <td><span className="badge active">{m.pases} pases</span></td>
                      <td><strong>S/ {Number(m.total).toFixed(2)}</strong></td>
                      <td>
                        <span className={`badge ${m.estado === 'Activa' ? 'active' : 'inactive'}`}>
                          {m.estado}
                        </span>
                      </td>
                      <td>
                        {m.estado === 'Activa' && (
                          <button
                            className="btn-toggle"
                            onClick={() => handleCancelarMembresia(m.id)}
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}