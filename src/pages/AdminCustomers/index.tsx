import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerProfileModal from '../../components/CustomerProfileModal';
import CustomerOrdersHistoryModal from '../../components/CustomerOrdersHistoryModal';
import { customerService } from '../../services/customerService';
import type { Cliente } from '../../types/customer';
import { formatarCpf, formatarTelefone } from '../../utils/formatters';

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Cliente | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<any>(null);

  const fetchCustomers = async (termo = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.listarClientes(termo, 0, 50);
      setCustomers(data.content || []);
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err);
      setError('Não foi possível carregar os clientes do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchTerm);
  };

  const handleToggleStatus = async (customer: Cliente) => {
    const novoStatus = !customer.ativo;
    const confirmMsg = novoStatus
      ? `Deseja reativar o cliente ${customer.nome}?`
      : `Deseja inativar o cliente ${customer.nome}?`;

    if (confirm(confirmMsg)) {
      try {
        await customerService.atualizarCliente({
          ...customer,
          ativo: novoStatus,
        });
        await fetchCustomers(searchTerm);
      } catch (err: any) {
        alert('Erro ao alterar status: ' + (err.response?.data || err.message));
      }
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Gerenciar Clientes</h2>
          <p className="text-muted mb-0">Listagem integrada com o banco de dados PostgreSQL</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark" onClick={() => fetchCustomers(searchTerm)}>
            <i className="bi bi-arrow-clockwise me-2"></i>Atualizar
          </button>
          <Link to="/customer/new" className="btn btn-warning fw-bold">
            <i className="bi bi-plus-lg me-2"></i>Novo Cliente
          </Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={handleSearch} className="row mb-4">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Buscar por nome, CPF ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-dark">
                  Buscar
                </button>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <span className="badge bg-light text-dark border p-2">
                Total encontrado: <strong>{customers.length}</strong>
              </span>
            </div>
          </form>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="text-muted mt-2">Buscando clientes no backend...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th className="text-nowrap" style={{ width: '130px' }}>Código</th>
                    <th style={{ minWidth: '180px' }}>Nome Completo</th>
                    <th style={{ minWidth: '180px' }}>E-mail</th>
                    <th className="text-nowrap" style={{ minWidth: '150px' }}>Telefone</th>
                    <th className="text-nowrap" style={{ minWidth: '140px' }}>CPF</th>
                    <th className="text-center text-nowrap" style={{ width: '90px' }}>Ranking</th>
                    <th className="text-center text-nowrap" style={{ width: '90px' }}>Status</th>
                    <th className="text-end text-nowrap" style={{ width: '130px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="fw-bold text-muted small">#{customer.id}</td>
                      <td className="text-nowrap">
                        <span className="badge bg-light text-dark border font-monospace">
                          {customer.codigoCliente || 'N/A'}
                        </span>
                      </td>
                      <td className="fw-bold text-dark">{customer.nome}</td>
                      <td>
                        <span className="small text-muted">{customer.email}</span>
                      </td>
                      <td className="text-nowrap">
                        <span className="font-monospace small">{formatarTelefone(customer.telefone)}</span>
                      </td>
                      <td className="text-nowrap">
                        <span className="font-monospace small">{formatarCpf(customer.cpf)}</span>
                      </td>
                      <td className="text-center text-nowrap">
                        <span className="badge bg-info text-dark">
                          ★ {customer.ranking ?? 0}
                        </span>
                      </td>
                      <td className="text-center text-nowrap">
                        <span
                          className={`badge ${
                            customer.ativo ? 'bg-success' : 'bg-danger'
                          }`}
                        >
                          {customer.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-dark"
                            title="Ver Detalhes / Editar"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className={`btn ${
                              customer.ativo ? 'btn-outline-danger' : 'btn-outline-success'
                            }`}
                            title={customer.ativo ? 'Inativar Cliente' : 'Reativar Cliente'}
                            onClick={() => handleToggleStatus(customer)}
                          >
                            <i className={`bi ${customer.ativo ? 'bi-person-x' : 'bi-person-check'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-warning text-dark"
                            title="Histórico de Pedidos"
                            onClick={() => setHistoryCustomer(customer)}
                          >
                            <i className="bi bi-box-seam"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <i className="bi bi-people fs-1 d-block mb-2 text-secondary"></i>
                        Nenhum cliente cadastrado ou encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CustomerProfileModal
        show={!!selectedCustomer}
        onClose={() => {
          setSelectedCustomer(null);
          fetchCustomers(searchTerm);
        }}
        customer={selectedCustomer}
      />

      <CustomerOrdersHistoryModal
        show={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        customer={historyCustomer}
      />
    </div>
  );
};

export default AdminCustomers;
