import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', vendas: 4000 },
  { name: 'Fev', vendas: 3000 },
  { name: 'Mar', vendas: 2000 },
  { name: 'Abr', vendas: 2780 },
  { name: 'Mai', vendas: 1890 },
  { name: 'Jun', vendas: 2390 },
  { name: 'Jul', vendas: 3490 },
];

const Dashboard = () => {
  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Painel de Análises</h2>
        <button className="btn btn-outline-dark"><i className="bi bi-download me-2"></i>Exportar Relatório</button>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 text-white bg-primary bg-gradient mb-3">
            <div className="card-body">
              <h5 className="card-title">Vendas Totais</h5>
              <h2 className="mb-0">R$ 24.500</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 text-dark bg-warning bg-gradient mb-3">
            <div className="card-body">
              <h5 className="card-title">Pedidos Mês</h5>
              <h2 className="mb-0">128</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm border-0 text-white bg-success bg-gradient mb-3">
            <div className="card-body">
              <h5 className="card-title">Novos Clientes</h5>
              <h2 className="mb-0">45</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white fw-bold">Evolução de Vendas (Últimos 7 meses)</div>
        <div className="card-body" style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="vendas" stroke="#ffc107" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
