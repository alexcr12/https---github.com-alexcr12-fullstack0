import { useState, useEffect } from 'react';
import './Asistencias.css';
import { logInfo, logExito, logAlerta, logError } from '../../utils/logger'; 

const API = 'http://localhost:3000';

// La hora se guarda en formato 24 h ("08:30") y se muestra como "08:30 a. m."
const formatHora = (hora) => {
  if (!/^\d{2}:\d{2}$/.test(hora)) return hora;
  return new Date(`1970-01-01T${hora}:00`).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Fecha y hora actuales en la zona horaria local (no en UTC)
const ahoraLocal = () => {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return {
    fecha: `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`,
    hora: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
  };
};

export default function Asistencias() {
  const [dniInput, setDniInput] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState('');

  const [socios, setSocios] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);

  // Cargar todo desde la API
  useEffect(() => {
    Promise.all([
      fetch(`${API}/socios`).then((res) => res.json()),
      fetch(`${API}/membresias`).then((res) => res.json()),
      fetch(`${API}/productos`).then((res) => res.json()),
      fetch(`${API}/asistencias`).then((res) => res.json()),
    ])
      .then(([s, m, p, a]) => {
        setSocios(s);
        setMembresias(m);
        setProductos(p);
        setAsistencias([...a].reverse()); // las más recientes primero
        logInfo(`Se cargaron ${a.length} registros de asistencia`);
      })
       .catch(() => {                                                   
        setError('No se pudo conectar con el servidor. ¿Está corriendo npm run server?');
        logError('Fallo al cargar los datos de control de acceso');  
      });   
  }, []);

  const getSocio = (id) => socios.find((s) => String(s.id) === String(id));

  // Nombre del plan = servicios de la membresía vigente del socio
  const getPlan = (membresia) =>
    membresia.productoIds
      .map((pid) => productos.find((p) => String(p.id) === String(pid))?.nombre)
      .filter(Boolean)
      .join(' + ');

  // RF18: Registrar Asistencia con validación de membresía vigente
  const handleRegistrarIngreso = async (e) => {
    e.preventDefault();
    setError('');
    const dniLimpio = dniInput.trim();
    if (!dniLimpio) return;

    const socio = socios.find((s) => s.dni === dniLimpio);

    if (!socio) {
      setMensaje({
        tipo: 'error',
        texto: `No se encontró socio registrado con el DNI ${dniLimpio}.`
      });
      logAlerta(`Intento de ingreso con DNI no registrado: ${dniLimpio}`);
      return;
    }

    if (!socio.activo) {
      setMensaje({
        tipo: 'error',
        texto: `Acceso denegado: El socio ${socio.nombres} está desactivado.`
      });
      logAlerta(`Acceso denegado a "${socio.nombres}" por estar desactivado`);
      return;
    }

    const membresiaVigente = membresias.find(
      (m) => String(m.socioId) === String(socio.id) && m.estado === 'Activa'
    );

    if (!membresiaVigente) {
      setMensaje({
        tipo: 'error',
        texto: `Acceso denegado: El socio ${socio.nombres} no tiene una membresía vigente.`
      });
      logAlerta(`Acceso denegado a "${socio.nombres}" por no tener membresía vigente`); 
      return;
    }

    const { fecha, hora } = ahoraLocal();

    try {
      const res = await fetch(`${API}/asistencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: String(socio.id),
          sede: 'Sede Central',
          hora,
          fecha,
        }),
      });
      if (!res.ok) return setError('No se pudo registrar la asistencia.');

      const creada = await res.json();
      setAsistencias([creada, ...asistencias]);
      setMensaje({
        tipo: 'success',
        texto: `¡Ingreso autorizado! Bienvenido/a ${socio.nombres} (${getPlan(membresiaVigente)}).`
      });
      logExito(`Ingreso registrado: ${socio.nombres} a las ${hora}`);
      setDniInput('');
    } catch {
      setError('No se pudo conectar con el servidor.');
      logError(`No se pudo registrar el ingreso del DNI ${dniLimpio}`);
    }
  };

  // RF20: Corregir hora de asistencia
  const handleEditarHora = async (id) => {
    const registro = asistencias.find((a) => a.id === id);
    const nuevaHora = prompt('Editar hora de ingreso (formato 24 h, ej. 07:45):', registro.hora);
    if (!nuevaHora || nuevaHora.trim() === '') return;

    const hora = nuevaHora.trim();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
      return setError('Hora inválida. Usa el formato HH:MM en 24 horas, por ejemplo 07:45.');
    }
    setError('');

    try {
      const res = await fetch(`${API}/asistencias/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora }),
      });
      if (!res.ok) return setError('No se pudo actualizar la hora.');

      setAsistencias(asistencias.map((a) => (a.id === id ? { ...a, hora } : a)));
      logExito(`Se corrigió la hora de la asistencia #${id} a ${hora}`);
    } catch {
      setError('No se pudo conectar con el servidor.');
      logError(`No se pudo actualizar la hora de la asistencia #${id}`);
    }
  };

  // RF21: Eliminación física de registro erróneo
  const handleEliminar = async (id) => {
    if (!confirm('¿Deseas eliminar este registro de asistencia?')) return;
    setError('');

    try {
      const res = await fetch(`${API}/asistencias/${id}`, { method: 'DELETE' });
      if (!res.ok) return setError('No se pudo eliminar el registro.');

      setAsistencias(asistencias.filter((a) => a.id !== id));
       logExito(`Se eliminó el registro de asistencia #${id}`);
    } catch {
      setError('No se pudo conectar con el servidor.');
      logError(`No se pudo eliminar el registro de asistencia #${id}`); 
    }
  };

  return (
    <div className="asistencias-container">
      <div className="asistencias-header">
        <div>
          <h2>Control de Accesos y Asistencias</h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Validación de ingreso en recepción mediante documento de identidad
          </p>
        </div>
      </div>

      {/* RF18: Validación en tiempo real */}
      <div className="checkin-card">
        <h3>Control de Ingreso por Recepción</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0.25rem 0' }}>
          Ingresa el DNI del socio o pasa el lector de código de barras / QR.
        </p>

        <form onSubmit={handleRegistrarIngreso} className="checkin-form">
          <input
            type="text"
            className="checkin-input"
            placeholder="Tipea el DNI (ej: 74125896, 45896321, 78965412)..."
            value={dniInput}
            maxLength="8"
            onChange={(e) => setDniInput(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Validar e Ingresar
          </button>
        </form>

        {mensaje && (
          <div className={`checkin-feedback ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}
      </div>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {/* RF19: Historial y acciones de corrección */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Socio</th>
              <th>Sede</th>
              <th>Fecha</th>
              <th>Hora Ingreso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {asistencias.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                  No hay asistencias registradas hoy.
                </td>
              </tr>
            ) : (
              asistencias.map((asist) => {
                const socio = getSocio(asist.socioId);
                return (
                  <tr key={asist.id}>
                    <td><strong>{socio ? socio.dni : '—'}</strong></td>
                    <td>{socio ? socio.nombres : 'Socio no encontrado'}</td>
                    <td>{asist.sede}</td>
                    <td>{asist.fecha}</td>
                    <td><span className="badge active">{formatHora(asist.hora)}</span></td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEditarHora(asist.id)}
                      >
                        Editar Hora
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleEliminar(asist.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}