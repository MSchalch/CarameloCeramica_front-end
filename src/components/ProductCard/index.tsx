import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../../services/cartService';

export interface ProductCardProps {
  id: number;
  sku?: string;
  name: string;
  artesaoMarca?: string;
  price: number;
  category: string;
  categoriasAdicionais?: string[];
  img: string;
  estoque?: number;
  peso?: number;
  altura?: number;
  diametro?: number;
  volume?: number;
  tipoArgila?: string;
  tipoEsmalte?: string;
  vaiAoForno?: boolean;
  vaiAoMicroondas?: boolean;
}

const ProductCard = ({ product }: { product: ProductCardProps }) => {
  const navigate = useNavigate();
  const estoqueDisponivel = product.estoque ?? 0;
  const isEsgotado = estoqueDisponivel <= 0;
  const [quantidade, setQuantidade] = useState<number | ''>(1);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  const handleAddToCart = () => {
    if (isEsgotado) {
      alert('Este produto está indisponível em estoque (RN0031).');
      return;
    }

    const qtdNum = Number(quantidade) || 1;

    if (qtdNum < 1) {
      alert('A quantidade mínima é 1 unidade.');
      return;
    }

    if (qtdNum > estoqueDisponivel) {
      alert(`Quantidade superior ao estoque disponível (${estoqueDisponivel} un.) (RN0031).`);
      return;
    }

    const cart = [...cartService.getCart()];

    const existingIndex = cart.findIndex((i: any) => i.id === product.id);
    if (existingIndex >= 0) {
      const novaQtd = cart[existingIndex].quantidade + qtdNum;
      if (novaQtd > estoqueDisponivel) {
        alert(
          `Não é possível adicionar ${qtdNum} un. Você já tem ${cart[existingIndex].quantidade} un. no carrinho e o estoque é de ${estoqueDisponivel} un. (RN0031)`
        );
        return;
      }
      cart[existingIndex].quantidade = novaQtd;
    } else {
      cart.push({
        id: product.id,
        sku: product.sku,
        nome: product.name,
        artesaoMarca: product.artesaoMarca,
        preco: product.price,
        imagemUrl: product.img,
        categoria: product.category,
        categoriasAdicionais: product.categoriasAdicionais,
        quantidade: qtdNum,
        estoque: estoqueDisponivel,
        peso: product.peso || 500,
        altura: product.altura,
        diametro: product.diametro,
        volume: product.volume,
        tipoArgila: product.tipoArgila,
        tipoEsmalte: product.tipoEsmalte,
        vaiAoForno: product.vaiAoForno,
        vaiAoMicroondas: product.vaiAoMicroondas,
      });
    }

    cartService.saveCart(cart);
    setMostrarDetalhes(false);
    navigate('/cart');
  };

  return (
    <>
      <div className="card h-100 shadow-sm border-0 product-card">
        <div
          className="position-relative overflow-hidden"
          style={{ cursor: 'pointer' }}
          onClick={() => setMostrarDetalhes(true)}
          title="Clique para ver detalhes e ficha técnica da peça"
          data-testid={`product-card-img-trigger-${product.id}`}
        >
          <img
            src={product.img}
            className="card-img-top product-card-img"
            alt={product.name}
            style={{ transition: 'transform 0.25s ease' }}
          />
          <span
            className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-2 px-2 py-1"
            style={{ fontSize: '0.75rem', fontWeight: 500 }}
          >
            <i className="bi bi-eye me-1"></i>Ver detalhes
          </span>
        </div>

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

          <h5
            className="card-title fw-bold mb-1"
            style={{ cursor: 'pointer' }}
            onClick={() => setMostrarDetalhes(true)}
            title="Clique para ver detalhes da peça"
          >
            {product.name}
          </h5>

          {(product.tipoArgila || product.tipoEsmalte) && (
            <small className="text-muted mb-2 d-block" style={{ fontSize: '0.82rem' }}>
              {product.tipoArgila ? `Argila ${product.tipoArgila}` : ''}
              {product.tipoArgila && product.tipoEsmalte ? ' • ' : ''}
              {product.tipoEsmalte ? `Esmalte ${product.tipoEsmalte}` : ''}
            </small>
          )}

          <h6 className="card-subtitle mb-3 text-dark fw-bold fs-5">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              product.price
            )}
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
                    onClick={() => setQuantidade((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                    disabled={(Number(quantidade) || 1) <= 1}
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
                        setQuantidade('');
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        setQuantidade(Math.max(1, Math.min(estoqueDisponivel, val)));
                      }
                    }}
                    onBlur={() => {
                      if (quantidade === '' || Number(quantidade) < 1) {
                        setQuantidade(1);
                      }
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() =>
                      setQuantidade((prev) =>
                        Math.min(estoqueDisponivel, (Number(prev) || 1) + 1)
                      )
                    }
                    disabled={(Number(quantidade) || 1) >= estoqueDisponivel}
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

      {/* Modal de Detalhes e Ficha Técnica da Peça para o Cliente */}
      {mostrarDetalhes && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
          onClick={() => setMostrarDetalhes(false)}
          data-testid="product-details-modal"
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white border-0">
                <div>
                  <h5 className="modal-title fw-bold mb-0">{product.name}</h5>
                  {product.artesaoMarca && (
                    <small className="text-white-50">
                      Artesão / Ateliê: <strong>{product.artesaoMarca}</strong>
                      {product.sku ? ` • SKU: ${product.sku}` : ''}
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setMostrarDetalhes(false)}
                  aria-label="Fechar"
                />
              </div>

              <div className="modal-body p-4">
                <div className="row g-4 align-items-center">
                  <div className="col-md-5">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="img-fluid rounded-3 shadow-sm w-100"
                      style={{ maxHeight: '320px', objectFit: 'cover' }}
                    />
                  </div>

                  <div className="col-md-7">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span className="badge bg-secondary">{product.category}</span>
                      {product.categoriasAdicionais &&
                        product.categoriasAdicionais
                          .filter((c) => c !== product.category)
                          .map((cat, i) => (
                            <span key={i} className="badge bg-light text-dark border">
                              {cat}
                            </span>
                          ))}
                      {isEsgotado ? (
                        <span className="badge bg-danger">Esgotado</span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {estoqueDisponivel} unidades em estoque
                        </span>
                      )}
                    </div>

                    <h3 className="fw-bold text-success mb-3">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(product.price)}
                    </h3>

                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                      <i className="bi bi-sliders me-2 text-warning"></i>
                      Ficha Técnica Artesanal
                    </h6>

                    <div className="row g-2 mb-3" style={{ fontSize: '0.92rem' }}>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Tipo de Argila</small>
                          <strong>{product.tipoArgila || 'Cerâmica Artesanal'}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Acabamento / Esmalte</small>
                          <strong>{product.tipoEsmalte || 'Esmalte Mineral'}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Dimensões (Alt. × Diâm.)</small>
                          <strong>
                            {product.altura ? `${product.altura} cm` : '-'} ×{' '}
                            {product.diametro ? `${product.diametro} cm` : '-'}
                          </strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Peso / Capacidade</small>
                          <strong>
                            {product.peso ? `${product.peso} g` : '-'}
                            {product.volume && product.volume > 0 ? ` • ${product.volume} ml` : ''}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-4">
                      <span
                        className={`badge px-3 py-2 ${
                          product.vaiAoForno
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-secondary-subtle text-secondary border'
                        }`}
                      >
                        <i
                          className={`bi ${
                            product.vaiAoForno ? 'bi-check-circle-fill' : 'bi-x-circle'
                          } me-1`}
                        ></i>
                        Forno: {product.vaiAoForno ? 'Sim (até 1240°C)' : 'Não indicado'}
                      </span>

                      <span
                        className={`badge px-3 py-2 ${
                          product.vaiAoMicroondas
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-secondary-subtle text-secondary border'
                        }`}
                      >
                        <i
                          className={`bi ${
                            product.vaiAoMicroondas ? 'bi-check-circle-fill' : 'bi-x-circle'
                          } me-1`}
                        ></i>
                        Micro-ondas: {product.vaiAoMicroondas ? 'Sim' : 'Não indicado'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isEsgotado}
                        className="btn btn-warning fw-bold px-4 py-2 flex-grow-1 shadow-sm"
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        {isEsgotado ? 'Produto Indisponível' : 'Adicionar ao Carrinho'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-3 py-2"
                        onClick={() => setMostrarDetalhes(false)}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
