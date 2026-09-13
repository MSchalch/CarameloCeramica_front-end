import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductEditModal from '../../components/ProductEditModal';
import { productService } from '../../services/productService';
import type { Peca } from '../../types/product';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [products, setProducts] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Peca | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.listarPecas(searchTerm, categoryFilter, 0, 50);
      setProducts(data.content || []);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
      setError('Não foi possível carregar as peças de cerâmica do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleToggleStatus = async (product: Peca) => {
    const novoStatus = !product.ativo;
    const confirmMsg = novoStatus
      ? `Deseja reativar a peça "${product.nome}" no catálogo?`
      : `Deseja inativar a peça "${product.nome}"?`;

    if (confirm(confirmMsg)) {
      try {
        await productService.atualizarPeca({
          ...product,
          ativo: novoStatus,
          motivoInativacao: !novoStatus ? 'Inativado pelo administrador via painel' : undefined,
          categoriaInativacao: !novoStatus ? 'GERENCIAL' : undefined,
        });
        await fetchProducts();
      } catch (err: any) {
        alert('Erro ao alterar status: ' + (err.response?.data || err.message));
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Gerenciar Produtos</h2>
          <p className="text-muted mb-0">Catálogo de cerâmicas integrado com o banco de dados</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark" onClick={fetchProducts}>
            <i className="bi bi-arrow-clockwise me-2"></i>Atualizar
          </button>
          <Link to="/product/new" className="btn btn-warning fw-bold">
            <i className="bi bi-plus-lg me-2"></i>Nova Peça
          </Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={handleSearch} className="row mb-4">
            <div className="col-md-6 mb-2">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Buscar por nome, SKU, categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-dark">
                  Buscar
                </button>
              </div>
            </div>
            <div className="col-md-3 mb-2">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Categoria: Todas</option>
                <option value="Bowls">Bowls</option>
                <option value="Pratos">Pratos</option>
                <option value="Xícaras">Xícaras</option>
                <option value="Vasos">Vasos</option>
                <option value="Travessas">Travessas</option>
              </select>
            </div>
            <div className="col-md-3 text-end mb-2 d-flex align-items-center justify-content-end">
              <span className="badge bg-light text-dark border p-2">
                Total de peças: <strong>{products.length}</strong>
              </span>
            </div>
          </form>

          {error && <div className="alert alert-danger mb-4">{error}</div>}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="text-muted mt-2">Carregando peças de cerâmica...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>SKU</th>
                    <th>Peça</th>
                    <th>Categoria</th>
                    <th>Custo / Grupo</th>
                    <th>Preço de Venda</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="fw-bold text-muted">{product.sku}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {product.imagemUrl ? (
                            <img
                              src={product.imagemUrl}
                              alt={product.nome}
                              className="rounded me-2"
                              style={{ width: 40, height: 40, objectFit: 'cover' }}
                            />
                          ) : (
                            <i className="bi bi-box-seam fs-3 me-2 text-secondary"></i>
                          )}
                          <div>
                            <div className="fw-bold">{product.nome}</div>
                            <small className="text-muted">{product.artesaoMarca}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.categoria}</td>
                      <td>
                        <small className="text-muted">
                          R$ {Number(product.custo || 0).toFixed(2).replace('.', ',')}
                          <br />
                          <span className="badge bg-light text-dark border">
                            {product.grupoPrecificacao}
                          </span>
                        </small>
                      </td>
                      <td className="fw-bold text-success fs-6">
                        R$ {Number(product.valorVenda || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            (product.estoque || 0) > 0 ? 'bg-secondary' : 'bg-danger'
                          }`}
                        >
                          {product.estoque} un.
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            product.ativo ? 'bg-success' : 'bg-danger'
                          }`}
                        >
                          {product.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-dark me-2"
                          title="Editar Peça"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <i className="bi bi-pencil me-1"></i>Editar
                        </button>
                        <button
                          className={`btn btn-sm ${
                            product.ativo ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          title={product.ativo ? 'Inativar Peça' : 'Reativar Peça'}
                          onClick={() => handleToggleStatus(product)}
                        >
                          <i className={`bi ${product.ativo ? 'bi-power' : 'bi-check-circle'}`}></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <i className="bi bi-box2 fs-1 d-block mb-2 text-secondary"></i>
                        Nenhuma peça de cerâmica encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProductEditModal
        show={!!selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          fetchProducts();
        }}
        product={selectedProduct}
      />
    </div>
  );
};

export default AdminProducts;
