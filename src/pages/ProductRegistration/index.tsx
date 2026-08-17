import ProductForm, { type ProductData } from '../../components/ProductForm';

const ProductRegistration = () => {
  const handleCreateProduct = (data: ProductData) => {
    console.log('Criar produto:', data);
    alert('Peça cadastrada com sucesso (MOCK)!');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4">
              <h3 className="fw-bold mb-0">Nova Peça de Cerâmica</h3>
              <p className="text-muted">Preencha as informações para registrar uma nova peça no catálogo.</p>
            </div>
            <div className="card-body p-4">
              <ProductForm onSubmit={handleCreateProduct} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRegistration;
