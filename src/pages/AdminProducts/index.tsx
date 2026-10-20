import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductEditModal from '../../components/ProductEditModal';
import { productService } from '../../services/productService';
import type { Peca } from '../../types/product';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [argilaFilter, setArgilaFilter] = useState('');
  const [grupoFilter, setGrupoFilter] = useState('');
  const [fornoFilter, setFornoFilter] = useState<string>('');
  const [products, setProducts] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Peca | null>(null);

  // Modal de Entrada em Estoque (RF0051, RN0050, RN0051, RN0061, RN0062, RN0064)
  const [pecaEntradaEstoque, setPecaEntradaEstoque] = useState<Peca | null>(null);
  const [qtdEntrada, setQtdEntrada] = useState<number>(5);
  const [custoEntrada, setCustoEntrada] = useState<number>(30);
  const [fornecedorEntrada, setFornecedorEntrada] = useState<string>('Ateliê Cerâmica Caramelo');
  const [dataEntrada, setDataEntrada] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);

  // Modal de Inativação/Ativação Manual com Justificativa e Categoria (RN0015 e RN0017)
  const [pecaStatusModal, setPecaStatusModal] = useState<Peca | null>(null);
  const [motivoStatus, setMotivoStatus] = useState<string>('');
  const [categoriaStatus, setCategoriaStatus] = useState<string>('');

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.listarPecas(searchTerm, categoryFilter, 0, 50, {
        tipoArgila: argilaFilter || undefined,
        grupoPrecificacao: grupoFilter || undefined,
        vaiAoForno: fornoFilter === 'true' ? true : fornoFilter === 'false' ? false : undefined,
      });
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
  }, [categoryFilter, grupoFilter, fornoFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAbrirModalStatus = (product: Peca) => {
    setPecaStatusModal(product);
    if (product.ativo) {
      setCategoriaStatus('PECA_DESCONTINUADA');
      setMotivoStatus('Peça descontinuada temporariamente do catálogo');
    } else {
      setCategoriaStatus('REPOSICAO_CATALOGO');
      setMotivoStatus('Reativação manual para nova coleção');
    }
  };

  const handleConfirmarStatusModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pecaStatusModal) return;
    const novoStatus = !pecaStatusModal.ativo;
    try {
      await productService.atualizarPeca({
        ...pecaStatusModal,
        ativo: novoStatus,
        motivoInativacao: !novoStatus ? motivoStatus : pecaStatusModal.motivoInativacao,
        categoriaInativacao: !novoStatus ? categoriaStatus : pecaStatusModal.categoriaInativacao,
        motivoAtivacao: novoStatus ? motivoStatus : pecaStatusModal.motivoAtivacao,
        categoriaAtivacao: novoStatus ? categoriaStatus : pecaStatusModal.categoriaAtivacao,
      });
      setPecaStatusModal(null);
      await fetchProducts();
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err.response?.data || err.message));
    }
  };

  const handleAbrirModalEntrada = (product: Peca) => {
    setPecaEntradaEstoque(product);
    setQtdEntrada(5);
    setCustoEntrada(Number(product.custo || 30));
    setFornecedorEntrada(product.artesaoMarca || 'Ateliê Cerâmica Caramelo');
    setDataEntrada(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmarEntradaEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pecaEntradaEstoque || !pecaEntradaEstoque.id) return;
    setSalvandoEntrada(true);
    try {
      await productService.registrarEntradaEstoque(pecaEntradaEstoque.id, {
        quantidadeEntrada: qtdEntrada,
        custo: custoEntrada,
        fornecedorEntrada,
        dataEntrada,
      });
      setPecaEntradaEstoque(null);
      await fetchProducts();
    } catch (err: any) {
      alert('Erro na entrada de estoque: ' + (err.response?.data || err.message));
    } finally {
      setSalvandoEntrada(false);
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
            <div className="col-md-4 mb-2">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Nome, SKU, artesão, esmalte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-dark">
                  Buscar
                </button>
              </div>
            </div>
            <div className="col-md-2 mb-2">
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
            <div className="col-md-2 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Filtrar Argila..."
                value={argilaFilter}
                onChange={(e) => setArgilaFilter(e.target.value)}
              />
            </div>
            <div className="col-md-2 mb-2">
              <select
                className="form-select"
                value={grupoFilter}
                onChange={(e) => setGrupoFilter(e.target.value)}
              >
                <option value="">Grupo: Todos</option>
                <option value="Basico">Básico</option>
                <option value="Premium">Premium</option>
                <option value="Luxo">Luxo</option>
              </select>
            </div>
            <div className="col-md-2 mb-2">
              <select
                className="form-select"
                value={fornoFilter}
                onChange={(e) => setFornoFilter(e.target.value)}
              >
                <option value="">Forno: Todos</option>
                <option value="true">Vai ao Forno</option>
                <option value="false">Não vai ao Forno</option>
              </select>
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
                          className="btn btn-sm btn-outline-primary me-2 btn-entrada-estoque"
                          title="Entrada em Estoque (RF0051 / RN0050 / RN0051)"
                          onClick={() => handleAbrirModalEntrada(product)}
                        >
                          <i className="bi bi-box-arrow-in-down me-1"></i>Estoque
                        </button>
                        <button
                          className="btn btn-sm btn-outline-dark me-2"
                          title="Editar Peça"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <i className="bi bi-pencil me-1"></i>Editar
                        </button>
                        <button
                          className={`btn btn-sm btn-toggle-status-peca ${
                            product.ativo ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          title={product.ativo ? 'Inativar Peça (RN0015)' : 'Reativar Peça (RN0017)'}
                          onClick={() => handleAbrirModalStatus(product)}
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

      {/* Modal de Entrada em Estoque (RF0051, RN0050, RN0051, RN0061, RN0062, RN0064) */}
      {pecaEntradaEstoque && (
        <div
          className="modal fade show d-block modal-entrada-estoque"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleConfirmarEntradaEstoque}>
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-box-arrow-in-down me-2"></i>
                    Entrada em Estoque (RF0051 / RN0050)
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setPecaEntradaEstoque(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <p className="mb-3">
                    Peça selecionada: <strong>{pecaEntradaEstoque.nome}</strong> (Estoque atual:{' '}
                    <strong>{pecaEntradaEstoque.estoque} un.</strong> | Custo atual: R${' '}
                    {Number(pecaEntradaEstoque.custo || 0).toFixed(2).replace('.', ',')})
                  </p>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Quantidade de Entrada * (RN0061)</label>
                      <input
                        type="number"
                        min={1}
                        className="form-control input-qtd-entrada"
                        value={qtdEntrada}
                        onChange={(e) => setQtdEntrada(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Custo Unitário (R$) * (RN0062)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        className="form-control input-custo-entrada"
                        value={custoEntrada}
                        onChange={(e) => setCustoEntrada(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Fornecedor / Estúdio * (RN0050)</label>
                      <input
                        type="text"
                        className="form-control input-fornecedor-entrada"
                        value={fornecedorEntrada}
                        onChange={(e) => setFornecedorEntrada(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Data de Entrada * (RN0064)</label>
                      <input
                        type="date"
                        className="form-control input-data-entrada"
                        value={dataEntrada}
                        onChange={(e) => setDataEntrada(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="alert alert-info py-2 px-3 small mt-3 mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Regra RN0051:</strong> Se o novo custo for diferente do custo anterior, o preço de venda será nivelado automaticamente pelo <strong>maior custo</strong>.
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setPecaEntradaEstoque(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold btn-confirmar-entrada-estoque"
                    disabled={salvandoEntrada}
                  >
                    {salvandoEntrada ? 'Registrando...' : 'Confirmar Entrada'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inativação / Ativação com Justificativa e Categoria (RN0015 / RN0017) */}
      {pecaStatusModal && (
        <div
          className="modal fade show d-block modal-status-peca"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleConfirmarStatusModal}>
                <div className={`modal-header text-white ${pecaStatusModal.ativo ? 'bg-danger' : 'bg-success'}`}>
                  <h5 className="modal-title fw-bold">
                    {pecaStatusModal.ativo
                      ? 'Inativar Peça Manualmente (RF0012 / RN0015)'
                      : 'Ativar Peça no Catálogo (RF0016 / RN0017)'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setPecaStatusModal(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <p className="mb-3">
                    Peça: <strong>{pecaStatusModal.nome}</strong> ({pecaStatusModal.sku})
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Categoria de {pecaStatusModal.ativo ? 'Inativação (RN0015)' : 'Ativação (RN0017)'} *
                    </label>
                    <select
                      className="form-select select-categoria-status-peca"
                      value={categoriaStatus}
                      onChange={(e) => setCategoriaStatus(e.target.value)}
                      required
                    >
                      {pecaStatusModal.ativo ? (
                        <>
                          <option value="PECA_DESCONTINUADA">Peça Descontinuada</option>
                          <option value="PECA_COM_DEFEITO">Peça com Defeito</option>
                          <option value="FORA DE MERCADO">Fora de Mercado</option>
                        </>
                      ) : (
                        <>
                          <option value="REPOSICAO_CATALOGO">Reposição de Catálogo</option>
                          <option value="NOVA_FORNADA">Nova Fornada Artesanal</option>
                          <option value="CORRECAO_CADASTRO">Correção Cadastral</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Justificativa Obrigatória *</label>
                    <textarea
                      className="form-control input-justificativa-status-peca"
                      rows={3}
                      value={motivoStatus}
                      onChange={(e) => setMotivoStatus(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setPecaStatusModal(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`btn fw-bold btn-confirmar-status-peca ${
                      pecaStatusModal.ativo ? 'btn-danger' : 'btn-success'
                    }`}
                  >
                    Confirmar {pecaStatusModal.ativo ? 'Inativação' : 'Ativação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
