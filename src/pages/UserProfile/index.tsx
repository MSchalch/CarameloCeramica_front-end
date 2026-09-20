import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerForm from '../../components/CustomerForm';
import AddressModal from '../../components/AddressModal';
import CardModal from '../../components/CardModal';
import { customerService } from '../../services/customerService';
import type { Cliente, Endereco, CartaoCredito } from '../../types/customer';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dados');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Carregar cliente do usuário logado ou fallback
  const loadProfile = async () => {
    setLoading(true);
    try {
      if (user?.clienteId) {
        const fullCustomer = await customerService.buscarPorId(user.clienteId);
        setCurrentCustomer(fullCustomer);
      } else {
        const data = await customerService.listarClientes('', 0, 1);
        if (data.content && data.content.length > 0) {
          const fullCustomer = await customerService.buscarPorId(data.content[0].id!);
          setCurrentCustomer(fullCustomer);
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar perfil do cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (dadosAtualizados: Cliente) => {
    if (!currentCustomer) return;
    setLoading(true);
    setFeedback(null);

    const payload: Cliente = {
      ...currentCustomer,
      ...dadosAtualizados,
      id: currentCustomer.id,
      enderecos: currentCustomer.enderecos || [],
      cartoes: currentCustomer.cartoes || [],
    };

    try {
      const msg = await customerService.atualizarCliente(payload);
      setFeedback({ type: 'success', text: msg || 'Seus dados foram atualizados com sucesso!' });
      const reloaded = await customerService.buscarPorId(currentCustomer.id!);
      setCurrentCustomer(reloaded);
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Erro ao atualizar dados.';
      setFeedback({ type: 'danger', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (novoEndereco: Endereco) => {
    if (!currentCustomer) return;
    const novosEnderecos = [...(currentCustomer.enderecos || []), novoEndereco];
    const payload: Cliente = {
      ...currentCustomer,
      enderecos: novosEnderecos,
    };

    try {
      await customerService.atualizarCliente(payload);
      setFeedback({ type: 'success', text: 'Endereço adicionado com sucesso!' });
      const reloaded = await customerService.buscarPorId(currentCustomer.id!);
      setCurrentCustomer(reloaded);
    } catch (err: any) {
      alert('Erro ao salvar endereço: ' + (err.response?.data || err.message));
    }
  };

  const handleRemoveAddress = async (index: number) => {
    if (!currentCustomer) return;
    if (confirm('Deseja realmente remover este endereço?')) {
      const filtrados = (currentCustomer.enderecos || []).filter((_, i) => i !== index);
      const payload: Cliente = {
        ...currentCustomer,
        enderecos: filtrados,
      };

      try {
        await customerService.atualizarCliente(payload);
        setFeedback({ type: 'success', text: 'Endereço removido com sucesso!' });
        const reloaded = await customerService.buscarPorId(currentCustomer.id!);
        setCurrentCustomer(reloaded);
      } catch (err: any) {
        alert('Erro ao remover endereço: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleAddCard = async (novoCartao: CartaoCredito) => {
    if (!currentCustomer) return;
    const novosCartoes = [...(currentCustomer.cartoes || []), novoCartao];
    const payload: Cliente = {
      ...currentCustomer,
      cartoes: novosCartoes,
    };

    try {
      await customerService.atualizarCliente(payload);
      setFeedback({ type: 'success', text: 'Cartão adicionado com sucesso!' });
      const reloaded = await customerService.buscarPorId(currentCustomer.id!);
      setCurrentCustomer(reloaded);
    } catch (err: any) {
      alert('Erro ao salvar cartão: ' + (err.response?.data || err.message));
    }
  };

  const handleRemoveCard = async (index: number) => {
    if (!currentCustomer) return;
    if (confirm('Deseja realmente remover este cartão?')) {
      const filtrados = (currentCustomer.cartoes || []).filter((_, i) => i !== index);
      const payload: Cliente = {
        ...currentCustomer,
        cartoes: filtrados,
      };

      try {
        await customerService.atualizarCliente(payload);
        setFeedback({ type: 'success', text: 'Cartão removido com sucesso!' });
        const reloaded = await customerService.buscarPorId(currentCustomer.id!);
        setCurrentCustomer(reloaded);
      } catch (err: any) {
        alert('Erro ao remover cartão: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleInactivate = async () => {
    if (!currentCustomer) return;
    if (confirm('Tem certeza que deseja inativar sua conta? Você não poderá mais realizar compras.')) {
      try {
        await customerService.atualizarCliente({
          ...currentCustomer,
          ativo: false,
        });
        alert('Conta inativada com sucesso.');
        const reloaded = await customerService.buscarPorId(currentCustomer.id!);
        setCurrentCustomer(reloaded);
      } catch (err: any) {
        alert('Erro ao inativar conta: ' + (err.response?.data || err.message));
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        {/* Menu Lateral */}
        <div className="col-md-3 mb-4">
          <div className="list-group shadow-sm">
            <button
              className={`list-group-item list-group-item-action ${
                activeTab === 'dados' ? 'active bg-dark border-dark' : ''
              }`}
              onClick={() => setActiveTab('dados')}
            >
              Meus Dados
            </button>
            <button
              className={`list-group-item list-group-item-action ${
                activeTab === 'enderecos' ? 'active bg-dark border-dark' : ''
              }`}
              onClick={() => setActiveTab('enderecos')}
            >
              Endereços ({currentCustomer?.enderecos?.length || 0})
            </button>
            <button
              className={`list-group-item list-group-item-action ${
                activeTab === 'cartoes' ? 'active bg-dark border-dark' : ''
              }`}
              onClick={() => setActiveTab('cartoes')}
            >
              Cartões ({currentCustomer?.cartoes?.length || 0})
            </button>
            <button
              className={`list-group-item list-group-item-action ${
                activeTab === 'cupons' ? 'active bg-dark border-dark' : ''
              }`}
              onClick={() => setActiveTab('cupons')}
            >
              Meus Cupons
            </button>
            <Link to="/profile/orders" className="list-group-item list-group-item-action text-primary fw-bold">
              Ver Meus Pedidos <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="col-md-9">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              {feedback && (
                <div className={`alert alert-${feedback.type} alert-dismissible fade show`} role="alert">
                  {feedback.text}
                  <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
                </div>
              )}

              {loading && !currentCustomer && (
                <div className="text-center py-5">
                  <div className="spinner-border text-warning" role="status"></div>
                  <p className="text-muted mt-2">Carregando dados do cliente...</p>
                </div>
              )}

              {!loading && !currentCustomer && (
                <div className="alert alert-info">
                  Nenhum cliente encontrado no sistema. Por favor,{' '}
                  <Link to="/customer/new" className="alert-link">
                    cadastre um novo cliente aqui
                  </Link>
                  .
                </div>
              )}

              {currentCustomer && activeTab === 'dados' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="fw-bold mb-0">Meus Dados Pessoais</h3>
                    <span className="badge bg-secondary">
                      Código: {currentCustomer.codigoCliente || 'CLI-000'}
                    </span>
                  </div>
                  <CustomerForm
                    initialData={currentCustomer}
                    onSubmit={handleUpdateProfile}
                    isEdit={true}
                    loading={loading}
                  />

                  <hr className="my-5" />

                  <div className="p-4 bg-light rounded border border-danger">
                    <h5 className="text-danger fw-bold mb-2">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>Zona de Perigo
                    </h5>
                    <p className="text-muted mb-3">
                      Ao inativar sua conta, você perderá acesso ao histórico de pedidos e não poderá realizar
                      novas compras até que um administrador a reative.
                    </p>
                    <button
                      className="btn btn-outline-danger fw-bold"
                      onClick={handleInactivate}
                      disabled={!currentCustomer.ativo}
                    >
                      {currentCustomer.ativo ? 'Inativar Minha Conta' : 'Conta Já Inativada'}
                    </button>
                  </div>
                </div>
              )}

              {currentCustomer && activeTab === 'enderecos' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Meus Endereços</h3>
                    <button className="btn btn-dark" onClick={() => setShowAddressModal(true)}>
                      <i className="bi bi-plus-lg me-1"></i>Novo Endereço
                    </button>
                  </div>
                  <div className="row">
                    {currentCustomer.enderecos && currentCustomer.enderecos.length > 0 ? (
                      currentCustomer.enderecos.map((end, idx) => (
                        <div key={idx} className="col-md-6 mb-3">
                          <div className="card border-warning shadow-sm h-100">
                            <div className="card-body">
                              <span className="badge bg-warning text-dark mb-2">
                                {end.tipoEndereco}
                              </span>
                              <h6 className="fw-bold fs-5">{end.identificacao}</h6>
                              <p className="mb-1 text-muted">
                                {end.logradouro}, {end.numero} - {end.bairro}
                              </p>
                              <p className="mb-3 text-muted">
                                CEP: {end.cep} - {end.cidade}, {end.estado}
                              </p>
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveAddress(idx)}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 py-4 text-center text-muted">
                        Nenhum endereço cadastrado.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentCustomer && activeTab === 'cartoes' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Meus Cartões</h3>
                    <button className="btn btn-dark" onClick={() => setShowCardModal(true)}>
                      <i className="bi bi-plus-lg me-1"></i>Novo Cartão
                    </button>
                  </div>
                  <div className="row">
                    {currentCustomer.cartoes && currentCustomer.cartoes.length > 0 ? (
                      currentCustomer.cartoes.map((cart, idx) => (
                        <div key={idx} className="col-md-6 mb-3">
                          <div className="card border-secondary shadow-sm h-100">
                            <div className="card-body d-flex flex-column">
                              <div className="d-flex align-items-center mb-3">
                                <i className="bi bi-credit-card-2-front fs-1 me-3 text-secondary"></i>
                                <div>
                                  <h5 className="fw-bold mb-1">
                                    {cart.bandeira}{' '}
                                    {cart.preferencial && (
                                      <span className="badge bg-primary fs-6">Preferencial</span>
                                    )}
                                  </h5>
                                  <p className="mb-0 text-muted">
                                    Nº: {cart.numero} - {cart.nomeImpresso}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-auto">
                                <button
                                  className="btn btn-sm btn-outline-danger w-100"
                                  onClick={() => handleRemoveCard(idx)}
                                >
                                  <i className="bi bi-trash me-2"></i>Remover Cartão
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-12 py-4 text-center text-muted">
                        Nenhum cartão cadastrado.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'cupons' && (
                <div>
                  <h3 className="fw-bold mb-4">Meus Cupons</h3>
                  <div className="alert alert-success d-flex align-items-center" role="alert">
                    <i className="bi bi-ticket-perforated-fill fs-3 me-3"></i>
                    <div>
                      <h6 className="alert-heading fw-bold mb-1">BEMVINDO10</h6>
                      <p className="mb-0 small">10% de desconto na primeira compra. Válido até 31/12/2026.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddressModal
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSave={handleAddAddress}
      />
      <CardModal
        show={showCardModal}
        onClose={() => setShowCardModal(false)}
        onSave={handleAddCard}
      />
    </div>
  );
};

export default UserProfile;
