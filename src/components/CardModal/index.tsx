import { useState } from 'react';
import type { CartaoCredito } from '../../types/customer';

interface CardModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (card: CartaoCredito) => void;
}

const CardModal = ({ show, onClose, onSave }: CardModalProps) => {
  const [formData, setFormData] = useState<CartaoCredito>({
    numero: '',
    nomeImpresso: '',
    bandeira: 'MASTERCARD',
    codigoSeguranca: '',
    preferencial: false,
  });

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            <h5 className="modal-title fw-bold">Novo Cartão de Crédito</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Número do Cartão *</label>
                <input
                  type="text"
                  className="form-control"
                  name="numero"
                  placeholder="0000 0000 0000 0000"
                  value={formData.numero}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Nome Impresso no Cartão *</label>
                <input
                  type="text"
                  className="form-control"
                  name="nomeImpresso"
                  placeholder="NOME COMO NO CARTÃO"
                  value={formData.nomeImpresso}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Bandeira *</label>
                  <select
                    className="form-select"
                    name="bandeira"
                    value={formData.bandeira}
                    onChange={handleChange}
                    required
                  >
                    <option value="MASTERCARD">Mastercard</option>
                    <option value="VISA">Visa</option>
                    <option value="ELO">Elo</option>
                    <option value="AMEX">American Express</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">CVV *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="codigoSeguranca"
                    maxLength={4}
                    placeholder="123"
                    value={formData.codigoSeguranca}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="preferencial"
                  checked={formData.preferencial}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferencial: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="preferencial">
                  Definir como cartão preferencial
                </label>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning fw-bold">
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
