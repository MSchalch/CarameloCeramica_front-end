import { useState, useEffect } from 'react';
import type { Peca } from '../../types/product';

interface ProductFormProps {
  initialData?: Peca;
  onSubmit: (data: Peca) => void;
  isEdit?: boolean;
  loading?: boolean;
}

const ProductForm = ({ initialData, onSubmit, isEdit = false, loading = false }: ProductFormProps) => {
  const [formData, setFormData] = useState<Peca>({
    nome: '',
    sku: '',
    artesaoMarca: 'Cerâmica Caramelo',
    categoria: 'Bowls',
    tipoArgila: 'Argila Terracota',
    tipoEsmalte: 'Esmalte Esmaltado Fosco',
    altura: 8,
    diametro: 15,
    peso: 400,
    volume: 500,
    vaiAoForno: true,
    vaiAoMicroondas: true,
    grupoPrecificacao: 'Basico',
    custo: 25,
    margemLucro: 30,
    valorVenda: 32.50,
    estoque: 10,
    imagemUrl: '',
    ativo: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Recalcula o preço sugerido sempre que custo ou grupo mudam
  const calcularMargemPorGrupo = (grupo: string) => {
    switch (grupo) {
      case 'Premium':
        return 50;
      case 'Luxo':
        return 100;
      default:
        return 30;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
      };

      if (name === 'grupoPrecificacao') {
        const novaMargem = calcularMargemPorGrupo(value);
        updated.margemLucro = novaMargem;
        const custoAtual = updated.custo || 0;
        updated.valorVenda = Number((custoAtual * (1 + novaMargem / 100)).toFixed(2));
      } else if (name === 'custo') {
        const custoNum = Number(value) || 0;
        const margem = updated.margemLucro || 30;
        updated.valorVenda = Number((custoNum * (1 + margem / 100)).toFixed(2));
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row mb-3">
        <div className="col-md-8">
          <label className="form-label">Nome da Peça *</label>
          <input
            type="text"
            className="form-control"
            name="nome"
            placeholder="Ex: Tigela Rústica Caramelo"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">SKU (Deixe em branco para gerar automático)</label>
          <input
            type="text"
            className="form-control"
            name="sku"
            placeholder="Ex: BWL-A1B2C3"
            value={formData.sku || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Artesão / Marca *</label>
          <input
            type="text"
            className="form-control"
            name="artesaoMarca"
            value={formData.artesaoMarca}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Categoria Principal *</label>
          <select
            className="form-select"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            required
          >
            <option value="Bowls">Bowls</option>
            <option value="Pratos">Pratos</option>
            <option value="Xícaras">Xícaras</option>
            <option value="Vasos">Vasos</option>
            <option value="Travessas">Travessas</option>
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Tipo de Argila *</label>
          <input
            type="text"
            className="form-control"
            name="tipoArgila"
            placeholder="Ex: Argila Vermelha, Tabaco, Terracota"
            value={formData.tipoArgila}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Tipo de Esmalte *</label>
          <input
            type="text"
            className="form-control"
            name="tipoEsmalte"
            placeholder="Ex: Esmalte Reativo Brilhante"
            value={formData.tipoEsmalte}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <h6 className="fw-bold text-secondary mt-4 mb-3">Dimensões e Especificações Técnicas (RN0011)</h6>
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Altura (cm) *</label>
          <input
            type="number"
            step="0.1"
            className="form-control"
            name="altura"
            value={formData.altura}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Diâmetro (cm) *</label>
          <input
            type="number"
            step="0.1"
            className="form-control"
            name="diametro"
            value={formData.diametro}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Peso (gramas) *</label>
          <input
            type="number"
            step="1"
            className="form-control"
            name="peso"
            value={formData.peso}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Volume (ml) *</label>
          <input
            type="number"
            step="1"
            className="form-control"
            name="volume"
            value={formData.volume}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <div className="form-check form-switch mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="vaiForno"
              name="vaiAoForno"
              checked={formData.vaiAoForno}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="vaiForno">
              Pode ir ao forno convencional
            </label>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-check form-switch mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="vaiMicro"
              name="vaiAoMicroondas"
              checked={formData.vaiAoMicroondas}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="vaiMicro">
              Pode ir ao micro-ondas e lava-louças
            </label>
          </div>
        </div>
      </div>

      <h6 className="fw-bold text-secondary mt-4 mb-3">Precificação e Estoque (RN0013 / RF0052)</h6>
      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Grupo de Precificação *</label>
          <select
            className="form-select"
            name="grupoPrecificacao"
            value={formData.grupoPrecificacao}
            onChange={handleChange}
            required
          >
            <option value="Basico">Básico (Margem 30%)</option>
            <option value="Premium">Premium (Margem 50%)</option>
            <option value="Luxo">Luxo (Margem 100%)</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Custo de Produção (R$) *</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            name="custo"
            value={formData.custo || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Margem (%)</label>
          <input
            type="number"
            className="form-control bg-light"
            name="margemLucro"
            value={formData.margemLucro || 30}
            readOnly
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Preço de Venda (R$)</label>
          <input
            type="number"
            step="0.01"
            className="form-control fw-bold text-success"
            name="valorVenda"
            value={formData.valorVenda || ''}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Quantidade em Estoque</label>
          <input
            type="number"
            className="form-control"
            name="estoque"
            value={formData.estoque ?? 0}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-8">
          <label className="form-label">URL da Imagem da Peça</label>
          <input
            type="text"
            className="form-control"
            name="imagemUrl"
            placeholder="https://images.unsplash.com/..."
            value={formData.imagemUrl || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-warning fw-bold px-4 py-2" disabled={loading}>
          {loading ? (
            <span>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Salvando...
            </span>
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            'Cadastrar Peça'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
