import ProductCard from '../../components/ProductCard';

const Home = () => {
  // Mocks para o protótipo
  const mockProducts = [
    { id: 1, name: 'Tigela Rústica', price: 89.90, category: 'Bowls', img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80' },
    { id: 2, name: 'Vaso Minimalista', price: 145.00, category: 'Vasos', img: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80' },
    { id: 3, name: 'Xícara de Café Expresso', price: 45.50, category: 'Xícaras', img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80' },
    { id: 4, name: 'Prato Fundo Cerâmica', price: 65.00, category: 'Pratos', img: 'https://images.unsplash.com/photo-1605342410385-e2a1dfdf3b78?w=500&q=80' },
  ];

  return (
    <div className="container py-5">
      <div className="row mb-5 text-center">
        <h1 className="display-4 fw-bold text-dark">Bem-vindo à Caramelo Cerâmicas</h1>
        <p className="lead text-muted">Encontre peças artesanais exclusivas que darão vida e personalidade ao seu lar.</p>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">Nosso Catálogo</h3>
        <select className="form-select w-auto">
          <option value="all">Todas as Categorias</option>
          <option value="bowls">Bowls</option>
          <option value="pratos">Pratos</option>
          <option value="xicaras">Xícaras</option>
        </select>
      </div>

      <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4">
        {mockProducts.map((product) => (
          <div className="col" key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
