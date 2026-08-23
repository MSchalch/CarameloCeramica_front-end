import { useState } from 'react';
import { Link } from 'react-router-dom';

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock dados
  const products = [
    { id: 1, sku: 'BOWL-001', name: 'Tigela Rústica', category: 'Bowls', price: 89.90, stock: 15, status: 'Ativo' },
    { id: 2, sku: 'VASO-002', name: 'Vaso Minimalista', category: 'Vasos', price: 145.00, stock: 4, status: 'Ativo' },
    { id: 3, sku: 'XICA-003', name: 'Xícara de Café Expresso', category: 'Xícaras', price: 45.50, stock: 0, status: 'Inativo' },
    { id: 4, sku: 'PRAT-004', name: 'Prato Fundo Cerâmica', category: 'Pratos', price: 65.00, stock: 22, status: 'Ativo' },
  ];

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Gerenciar Produtos</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-dark"><i className="bi bi-download me-2"></i>Exportar</button>
          <Link to="/product/new" className="btn btn-dark"><i className="bi bi-plus-lg me-2"></i>Novo Produto</Link>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Buscar por nome ou SKU..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select">
                <option value="">Categoria: Todas</option>
                <option value="Bowls">Bowls</option>
                <option value="Vasos">Vasos</option>
                <option value="Xícaras">Xícaras</option>
                <option value="Pratos">Pratos</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select">
                <option value="">Status: Todos</option>
                <option value="Ativo">Em Estoque</option>
                <option value="Inativo">Esgotado / Inativo</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>SKU</th>
                  <th>Nome do Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id}>
                    <td className="fw-bold text-muted">{product.sku}</td>
                    <td className="fw-bold">{product.name}</td>
                    <td>{product.category}</td>
                    <td>R$ {product.price.toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span className={`badge ${product.stock > 0 ? 'bg-secondary' : 'bg-danger'}`}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.status === 'Ativo' ? 'bg-success' : 'bg-danger'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link to={`/product/${product.id}/edit`} className="btn btn-sm btn-outline-dark me-2" title="Editar">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button className="btn btn-sm btn-outline-danger" title="Inativar/Remover">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">Nenhum produto encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
