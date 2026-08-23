import { useState } from 'react';

interface AddressModalProps {
  show: boolean;
  onClose: () => void;
}

const AddressModal = ({ show, onClose }: AddressModalProps) => {
  const [formData, setFormData] = useState({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  if (!show) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Endereço salvo com sucesso (MOCK)!');
    onClose();
  };

  return (
    <div className="modal fade show custom-modal-overlay" tabIndex={-1}>
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
                  <label className="form-label">CEP</label>
                  <input type="text" className="form-control" name="cep" value={formData.cep} onChange={handleChange} required />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-9">
                  <label className="form-label">Logradouro</label>
                  <input type="text" className="form-control" name="street" value={formData.street} onChange={handleChange} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Número</label>
                  <input type="text" className="form-control" name="number" value={formData.number} onChange={handleChange} required />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Complemento</label>
                  <input type="text" className="form-control" name="complement" value={formData.complement} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bairro</label>
                  <input type="text" className="form-control" name="neighborhood" value={formData.neighborhood} onChange={handleChange} required />
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-md-8">
                  <label className="form-label">Cidade</label>
                  <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Estado</label>
                  <input type="text" className="form-control" name="state" value={formData.state} onChange={handleChange} required />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn btn-warning fw-bold">Salvar Endereço</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
