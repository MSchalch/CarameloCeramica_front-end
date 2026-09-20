import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50 py-5">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger shadow-sm d-inline-block p-4" style={{ maxWidth: '600px' }}>
          <i className="bi bi-shield-lock-fill fs-1 text-danger d-block mb-3"></i>
          <h4 className="fw-bold">Acesso Restrito</h4>
          <p className="mb-3">
            Apenas usuários administradores têm permissão para acessar esta página.
          </p>
          <a href="/" className="btn btn-outline-danger fw-semibold">
            Voltar para o Início
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
