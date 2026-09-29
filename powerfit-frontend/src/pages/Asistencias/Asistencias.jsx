import { useState } from 'react';
import './Asistencias.css';

// Base de socios con su estado de vigencia actual
const sociosPadrón = [
  { dni: '74125896', nombres: 'Carlos Mendoza', membresiaVigente: true, plan: 'Acceso Total + Sauna' },
  { dni: '45896321', nombres: 'Andrea Quispe', membresiaVigente: true, plan: 'Pase Libre Musculación' },
  { dni: '78965412', nombres: 'Renzo Salazar', membresiaVigente: false, plan: 'Vencida el 15/09' }
];

export default function Asistencias() {
  const [dniInput, setDniInput] = useState('');
  const [mensaje, setMensaje] = useState(null);

  // RF19: Listado de asistencias
  const [asistencias, setAsistencias] = useState([
    { id: 1, dni: '74125896', nombres: 'Carlos Mendoza', sede: 'Sede Central', hora: '08:30 a. m.', fecha: '2026-09-28' },
    { id: 2, dni: '45896321', nombres: 'Andrea Quispe', sede: 'Sede Central', hora: '09:15 a. m.', fecha: '2026-09-28' }
  ]);

  // RF18: Registrar Asistencia con validación de membresía vigente
  const handleRegistrarIngreso = (e) => {
    e.preventDefault();
    const dniLimpio = dniInput.trim();
    if (!dniLimpio) return;

    const socio = sociosPadrón.find((s) => s.dni === dniLimpio);

    if (!socio) {
      setMensaje({
        tipo: 'error',
        texto: `No se encontró socio registrado con el DNI ${dniLimpio}.`
      });
      return;
    }

    if (!socio.membresiaVigente) {
      setMensaje({
        tipo: 'error',
        texto: `Acceso denegado: El socio ${socio.nombres} tiene la membresía ${socio.plan}.`
      });
      return;
    }

    const nuevaAsistencia = {
      id: Date.now(),
      dni: socio.dni,
      nombres: socio.nombres,
      sede: 'Sede Central',
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      fecha: new Date().toISOString().split('T')[0]
    };

    setAsistencias([nuevaAsistencia, ...asistencias]);
    setMensaje({
      tipo: 'success',
      texto: `¡Ingreso autorizado! Bienvenido/a ${socio.nombres} (${socio.plan}).`
    });
    setDniInput('');
  };

  // RF20: Corregir hora de asistencia
  const handleEditarHora = (id) => {
    const registro = asistencias.find((a) => a.id === id);
    const nuevaHora = prompt('Editar hora de ingreso (ej. 07:45 a. m.):', registro.hora);
    if (nuevaHora && nuevaHora.trim() !== '') {
      setAsistencias(
        asistencias.map((a) => (a.id === id ? { ...a, hora: nuevaHora.trim() } : a))
      );
    }
  };

  // RF21: Eliminación física de registro erróneo
  const handleEliminar = (id) => {
    if (confirm('¿Deseas eliminar este registro de asistencia?')) {
      setAsistencias(asistencias.filter((a) => a.id !== id));
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
        <h3>Control de Ingreso por Recepción (RF18)</h3>
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
              asistencias.map((asist) => (
                <tr key={asist.id}>
                  <td><strong>{asist.dni}</strong></td>
                  <td>{asist.nombres}</td>
                  <td>{asist.sede}</td>
                  <td>{asist.fecha}</td>
                  <td><span className="badge active">{asist.hora}</span></td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEditarHora(asist.id)}
                    >
                      Editar Hora (RF20)
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleEliminar(asist.id)}
                    >
                      Eliminar (RF21)
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}