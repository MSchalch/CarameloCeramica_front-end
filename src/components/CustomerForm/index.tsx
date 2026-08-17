import { useState, useEffect } from 'react';

export interface CustomerData {
  id?: number;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  gender: string;
  birthDate: string;
  address: string;
}

interface CustomerFormProps {
  initialData?: CustomerData;
  onSubmit: (data: CustomerData) => void;
  isEdit?: boolean;
}

const CustomerForm = ({ initialData, onSubmit, isEdit = false }: CustomerFormProps) => {
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    gender: '',
    birthDate: '',
    address: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Nome Completo</label>
          <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">E-mail</label>
          <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">CPF</label>
          <input type="text" className="form-control" name="cpf" value={formData.cpf} onChange={handleChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Telefone</label>
          <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Data de Nascimento</label>
          <input type="date" className="form-control" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Gênero</label>
          <select className="form-select" name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Selecione...</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
            <option value="Prefiro não informar">Prefiro não informar</option>
          </select>
        </div>
        <div className="col-md-8">
          <label className="form-label">Endereço Principal</label>
          <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} required />
        </div>
      </div>
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-warning fw-bold px-4">
          {isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
