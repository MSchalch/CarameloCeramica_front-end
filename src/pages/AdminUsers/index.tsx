import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import type { Usuario, NovoAdminRequest } from '../../types/auth';

const AdminUsers: React.FC = () => {
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [formData, setFormData] = useState<NovoAdminRequest & { confirmarSenha: string }>({
    nome: '',
    login: '',
    senha: '',
    confirmarSenha: '',
  });

  const carregarAdmins = async () => {
    setLoading(true);
    try {
      const lista = await authService.listarAdmins();
      setAdmins(lista);
    } catch (err: any) {
      console.error('Erro ao carregar administradores:', err);
      setFeedback({ type: 'danger', text: 'Não foi possível carregar a lista de administradores.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAdmins();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.nome.trim() || !formData.login.trim() || !formData.senha.trim()) {
      setFeedback({ type: 'danger', text: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      setFeedback({ type: 'danger', text: 'A confirmação de senha não confere com a senha informada.' });
      return;
    }

    setSubmitting(true);
    try {
      await authService.criarAdmin({
        nome: formData.nome.trim(),
        login: formData.login.trim(),
        senha: formData.senha.trim(),
      });

      setFeedback({ type: 'success', text: `Administrador "${formData.nome}" cadastrado com sucesso!` });
      setFormData({ nome: '', login: '', senha: '', confirmarSenha: '' });
      setShowModal(false);
      carregarAdmins();
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Erro ao criar novo administrador.';
      setFeedback({ type: 'danger', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Cabeçalho */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#426B69' }}>
            <i className="bi bi-shield-check me-2"></i>Gerenciamento de Administradores
          </h2>
          <p className="text-muted mb-0">
            Crie e visualize os administradores que possuem acesso total ao painel de controle e dashboard
          </p>
        </div>
        <button
          className="btn btn-dark fw-semibold"
          onClick={() => {
            setFeedback(null);
            setShowModal(true);
          }}
        >
          <i className="bi bi-person-plus-fill me-2"></i>Novo Administrador
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* Tabela de Administradores */}
      <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">ID</th>
                  <th>Nome</th>
                  <th>Login / Usuário</th>
                  <th>Perfil</th>
                  <th>Data de Cadastro</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-warning" role="status"></div>
                      <p className="text-muted mt-2 mb-0">Carregando administradores...</p>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      Nenhum administrador encontrado.
                    </td>
                  </tr>
                ) : (
                  admins.map((adm) => (
                    <tr key={adm.id}>
                      <td className="ps-4 fw-bold text-muted">#{adm.id}</td>
                      <td>
                        <div className="fw-bold">{adm.nome}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary font-monospace fs-6">
                          {adm.login}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-danger">
                          <i className="bi bi-shield-fill me-1"></i>ADMINISTRADOR
                        </span>
                      </td>
                      <td className="text-muted">
                        {adm.dataCadastro ? new Date(adm.dataCadastro).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td>
                        {adm.ativo ? (
                          <span className="badge bg-success">Ativo</span>
                        ) : (
                          <span className="badge bg-secondary">Inativo</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Criação de Novo Administrador */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-plus-fill me-2 text-warning"></i>Novo Administrador
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Ex: Carlos Oliveira"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Login de Acesso *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="login"
                      value={formData.login}
                      onChange={handleChange}
                      placeholder="Ex: carlos ou carlos@ceramica.com"
                      required
                    />
                    <div className="form-text">
                      Este será o nome de usuário utilizado na tela de login.
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Senha *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      placeholder="Digite a senha"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Confirmar Senha *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmarSenha"
                      value={formData.confirmarSenha}
                      onChange={handleChange}
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-dark fw-bold" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Cadastrando...
                      </>
                    ) : (
                      'Salvar Administrador'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
