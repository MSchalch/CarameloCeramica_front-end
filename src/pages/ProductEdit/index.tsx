import { useParams } from 'react-router-dom';
import ProductForm, { type ProductData } from '../../components/ProductForm';

const ProductEdit = () => {
  const { id } = useParams();

  // Mock dados do produto (em um app real viria da API pelo ID)
  const mockProduct: ProductData = {
    id: Number(id) || 1,
    sku: 'BOWL-001',
    name: 'Tigela Rústica Caramelo',
    brand: 'Estúdio Caramelo',
    category: 'Bowls',
    material: 'Argila Vermelha / Esmalte Transparente',
    dimensions: '15x8cm, 350g',
    priceGroup: 'Premium'
  };

  const handleUpdateProduct = (data: ProductData) => {
    console.log('Atualizar produto:', data);
    alert('Peça atualizada com sucesso (MOCK)!');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4 d-flex align-items-center">
              <i className="bi bi-box-seam fs-2 text-warning me-3"></i>
              <div>
                <h3 className="fw-bold mb-0">Editar Peça</h3>
                <p className="text-muted mb-0">Altere as informações da peça de cerâmica selecionada.</p>
              </div>
            </div>
            <div className="card-body p-4">
              <ProductForm initialData={mockProduct} onSubmit={handleUpdateProduct} isEdit={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
