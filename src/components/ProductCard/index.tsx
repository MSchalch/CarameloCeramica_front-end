import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  img: string;
}

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="card h-100 shadow-sm border-0 product-card">
      <img src={product.img} className="card-img-top" alt={product.name} style={{ height: '250px', objectFit: 'cover' }} />
      <div className="card-body d-flex flex-column">
        <span className="badge bg-light text-dark mb-2 align-self-start">{product.category}</span>
        <h5 className="card-title fw-bold">{product.name}</h5>
        <h6 className="card-subtitle mb-3 text-muted">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
        </h6>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <Link to={`/cart`} className="btn btn-warning w-100 fw-bold shadow-sm">
            Adicionar ao Carrinho
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
