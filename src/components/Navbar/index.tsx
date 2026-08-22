import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-palette-fill text-warning me-2"></i>
          Caramelo Cerâmicas
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Catálogo</Link>
            </li>
            
            {/* ADM Dropdown */}
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                Admin
              </a>
              <ul className="dropdown-menu shadow-sm border-0">
                <li><Link className="dropdown-item" to="/dashboard">Dashboard</Link></li>
                <li><Link className="dropdown-item" to="/admin/orders">Gerenciar Pedidos</Link></li>
                <li><Link className="dropdown-item" to="/admin/customers">Gerenciar Clientes</Link></li>
                <li><Link className="dropdown-item" to="/product/new">Novo Produto</Link></li>
              </ul>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/cart">
                <i className="bi bi-cart3 fs-5"></i>
                <span className="badge bg-warning text-dark rounded-pill ms-1">0</span>
              </Link>
            </li>
            <li className="nav-item ms-3 dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle fs-5 me-1"></i>
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                <li><h6 className="dropdown-header">Cliente</h6></li>
                <li><Link className="dropdown-item" to="/profile">Meu Perfil</Link></li>
                <li><Link className="dropdown-item" to="/profile/orders">Meus Pedidos</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item text-danger" to="/login">Sair</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
