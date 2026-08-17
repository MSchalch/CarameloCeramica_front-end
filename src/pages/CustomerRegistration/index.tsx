import CustomerForm, { type CustomerData } from '../../components/CustomerForm';

const CustomerRegistration = () => {
  const handleCreateCustomer = (data: CustomerData) => {
    console.log('Criar cliente:', data);
    alert('Cliente cadastrado com sucesso (MOCK)!');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4">
              <h3 className="fw-bold mb-0">Novo Cliente</h3>
              <p className="text-muted">Preencha os dados abaixo para cadastrar um novo cliente na plataforma.</p>
            </div>
            <div className="card-body p-4">
              <CustomerForm onSubmit={handleCreateCustomer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegistration;
