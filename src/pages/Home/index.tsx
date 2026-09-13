import { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';
import { productService } from '../../services/productService';
import type { Peca } from '../../types/product';

const Home = () => {
  const [products, setProducts] = useState<Peca[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const cat = selectedCategory === 'all' ? '' : selectedCategory;
        const data = await productService.listarPecas('', cat, 0, 40);
        // Exibir apenas produtos ativos na vitrine
        const ativos = (data.content || []).filter(p => p.ativo);
        setProducts(ativos);
      } catch (err) {
        console.error('Erro ao carregar catálogo da Home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory]);

  return (
    <div className="container py-5">
      <div className="row mb-5 text-center">
        <h1 className="display-4 fw-bold text-dark">Bem-vindo à Caramelo Cerâmicas</h1>
        <p className="lead text-muted">Encontre peças artesanais exclusivas que darão vida e personalidade ao seu lar.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Nosso Catálogo</h3>
        <select
          className="form-select w-auto"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">Todas as Categorias</option>
          <option value="Bowls">Bowls</option>
          <option value="Pratos">Pratos</option>
          <option value="Xícaras">Xícaras</option>
          <option value="Vasos">Vasos</option>
          <option value="Travessas">Travessas</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted mt-2">Carregando catálogo artesanal...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
          {products.map((product) => (
            <div className="col" key={product.id}>
              <ProductCard
                product={{
                  id: product.id!,
                  name: product.nome,
                  price: Number(product.valorVenda || 0),
                  category: product.categoria,
                  img:
                    product.imagemUrl ||
                    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80',
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-box2 fs-1 d-block mb-2 text-secondary"></i>
          Nenhuma peça encontrada para esta categoria no momento.
        </div>
      )}
    </div>
  );
};

export default Home;
