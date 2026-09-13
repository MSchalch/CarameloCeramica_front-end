import { useState, useEffect } from 'react';
import type { Cliente, Endereco, CartaoCredito } from '../../types/customer';

interface CustomerFormProps {
  initialData?: Cliente;
  onSubmit: (data: Cliente) => void;
  isEdit?: boolean;
  loading?: boolean;
}

const CustomerForm = ({ initialData, onSubmit, isEdit = false, loading = false }: CustomerFormProps) => {
  const [formData, setFormData] = useState<Cliente>({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    genero: '',
    dataNascimento: '',
    enderecos: [],
    cartoes: [],
  });

  // Estado para cadastro inicial de endereço obrigatório
  const [enderecoInicial, setEnderecoInicial] = useState<Endereco>({
    identificacao: 'Principal',
    tipoResidencia: 'Casa',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    pais: 'Brasil',
    observacoes: '',
    tipoEndereco: 'AMBOS',
  });

  // Estado para cartão inicial opcional
  const [incluirCartao, setIncluirCartao] = useState(false);
  const [cartaoInicial, setCartaoInicial] = useState<CartaoCredito>({
    numero: '',
    nomeImpresso: '',
    bandeira: 'MASTERCARD',
    codigoSeguranca: '',
    preferencial: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        senha: '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEnderecoInicial(prev => ({ ...prev, [name]: value }));
  };

  const handleCartaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCartaoInicial(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Cliente = {
      ...formData,
      enderecos: isEdit
        ? formData.enderecos
        : [enderecoInicial],
      cartoes: isEdit
        ? formData.cartoes
        : (incluirCartao && cartaoInicial.numero ? [cartaoInicial] : []),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h5 className="fw-bold text-secondary mb-3">1. Dados Pessoais</h5>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Nome Completo *</label>
          <input
            type="text"
            className="form-control"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">E-mail *</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">CPF *</label>
          <input
            type="text"
            className="form-control"
            name="cpf"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Telefone *</label>
          <input
            type="text"
            className="form-control"
            name="telefone"
            placeholder="(11) 90000-0000"
            value={formData.telefone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Data de Nascimento *</label>
          <input
            type="date"
            className="form-control"
            name="dataNascimento"
            value={formData.dataNascimento}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Gênero *</label>
          <select
            className="form-select"
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            required
          >
            <option value="">Selecione...</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
            <option value="Prefiro não informar">Prefiro não informar</option>
          </select>
        </div>
        <div className="col-md-8">
          <label className="form-label">Senha {isEdit ? '(Deixe em branco para não alterar)' : '*'}</label>
          <input
            type="password"
            className="form-control"
            name="senha"
            value={formData.senha || ''}
            onChange={handleChange}
            required={!isEdit}
            placeholder={isEdit ? 'Nova senha opcional' : 'Senha de acesso segura'}
          />
        </div>
      </div>

      {!isEdit && (
        <>
          <hr className="my-4" />
          <h5 className="fw-bold text-secondary mb-3">2. Endereço Obrigatório de Cadastro</h5>
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Apelido do Endereço *</label>
              <input
                type="text"
                className="form-control"
                name="identificacao"
                placeholder="Ex: Minha Casa, Trabalho"
                value={enderecoInicial.identificacao}
                onChange={handleEnderecoChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Tipo de Residência *</label>
              <select
                className="form-select"
                name="tipoResidencia"
                value={enderecoInicial.tipoResidencia}
                onChange={handleEnderecoChange}
                required
              >
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Comercial">Comercial</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">CEP *</label>
              <input
                type="text"
                className="form-control"
                name="cep"
                placeholder="00000-000"
                value={enderecoInicial.cep}
                onChange={handleEnderecoChange}
                required
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-8">
              <label className="form-label">Logradouro / Rua *</label>
              <input
                type="text"
                className="form-control"
                name="logradouro"
                value={enderecoInicial.logradouro}
                onChange={handleEnderecoChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Número *</label>
              <input
                type="text"
                className="form-control"
                name="numero"
                value={enderecoInicial.numero}
                onChange={handleEnderecoChange}
                required
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Bairro *</label>
              <input
                type="text"
                className="form-control"
                name="bairro"
                value={enderecoInicial.bairro}
                onChange={handleEnderecoChange}
                required
              />
            </div>
            <div className="col-md-5">
              <label className="form-label">Cidade *</label>
              <input
                type="text"
                className="form-control"
                name="cidade"
                value={enderecoInicial.cidade}
                onChange={handleEnderecoChange}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Estado (UF) *</label>
              <input
                type="text"
                className="form-control"
                name="estado"
                maxLength={2}
                placeholder="SP"
                value={enderecoInicial.estado}
                onChange={handleEnderecoChange}
                required
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label">Finalidade do Endereço *</label>
              <select
                className="form-select"
                name="tipoEndereco"
                value={enderecoInicial.tipoEndereco}
                onChange={handleEnderecoChange}
                required
              >
                <option value="AMBOS">Cobrança e Entrega (Ambos)</option>
                <option value="ENTREGA">Apenas Entrega</option>
                <option value="COBRANCA">Apenas Cobrança</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Observações (Opcional)</label>
              <input
                type="text"
                className="form-control"
                name="observacoes"
                placeholder="Ex: Perto da praça"
                value={enderecoInicial.observacoes || ''}
                onChange={handleEnderecoChange}
              />
            </div>
          </div>

          <hr className="my-4" />
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="checkCartao"
              checked={incluirCartao}
              onChange={(e) => setIncluirCartao(e.target.checked)}
            />
            <label className="form-check-label fw-bold" htmlFor="checkCartao">
              Deseja já cadastrar um Cartão de Crédito inicial?
            </label>
          </div>

          {incluirCartao && (
            <div className="p-3 bg-light rounded border mb-4">
              <h6 className="fw-bold mb-3">Dados do Cartão</h6>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Número do Cartão *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="numero"
                    placeholder="0000 0000 0000 0000"
                    value={cartaoInicial.numero}
                    onChange={handleCartaoChange}
                    required={incluirCartao}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Nome Impresso no Cartão *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nomeImpresso"
                    placeholder="NOME COMO NO CARTAO"
                    value={cartaoInicial.nomeImpresso}
                    onChange={handleCartaoChange}
                    required={incluirCartao}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Bandeira *</label>
                  <select
                    className="form-select"
                    name="bandeira"
                    value={cartaoInicial.bandeira}
                    onChange={handleCartaoChange}
                    required={incluirCartao}
                  >
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="VISA">Visa</option>
                    <option value="ELO">Elo</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Código de Segurança (CVV) *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="codigoSeguranca"
                    maxLength={4}
                    placeholder="123"
                    value={cartaoInicial.codigoSeguranca}
                    onChange={handleCartaoChange}
                    required={incluirCartao}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="cartaoPref"
                      checked={cartaoInicial.preferencial}
                      onChange={(e) =>
                        setCartaoInicial(prev => ({ ...prev, preferencial: e.target.checked }))
                      }
                    />
                    <label className="form-check-label" htmlFor="cartaoPref">
                      Cartão preferencial
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="d-flex justify-content-end mt-4">
        <button type="submit" className="btn btn-warning fw-bold px-4 py-2" disabled={loading}>
          {loading ? (
            <span>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Gravando...
            </span>
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            'Cadastrar Cliente'
          )}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
