import ProductForm, { type ProductData } from '../ProductForm';

interface ProductEditModalProps {
  show: boolean;
  onClose: () => void;
  product: any;
}

const ProductEditModal = ({ show, onClose, product }: ProductEditModalProps) => {
  if (!show || !product) return null;

  // Mock data mapping
  const mockProduct: ProductData = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: 'Estúdio Caramelo', // mock
    category: product.category,
    material: 'Argila Vermelha / Esmalte Transparente', // mock
    dimensions: '15x8cm', // mock
    weight: 350, // mock
    priceGroup: 'Premium' // mock
  };

  const handleUpdateProduct = (data: ProductData) => {
    alert('Peça atualizada com sucesso pelo Admin (MOCK)!');
    onClose();
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-box-seam fs-4 text-warning me-2"></i>
              Editar Peça: {product.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <ProductForm initialData={mockProduct} onSubmit={handleUpdateProduct} isEdit={true} />
            <hr className="my-4" />
            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
              <div>
                <h6 className="text-danger mb-1 fw-bold">Status do Produto no Catálogo</h6>
                <p className="text-muted mb-0 small">Controla se o produto fica visível e disponível para compra na loja.</p>
              </div>
              <button className="btn btn-outline-danger fw-bold">
                <i className="bi bi-power me-2"></i>{product.status === 'Ativo' ? 'Inativar' : 'Reativar'} Produto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditModal;
