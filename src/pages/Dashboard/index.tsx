import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const salesData = [
  { name: 'Jan', vendas: 4000 },
  { name: 'Fev', vendas: 3000 },
  { name: 'Mar', vendas: 2000 },
  { name: 'Abr', vendas: 2780 },
  { name: 'Mai', vendas: 1890 },
  { name: 'Jun', vendas: 2390 },
  { name: 'Jul', vendas: 3490 },
];

const categoryData = [
  { name: 'Bowls', qtd: 45 },
  { name: 'Xícaras', qtd: 80 },
  { name: 'Pratos', qtd: 35 },
  { name: 'Vasos', qtd: 20 },
];

const Dashboard = () => {
  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Painel de Análises</h2>
        <button className="btn btn-outline-dark" onClick={() => alert('Exportação bem-sucedida! (MOCK)')}><i className="bi bi-download me-2"></i>Exportar Relatório</button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white bg-primary mb-3">
            <div className="card-body">
              <h6 className="card-title">Vendas Totais</h6>
              <h3 className="mb-0 fw-bold">R$ 24.500</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-dark bg-warning mb-3">
            <div className="card-body">
              <h6 className="card-title">Pedidos Mês</h6>
              <h3 className="mb-0 fw-bold">128</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white bg-success mb-3">
            <div className="card-body">
              <h6 className="card-title">Novos Clientes</h6>
              <h3 className="mb-0 fw-bold">45</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 text-white bg-danger mb-3">
            <div className="card-body">
              <h6 className="card-title">Trocas Solicitadas</h6>
              <h3 className="mb-0 fw-bold">3</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-8 mb-4 mb-lg-0">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold">Evolução de Vendas (Últimos 7 meses)</div>
            <div className="card-body chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vendas" stroke="#426B69" activeDot={{ r: 8 }} name="Vendas (R$)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold">Vendas por Categoria</div>
            <div className="card-body chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qtd" fill="#B08F70" name="Qtd. Vendida" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
