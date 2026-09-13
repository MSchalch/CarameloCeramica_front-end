import { useState, useEffect } from 'react';
import ProductForm from '../ProductForm';
import { productService } from '../../services/productService';
import type { Peca } from '../../types/product';

interface ProductEditModalProps {
  show: boolean;
  onClose: () => void;
  product: Peca | null;
}

const ProductEditModal = ({ show, onClose, product }: ProductEditModalProps) => {
  const [currentProduct, setCurrentProduct] = useState<Peca | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    if (product?.id) {
      loadFullProduct(product.id);
    } else {
      setCurrentProduct(null);
    }
  }, [product]);

  const loadFullProduct = async (id: number) => {
    try {
      const data = await productService.buscarPorId(id);
      setCurrentProduct(data);
    } catch (err: any) {
      console.error('Erro ao buscar dados da peça:', err);
      setCurrentProduct(product);
    }
  };

  if (!show || !product) return null;

  const handleUpdateProduct = async (dadosAtualizados: Peca) => {
    if (!currentProduct) return;
    setLoading(true);
    setFeedback(null);

    const payload: Peca = {
      ...currentProduct,
      ...dadosAtualizados,
      id: currentProduct.id,
    };

    try {
      const msg = await productService.atualizarPeca(payload);
      setFeedback({ type: 'success', text: msg || 'Peça atualizada com sucesso!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Erro ao atualizar peça.';
      setFeedback({ type: 'danger', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!currentProduct) return;
    const novoStatus = !currentProduct.ativo;
    try {
      await productService.atualizarPeca({
        ...currentProduct,
        ativo: novoStatus,
        motivoInativacao: !novoStatus ? 'Inativação via painel rápido' : undefined,
        categoriaInativacao: !novoStatus ? 'GERENCIAL' : undefined,
      });
      setFeedback({
        type: 'success',
        text: `Peça ${novoStatus ? 'reativada' : 'inativada'} com sucesso!`,
      });
      await loadFullProduct(currentProduct.id!);
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="modal fade show custom-modal-overlay d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-box-seam fs-4 text-warning me-2"></i>
              Editar Peça: {currentProduct?.nome || product.nome}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            {feedback && (
              <div className={`alert alert-${feedback.type} alert-dismissible fade show`} role="alert">
                {feedback.text}
                <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
              </div>
            )}

            {currentProduct && (
              <ProductForm
                initialData={currentProduct}
                onSubmit={handleUpdateProduct}
                isEdit={true}
                loading={loading}
              />
            )}

            <hr className="my-4" />
            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
              <div>
                <h6 className="text-danger mb-1 fw-bold">Status da Peça no Catálogo</h6>
                <p className="text-muted mb-0 small">
                  Situação atual: <strong>{currentProduct?.ativo ? 'Ativo' : 'Inativo'}</strong>
                </p>
              </div>
              <button
                className={`btn ${currentProduct?.ativo ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold`}
                onClick={handleToggleStatus}
              >
                <i className={`bi ${currentProduct?.ativo ? 'bi-power' : 'bi-check-circle'} me-2`}></i>
                {currentProduct?.ativo ? 'Inativar Peça' : 'Reativar Peça'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductEditModal;
