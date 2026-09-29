import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HomeNav from '../../componentes/HomeNav';
import './Home.css';

const API = 'http://localhost:3000';

// El carrusel es decorativo, se queda fijo
const slidesData = [
  {
    tag: 'Sede Central Lima',
    titulo: 'Entrena con equipamiento de nivel olímpico',
    descripcion: 'Supera el sedentarismo y transforma tu condición física con biomecánica de vanguardia.',
    imagen: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
    boton: 'Ver Sedes'
  },
  {
    tag: 'Promoción Apertura 2026',
    titulo: '15% OFF en Paquetes Multiproducto',
    descripcion: 'Combina musculación, sauna seco/vapor y clases guiadas en una sola membresía flexible.',
    imagen: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
    boton: 'Arma tu Plan'
  }
];

const money = (n) => Number(n || 0).toFixed(2);

export default function Home() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeSlide, setActiveSlide] = useState(0);

  // Datos desde la API
  const [sedes, setSedes] = useState([]);
  const [productosTienda, setProductosTienda] = useState([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState('');

  // Modales
  const [modalLoginOpen, setModalLoginOpen] = useState(false);
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Formularios (ya no hay credenciales precargadas)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registroForm, setRegistroForm] = useState({ nombres: '', dni: '', telefono: '', username: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registroError, setRegistroError] = useState('');
  const [registroLoading, setRegistroLoading] = useState(false);

  // Carrito de compras
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('yape');

  // Simulador de Paquetes
  const [serviciosElegidos, setServiciosElegidos] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slidesData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Carga de sedes, tienda y servicios
  useEffect(() => {
    const cargar = async () => {
      try {
        const [rs, rt, rp] = await Promise.all([
          fetch(`${API}/sedes`),
          fetch(`${API}/tienda`),
          fetch(`${API}/productos`),
        ]);
        if (!rs.ok || !rt.ok || !rp.ok) throw new Error();

        const [s, t, p] = await Promise.all([rs.json(), rt.json(), rp.json()]);
        const serviciosActivos = p.filter((x) => x.activo);

        setSedes(s);
        setProductosTienda(t);
        setServiciosCatalogo(serviciosActivos);
        setServiciosElegidos(serviciosActivos.slice(0, 2)); // selección inicial del simulador
      } catch {
        setErrorData('No se pudo cargar la información. ¿Está encendido el servidor?');
      } finally {
        setLoadingData(false);
      }
    };
    cargar();
  }, []);

  const handleAgregarAlCarrito = (prod) => {
    setCarrito([...carrito, { ...prod, cartId: Date.now() }]);
    setCartDrawerOpen(true);
  };

  const handleEliminarDelCarrito = (cartId) => {
    setCarrito(carrito.filter((item) => item.cartId !== cartId));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + Number(item.precio), 0);

  const toggleServicio = (item) => {
    const yaExiste = serviciosElegidos.some((s) => s.id === item.id);
    if (yaExiste) {
      if (serviciosElegidos.length === 1) return;
      setServiciosElegidos(serviciosElegidos.filter((s) => s.id !== item.id));
    } else {
      setServiciosElegidos([...serviciosElegidos, item]);
    }
  };

  const totalItems = serviciosElegidos.length;
  const subtotal = serviciosElegidos.reduce((acc, s) => acc + Number(s.precio), 0);
  const tieneDescuento = totalItems >= 4;
  const descuento = tieneDescuento ? subtotal * 0.15 : 0;
  const totalCalculado = subtotal - descuento;
  const pases = totalItems >= 2 ? 5 : 2;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const res = await login(loginForm.username, loginForm.password);
    setLoginLoading(false);

    if (res.success) {
      setModalLoginOpen(false);
      setLoginForm({ username: '', password: '' });

      // Cliente se queda en el Home; admin o staff van al panel
      if (res.rol === 'admin' || res.rol === 'staff') {
        navigate('/admin');
      }
    } else {
      setLoginError(res.message);
    }
  };

  const handleRegistroSubmit = async (e) => {
    e.preventDefault();
    setRegistroError('');
    setRegistroLoading(true);

    try {
      const dni = registroForm.dni.trim();
      const username = registroForm.username.trim().toLowerCase();

      if (!/^\d{8}$/.test(dni)) {
        setRegistroError('El DNI debe tener exactamente 8 dígitos.');
        return;
      }

      // Validar duplicados antes de crear nada
      const [rd, ru] = await Promise.all([
        fetch(`${API}/socios?dni=${dni}`),
        fetch(`${API}/usuarios?username=${encodeURIComponent(username)}`),
      ]);
      if (!rd.ok || !ru.ok) throw new Error();

      if ((await rd.json()).length > 0) {
        setRegistroError('Ya existe un socio registrado con ese DNI.');
        return;
      }
      if ((await ru.json()).length > 0) {
        setRegistroError('Ese usuario ya está en uso. Elige otro.');
        return;
      }

      // 1) Crear el socio
      const rs = await fetch(`${API}/socios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: registroForm.nombres.trim(),
          dni,
          telefono: registroForm.telefono.trim(),
          activo: true,
        }),
      });
      if (!rs.ok) throw new Error();
      const socio = await rs.json();

      // 2) Crear su usuario de acceso, enlazado al socio
      const rUser = await fetch(`${API}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: registroForm.password.trim(),
          nombre: registroForm.nombres.trim(),
          rol: 'cliente',
          socioId: socio.id,
        }),
      });
      if (!rUser.ok) {
        // Si falla el usuario, deshacer el socio para no dejar datos huérfanos
        await fetch(`${API}/socios/${socio.id}`, { method: 'DELETE' });
        throw new Error();
      }

      setRegistroForm({ nombres: '', dni: '', telefono: '', username: '', password: '' });
      setModalRegistroOpen(false);
      setLoginForm({ username, password: '' });
      setModalLoginOpen(true);
    } catch {
      setRegistroError('No se pudo completar el registro. Inténtalo de nuevo.');
    } finally {
      setRegistroLoading(false);
    }
  };

  const handleProcesarPago = (e) => {
    e.preventDefault();
    alert(`¡Pago de S/ ${money(totalCarrito)} confirmado exitosamente mediante ${metodoPago.toUpperCase()}! Tu código de retiro en sede es #PF-${Math.floor(1000 + Math.random() * 9000)}.`);
    setCarrito([]);
    setModalPagoOpen(false);
    setCartDrawerOpen(false);
  };

  return (
    <div className="home-page">
      {/* NAVBAR */}
      <HomeNav
        onOpenLogin={() => setModalLoginOpen(true)}
        onOpenRegistro={() => setModalRegistroOpen(true)}
        cartCount={carrito.length}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

      {/* CARRUSEL HERO */}
      <section id="inicio" className="carousel-container">
        {slidesData.map((slide, idx) => (
          <div
            key={idx}
            className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.imagen})` }}
          >
            <div className="carousel-overlay" />
            <div className="carousel-content">
              <span className="carousel-tag">{slide.tag}</span>
              <h1>{slide.titulo}</h1>
              <p>{slide.descripcion}</p>
              <a href="#simulador" className="btn-nav-registro" style={{ textDecoration: 'none', display: 'inline-block' }}>
                {slide.boton}
              </a>
            </div>
          </div>
        ))}

        <button className="carousel-btn prev" onClick={() => setActiveSlide((prev) => (prev === 0 ? slidesData.length - 1 : prev - 1))}>‹</button>
        <button className="carousel-btn next" onClick={() => setActiveSlide((prev) => (prev + 1) % slidesData.length)}>›</button>
      </section>

      {errorData && (
        <p style={{ color: '#f87171', textAlign: 'center', padding: '1rem' }}>{errorData}</p>
      )}

      {/* SEDES */}
      <section id="sedes" className="section-wrapper">
        <div className="section-head">
          <h2>Nuestras Sedes en Lima</h2>
          <p>Instalaciones climatizadas con vestidores y lockers de libre uso.</p>
        </div>

        <div className="sedes-grid">
          {loadingData && <p style={{ color: '#64748b' }}>Cargando sedes...</p>}
          {sedes.map((sede) => (
            <div key={sede.id} className="sede-card">
              <div className="sede-img-wrapper">
                <img src={sede.imagen} alt={sede.nombre} />
                <span className="sede-aforo-badge">{sede.aforo}</span>
              </div>
              <div className="sede-info">
                <h3>{sede.nombre}</h3>
                <p>📍 {sede.direccion}</p>
                <div className="sede-features">
                  {sede.servicios.map((s, i) => (
                    <span key={i} className="sede-chip">{s}</span>
                  ))}
                </div>
                <small style={{ color: '#64748b' }}>🕒 {sede.horario}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIMULADOR DE MEMBRESÍA EN VIVO */}
      <section id="simulador" className="section-wrapper" style={{ backgroundColor: '#090d16' }}>
        <div className="section-head">
          <h2>Simula y Personaliza tu Membresía</h2>
          <p>Selecciona tus servicios y calcula tu descuento del 15% automáticamente.</p>
        </div>

        <div className="custom-bundle-box">
          <div className="bundle-options">
            <h4 style={{ margin: '0 0 0.5rem', color: '#cbd5e1' }}>Selecciona tus ítems:</h4>
            {loadingData && <p style={{ color: '#64748b' }}>Cargando servicios...</p>}
            {serviciosCatalogo.map((item) => {
              const checked = serviciosElegidos.some((s) => s.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`bundle-item ${checked ? 'active' : ''}`}
                  onClick={() => toggleServicio(item)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" checked={checked} readOnly />
                    <span><strong>{item.nombre}</strong></span>
                  </div>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>S/ {money(item.precio)}</span>
                </div>
              );
            })}
          </div>

          <div className="bundle-summary-card">
            <div>
              <h3 style={{ margin: '0 0 1.2rem', color: '#f59e0b' }}>Tu Liquidación Mensual</h3>
              <div className="summary-line">
                <span style={{ color: '#94a3b8' }}>Servicios elegidos:</span>
                <span>{totalItems} ítems</span>
              </div>
              <div className="summary-line">
                <span style={{ color: '#94a3b8' }}>Subtotal:</span>
                <span>S/ {money(subtotal)}</span>
              </div>

              {tieneDescuento ? (
                <div className="summary-line green">
                  <span>Descuento Paquete (15% - Regla 4):</span>
                  <span>- S/ {money(descuento)}</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0' }}>
                  💡 Selecciona 4 o más servicios para activar el 15% OFF.
                </div>
              )}

              <div className="summary-total-big">
                <span>Total a Pagar:</span>
                <span>S/ {money(totalCalculado)}</span>
              </div>

              <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.85rem' }}>
                🎉 Tienes derecho a <strong>{pases} pases de invitado</strong> este mes (+1 pase extra de cortesía para socios nuevos).
              </div>
            </div>

            <button
              className="btn-nav-registro"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
              onClick={() => setModalRegistroOpen(true)}
            >
              Registrarme con este Plan
            </button>
          </div>
        </div>
      </section>

      {/* TIENDA DE ARTÍCULOS */}
      <section id="tienda" className="section-wrapper">
        <div className="section-head">
          <h2>Tienda Oficial PowerFit</h2>
          <p>Agrega artículos a tu carrito y recógelos en counter o recíbelos en casa.</p>
        </div>

        <div className="shop-grid">
          {loadingData && <p style={{ color: '#64748b' }}>Cargando productos...</p>}
          {productosTienda.map((p) => (
            <div key={p.id} className="shop-card">
              <img src={p.imagen} alt={p.nombre} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700 }}>
                  {p.categoria}
                </span>
                <h4>{p.nombre}</h4>
                <span className="stock">✓ {p.stock}</span>
              </div>
              <div className="shop-price-row">
                <span className="shop-price">S/ {money(p.precio)}</span>
                <button
                  className="btn-nav-registro"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  onClick={() => handleAgregarAlCarrito(p)}
                >
                  + Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CARRITO LATERAL */}
      {cartDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setCartDrawerOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header-fixed">
              <div className="drawer-header" style={{ marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#38bdf8' }}>Tu Carrito ({carrito.length})</h3>
                <button className="btn-remove-item" onClick={() => setCartDrawerOpen(false)}>✕</button>
              </div>
            </div>

            <div className="cart-items-list">
              {carrito.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', marginTop: '3rem' }}>
                  Tu carrito está vacío. Agrega artículos desde la tienda.
                </p>
              ) : (
                carrito.map((item) => (
                  <div key={item.cartId} className="cart-item-row">
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{item.nombre}</strong>
                      <div style={{ color: '#38bdf8', fontSize: '0.85rem' }}>S/ {money(item.precio)}</div>
                    </div>
                    <button
                      className="btn-remove-item"
                      title="Eliminar artículo"
                      onClick={() => handleEliminarDelCarrito(item.cartId)}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {carrito.length > 0 && (
              <div className="cart-footer-fixed">
                <div className="summary-line" style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>
                  <span>Total a Pagar:</span>
                  <span style={{ color: '#f59e0b' }}>S/ {money(totalCarrito)}</span>
                </div>
                <button
                  className="btn-nav-registro"
                  style={{ width: '100%', marginTop: '0.75rem', padding: '0.85rem', fontSize: '0.95rem' }}
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setModalPagoOpen(true);
                  }}
                >
                  Continuar al Pago (Checkout)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL INICIAR SESIÓN */}
      {modalLoginOpen && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <button className="btn-close-modal" onClick={() => setModalLoginOpen(false)}>✕</button>
            <h3>Iniciar Sesión</h3>
            <p className="modal-desc">Ingresa a tu cuenta para gestionar tu membresía y pases.</p>

            {loginError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="Tu usuario"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  disabled={loginLoading}
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={loginLoading}
                />
              </div>

              <button
                type="submit"
                className="btn-nav-registro"
                disabled={loginLoading}
                style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
              >
                {loginLoading ? 'Ingresando...' : 'Acceder al Portal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRARSE */}
      {modalRegistroOpen && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <button className="btn-close-modal" onClick={() => setModalRegistroOpen(false)}>✕</button>
            <h3>Crear Cuenta Nueva</h3>
            <p className="modal-desc">Únete a PowerFit GYM y obtén tu pase de bienvenida.</p>

            {registroError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {registroError}
              </div>
            )}

            <form onSubmit={handleRegistroSubmit} className="auth-form">
              <div className="form-group">
                <label>Nombres Completos</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={registroForm.nombres}
                  onChange={(e) => setRegistroForm({ ...registroForm, nombres: e.target.value })}
                  disabled={registroLoading}
                />
              </div>

              <div className="form-group">
                <label>DNI</label>
                <input
                  type="text"
                  maxLength="8"
                  required
                  placeholder="8 dígitos"
                  value={registroForm.dni}
                  onChange={(e) => setRegistroForm({ ...registroForm, dni: e.target.value })}
                  disabled={registroLoading}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  placeholder="999 999 999"
                  value={registroForm.telefono}
                  onChange={(e) => setRegistroForm({ ...registroForm, telefono: e.target.value })}
                  disabled={registroLoading}
                />
              </div>

              <div className="form-group">
                <label>Crea un Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="Usuario para tu cuenta"
                  value={registroForm.username}
                  onChange={(e) => setRegistroForm({ ...registroForm, username: e.target.value })}
                  disabled={registroLoading}
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={registroForm.password}
                  onChange={(e) => setRegistroForm({ ...registroForm, password: e.target.value })}
                  disabled={registroLoading}
                />
              </div>

              <button
                type="submit"
                className="btn-nav-registro"
                disabled={registroLoading}
                style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
              >
                {registroLoading ? 'Registrando...' : 'Registrarme'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PASARELA DE PAGO */}
      {modalPagoOpen && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <button className="btn-close-modal" onClick={() => setModalPagoOpen(false)}>✕</button>
            <h3 style={{ color: '#38bdf8' }}>💳 Pasarela de Pago</h3>
            <p className="modal-desc">Elige tu método de pago para completar tu orden.</p>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div className="summary-line">
                <span>Total a Liquidar:</span>
                <strong style={{ color: '#f59e0b', fontSize: '1.2rem' }}>S/ {money(totalCarrito)}</strong>
              </div>
            </div>

            <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Selecciona tu método:</label>
            <div className="payment-methods-grid">
              <div
                className={`payment-method-box ${metodoPago === 'yape' ? 'active' : ''}`}
                onClick={() => setMetodoPago('yape')}
              >
                🟣 Yape / Plin
              </div>
              <div
                className={`payment-method-box ${metodoPago === 'tarjeta' ? 'active' : ''}`}
                onClick={() => setMetodoPago('tarjeta')}
              >
                💳 Tarjeta Débito/Crédito
              </div>
              <div
                className={`payment-method-box ${metodoPago === 'transferencia' ? 'active' : ''}`}
                onClick={() => setMetodoPago('transferencia')}
              >
                🏦 Transferencia BCP/BBVA
              </div>
              <div
                className={`payment-method-box ${metodoPago === 'efectivo' ? 'active' : ''}`}
                onClick={() => setMetodoPago('efectivo')}
              >
                💵 Pago en Caja (Sede)
              </div>
            </div>

            <form onSubmit={handleProcesarPago} className="auth-form" style={{ marginTop: '1rem' }}>
              {metodoPago === 'yape' && (
                <div style={{ textAlign: 'center', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Transfiere al número oficial:</p>
                  <strong style={{ fontSize: '1.1rem', color: '#fff' }}>987 654 321 (PowerFit GYM S.A.C.)</strong>
                </div>
              )}

              {metodoPago === 'tarjeta' && (
                <>
                  <div className="form-group">
                    <label>Número de Tarjeta</label>
                    <input type="text" maxLength="16" placeholder="4557 •••• •••• ••••" required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label>Vencimiento</label>
                      <input type="text" placeholder="MM/AA" required />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input type="password" maxLength="3" placeholder="•••" required />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-nav-registro" style={{ width: '100%', padding: '0.85rem', marginTop: '0.8rem' }}>
                Confirmar y Pagar S/ {money(totalCarrito)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="home-footer">
        <p>© 2026 PowerFit GYM - Todos los derechos reservados. Lima Metropolitana, Perú.</p>
      </footer>
    </div>
  );
}