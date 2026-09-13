import { useState, useEffect } from 'react';
import CustomerForm from '../CustomerForm';
import AddressModal from '../AddressModal';
import CardModal from '../CardModal';
import { customerService } from '../../services/customerService';
import type { Cliente, Endereco, CartaoCredito } from '../../types/customer';

interface CustomerProfileModalProps {
  show: boolean;
  onClose: () => void;
  customer: Cliente | null;
}

const CustomerProfileModal = ({ show, onClose, customer }: CustomerProfileModalProps) => {
  const [activeTab, setActiveTab] = useState('dados');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (customer?.id) {
      loadFullCustomer(customer.id);
    } else {
      setCurrentCustomer(null);
    }
  }, [customer]);

  const loadFullCustomer = async (id: number) => {
    try {
      const data = await customerService.buscarPorId(id);
      setCurrentCustomer(data);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes do cliente:', err);
      setCurrentCustomer(customer);
    }
  };

  if (!show || !customer) return null;

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
      setFeedback({ type: 'success', text: msg || 'Cliente atualizado com sucesso!' });
      await loadFullCustomer(currentCustomer.id!);
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Erro ao atualizar cliente.';
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
      await loadFullCustomer(currentCustomer.id!);
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
        await loadFullCustomer(currentCustomer.id!);
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
      await loadFullCustomer(currentCustomer.id!);
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
        await loadFullCustomer(currentCustomer.id!);
      } catch (err: any) {
        alert('Erro ao remover cartão: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!currentCustomer) return;
    const novoStatus = !currentCustomer.ativo;
    try {
      await customerService.atualizarCliente({
        ...currentCustomer,
        ativo: novoStatus,
      });
      setFeedback({
        type: 'success',
        text: `Cliente ${novoStatus ? 'reativado' : 'inativado'} com sucesso!`,
      });
      await loadFullCustomer(currentCustomer.id!);
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err.response?.data || err.message));
    }
  };

  return (
    <>
      <div className="modal fade show custom-modal-overlay d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-scrollable modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-light border-0">
              <h5 className="modal-title fw-bold d-flex align-items-center">
                <i className="bi bi-person-gear fs-4 text-primary me-2"></i>
                Gerenciar Perfil: {currentCustomer?.nome || customer.nome}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body p-4">
              {feedback && (
                <div className={`alert alert-${feedback.type} alert-dismissible fade show`} role="alert">
                  {feedback.text}
                  <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
                </div>
              )}

              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'dados' ? 'active fw-bold' : ''}`}
                    onClick={() => setActiveTab('dados')}
                  >
                    Dados Pessoais
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'enderecos' ? 'active fw-bold' : ''}`}
                    onClick={() => setActiveTab('enderecos')}
                  >
                    Endereços ({currentCustomer?.enderecos?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'cartoes' ? 'active fw-bold' : ''}`}
                    onClick={() => setActiveTab('cartoes')}
                  >
                    Cartões ({currentCustomer?.cartoes?.length || 0})
                  </button>
                </li>
              </ul>

              <div className="tab-content">
                {activeTab === 'dados' && (
                  <div>
                    {currentCustomer && (
                      <CustomerForm
                        initialData={currentCustomer}
                        onSubmit={handleUpdateProfile}
                        isEdit={true}
                        loading={loading}
                      />
                    )}
                    <hr className="my-4" />
                    <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
                      <div>
                        <h6 className="text-danger mb-1 fw-bold">Status da Conta</h6>
                        <p className="text-muted mb-0 small">
                          Situação atual:{' '}
                          <strong>{currentCustomer?.ativo ? 'Ativo' : 'Inativo'}</strong>
                        </p>
                      </div>
                      <button
                        className={`btn ${currentCustomer?.ativo ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold`}
                        onClick={handleToggleStatus}
                      >
                        <i className="bi bi-power me-2"></i>
                        {currentCustomer?.ativo ? 'Inativar Conta' : 'Reativar Conta'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'enderecos' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Endereços Cadastrados</h5>
                      <button className="btn btn-sm btn-dark" onClick={() => setShowAddressModal(true)}>
                        <i className="bi bi-plus-lg me-1"></i>Novo Endereço
                      </button>
                    </div>

                    <div className="row">
                      {currentCustomer?.enderecos && currentCustomer.enderecos.length > 0 ? (
                        currentCustomer.enderecos.map((end, idx) => (
                          <div key={idx} className="col-md-6 mb-3">
                            <div className="card border-warning shadow-sm h-100">
                              <div className="card-body">
                                <span className="badge bg-warning text-dark mb-2">
                                  {end.tipoEndereco}
                                </span>
                                <h6 className="fw-bold mb-1">{end.identificacao}</h6>
                                <p className="mb-1 small text-muted">
                                  {end.logradouro}, {end.numero} - {end.bairro}
                                </p>
                                <p className="mb-2 small text-muted">
                                  CEP: {end.cep} - {end.cidade}, {end.estado}
                                </p>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveAddress(idx)}
                                >
                                  <i className="bi bi-trash me-1"></i>Remover
                                </button>
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

                {activeTab === 'cartoes' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">Cartões Cadastrados</h5>
                      <button className="btn btn-sm btn-dark" onClick={() => setShowCardModal(true)}>
                        <i className="bi bi-plus-lg me-1"></i>Novo Cartão
                      </button>
                    </div>

                    <div className="row">
                      {currentCustomer?.cartoes && currentCustomer.cartoes.length > 0 ? (
                        currentCustomer.cartoes.map((cart, idx) => (
                          <div key={idx} className="col-md-6 mb-3">
                            <div className="card border-secondary shadow-sm">
                              <div className="card-body d-flex align-items-center">
                                <i className="bi bi-credit-card-2-front fs-1 me-3 text-secondary"></i>
                                <div>
                                  <h6 className="fw-bold mb-1">
                                    {cart.bandeira} {cart.preferencial && <span className="badge bg-primary">Preferencial</span>}
                                  </h6>
                                  <p className="mb-0 small text-muted">
                                    Nº: {cart.numero} - {cart.nomeImpresso}
                                  </p>
                                </div>
                                <button
                                  className="btn btn-sm btn-outline-danger ms-auto"
                                  onClick={() => handleRemoveCard(idx)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
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
              </div>
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
    </>
  );
};

export default CustomerProfileModal;
