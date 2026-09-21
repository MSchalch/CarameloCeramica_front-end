import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [loginIdentificador, setLoginIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!loginIdentificador.trim() || !senha.trim()) {
      setErro('Por favor, informe seu usuário/e-mail e a senha.');
      return;
    }

    setLoading(true);
    try {
      const usuario = await login({
        login: loginIdentificador.trim(),
        senha: senha.trim(),
      });

      // Redirecionamento condicional de acordo com o perfil
      const from = (location.state as any)?.from?.pathname;
      if (usuario.perfil === 'ADMIN') {
        navigate(from && from.startsWith('/admin') ? from : '/dashboard', { replace: true });
      } else {
        navigate(from && !from.startsWith('/admin') && !from.startsWith('/dashboard') ? from : '/', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Erro ao realizar login.';
      setErro(typeof msg === 'string' ? msg : 'Credenciais inválidas. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center login-container" style={{ minHeight: '80vh' }}>
      <div className="card shadow border-0 login-card" style={{ maxWidth: '420px', width: '100%', borderRadius: '16px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="bi bi-person-circle fs-1 text-warning"></i>
            <h4 className="fw-bold mt-2">Acesse sua conta</h4>
            <p className="text-muted small">Caramelo Cerâmicas</p>
          </div>

          {erro && (
            <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>{erro}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="loginInput" className="form-label fw-semibold">Usuário ou E-mail</label>
              <input
                id="loginInput"
                name="login"
                type="text"
                className="form-control"
                placeholder="Admin ou seu@email.com"
                value={loginIdentificador}
                onChange={(e) => setLoginIdentificador(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="senhaInput" className="form-label fw-semibold">Senha</label>
              <input
                id="senhaInput"
                name="senha"
                type="password"
                className="form-control"
                placeholder="••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-dark w-100 fw-bold py-2 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
            <div className="text-center">
              <span className="text-muted small">
                Ainda não tem conta?{' '}
                <Link to="/customer/new" className="text-warning text-decoration-none fw-bold">
                  Cadastre-se
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
