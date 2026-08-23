import { useState } from 'react';
import CustomerForm, { type CustomerData } from '../../components/CustomerForm';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('dados');

  // Mock dados do perfil
  const mockProfile: CustomerData = {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    gender: 'Masculino',
    birthDate: '1990-05-15',
    address: 'Rua das Flores, 123 - São Paulo, SP'
  };

  const handleUpdateProfile = (data: CustomerData) => {
    console.log('Atualizar perfil:', data);
    alert('Perfil atualizado com sucesso (MOCK)!');
  };

  const handleInactivate = () => {
    if (window.confirm('Tem certeza que deseja inativar sua conta? Esta ação não pode ser desfeita.')) {
      alert('Conta inativada com sucesso!');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4 d-flex align-items-center">
              <i className="bi bi-person-circle fs-2 text-warning me-3"></i>
              <div>
                <h3 className="fw-bold mb-0">Meu Perfil</h3>
                <p className="text-muted mb-0">Gerencie sua conta, endereços, cartões e cupons.</p>
              </div>
            </div>
            <div className="card-body p-4">
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button className={"nav-link "} onClick={() => setActiveTab('dados')}>Meus Dados</button>
                </li>
                <li className="nav-item">
                  <button className={"nav-link "} onClick={() => setActiveTab('enderecos')}>Endereços</button>
                </li>
                <li className="nav-item">
                  <button className={"nav-link "} onClick={() => setActiveTab('cartoes')}>Cartões</button>
                </li>
                <li className="nav-item">
                  <button className={"nav-link "} onClick={() => setActiveTab('cupons')}>Meus Cupons</button>
                </li>
              </ul>

              <div className="tab-content">
                {activeTab === 'dados' && (
                  <div>
                    <CustomerForm initialData={mockProfile} onSubmit={handleUpdateProfile} isEdit={true} />
                    <hr className="my-4" />
                    <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
                      <div>
                        <h5 className="text-danger mb-1 fw-bold">Zona de Perigo</h5>
                        <p className="text-muted mb-0 small">Ao inativar sua conta, você perderá acesso ao sistema.</p>
                      </div>
                      <button className="btn btn-outline-danger fw-bold" onClick={handleInactivate}>
                        <i className="bi bi-trash me-2"></i>Inativar Conta
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'enderecos' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold">Meus Endereços</h5>
                      <button className="btn btn-sm btn-dark" onClick={() => alert('Abrir modal de novo endereço (Em desenvolvimento)')}><i className="bi bi-plus-lg me-1"></i>Novo Endereço</button>
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
                      <h5 className="fw-bold">Meus Cartões</h5>
                      <button className="btn btn-sm btn-dark" onClick={() => alert('Abrir modal de novo cartão (Em desenvolvimento)')}><i className="bi bi-plus-lg me-1"></i>Novo Cartão</button>
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

                {activeTab === 'cupons' && (
                  <div>
                    <h5 className="fw-bold mb-3">Meus Cupons de Troca / Promocionais</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Código</th>
                            <th>Tipo</th>
                            <th>Valor/Desconto</th>
                            <th>Validade</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="fw-bold text-success">TROCA123</td>
                            <td>Troca</td>
                            <td>R$ 45,50</td>
                            <td>31/12/2026</td>
                            <td><span className="badge bg-success">Disponível</span></td>
                          </tr>
                          <tr>
                            <td className="fw-bold text-warning">BEMVINDO10</td>
                            <td>Promocional</td>
                            <td>10% OFF</td>
                            <td>30/11/2026</td>
                            <td><span className="badge bg-success">Disponível</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
