import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "../../services/dashboardService";
import type { DashboardData } from "../../types/dashboard";

const CORES_PALETA = [
  "#426B69", // Verde petróleo clássico da loja
  "#B08F70", // Caramelo / Cerâmica
  "#C25953", // Terracota avermelhado
  "#2E6F9E", // Azul safira
  "#E6AF2E", // Mostarda dourado
  "#6D597A", // Roxo argila
  "#355070", // Azul marinho
  "#E56B6F", // Salmão
  "#B56576", // Rosa antigo
  "#52B788", // Verde folha
];

const Dashboard: React.FC = () => {
  const [carregando, setCarregando] = useState<boolean>(true);
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [tempoRespostaMs, setTempoRespostaMs] = useState<number>(0);

  // Estados dos filtros (padrão: últimos 6 meses agrupados por mês/ano - MM/yyyy)
  const hoje = useMemo(() => new Date().toISOString().split("T")[0], []);
  const seisMesesAtras = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  }, []);

  const [dataInicio, setDataInicio] = useState<string>(seisMesesAtras);
  const [dataFim, setDataFim] = useState<string>(hoje);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    string[]
  >([]);

  const carregarDados = async (
    overrideInicio?: string,
    overrideFim?: string,
    overrideCats?: string[],
  ) => {
    setCarregando(true);
    const t0 = performance.now();
    try {
      const ini = overrideInicio !== undefined ? overrideInicio : dataInicio;
      const fim = overrideFim !== undefined ? overrideFim : dataFim;
      const cats =
        overrideCats !== undefined ? overrideCats : categoriasSelecionadas;
      const resp = await dashboardService.obterDados({
        dataInicio: ini || undefined,
        dataFim: fim || undefined,
        categorias: cats.length > 0 ? cats : undefined,
      });
      const elapsed = Math.max(1, Math.round(performance.now() - t0));
      setTempoRespostaMs(elapsed);
      setDados(resp);

      // Se for a primeira carga e ainda não tiver categorias selecionadas, seleciona todas por padrão
      if (cats.length === 0 && resp.categoriasDisponiveis?.length > 0) {
        setCategoriasSelecionadas(resp.categoriasDisponiveis);
      }
    } catch (err) {
      console.error("Erro ao carregar métricas do dashboard:", err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (dataInicio && dataFim && dataFim < dataInicio) {
      alert("A data de fim não pode ser anterior à data de início (RF0056).");
      return;
    }
    if (dataInicio && dataFim) {
      const dIni = new Date(dataInicio);
      const dFim = new Date(dataFim);
      const diffDias = Math.round(
        (dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDias > 735) {
        alert("O período máximo de análise permitido é de 24 meses (RN0072).");
        return;
      }
    }
    carregarDados();
  };

  const handleToggleCategoria = (cat: string) => {
    setCategoriasSelecionadas((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleSelecionarTodas = () => {
    if (dados?.categoriasDisponiveis) {
      setCategoriasSelecionadas([...dados.categoriasDisponiveis]);
    }
  };

  const handleLimparCategorias = () => {
    setCategoriasSelecionadas([]);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  // Categorias ativas a serem exibidas no gráfico de linhas
  const categoriasExibicao = useMemo(() => {
    if (!dados?.categoriasDisponiveis) return [];
    if (categoriasSelecionadas.length === 0) return dados.categoriasDisponiveis;
    return dados.categoriasDisponiveis.filter((cat) =>
      categoriasSelecionadas.includes(cat),
    );
  }, [dados, categoriasSelecionadas]);

  // Soma das vendas ENTREGUE por categoria seguindo o mesmo filtro do gráfico
  const totaisPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    if (!dados?.dadosGraficoLinhas) return mapa;
    categoriasExibicao.forEach((cat) => {
      mapa[cat] = dados.dadosGraficoLinhas.reduce(
        (acc, linha) => acc + Number(linha[cat] || 0),
        0,
      );
    });
    return mapa;
  }, [dados, categoriasExibicao]);

  // Total geral das vendas ENTREGUE das categorias selecionadas no período filtrado
  const totalGeralGrafico = useMemo(() => {
    return categoriasExibicao.reduce(
      (acc, cat) => acc + (totaisPorCategoria[cat] || 0),
      0,
    );
  }, [categoriasExibicao, totaisPorCategoria]);

  const exportarCSV = () => {
    if (
      !dados ||
      !dados.dadosGraficoLinhas ||
      dados.dadosGraficoLinhas.length === 0
    ) {
      alert("Não há dados para exportar no período selecionado.");
      return;
    }

    const categoriasParaExportar =
      categoriasExibicao.length > 0
        ? categoriasExibicao
        : dados.categoriasDisponiveis || [];

    const headers = ["Data", ...categoriasParaExportar];
    const rows = dados.dadosGraficoLinhas.map((linha) => {
      return [
        linha.data,
        ...categoriasParaExportar.map((cat) => linha[cat] || 0),
      ].join(";");
    });

    // Adiciona o BOM (\uFEFF) no início para que o Excel no Windows reconheça UTF-8 e exiba acentos ("Xícaras") corretamente
    const conteudoCSV = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([conteudoCSV], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `relatorio_vendas_${dataInicio}_a_${dataFim}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-4">
      {/* Cabeçalho */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "#426B69" }}>
            <i className="bi bi-graph-up-arrow me-2"></i>Painel Analítico de
            Vendas
          </h2>
          <p className="text-muted mb-0">
            Acompanhe o desempenho de vendas por categoria de produto e período
          </p>
        </div>
        <button className="btn btn-outline-dark" onClick={exportarCSV}>
          <i className="bi bi-download me-2"></i>Exportar Relatório (CSV)
        </button>
      </div>

      {/* Card de Filtros */}
      <div
        className="card shadow-sm border-0 mb-4"
        style={{ borderRadius: "12px" }}
      >
        <div className="card-body p-4">
          <form onSubmit={handleFiltrar}>
            <div className="row g-3 align-items-end mb-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-calendar-event me-1 text-primary"></i>{" "}
                  Data de Início
                </label>
                <input
                  type="date"
                  className="form-control input-data-inicio-dashboard"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">
                  <i className="bi bi-calendar-check me-1 text-primary"></i>{" "}
                  Data de Fim
                </label>
                <input
                  type="date"
                  className="form-control input-data-fim-dashboard"
                  value={dataFim}
                  min={dataInicio}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1 btn-aplicar-filtros-dashboard"
                  style={{ backgroundColor: "#426B69", borderColor: "#426B69" }}
                >
                  <i className="bi bi-funnel me-2"></i>Aplicar Filtros
                </button>
              </div>
            </div>

            {/* Filtro de Categorias de Produto */}
            <div className="border-top pt-3 mt-2">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-semibold mb-0">
                  <i className="bi bi-tags me-1 text-secondary"></i> Categorias
                  de Produtos para Análise
                </label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    onClick={handleSelecionarTodas}
                  >
                    Selecionar Todas
                  </button>
                  <span className="text-muted">|</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-decoration-none text-danger"
                    onClick={handleLimparCategorias}
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {dados?.categoriasDisponiveis &&
                dados.categoriasDisponiveis.length > 0 ? (
                  dados.categoriasDisponiveis.map((cat, index) => {
                    const isSelected = categoriasSelecionadas.includes(cat);
                    const cor = CORES_PALETA[index % CORES_PALETA.length];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategoria(cat)}
                        className={`btn btn-sm rounded-pill px-3 py-1 transition-all ${
                          isSelected ? "text-white" : "btn-outline-secondary"
                        }`}
                        style={{
                          backgroundColor: isSelected ? cor : "transparent",
                          borderColor: cor,
                          fontWeight: isSelected ? "600" : "normal",
                        }}
                      >
                        <i
                          className={`bi ${isSelected ? "bi-check2-circle" : "bi-circle"} me-1`}
                        ></i>
                        {cat}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-muted small">
                    Nenhuma categoria cadastrada no momento.
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Gráfico de Linhas por Categoria (Destaque Principal logo abaixo dos filtros) */}
      <div
        className="card shadow-sm border-0 mb-4"
        style={{ borderRadius: "12px" }}
      >
        <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0" style={{ color: "#426B69" }}>
              <i className="bi bi-graph-up me-2"></i>Evolução de Vendas por
              Categoria
            </h5>
            <small className="text-muted">
              Vendas com status <strong>ENTREGUE</strong> agrupadas por mês/ano
              em Reais (R$)
            </small>
          </div>
          <span className="badge bg-success-subtle text-success border border-success-subtle badge-tempo-resposta-dashboard">
            <i className="bi bi-lightning-charge-fill me-1"></i>
            Tempo de resposta (RNF0011): {tempoRespostaMs} ms (&le; 1000 ms)
          </span>
        </div>
        <div className="card-body" style={{ minHeight: "420px" }}>
          {carregando ? (
            <div className="d-flex justify-content-center align-items-center h-100 py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <span className="ms-2">Carregando métricas...</span>
            </div>
          ) : !dados?.dadosGraficoLinhas ||
            dados.dadosGraficoLinhas.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bar-chart fs-1 d-block mb-3"></i>
              <p className="lead mb-0">
                Nenhum dado de vendas registrado para o período e categorias
                selecionadas.
              </p>
              <small>
                Experimente selecionar um intervalo de datas mais amplo.
              </small>
            </div>
          ) : (
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dados.dadosGraficoLinhas}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="data" stroke="#666" tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="#666"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatarMoeda(Number(value) || 0),
                      name,
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
                  {/* Linha individual para cada categoria de produto */}
                  {categoriasExibicao.map((cat, idx) => {
                    const originalIdx = (
                      dados.categoriasDisponiveis || []
                    ).indexOf(cat);
                    const cor =
                      CORES_PALETA[
                        (originalIdx >= 0 ? originalIdx : idx) %
                          CORES_PALETA.length
                      ];
                    return (
                      <Line
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        name={cat}
                        stroke={cor}
                        strokeWidth={2.5}
                        activeDot={{ r: 7 }}
                        dot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Cards com o Total Vendido por Categoria (seguindo o mesmo filtro do gráfico) + 6º Card com o Total Geral do Período */}
      <div className="row g-3 mb-4">
        {(dados?.categoriasDisponiveis || []).map((cat, idx) => {
          const cor = CORES_PALETA[idx % CORES_PALETA.length];
          const ativaNoFiltro = categoriasExibicao.includes(cat);
          const valorTotalCategoria = ativaNoFiltro
            ? totaisPorCategoria[cat] || 0
            : 0;

          return (
            <div key={cat} className="col-12 col-sm-6 col-md-4 col-xl-2">
              <div
                className="card shadow-sm border-0 h-100 card-total-categoria"
                data-categoria={cat}
                data-valor={valorTotalCategoria.toFixed(2)}
                style={{
                  borderRadius: "12px",
                  borderLeft: `4px solid ${cor}`,
                  opacity: ativaNoFiltro ? 1 : 0.55,
                  transition: "all 0.2s ease",
                }}
              >
                <div className="card-body py-3 px-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      className="fw-bold small text-truncate"
                      style={{ color: cor }}
                    >
                      {cat}
                    </span>
                    <i
                      className="bi bi-tag-fill fs-5"
                      style={{ color: cor }}
                    ></i>
                  </div>
                  <h4 className="fw-bold mb-0 mt-2 text-dark">
                    {formatarMoeda(valorTotalCategoria)}
                  </h4>
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {ativaNoFiltro
                      ? "Total ENTREGUE no filtro"
                      : "Oculta no filtro"}
                  </small>
                </div>
              </div>
            </div>
          );
        })}

        {/* 6º Card: Total Geral Vendido no Período Filtrado */}
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 h-100 card-total-geral-periodo"
            data-valor={totalGeralGrafico.toFixed(2)}
            style={{
              borderRadius: "12px",
              borderLeft: "4px solid #198754",
              backgroundColor: "#f8fff9",
            }}
          >
            <div className="card-body py-3 px-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold small text-success">
                  Total no Período
                </span>
                <i className="bi bi-cash-stack text-success fs-5"></i>
              </div>
              <h4 className="fw-bold mb-0 mt-2 text-success">
                {formatarMoeda(totalGeralGrafico)}
              </h4>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Soma das categorias no gráfico
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Detalhamento Mensal por Categoria (Rastreabilidade com a base de vendas ENTREGUE) */}
      {dados?.dadosGraficoLinhas && dados.dadosGraficoLinhas.length > 0 && (
        <div
          className="card shadow-sm border-0 mb-4"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-header bg-white py-3 border-0">
            <h6 className="fw-bold mb-0" style={{ color: "#426B69" }}>
              <i className="bi bi-table me-2"></i>Valores Mensais Consolidados
              por Categoria (Somente Compras ENTREGUE)
            </h6>
          </div>
          <div className="card-body pt-0">
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0 tabela-historico-mensal">
                <thead className="table-light">
                  <tr>
                    <th>Mês/Ano</th>
                    {categoriasExibicao.map((cat) => (
                      <th key={cat} className="text-end">
                        {cat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.dadosGraficoLinhas.map((linha, idx) => (
                    <tr
                      key={idx}
                      className="linha-mes-dashboard"
                      data-mes={String(linha.data)}
                    >
                      <td className="fw-bold text-secondary celula-mes-ano">
                        {String(linha.data)}
                      </td>
                      {categoriasExibicao.map((cat) => (
                        <td
                          key={cat}
                          className="text-end fw-semibold celula-valor-categoria"
                          data-categoria={cat}
                          data-valor={Number(linha[cat] || 0).toFixed(2)}
                        >
                          {formatarMoeda(Number(linha[cat] || 0))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
