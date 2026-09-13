import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../../components/ProductForm';
import { productService } from '../../services/productService';
import type { Peca } from '../../types/product';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Peca | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      productService
        .buscarPorId(Number(id))
        .then((data) => setProduct(data))
        .catch((err) => {
          console.error('Erro ao buscar peça:', err);
          setErrorMessage('Não foi possível encontrar a peça selecionada.');
        });
    }
  }, [id]);

  const handleUpdateProduct = async (data: Peca) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const msg = await productService.atualizarPeca(data);
      setSuccessMessage(msg || 'Peça atualizada com sucesso!');
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao atualizar peça:', err);
      const msg = err.response?.data || err.message || 'Erro ao atualizar peça.';
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
            <div className="card-header bg-white pb-0 border-0 pt-4 px-4 d-flex align-items-center">
              <i className="bi bi-box-seam fs-2 text-warning me-3"></i>
              <div>
                <h3 className="fw-bold mb-0">Editar Peça de Cerâmica</h3>
                <p className="text-muted mb-0">Altere as especificações técnicas, preço e dados da peça.</p>
              </div>
            </div>
            <div className="card-body p-4">
              {errorMessage && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {errorMessage}
                  <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}></button>
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  {successMessage}
                </div>
              )}

              {product ? (
                <ProductForm initialData={product} onSubmit={handleUpdateProduct} isEdit={true} loading={loading} />
              ) : (
                <div className="text-center py-5">
                  <div className="spinner-border text-warning" role="status"></div>
                  <p className="text-muted mt-2">Carregando dados da peça...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEdit;
