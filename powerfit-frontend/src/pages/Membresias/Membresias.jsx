import { useState } from 'react';
import './Membresias.css';

// Socios mock (Andrés ya tiene historial, Daniela es nueva)
const initialSocios = [
  { id: 1, dni: '74125896', nombres: 'Carlos Mendoza', tieneHistorial: true },
  { id: 2, dni: '45896321', nombres: 'Andrea Quispe', tieneHistorial: false },
  { id: 3, dni: '78965412', nombres: 'Renzo Salazar', tieneHistorial: true }
];

// Catálogo disponible (Regla 2: Solo los activos se pueden seleccionar)
const productosCatalogo = [
  { id: 1, nombre: 'Acceso Base Musculación', precio: 90.00, activo: true },
  { id: 2, nombre: 'Sauna Húmedo y Seco', precio: 35.00, activo: true },
  { id: 3, nombre: 'Clases Grupales (Spinning/Crossfit)', precio: 45.00, activo: true },
  { id: 4, nombre: 'Casillero Exclusivo', precio: 25.00, activo: true },
  { id: 5, nombre: 'Nutrición Deportiva', precio: 30.00, activo: true },
  { id: 6, nombre: 'Servicio Spa Temporal', precio: 50.00, activo: false } // Desactivado
];

export default function Membresias() {
  const [modoCrear, setModoCrear] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState(initialSocios[0]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([productosCatalogo[0]]);
  
  // Histórico de membresías contratadas
  const [membresias, setMembresias] = useState([
    {
      id: 101,
      socioNombre: 'Carlos Mendoza',
      dni: '74125896',
      total: 144.50,
      pases: 5,
      items: ['Acceso Base Musculación', 'Sauna Húmedo y Seco', 'Casillero Exclusivo'],
      estado: 'Activa'
    }
  ]);

  // Regla 2: Filtrar productos disponibles
  const productosDisponibles = productosCatalogo.filter((p) => p.activo);

  // Toggle checkbox de producto
  const handleToggleProducto = (producto) => {
    const existe = productosSeleccionados.some((p) => p.id === producto.id);
    if (existe) {
      if (productosSeleccionados.length === 1) {
        alert('Una membresía debe incluir al menos un servicio base.');
        return;
      }
      setProductosSeleccionados(productosSeleccionados.filter((p) => p.id !== producto.id));
    } else {
      setProductosSeleccionados([...productosSeleccionados, producto]);
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

  // Regla 5: Bono de bienvenida (+1 pase si es primera membresía)
  const esPrimeraVez = socioSeleccionado ? !socioSeleccionado.tieneHistorial : false;
  const bonoBienvenida = esPrimeraVez ? 1 : 0;
  const totalPasesInvitado = pasesBase + bonoBienvenida;

  // Confirmar y registrar la membresía (RF14)
  const handleContratar = () => {
    const nuevaMembresia = {
      id: Date.now(),
      socioNombre: socioSeleccionado.nombres,
      dni: socioSeleccionado.dni,
      total: totalPagar,
      pases: totalPasesInvitado,
      items: productosSeleccionados.map((p) => p.nombre),
      estado: 'Activa'
    };

    setMembresias([nuevaMembresia, ...membresias]);
    alert(`¡Membresía generada exitosamente para ${socioSeleccionado.nombres}!`);
    setModoCrear(false);
  };

  // RF16: Cancelación de membresía
  const handleCancelarMembresia = (id) => {
    if (confirm('¿Estás seguro de cancelar esta membresía?')) {
      setMembresias(
        membresias.map((m) => (m.id === id ? { ...m, estado: 'Cancelada' } : m))
      );
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
        <button
          className="btn-primary"
          onClick={() => setModoCrear(!modoCrear)}
        >
          {modoCrear ? 'Ver Listado' : '+ Contratar Membresía (RF14)'}
        </button>
      </div>

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
                value={socioSeleccionado.id}
                onChange={(e) => {
                  const sel = initialSocios.find((s) => s.id === parseInt(e.target.value));
                  setSocioSeleccionado(sel);
                }}
              >
                {initialSocios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombres} - DNI: {s.dni} {!s.tieneHistorial ? '(Nuevo socio)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="step-box">
              <h3>Paso 2: Paquete de Servicios (Regla 2: Solo Activos)</h3>
              <div className="product-selection-list">
                {productosDisponibles.map((prod) => {
                  const isChecked = productosSeleccionados.some((p) => p.id === prod.id);
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
              <strong>{socioSeleccionado.nombres}</strong>
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
              {membresias.map((m) => (
                <tr key={m.id}>
                  <td><strong>#{m.id}</strong></td>
                  <td>{m.socioNombre} <br/><small style={{ color: '#64748b' }}>DNI: {m.dni}</small></td>
                  <td>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                      {m.items.map((it, idx) => (
                        <li key={idx}>{it}</li>
                      ))}
                    </ul>
                  </td>
                  <td><span className="badge active">{m.pases} pases</span></td>
                  <td><strong>S/ {m.total.toFixed(2)}</strong></td>
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
                        Cancelar (RF16)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}