import { useState } from 'react';
import CustomerForm, { type CustomerData } from '../CustomerForm';
import AddressModal from '../AddressModal';
import CardModal from '../CardModal';

interface CustomerProfileModalProps {
  show: boolean;
  onClose: () => void;
  customer: any;
}

const CustomerProfileModal = ({ show, onClose, customer }: CustomerProfileModalProps) => {
  const [activeTab, setActiveTab] = useState('dados');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  if (!show || !customer) return null;

  const mockProfile: CustomerData = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    cpf: customer.cpf,
    phone: '(11) 99999-9999', // mock
    gender: 'Feminino',
    birthDate: '1995-01-01',
    address: 'Endereço principal...'
  };

  const handleUpdateProfile = (data: CustomerData) => {
    alert('Perfil atualizado pelo admin (MOCK)!');
    onClose();
  };

  return (
    <>
      <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-scrollable modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-light border-0">
              <h5 className="modal-title fw-bold d-flex align-items-center">
                <i className="bi bi-person-gear fs-4 text-primary me-2"></i>
                Gerenciar Perfil: {customer.name}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body p-4">
              
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'dados' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('dados')}>Dados Pessoais</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'enderecos' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('enderecos')}>Endereços</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${activeTab === 'cartoes' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('cartoes')}>Cartões</button>
                </li>
              </ul>

              <div className="tab-content">
                {activeTab === 'dados' && (
                  <div>
                    <CustomerForm initialData={mockProfile} onSubmit={handleUpdateProfile} isEdit={true} />
                    <hr className="my-4" />
                    <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
                      <div>
                        <h6 className="text-danger mb-1 fw-bold">Status da Conta</h6>
                        <p className="text-muted mb-0 small">Você pode inativar ou reativar esta conta.</p>
                      </div>
                      <button className="btn btn-outline-danger fw-bold">
                        <i className="bi bi-power me-2"></i>{customer.status === 'Ativo' ? 'Inativar' : 'Reativar'} Conta
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'enderecos' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold">Endereços Cadastrados</h5>
                      <button className="btn btn-sm btn-dark" onClick={() => setShowAddressModal(true)}><i className="bi bi-plus-lg me-1"></i>Novo Endereço</button>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="card border-warning shadow-sm">
                          <div className="card-body">
                            <span className="badge bg-warning text-dark mb-2">Principal</span>
                            <h6 className="fw-bold">Casa</h6>
                            <p className="mb-1 small text-muted">Rua das Flores, 123 - Apto 45</p>
                            <p className="mb-2 small text-muted">CEP: 01234-567 - São Paulo, SP</p>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-secondary">Editar</button>
                              <button className="btn btn-sm btn-outline-danger">Remover</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'cartoes' && (
                  <div>
                     <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold">Cartões Cadastrados</h5>
                      <button className="btn btn-sm btn-dark" onClick={() => setShowCardModal(true)}><i className="bi bi-plus-lg me-1"></i>Novo Cartão</button>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="card border-secondary shadow-sm">
                          <div className="card-body d-flex align-items-center">
                            <i className="bi bi-credit-card-2-front fs-1 me-3 text-secondary"></i>
                            <div>
                              <h6 className="fw-bold mb-1">Cartão Final 4321</h6>
                              <p className="mb-0 small text-muted">Mastercard - Vence em 12/29</p>
                            </div>
                            <button className="btn btn-sm btn-outline-danger ms-auto"><i className="bi bi-trash"></i></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <AddressModal show={showAddressModal} onClose={() => setShowAddressModal(false)} />
      <CardModal show={showCardModal} onClose={() => setShowCardModal(false)} />
    </>
  );
};

export default CustomerProfileModal;
