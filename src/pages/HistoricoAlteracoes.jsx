import { Fragment, useMemo, useState } from "react";

export default function HistoricoAlteracoes({
  historicoAlteracoes = [],
  setHistoricoAlteracoes,
  registrarAlteracao,
  usuario,
  admin,
}) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [filtroUsuario, setFiltroUsuario] = useState("Todos");
  const [limite, setLimite] = useState(100);
  const [filtroPeriodo, setFiltroPeriodo] = useState("Todos");
  const [registroExpandido, setRegistroExpandido] = useState(null);

  const email = usuario?.email?.toLowerCase() || "";
  const ehAdmin = admin;

  const tipos = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(historicoAlteracoes.map((item) => item.tipo).filter(Boolean))
      ),
    ];
  }, [historicoAlteracoes]);

  const modulos = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(historicoAlteracoes.map((item) => item.modulo).filter(Boolean))
      ),
    ];
  }, [historicoAlteracoes]);

  const usuarios = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(historicoAlteracoes.map((item) => item.usuario).filter(Boolean))
      ),
    ];
  }, [historicoAlteracoes]);

  const historicoFiltrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const agora = new Date();

    function dentroPeriodo(dataHora) {
      if (filtroPeriodo === "Todos") return true;

      const data = new Date(dataHora);

      if (filtroPeriodo === "Hoje") {
        return data.toDateString() === agora.toDateString();
      }

      if (filtroPeriodo === "7 Dias") {
        const seteDias = new Date();
        seteDias.setDate(agora.getDate() - 7);
        return data >= seteDias;
      }

      if (filtroPeriodo === "Mês") {
        return (
          data.getMonth() === agora.getMonth() &&
          data.getFullYear() === agora.getFullYear()
        );
      }

      return true;
    }

    return historicoAlteracoes
      .filter((item) => {
        const passaTipo = filtroTipo === "Todos" || item.tipo === filtroTipo;
        const passaModulo =
          filtroModulo === "Todos" || item.modulo === filtroModulo;
        const passaUsuario =
          filtroUsuario === "Todos" || item.usuario === filtroUsuario;

        const textoBusca = [
          item.usuario,
          item.tipo,
          item.modulo,
          item.descricao,
          item.valorAntigo,
          item.valorNovo,
          item.itemId,
          item.risco,
          item.dataHora ? new Date(item.dataHora).toLocaleString("pt-BR") : "",
          ...(item.detalhes || []).map(
            (detalhe) =>
              `${detalhe.campo} ${detalhe.valorAntigo} ${detalhe.valorNovo}`
          ),
        ]
          .join(" ")
          .toLowerCase();

        return (
          passaTipo &&
          passaModulo &&
          passaUsuario &&
          (!termo || textoBusca.includes(termo)) &&
          dentroPeriodo(item.dataHora)
        );
      })
      .slice(0, limite);
  }, [
    historicoAlteracoes,
    busca,
    filtroTipo,
    filtroModulo,
    filtroUsuario,
    filtroPeriodo,
    limite,
  ]);

  function formatarData(dataHora) {
    if (!dataHora) return "-";

    try {
      return new Date(dataHora).toLocaleString("pt-BR");
    } catch {
      return dataHora;
    }
  }

  function limparHistorico() {
    if (!ehAdmin) return;

    const confirmar = prompt(
      'Digite "LIMPAR HISTORICO" para apagar o histórico de alterações.'
    );

    if (confirmar !== "LIMPAR HISTORICO") {
      alert("Limpeza cancelada.");
      return;
    }

    const registro = {
      id: Date.now(),
      usuario: usuario?.email || "Usuário não identificado",
      tipo: "Exclusão",
      modulo: "Histórico de Alterações",
      descricao: `${usuario?.email || "Usuário"} limpou o histórico de alterações`,
      valorAntigo: `${historicoAlteracoes.length} registros`,
      valorNovo: "1 registro de limpeza",
      itemId: "historicoAlteracoes",
      detalhes: [],
      risco: "ALTO",
      dataHora: new Date().toISOString(),
    };

    setHistoricoAlteracoes([registro]);
  }

  function exportarHistorico() {
    if (!ehAdmin) return;

    const agora = new Date();

    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportadoEm: agora.toISOString(),
            quantidade: historicoAlteracoes.length,
            historicoAlteracoes,
          },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `historico-alteracoes-${agora
  .toISOString()
  .slice(0, 10)}.json`;

    a.click();
    URL.revokeObjectURL(url);

    registrarAlteracao?.({
      tipo: "Exportação",
      modulo: "Histórico de Alterações",
      descricao: `${usuario?.email || "Usuário"} exportou o histórico de alterações`,
      valorNovo: `${historicoAlteracoes.length} registros`,
    });
  }

  const cards = [
    { titulo: "Registros", valor: historicoAlteracoes.length },
    { titulo: "Exibindo", valor: historicoFiltrado.length },
    {
      titulo: "Risco alto",
      valor: historicoAlteracoes.filter((item) => item.risco === "ALTO").length,
    },
    {
      titulo: "Alterações",
      valor: historicoAlteracoes.filter((item) => item.tipo === "Alteração")
        .length,
    },
    {
      titulo: "Exclusões",
      valor: historicoAlteracoes.filter((item) => item.tipo === "Exclusão")
        .length,
    },
    {
      titulo: "Pagamentos",
      valor: historicoAlteracoes.filter((item) => item.tipo === "Pagamento")
        .length,
    },
  ];

  const corTipo = {
    Adição: "#16a34a",
    Alteração: "#2563eb",
    Exclusão: "#dc2626",
    Exportação: "#7c3aed",
    Importação: "#f97316",
    Login: "#06b6d4",
    Logout: "#64748b",
    Pagamento: "#22c55e",
    Restauração: "#eab308",
    Fechamento: "#9333ea",
    Backup: "#0ea5e9",
    "Desfazer pagamento": "#ef4444",
  };

  function corLinha(tipo) {
    if (tipo === "Exclusão") return "rgba(220,38,38,0.08)";
    if (tipo === "Alteração") return "rgba(37,99,235,0.08)";
    if (tipo === "Adição") return "rgba(22,163,74,0.08)";
    if (tipo === "Login") return "rgba(6,182,212,0.08)";
    if (tipo === "Pagamento") return "rgba(34,197,94,0.08)";
    if (tipo === "Restauração") return "rgba(234,179,8,0.08)";
    if (tipo === "Fechamento") return "rgba(147,51,234,0.08)";
    return "transparent";
  }

  function corRisco(risco) {
    if (risco === "ALTO") return "#dc2626";
    if (risco === "MÉDIO") return "#f97316";
    return "#16a34a";
  }

  function valorTexto(valor) {
    if (valor === null || valor === undefined || valor === "") return "-";

    if (typeof valor === "object") {
      try {
        return JSON.stringify(valor, null, 2);
      } catch {
        return String(valor);
      }
    }

    return String(valor);
  }

  if (!ehAdmin) {
    return (
      <div style={container}>
        <div style={cardBloqueado}>
          <h1 style={titulo}>Acesso bloqueado</h1>
          <p style={textoSuave}>Esta página é exclusiva do administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={cabecalho}>
        <div>
          <h1 style={titulo}>Histórico de Alterações</h1>
          <p style={textoSuave}>
            Auditoria completa de adições, edições, exclusões, backups e
            mudanças importantes.
          </p>
        </div>

        <div style={acoesTopo}>
          <button style={botaoPrimario} onClick={exportarHistorico}>
            Exportar histórico
          </button>

          <button style={botaoPerigo} onClick={limparHistorico}>
            Limpar histórico
          </button>
        </div>
      </div>

      <div style={gridCards}>
        {cards.map((card) => (
          <div key={card.titulo} style={cardResumo}>
            <span style={labelCard}>{card.titulo}</span>
            <strong style={valorCard}>{card.valor}</strong>
          </div>
        ))}
      </div>

      <div style={painelFiltros}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por usuário, placa, cliente, valor, módulo..."
          style={input}
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          style={select}
        >
          {tipos.map((tipo) => (
            <option key={tipo}>{tipo}</option>
          ))}
        </select>

        <select
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
          style={select}
        >
          {modulos.map((modulo) => (
            <option key={modulo}>{modulo}</option>
          ))}
        </select>

        <select
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
          style={select}
        >
          {usuarios.map((usuarioItem) => (
            <option key={usuarioItem} value={usuarioItem}>
              {usuarioItem}
            </option>
          ))}
        </select>

        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          style={select}
        >
          <option value="Todos">Todos períodos</option>
          <option value="Hoje">Hoje</option>
          <option value="7 Dias">Últimos 7 dias</option>
          <option value="Mês">Mês atual</option>
        </select>

        <select
          value={limite}
          onChange={(e) => setLimite(Number(e.target.value))}
          style={select}
        >
          <option value={50}>50 últimos</option>
          <option value={100}>100 últimos</option>
          <option value={250}>250 últimos</option>
          <option value={500}>500 últimos</option>
          <option value={1000}>1000 últimos</option>
        </select>
      </div>

      <div style={tabelaBox}>
        <table style={tabela}>
          <thead>
            <tr>
              <th style={th}>Data/Hora</th>
              <th style={th}>Usuário</th>
              <th style={th}>Tipo</th>
              <th style={th}>Módulo</th>
              <th style={th}>Descrição</th>
              <th style={th}>Campo</th>
              <th style={th}>Antes</th>
              <th style={th}>Depois</th>
              <th style={thStickyDireita}>Risco</th>
            </tr>
          </thead>

          <tbody>
            {historicoFiltrado.length === 0 && (
              <tr>
                <td colSpan={9} style={vazio}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}

            {historicoFiltrado.map((item) => {
              const riscoAtual = item.risco || "NORMAL";

              return (
                <Fragment key={item.id}>
                  <tr
                    onClick={() =>
                      setRegistroExpandido(
                        registroExpandido === item.id ? null : item.id
                      )
                    }
                    style={{
                      cursor: "pointer",
                      background: corLinha(item.tipo),
                    }}
                  >
                    <td style={tdData}>{formatarData(item.dataHora)}</td>

                    <td style={td}>{item.usuario || "-"}</td>

                    <td style={td}>
                      <span
                        style={{
                          ...badge,
                          background: corTipo[item.tipo] || "#475569",
                        }}
                      >
                        {item.tipo || "-"}
                      </span>
                    </td>

                    <td style={td}>{item.modulo || "-"}</td>

                    <td style={tdDescricao}>{item.descricao || "-"}</td>

                    <td style={td}>
                      {Array.isArray(item.detalhes) &&
                      item.detalhes.length > 0 ? (
                        <div style={listaDetalhes}>
                          {item.detalhes.map((detalhe, index) => (
                            <div
                              key={`${item.id}-${detalhe.campo}-${index}`}
                              style={linhaDetalhe}
                            >
                              {detalhe.campo}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td style={tdValor}>
                      {Array.isArray(item.detalhes) &&
                      item.detalhes.length > 0 ? (
                        <div style={listaDetalhes}>
                          {item.detalhes.map((detalhe, index) => (
                            <div
                              key={`${item.id}-antes-${index}`}
                              style={linhaDetalhe}
                            >
                              {valorTexto(detalhe.valorAntigo)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td style={tdValor}>
                      {Array.isArray(item.detalhes) &&
                      item.detalhes.length > 0 ? (
                        <div style={listaDetalhes}>
                          {item.detalhes.map((detalhe, index) => (
                            <div
                              key={`${item.id}-depois-${index}`}
                              style={linhaDetalhe}
                            >
                              {valorTexto(detalhe.valorNovo)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td style={tdStickyDireita}>
                      <span
                        style={{
                          ...badge,
                          background: corRisco(riscoAtual),
                        }}
                      >
                        {riscoAtual}
                      </span>
                    </td>
                  </tr>

                  {registroExpandido === item.id && (
                    <tr>
                      <td colSpan={9} style={tdExpandido}>
                        <div style={boxExpandido}>
                          <strong style={tituloExpandido}>
                            Detalhes completos
                          </strong>

                          <div style={gridExpandido}>
                            <div>
                              <b>Usuário:</b> {item.usuario || "-"}
                            </div>

                            <div>
                              <b>Tipo:</b> {item.tipo || "-"}
                            </div>

                            <div>
                              <b>Módulo:</b> {item.modulo || "-"}
                            </div>

                            <div>
                              <b>Risco:</b>{" "}
                              <span
                                style={{
                                  ...badge,
                                  background: corRisco(riscoAtual),
                                }}
                              >
                                {riscoAtual}
                              </span>
                            </div>

                            <div>
                              <b>Item ID:</b> {item.itemId || "-"}
                            </div>

                            <div>
                              <b>Data/Hora:</b> {formatarData(item.dataHora)}
                            </div>
                          </div>

                          <div style={descricaoExpandida}>
                            <b>Descrição:</b> {item.descricao || "-"}
                          </div>

                          {Array.isArray(item.detalhes) &&
                            item.detalhes.length > 0 && (
                              <div style={alteracoesExpandida}>
                                <strong>Alterações detectadas</strong>

                                {item.detalhes.map((detalhe, index) => (
                                  <div
                                    key={`${item.id}-expandido-${index}`}
                                    style={alteracaoLinhaExpandida}
                                  >
                                    <div style={campoExpandido}>
                                      {detalhe.campo}
                                    </div>

                                    <div style={antesDepoisGrid}>
                                      <div style={valorAntes}>
                                        <span style={labelAntesDepois}>
                                          Antes
                                        </span>
                                        <pre style={preValor}>
                                          {valorTexto(detalhe.valorAntigo)}
                                        </pre>
                                      </div>

                                      <div style={valorDepois}>
                                        <span style={labelAntesDepois}>
                                          Depois
                                        </span>
                                        <pre style={preValor}>
                                          {valorTexto(detalhe.valorNovo)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const container = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  width: "100%",
};

const cabecalho = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const titulo = {
  margin: 0,
  color: "#0f172a",
  fontSize: 28,
  fontWeight: 800,
};

const textoSuave = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: 14,
};

const acoesTopo = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const botaoPrimario = {
  border: 0,
  background: "#2563eb",
  color: "#fff",
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const botaoPerigo = {
  border: 0,
  background: "#dc2626",
  color: "#fff",
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const gridCards = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const cardResumo = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 18,
  padding: 18,
  backdropFilter: "blur(14px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
};

const labelCard = {
  display: "block",
  fontSize: 13,
  color: "#94a3b8",
  marginBottom: 8,
};

const valorCard = {
  fontSize: 34,
  color: "#f8fafc",
  fontWeight: 800,
};

const painelFiltros = {
  display: "grid",
  gridTemplateColumns: "2fr repeat(5, minmax(140px, 1fr))",
  gap: 10,
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 20,
  padding: 16,
  backdropFilter: "blur(14px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
};

const input = {
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 14,
  padding: "13px 14px",
  fontSize: 14,
  outline: "none",
  background: "rgba(2,6,23,0.82)",
  color: "#f8fafc",
};

const select = {
  border: "1px solid rgba(148,163,184,0.18)",
  borderRadius: 14,
  padding: "13px 14px",
  fontSize: 14,
  background: "rgba(2,6,23,0.82)",
  color: "#f8fafc",
  outline: "none",
};

const tabelaBox = {
  maxHeight: "72vh",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 22,
  overflow: "auto",
  position: "relative",
  scrollbarWidth: "thin",
  backdropFilter: "blur(14px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.30)",
};

const tabela = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  minWidth: 1180,
};

const th = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "rgba(2,6,23,0.98)",
  color: "#f8fafc",
  textAlign: "left",
  padding: "14px 12px",
  fontSize: 12,
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const thStickyDireita = {
  ...th,
  right: 0,
  zIndex: 30,
  boxShadow: "-10px 0 20px rgba(0,0,0,0.20)",
};

const td = {
  transition: "all 0.18s ease",
  padding: "12px",
  borderBottom: "1px solid rgba(148,163,184,0.08)",
  fontSize: 13,
  color: "#e2e8f0",
  verticalAlign: "top",
  maxWidth: 190,
  background: "transparent",
};

const tdStickyDireita = {
  ...td,
  position: "sticky",
  right: 0,
  zIndex: 10,
  background: "rgba(15,23,42,0.96)",
  boxShadow: "-10px 0 20px rgba(0,0,0,0.20)",
  minWidth: 105,
};

const tdData = {
  ...td,
  minWidth: 145,
  whiteSpace: "nowrap",
};

const tdDescricao = {
  ...td,
  minWidth: 260,
  maxWidth: 360,
};

const tdValor = {
  ...td,
  minWidth: 180,
  maxWidth: 260,
  wordBreak: "break-word",
};

const badge = {
  boxShadow: "0 0 18px rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  letterSpacing: 0.4,
  textTransform: "uppercase",
  display: "inline-block",
  color: "#fff",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const listaDetalhes = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const linhaDetalhe = {
  fontSize: 12,
  color: "#e2e8f0",
  background: "rgba(30,41,59,0.72)",
  border: "1px solid rgba(148,163,184,0.10)",
  borderRadius: 10,
  padding: "7px 10px",
};

const vazio = {
  padding: 24,
  textAlign: "center",
  color: "#94a3b8",
};

const cardBloqueado = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 20,
  padding: 24,
  backdropFilter: "blur(14px)",
};

const tdExpandido = {
  padding: 0,
  background: "rgba(2,6,23,0.92)",
};

const boxExpandido = {
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  borderTop: "1px solid rgba(148,163,184,0.12)",
};

const tituloExpandido = {
  color: "#f8fafc",
  fontSize: 16,
};

const gridExpandido = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
  gap: 12,
  color: "#cbd5e1",
  fontSize: 13,
};

const descricaoExpandida = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.10)",
  borderRadius: 14,
  padding: 14,
  color: "#e2e8f0",
  lineHeight: 1.5,
};

const alteracoesExpandida = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  color: "#f8fafc",
};

const alteracaoLinhaExpandida = {
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.10)",
  borderRadius: 14,
  padding: 14,
};

const campoExpandido = {
  fontWeight: 800,
  color: "#f8fafc",
  marginBottom: 10,
};

const antesDepoisGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))",
  gap: 12,
};

const valorAntes = {
  background: "rgba(220,38,38,0.10)",
  border: "1px solid rgba(220,38,38,0.18)",
  borderRadius: 12,
  padding: 12,
};

const valorDepois = {
  background: "rgba(22,163,74,0.10)",
  border: "1px solid rgba(22,163,74,0.18)",
  borderRadius: 12,
  padding: 12,
};

const labelAntesDepois = {
  display: "block",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 8,
};

const preValor = {
  margin: 0,
  color: "#e2e8f0",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: 12,
};