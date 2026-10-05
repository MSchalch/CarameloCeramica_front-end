import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  img: string;
  estoque?: number;
  peso?: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const estoqueDisponivel = product.estoque ?? 0;
  const isEsgotado = estoqueDisponivel <= 0;
  const [quantidade, setQuantidade] = useState(1);

  const handleAddToCart = () => {
    if (isEsgotado) {
      alert('Este produto está indisponível em estoque (RN0031).');
      return;
    }

    if (quantidade < 1) {
      alert('A quantidade mínima é 1 unidade.');
      return;
    }

    if (quantidade > estoqueDisponivel) {
      alert(`Quantidade superior ao estoque disponível (${estoqueDisponivel} un.) (RN0031).`);
      return;
    }

    const saved = localStorage.getItem('caramelo_cart');
    let cart: any[] = saved ? JSON.parse(saved) : [];

    const existingIndex = cart.findIndex((i: any) => i.id === product.id);
    if (existingIndex >= 0) {
      const novaQtd = cart[existingIndex].quantidade + quantidade;
      if (novaQtd > estoqueDisponivel) {
        alert(
          `Não é possível adicionar ${quantidade} un. Você já tem ${cart[existingIndex].quantidade} un. no carrinho e o estoque é de ${estoqueDisponivel} un. (RN0031)`
        );
        return;
      }
      cart[existingIndex].quantidade = novaQtd;
    } else {
      cart.push({
        id: product.id,
        nome: product.name,
        preco: product.price,
        imagemUrl: product.img,
        categoria: product.category,
        quantidade: quantidade,
        estoque: estoqueDisponivel,
        peso: product.peso || 500,
      });
    }

    localStorage.setItem('caramelo_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/cart');
  };

  return (
    <div className="card h-100 shadow-sm border-0 product-card">
      <img src={product.img} className="card-img-top product-card-img" alt={product.name} />
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="badge bg-light text-dark">{product.category}</span>
          {isEsgotado ? (
            <span className="badge bg-danger">Esgotado</span>
          ) : (
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              {estoqueDisponivel} em estoque
            </span>
          )}
        </div>
        <h5 className="card-title fw-bold">{product.name}</h5>
        <h6 className="card-subtitle mb-3 text-muted">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
        </h6>

        <div className="mt-auto">
          {/* Edição de quantidade no momento da adição (RF0032) */}
          {!isEsgotado && (
            <div className="d-flex align-items-center mb-2">
              <span className="small text-muted me-2">Qtd:</span>
              <div className="input-group input-group-sm" style={{ width: '120px' }}>
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantidade((prev) => Math.max(1, prev - 1))}
                  disabled={quantidade <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  className="form-control text-center input-quantidade-adicao"
                  value={quantidade}
                  min={1}
                  max={estoqueDisponivel}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setQuantidade(1);
                      return;
                    }
                    const val = parseInt(raw, 10);
                    if (!isNaN(val)) {
                      setQuantidade(Math.max(1, Math.min(estoqueDisponivel, val)));
                    }
                  }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setQuantidade((prev) => Math.min(estoqueDisponivel, prev + 1))}
                  disabled={quantidade >= estoqueDisponivel}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="btn btn-warning w-100 fw-bold shadow-sm btn-adicionar-carrinho"
            disabled={isEsgotado}
          >
            <i className="bi bi-cart-plus me-1"></i>
            {isEsgotado ? 'Indisponível' : 'Adicionar ao Carrinho'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
