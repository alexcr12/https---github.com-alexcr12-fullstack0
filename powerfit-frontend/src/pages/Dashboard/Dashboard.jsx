import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const API = 'http://localhost:3000';

// Fecha local en formato YYYY-MM-DD (toISOString usaría UTC)
const hoyLocal = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

function Dashboard() {
  const { usuario } = useAuth();
  const [socios, setSocios] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rs, rm, ra] = await Promise.all([
          fetch(`${API}/socios`),
          fetch(`${API}/membresias`),
          fetch(`${API}/asistencias`),
        ]);
        if (!rs.ok || !rm.ok || !ra.ok) throw new Error();

        const [s, m, a] = await Promise.all([rs.json(), rm.json(), ra.json()]);
        setSocios(s);
        setMembresias(m);
        setAsistencias(a);
      } catch {
        setError('No se pudieron cargar los datos. ¿Está encendido el servidor?');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Cifras calculadas a partir de los datos reales
  const sociosActivos = socios.filter((s) => s.activo).length;
  const membresiasActivas = membresias.filter((m) => m.estado === 'Activa');
  const asistenciasHoy = asistencias.filter((a) => a.fecha === hoyLocal()).length;
  const ingresos = membresias
    .filter((m) => m.estado !== 'Cancelada')
    .reduce((suma, m) => suma + Number(m.total || 0), 0);

  const valor = (v) => (loading ? '...' : v);

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Bienvenido a PowerFit GYM{usuario?.nombre ? `, ${usuario.nombre}` : ''}</p>

      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      <div className="dashboard-cards">
        <div className="card">
          <h3>Socios activos</h3>
          <span>{valor(sociosActivos)}</span>
        </div>

        <div className="card">
          <h3>Membresías activas</h3>
          <span>{valor(membresiasActivas.length)}</span>
        </div>

        <div className="card">
          <h3>Asistencias hoy</h3>
          <span>{valor(asistenciasHoy)}</span>
        </div>

        <div className="card">
          <h3>Ingresos</h3>
          <span>{valor(`S/ ${ingresos.toFixed(2)}`)}</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;