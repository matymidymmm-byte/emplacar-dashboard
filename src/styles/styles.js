const styles = {
  app: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    background: "#0b1020",
    color: "#e2e8f0",
    fontFamily: "Arial, sans-serif",
    overflow: "hidden",
  },

  sidebar: {
    width: "clamp(210px, 18vw, 240px)",
    minWidth: "210px",
    background: "#111827",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    borderRight: "1px solid #1e293b",
    overflowY: "auto",
  },

  main: {
    flex: 1,
    padding: 18,
    overflowX: "hidden",
    overflowY: "auto",
    background:
      "linear-gradient(135deg, #0b1020 0%, #121937 100%)",
  },

  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },

  logoImagem: {
    width: 58,
    height: 58,
    borderRadius: 14,
    objectFit: "cover",
    border: "2px solid #38bdf8",
  },

  logo: {
    margin: 0,
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "bold",
  },

  logoSubtitulo: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: 12,
  },

  menuLista: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  menu: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid transparent",
    background: "transparent",
    color: "#cbd5e1",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 14,
    width: "100%",
  },

  menuAtivo: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #2563eb",
    background:
      "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: 14,
    width: "100%",
  },

  menuRodape: {
    marginTop: "auto",
    paddingTop: 14,
    borderTop: "1px solid #1e293b",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  menuSecundario: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e2e8f0",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 13,
    fontWeight: "bold",
    width: "100%",
  },

  dadosEmpresaBox: {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 10,
    overflowWrap: "break-word",
  },

  dadosEmpresaTexto: {
    margin: 0,
    marginBottom: 10,
    whiteSpace: "pre-wrap",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#cbd5e1",
    fontFamily: "Arial, sans-serif",
  },

  botaoCopiarMenu: {
    width: "100%",
    padding: "9px 10px",
    border: 0,
    borderRadius: 10,
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },

  botaoCopiadoMenu: {
    width: "100%",
    padding: "9px 10px",
    border: 0,
    borderRadius: 10,
    background: "#64748b",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },

  botaoLimpar: {
    width: "100%",
    padding: "9px 10px",
    border: 0,
    borderRadius: 10,
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },

  dashboardTopo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
    flexWrap: "wrap",
  },

  dashboardTitulo: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 34px)",
    fontWeight: 800,
    color: "#f8fafc",
  },

  dashboardSubtitulo: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 14,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
    flexWrap: "wrap",
  },

  titulo: {
    margin: 0,
    fontSize: "clamp(22px, 2.8vw, 30px)",
    fontWeight: 800,
    color: "#f8fafc",
  },

  subtitulo: {
    marginTop: 4,
    color: "#94a3b8",
    fontSize: 14,
  },

  card: {
    background: "#131c31",
    borderRadius: 18,
    padding: 14,
    border: "1px solid #1e293b",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.35)",
    marginBottom: 14,
    overflow: "hidden",
    width: "100%",
    boxSizing: "border-box",
  },

  cardTitulo: {
    marginTop: 0,
    marginBottom: 12,
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "bold",
  },

  kpis: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 14,
  },

  kpisModernos: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 14,
  },

  kpi: {
    background:
      "linear-gradient(135deg, #1e293b 0%, #312e81 100%)",
    padding: 14,
    borderRadius: 18,
    border: "1px solid #334155",
    boxShadow:
      "0 10px 25px rgba(0,0,0,0.35)",
    overflow: "hidden",
    minWidth: 0,
  },

  kpiHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    overflow: "hidden",
  },

  kpiIcone: {
    width: 56,
    height: 56,
    minWidth: 56,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  kpiTitulo: {
    margin: 0,
    marginBottom: 6,
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "bold",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  kpiValor: {
    fontSize: "clamp(16px, 2vw, 20px)",
    fontWeight: 800,
    color: "#f8fafc",
    lineHeight: 1.1,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  dashboardGridNova: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 14,
    alignItems: "start",
    width: "100%",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    alignItems: "start",
    width: "100%",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
    marginBottom: 10,
    width: "100%",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "bold",
    minWidth: 0,
  },

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  },

  botao: {
    padding: "10px 14px",
    borderRadius: 12,
    border: 0,
    background:
      "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  botaoDashboard: {
    padding: "10px 16px",
    borderRadius: 12,
    border: 0,
    background:
      "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  botaoCinza: {
    padding: "10px 14px",
    borderRadius: 12,
    border: 0,
    background: "#475569",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
  },

  botaoPequeno: {
    padding: "7px 10px",
    borderRadius: 8,
    border: 0,
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 12,
  },

  acoes: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
  },

  editar: {
    padding: "6px 9px",
    borderRadius: 8,
    border: 0,
    background: "#1d4ed8",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  },

  excluir: {
    padding: "6px 9px",
    borderRadius: 8,
    border: 0,
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  },

  detalhes: {
    padding: "6px 9px",
    borderRadius: 8,
    border: 0,
    background: "#0891b2",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },

  copiar: {
    padding: "6px 9px",
    borderRadius: 8,
    border: 0,
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },

  copiado: {
    padding: "6px 9px",
    borderRadius: 8,
    border: 0,
    background: "#64748b",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: "bold",
  },

  status: {
    padding: "7px 10px",
    borderRadius: 8,
    border: 0,
    background: "#166534",
    color: "#dcfce7",
    cursor: "pointer",
    fontWeight: "bold",
  },

  resumoFiltro: {
    background: "#131c31",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    border: "1px solid #1e293b",
    color: "#e2e8f0",
  },

  tabelaContainer: {
    width: "100%",
    overflow: "hidden",
  },

  tabelaBox: {
    width: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    paddingBottom: 6,
  },

  tabela: {
    width: "100%",
    minWidth: 900,
    borderCollapse: "collapse",
    color: "#e2e8f0",
    fontSize: 12,
  },

  tabelaCompacta: {
    width: "100%",
    minWidth: 1180,
    borderCollapse: "collapse",
    fontSize: 13,
    color: "#e2e8f0",
  },

  th: {
    padding: "9px 8px",
    textAlign: "left",
    borderBottom: "1px solid #334155",
    background: "#0f172a",
    color: "#cbd5e1",
    whiteSpace: "nowrap",
  },

  thFiltro: {
    padding: "6px 8px",
    borderBottom: "1px solid #334155",
    background: "#0f172a",
  },

  td: {
    padding: "8px 8px",
    borderBottom: "1px solid #1e293b",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    color: "#e2e8f0",
  },

  tdData: {
    padding: "8px 8px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "middle",
    fontWeight: "bold",
    color: "#93c5fd",
  },

  tdValor: {
    padding: "8px 8px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "middle",
    fontWeight: "bold",
    color: "#f8fafc",
  },

  tdPlaca: {
    padding: "8px 8px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "middle",
    fontWeight: "bold",
    color: "#7dd3fc",
  },

  tdAcoes: {
    padding: "8px 8px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #1e293b",
    verticalAlign: "middle",
    minWidth: 210,
  },

  linhaData: {
    padding: "11px 10px",
    background:
      "linear-gradient(90deg, rgba(37,99,235,0.28), rgba(14,165,233,0.12))",
    color: "#bfdbfe",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    borderTop:
      "1px solid rgba(147,197,253,0.35)",
    borderBottom:
      "1px solid rgba(147,197,253,0.35)",
  },

  detalheLinha: {
    padding: 14,
    background: "#0f172a",
    borderBottom: "1px solid #334155",
  },

  detalheGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },

  detalheItem: {
    background: "#131c31",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.25)",
    color: "#e2e8f0",
    minWidth: 0,
  },

  detalheLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  filtroInput: {
    width: "100%",
    padding: "7px 8px",
    borderRadius: 8,
    border: "1px solid #334155",
    fontSize: 12,
    background: "#020617",
    color: "#f8fafc",
    boxSizing: "border-box",
  },

  totalTabela: {
    marginTop: 8,
    fontSize: 13,
    color: "#cbd5e1",
  },

  vazio: {
    padding: 16,
    textAlign: "center",
    color: "#94a3b8",
  },

  grafico: {
    width: "100%",
    height: 240,
  },

  graficoGrande: {
    width: "100%",
    height: 260,
  },

  textarea: {
    width: "100%",
    minHeight: 220,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #334155",
    fontSize: 14,
    resize: "vertical",
    marginBottom: 14,
    background: "#0f172a",
    color: "#f8fafc",
    boxSizing: "border-box",
  },

  ajuda: {
    color: "#cbd5e1",
    marginTop: 0,
    marginBottom: 12,
  },

  resultado: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#1e3a8a",
    color: "#bfdbfe",
    fontWeight: "bold",
  },

  caixaCobranca: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#0f172a",
    color: "#bfdbfe",
    border: "1px solid #1e40af",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
  },
};

export default styles;