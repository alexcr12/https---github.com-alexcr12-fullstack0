import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Bienvenido a PowerFit GYM</p>

      <div className="dashboard-cards">
        <div className="card">
          <h3>Socios</h3>
          <span>0</span>
        </div>

        <div className="card">
          <h3>Membresías</h3>
          <span>0</span>
        </div>

        <div className="card">
          <h3>Asistencias</h3>
          <span>0</span>
        </div>

        <div className="card">
          <h3>Ingresos</h3>
          <span>S/ 0.00</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;