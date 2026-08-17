import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="bi bi-person-circle fs-1 text-warning"></i>
            <h4 className="fw-bold mt-2">Acesse sua conta</h4>
          </div>
          <form>
            <div className="mb-3">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-control" placeholder="seu@email.com" />
            </div>
            <div className="mb-4">
              <label className="form-label">Senha</label>
              <input type="password" className="form-control" placeholder="********" />
            </div>
            <button type="submit" className="btn btn-dark w-100 fw-bold mb-3">Entrar</button>
            <div className="text-center">
              <span className="text-muted">Ainda não tem conta? <Link to="/login" className="text-warning text-decoration-none fw-bold">Cadastre-se</Link></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
