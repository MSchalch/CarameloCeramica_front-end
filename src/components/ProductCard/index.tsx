import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  img: string;
  estoque?: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();

  const handleAddToCart = () => {
    const saved = localStorage.getItem('caramelo_cart');
    let cart: any[] = saved ? JSON.parse(saved) : [];

    const existingIndex = cart.findIndex((i: any) => i.id === product.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantidade += 1;
    } else {
      cart.push({
        id: product.id,
        nome: product.name,
        preco: product.price,
        imagemUrl: product.img,
        categoria: product.category,
        quantidade: 1,
        estoque: product.estoque ?? 10,
      });
    }

    localStorage.setItem('caramelo_cart', JSON.stringify(cart));
    navigate('/cart');
  };

  return (
    <div className="card h-100 shadow-sm border-0 product-card">
      <img src={product.img} className="card-img-top product-card-img" alt={product.name} />
      <div className="card-body d-flex flex-column">
        <span className="badge bg-light text-dark mb-2 align-self-start">{product.category}</span>
        <h5 className="card-title fw-bold">{product.name}</h5>
        <h6 className="card-subtitle mb-3 text-muted">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
        </h6>
        <div className="mt-auto">
          <button onClick={handleAddToCart} className="btn btn-warning w-100 fw-bold shadow-sm">
            <i className="bi bi-cart-plus me-1"></i>Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
