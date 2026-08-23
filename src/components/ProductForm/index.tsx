import { useState, useEffect } from 'react';

export interface ProductData {
  id?: number;
  sku: string;
  name: string;
  brand: string;
  category: string;
  material: string;
  dimensions: string;
  weight: number | '';
  priceGroup: string;
}

interface ProductFormProps {
  initialData?: ProductData;
  onSubmit: (data: ProductData) => void;
  isEdit?: boolean;
}

const ProductForm = ({ initialData, onSubmit, isEdit = false }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductData>({
    sku: '',
    name: '',
    brand: '',
    category: '',
    material: '',
    dimensions: '',
    weight: '',
    priceGroup: ''
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
        <div className="col-12 mb-3">
          <label className="form-label">Foto Principal da Peça</label>
          <input type="file" className="form-control" name="image" accept="image/*" />
        </div>
        <div className="col-md-8">
          <label className="form-label">Nome da Peça</label>
          <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">SKU (Código)</label>
          <input type="text" className="form-control" name="sku" value={formData.sku} onChange={handleChange} required />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Artesão / Marca</label>
          <input type="text" className="form-control" name="brand" value={formData.brand} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Categoria Principal</label>
          <select className="form-select" name="category" value={formData.category} onChange={handleChange} required>
            <option value="">Selecione...</option>
            <option value="Pratos">Pratos</option>
            <option value="Bowls">Bowls</option>
            <option value="Xícaras">Xícaras</option>
            <option value="Vasos">Vasos</option>
          </select>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-md-3">
          <label className="form-label">Material (Argila/Esmalte)</label>
          <input type="text" className="form-control" name="material" value={formData.material} onChange={handleChange} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Dimensões (LxAxP)</label>
          <input type="text" className="form-control" name="dimensions" placeholder="Ex: 20x15x20cm" value={formData.dimensions} onChange={handleChange} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Peso (gramas)</label>
          <input type="number" className="form-control" name="weight" placeholder="Ex: 500" value={formData.weight || ''} onChange={handleChange} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Grupo de Precificação</label>
          <select className="form-select" name="priceGroup" value={formData.priceGroup} onChange={handleChange} required>
            <option value="">Selecione...</option>
            <option value="Basico">Básico (Margem 30%)</option>
            <option value="Premium">Premium (Margem 50%)</option>
            <option value="Luxo">Luxo (Margem 100%)</option>
          </select>
        </div>
      </div>
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-warning fw-bold px-4">
          {isEdit ? 'Salvar Alterações' : 'Cadastrar Peça'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
