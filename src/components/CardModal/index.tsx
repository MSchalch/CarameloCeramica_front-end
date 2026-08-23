import { useState } from 'react';

interface CardModalProps {
  show: boolean;
  onClose: () => void;
}

const CardModal = ({ show, onClose }: CardModalProps) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cartão adicionado com sucesso (MOCK)!');
    onClose();
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold">Novo Cartão de Crédito</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Número do Cartão</label>
                <input type="text" className="form-control" name="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Nome Impresso no Cartão</label>
                <input type="text" className="form-control" name="cardName" value={formData.cardName} onChange={handleChange} required />
              </div>
              <div className="row mb-4">
                <div className="col-6">
                  <label className="form-label">Validade</label>
                  <input type="text" className="form-control" name="expiryDate" placeholder="MM/AA" value={formData.expiryDate} onChange={handleChange} required />
                </div>
                <div className="col-6">
                  <label className="form-label">CVV</label>
                  <input type="text" className="form-control" name="cvv" placeholder="123" value={formData.cvv} onChange={handleChange} required />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-warning fw-bold">Salvar Cartão</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
