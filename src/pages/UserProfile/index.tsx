import CustomerForm, { type CustomerData } from '../../components/CustomerForm';

const UserProfile = () => {
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

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4 d-flex align-items-center">
              <i className="bi bi-person-circle fs-2 text-warning me-3"></i>
              <div>
                <h3 className="fw-bold mb-0">Meu Perfil</h3>
                <p className="text-muted mb-0">Visualize e edite suas informações pessoais.</p>
              </div>
            </div>
            <div className="card-body p-4">
              <CustomerForm initialData={mockProfile} onSubmit={handleUpdateProfile} isEdit={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
