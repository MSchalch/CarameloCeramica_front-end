import { useState, useEffect } from 'react';
import type { Cliente, Endereco, CartaoCredito } from '../../types/customer';
import { viaCepService } from '../../services/viaCepService';
import { formatarCpf, validarCpf, formatarTelefone, validarTelefone, validarEmail } from '../../utils/formatters';

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

  const [erroCpf, setErroCpf] = useState<string | null>(null);
  const [erroTelefone, setErroTelefone] = useState<string | null>(null);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroDataNascimento, setErroDataNascimento] = useState<string | null>(null);
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState<string | null>(null);

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

  const [buscandoCep, setBuscandoCep] = useState<boolean>(false);
  const [mensagemCep, setMensagemCep] = useState<string | null>(null);

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
        cpf: formatarCpf(initialData.cpf),
        telefone: formatarTelefone(initialData.telefone),
        senha: '',
      });
      setConfirmarSenha('');
      setErroConfirmarSenha(null);
    }
  }, [initialData]);

  const handleConfirmarSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmarSenha(value);
    if (formData.senha && value !== formData.senha) {
      setErroConfirmarSenha('As senhas não coincidem.');
    } else {
      setErroConfirmarSenha(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'cpf') {
      const formatado = formatarCpf(value);
      setFormData(prev => ({ ...prev, cpf: formatado }));
      const apenasNumeros = formatado.replace(/\D/g, '');
      if (apenasNumeros.length === 11) {
        if (!validarCpf(formatado)) {
          setErroCpf('CPF inválido. Verifique os dígitos informados.');
        } else {
          setErroCpf(null);
        }
      } else if (apenasNumeros.length > 0 && apenasNumeros.length < 11) {
        setErroCpf('O CPF deve ter 11 dígitos.');
      } else {
        setErroCpf(null);
      }
      return;
    }

    if (name === 'telefone') {
      const formatado = formatarTelefone(value);
      setFormData(prev => ({ ...prev, telefone: formatado }));
      const apenasDigitos = formatado.replace(/\D/g, '');
      if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
        if (!validarTelefone(formatado)) {
          setErroTelefone('Telefone inválido. Verifique o DDD e os dígitos informados.');
        } else {
          setErroTelefone(null);
        }
      } else if (apenasDigitos.length > 0) {
        setErroTelefone('O telefone deve conter DDD + 8 ou 9 dígitos.');
      } else {
        setErroTelefone(null);
      }
      return;
    }

    if (name === 'email') {
      setFormData(prev => ({ ...prev, email: value }));
      if (value.trim().length > 0 && !validarEmail(value)) {
        setErroEmail('Formato de e-mail inválido (ex: nome@dominio.com).');
      } else {
        setErroEmail(null);
      }
      return;
    }

    if (name === 'dataNascimento') {
      setFormData(prev => ({ ...prev, dataNascimento: value }));
      if (value) {
        const dataEscolhida = new Date(value);
        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        if (dataEscolhida > hoje) {
          setErroDataNascimento('A data de nascimento não pode ser no futuro.');
        } else {
          setErroDataNascimento(null);
        }
      } else {
        setErroDataNascimento(null);
      }
      return;
    }

    if (name === 'senha') {
      setFormData(prev => ({ ...prev, senha: value }));
      if (confirmarSenha && value !== confirmarSenha) {
        setErroConfirmarSenha('As senhas não coincidem.');
      } else {
        setErroConfirmarSenha(null);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEnderecoInicial(prev => ({ ...prev, [name]: value }));
  };

  const handleEnderecoCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorOriginal = e.target.value;
    const cepFormatado = viaCepService.formatarCep(valorOriginal);

    setEnderecoInicial(prev => ({ ...prev, cep: cepFormatado }));
    setMensagemCep(null);

    const cepLimpo = valorOriginal.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const dados = await viaCepService.buscarEnderecoPorCep(cepLimpo);
        if (dados) {
          setEnderecoInicial(prev => ({
            ...prev,
            logradouro: dados.logradouro || prev.logradouro,
            bairro: dados.bairro || prev.bairro,
            cidade: dados.localidade || prev.cidade,
            estado: dados.uf || prev.estado,
          }));
          setMensagemCep('Endereço preenchido via CEP com sucesso!');
        } else {
          setMensagemCep('CEP não encontrado. Preencha manualmente.');
        }
      } catch (err) {
        setMensagemCep('Erro ao consultar ViaCEP.');
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleCartaoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCartaoInicial(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarCpf(formData.cpf)) {
      setErroCpf('Por favor, informe um CPF válido com 11 dígitos no formato 000.000.000-00.');
      alert('CPF inválido. O CPF deve conter 11 dígitos válidos.');
      return;
    }

    if (!validarTelefone(formData.telefone)) {
      setErroTelefone('Telefone inválido. Informe um telefone brasileiro com DDD válido.');
      alert('Telefone inválido. Verifique o DDD e os dígitos informados.');
      return;
    }

    if (!validarEmail(formData.email)) {
      setErroEmail('Por favor, informe um e-mail válido.');
      alert('E-mail inválido. Verifique o endereço digitado.');
      return;
    }

    if (formData.dataNascimento) {
      const dataEscolhida = new Date(formData.dataNascimento);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      if (dataEscolhida > hoje) {
        setErroDataNascimento('A data de nascimento não pode ser no futuro.');
        alert('A data de nascimento não pode ser no futuro.');
        return;
      }
    }

    if (!isEdit || formData.senha) {
      if (!isEdit && !formData.senha) {
        alert('Por favor, informe uma senha para o cliente.');
        return;
      }
      if (formData.senha.length < 8) {
        alert('A senha deve conter no mínimo 8 caracteres (RNF0031).');
        return;
      }
      if (formData.senha !== confirmarSenha) {
        setErroConfirmarSenha('As senhas não coincidem.');
        alert('As senhas digitadas não coincidem. Por favor, confirme sua senha.');
        return;
      }
    }

    const payload: Cliente = {
      ...formData,
      cpf: formatarCpf(formData.cpf),
      telefone: formatarTelefone(formData.telefone),
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
            className={`form-control ${erroEmail ? 'is-invalid' : ''}`}
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {erroEmail && <div className="invalid-feedback d-block">{erroEmail}</div>}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">CPF *</label>
          <input
            type="text"
            className={`form-control ${erroCpf ? 'is-invalid' : ''}`}
            name="cpf"
            placeholder="000.000.000-00"
            value={formData.cpf}
            onChange={handleChange}
            maxLength={14}
            required
          />
          {erroCpf && <div className="invalid-feedback d-block">{erroCpf}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Telefone *</label>
          <input
            type="text"
            className={`form-control ${erroTelefone ? 'is-invalid' : ''}`}
            name="telefone"
            placeholder="(11) 90000-0000"
            value={formData.telefone}
            onChange={handleChange}
            maxLength={15}
            required
          />
          {erroTelefone && <div className="invalid-feedback d-block">{erroTelefone}</div>}
        </div>
        <div className="col-md-4">
          <label className="form-label">Data de Nascimento *</label>
          <input
            type="date"
            className={`form-control ${erroDataNascimento ? 'is-invalid' : ''}`}
            name="dataNascimento"
            max={new Date().toISOString().split('T')[0]}
            value={formData.dataNascimento}
            onChange={handleChange}
            required
          />
          {erroDataNascimento && <div className="invalid-feedback d-block">{erroDataNascimento}</div>}
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
        <div className="col-md-4">
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
        <div className="col-md-4">
          <label className="form-label">Confirmar Senha {isEdit ? '(Opcional)' : '*'}</label>
          <input
            type="password"
            className={`form-control ${erroConfirmarSenha ? 'is-invalid' : ''}`}
            name="confirmarSenha"
            value={confirmarSenha}
            onChange={handleConfirmarSenhaChange}
            required={!isEdit || !!formData.senha}
            placeholder={isEdit ? 'Confirme a nova senha' : 'Confirme sua senha'}
          />
          {erroConfirmarSenha && <div className="invalid-feedback d-block">{erroConfirmarSenha}</div>}
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
              <label className="form-label d-flex justify-content-between">
                <span>CEP *</span>
                {buscandoCep && (
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                )}
              </label>
              <input
                type="text"
                className="form-control"
                name="cep"
                placeholder="00000-000"
                maxLength={9}
                value={enderecoInicial.cep}
                onChange={handleEnderecoCepChange}
                required
              />
              {mensagemCep && (
                <small className={`d-block mt-1 ${mensagemCep.includes('sucesso') ? 'text-success' : 'text-warning'}`}>
                  <i className={`bi ${mensagemCep.includes('sucesso') ? 'bi-check-circle' : 'bi-info-circle'} me-1`}></i>
                  {mensagemCep}
                </small>
              )}
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
