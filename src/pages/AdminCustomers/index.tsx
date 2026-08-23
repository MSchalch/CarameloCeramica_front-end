import { useState } from 'react';
import CustomerProfileModal from '../../components/CustomerProfileModal';

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Mock dados
  const customers = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', cpf: '123.456.789-00', status: 'Ativo', registeredAt: '10/01/2026' },
    { id: 2, name: 'Maria Oliveira', email: 'maria@email.com', cpf: '987.654.321-11', status: 'Ativo', registeredAt: '05/03/2026' },
    { id: 3, name: 'Carlos Souza', email: 'carlos@email.com', cpf: '111.222.333-44', status: 'Inativo', registeredAt: '12/05/2026' },
  ];

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf.includes(searchTerm));

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Gerenciar Clientes</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark" onClick={() => alert('Exportação bem-sucedida! (MOCK)')}><i className="bi bi-download me-2"></i>Exportar</button>
          <a href="/customer/new" className="btn btn-dark"><i className="bi bi-plus-lg me-2"></i>Novo Cliente</a>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Buscar por nome ou CPF..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select">
                <option value="">Status: Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nome Completo</th>
                  <th>E-mail</th>
                  <th>CPF</th>
                  <th>Data de Cadastro</th>
                  <th>Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(customer => (
                  <tr key={customer.id}>
                    <td className="fw-bold text-muted">#{customer.id}</td>
                    <td className="fw-bold">{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.cpf}</td>
                    <td>{customer.registeredAt}</td>
                    <td>
                      <span className={`badge ${customer.status === 'Ativo' ? 'bg-success' : 'bg-danger'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-dark me-2" 
                        title="Ver Detalhes"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-warning" title="Histórico de Pedidos" onClick={() => alert('Abrir modal de histórico de pedidos do cliente (Em desenvolvimento)')}>
                        <i className="bi bi-box-seam"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CustomerProfileModal 
        show={!!selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
        customer={selectedCustomer} 
      />
    </div>
  );
};

export default AdminCustomers;
