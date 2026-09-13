import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from '../../components/ProductForm';
import { productService } from '../../services/productService';
import type { Peca } from '../../types/product';

const ProductRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCreateProduct = async (data: Peca) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const msg = await productService.cadastrarPeca(data);
      setSuccessMessage(msg || 'Peça cadastrada com sucesso!');
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao cadastrar peça:', error);
      const msg = error.response?.data || error.message || 'Erro ao cadastrar peça no servidor.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4">
              <h3 className="fw-bold mb-1">Nova Peça de Cerâmica</h3>
              <p className="text-muted">
                Preencha as informações técnicas, dimensões e precificação para registrar no catálogo.
              </p>
            </div>
            <div className="card-body p-4">
              {errorMessage && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Erro:</strong> {errorMessage}
                  <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}></button>
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {successMessage}
                </div>
              )}

              <ProductForm onSubmit={handleCreateProduct} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRegistration;
