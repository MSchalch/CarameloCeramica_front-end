import { useState } from 'react';
import type { Endereco } from '../../types/customer';
import { viaCepService } from '../../services/viaCepService';

interface AddressModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (address: Endereco) => void;
}

const AddressModal = ({ show, onClose, onSave }: AddressModalProps) => {
  const [formData, setFormData] = useState<Endereco>({
    identificacao: '',
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

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorOriginal = e.target.value;
    const cepFormatado = viaCepService.formatarCep(valorOriginal);

    setFormData(prev => ({ ...prev, cep: cepFormatado }));
    setMensagemCep(null);

    const cepLimpo = valorOriginal.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const dados = await viaCepService.buscarEnderecoPorCep(cepLimpo);
        if (dados) {
          setFormData(prev => ({
            ...prev,
            logradouro: dados.logradouro || prev.logradouro,
            bairro: dados.bairro || prev.bairro,
            cidade: dados.localidade || prev.cidade,
            estado: dados.uf || prev.estado,
          }));
          setMensagemCep('Endereço localizado com sucesso!');
        } else {
          setMensagemCep('CEP não encontrado. Preencha os campos manualmente.');
        }
      } catch (err) {
        setMensagemCep('Erro ao buscar CEP. Preencha manualmente.');
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal fade show custom-modal-overlay d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold">Novo Endereço</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Apelido (Identificação) *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="identificacao"
                    placeholder="Ex: Trabalho, Casa de Praia"
                    value={formData.identificacao}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tipo de Residência *</label>
                  <select
                    className="form-select"
                    name="tipoResidencia"
                    value={formData.tipoResidencia}
                    onChange={handleChange}
                    required
                  >
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
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
                    value={formData.cep}
                    onChange={handleCepChange}
                    required
                  />
                  {mensagemCep && (
                    <small className={`d-block mt-1 ${mensagemCep.includes('sucesso') ? 'text-success' : 'text-warning'}`}>
                      <i className={`bi ${mensagemCep.includes('sucesso') ? 'bi-check-circle' : 'bi-info-circle'} me-1`}></i>
                      {mensagemCep}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Finalidade *</label>
                  <select
                    className="form-select"
                    name="tipoEndereco"
                    value={formData.tipoEndereco}
                    onChange={handleChange}
                    required
                  >
                    <option value="AMBOS">Cobrança e Entrega (Ambos)</option>
                    <option value="ENTREGA">Apenas Entrega</option>
                    <option value="COBRANCA">Apenas Cobrança</option>
                  </select>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-8">
                  <label className="form-label">Logradouro / Rua *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Número *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-5">
                  <label className="form-label">Bairro *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label">Cidade *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">UF *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="estado"
                    maxLength={2}
                    value={formData.estado}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">Observações (Opcional)</label>
                <input
                  type="text"
                  className="form-control"
                  name="observacoes"
                  value={formData.observacoes || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning fw-bold">
                  Salvar Endereço
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
