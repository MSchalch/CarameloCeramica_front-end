import { useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerForm, { type CustomerData } from '../../components/CustomerForm';
import AddressModal from '../../components/AddressModal';
import CardModal from '../../components/CardModal';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('dados');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  // Dados mockados
  const mockProfile: CustomerData = {
    id: 999,
    name: 'Maria Oliveira',
    email: 'maria@email.com',
    cpf: '987.654.321-11',
    phone: '(11) 98888-7777',
    gender: 'Feminino',
    birthDate: '1990-05-15',
    address: ''
  };

  const handleUpdateProfile = (data: CustomerData) => {
    alert('Dados atualizados com sucesso (MOCK)!');
  };

  const handleInactivate = () => {
    if (confirm('Tem certeza que deseja inativar sua conta? Você não poderá mais realizar compras.')) {
      alert('Conta inativada (MOCK).');
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        {/* Menu Lateral */}
        <div className="col-md-3 mb-4">
          <div className="list-group shadow-sm">
            <button className={`list-group-item list-group-item-action ${activeTab === 'dados' ? 'active bg-dark border-dark' : ''}`} onClick={() => setActiveTab('dados')}>Meus Dados</button>
            <button className={`list-group-item list-group-item-action ${activeTab === 'enderecos' ? 'active bg-dark border-dark' : ''}`} onClick={() => setActiveTab('enderecos')}>Endereços</button>
            <button className={`list-group-item list-group-item-action ${activeTab === 'cartoes' ? 'active bg-dark border-dark' : ''}`} onClick={() => setActiveTab('cartoes')}>Cartões</button>
            <button className={`list-group-item list-group-item-action ${activeTab === 'cupons' ? 'active bg-dark border-dark' : ''}`} onClick={() => setActiveTab('cupons')}>Meus Cupons</button>
            <Link to="/profile/orders" className="list-group-item list-group-item-action text-primary fw-bold">Ver Meus Pedidos <i className="bi bi-arrow-right"></i></Link>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="col-md-9">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              
              {activeTab === 'dados' && (
                <div>
                  <h3 className="fw-bold mb-4">Meus Dados Pessoais</h3>
                  <CustomerForm initialData={mockProfile} onSubmit={handleUpdateProfile} isEdit={true} />
                  
                  <hr className="my-5" />
                  
                  <div className="p-4 bg-light rounded border border-danger">
                    <h5 className="text-danger fw-bold mb-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>Zona de Perigo</h5>
                    <p className="text-muted mb-3">Ao inativar sua conta, você perderá acesso ao histórico de pedidos e não poderá realizar novas compras até que um administrador a reative.</p>
                    <button className="btn btn-outline-danger fw-bold" onClick={handleInactivate}>
                      Inativar Minha Conta
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'enderecos' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Meus Endereços</h3>
                    <button className="btn btn-dark" onClick={() => setShowAddressModal(true)}><i className="bi bi-plus-lg me-1"></i>Novo Endereço</button>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="card border-warning shadow-sm h-100">
                        <div className="card-body">
                          <span className="badge bg-warning text-dark mb-2">Endereço Principal</span>
                          <h6 className="fw-bold fs-5">Casa</h6>
                          <p className="mb-1 text-muted">Rua das Flores, 123 - Apto 45</p>
                          <p className="mb-3 text-muted">Bairro Jardim Primavera<br/>CEP: 01234-567 - São Paulo, SP</p>
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
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Meus Cartões</h3>
                    <button className="btn btn-dark" onClick={() => setShowCardModal(true)}><i className="bi bi-plus-lg me-1"></i>Novo Cartão</button>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="card border-secondary shadow-sm h-100">
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex align-items-center mb-3">
                            <i className="bi bi-credit-card-2-front fs-1 me-3 text-secondary"></i>
                            <div>
                              <h5 className="fw-bold mb-1">Cartão Final 4321</h5>
                              <p className="mb-0 text-muted">Mastercard - Vence em 12/29</p>
                            </div>
                          </div>
                          <div className="mt-auto">
                            <button className="btn btn-sm btn-outline-danger w-100"><i className="bi bi-trash me-2"></i>Remover Cartão</button>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <div className="alert alert-secondary d-flex align-items-center" role="alert">
                    <i className="bi bi-ticket-perforated-fill fs-3 me-3 text-muted"></i>
                    <div>
                      <h6 className="alert-heading fw-bold mb-1 text-muted">TROCA-XJ90 (Usado)</h6>
                      <p className="mb-0 small text-muted">Cupom de troca no valor de R$ 89,90. Utilizado em 10/08/2026.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      
      <AddressModal show={showAddressModal} onClose={() => setShowAddressModal(false)} />
      <CardModal show={showCardModal} onClose={() => setShowCardModal(false)} />
    </div>
  );
};

export default UserProfile;
