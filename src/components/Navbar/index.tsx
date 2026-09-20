import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-warning me-2" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2h8v2H8V2zm1 3h6c0 3 3 4 3 7 0 4-2 6-2 8H8c0-2-2-4-2-8 0-3 3-4 3-7z"/>
          </svg>
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
            
            {/* ADM Dropdown - Exclusivo para usuários administradores */}
            {isAdmin && (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle text-warning fw-semibold" href="#" role="button" data-bs-toggle="dropdown">
                  <i className="bi bi-gear-fill me-1"></i>Painel Admin
                </a>
                <ul className="dropdown-menu shadow-sm border-0">
                  <li><Link className="dropdown-item fw-semibold" to="/dashboard"><i className="bi bi-graph-up me-2"></i>Dashboard</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item" to="/admin/orders"><i className="bi bi-box-seam me-2"></i>Gerenciar Pedidos</Link></li>
                  <li><Link className="dropdown-item" to="/admin/customers"><i className="bi bi-people me-2"></i>Gerenciar Clientes</Link></li>
                  <li><Link className="dropdown-item" to="/admin/products"><i className="bi bi-tag me-2"></i>Gerenciar Produtos</Link></li>
                  <li><Link className="dropdown-item" to="/admin/users"><i className="bi bi-shield-lock me-2"></i>Gerenciar Administradores</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><Link className="dropdown-item text-primary" to="/product/new"><i className="bi bi-plus-circle me-2"></i>Novo Produto</Link></li>
                </ul>
              </li>
            )}
          </ul>

          <ul className="navbar-nav align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/cart" title="Carrinho de Compras">
                <i className="bi bi-cart3 fs-5"></i>
              </Link>
            </li>

            {isAuthenticated && user ? (
              <li className="nav-item ms-lg-3 dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown">
                  <i className="bi bi-person-circle fs-5 text-warning"></i>
                  <span className="small fw-semibold">{user.nome.split(' ')[0]}</span>
                  <span className={`badge ${isAdmin ? 'bg-danger' : 'bg-primary'} rounded-pill`} style={{ fontSize: '0.65rem' }}>
                    {user.perfil}
                  </span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                  <li className="px-3 py-2 border-bottom">
                    <div className="fw-bold small">{user.nome}</div>
                    <div className="text-muted small font-monospace">{user.login}</div>
                  </li>
                  
                  {isAdmin ? (
                    <>
                      <li><Link className="dropdown-item" to="/dashboard"><i className="bi bi-graph-up me-2"></i>Dashboard</Link></li>
                      <li><Link className="dropdown-item" to="/admin/users"><i className="bi bi-shield-check me-2"></i>Administradores</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2"></i>Meu Perfil</Link></li>
                      <li><Link className="dropdown-item" to="/profile/orders"><i className="bi bi-bag me-2"></i>Meus Pedidos</Link></li>
                    </>
                  )}

                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger fw-semibold" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Sair
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item ms-lg-3 d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm fw-semibold">
                  <i className="bi bi-box-arrow-in-right me-1"></i>Entrar
                </Link>
                <Link to="/customer/new" className="btn btn-warning btn-sm fw-bold">
                  Cadastre-se
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
