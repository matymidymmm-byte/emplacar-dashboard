import { useMemo, useState } from "react";

export default function HistoricoAlteracoes({
  historicoAlteracoes = [],
  setHistoricoAlteracoes,
  registrarAlteracao,
  usuario,
  admin,
  moeda,
}) {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroModulo, setFiltroModulo] = useState("Todos");
  const [limite, setLimite] = useState(100);

  const email = usuario?.email?.toLowerCase() || "";
  const ehAdmin = admin || email === "matymidy.mmm@gmail.com";

  const tipos = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(
          historicoAlteracoes
            .map((item) => item.tipo)
            .filter(Boolean)
        )
      ),
    ];
  }, [historicoAlteracoes]);

  const modulos = useMemo(() => {
    return [
      "Todos",
      ...Array.from(
        new Set(
          historicoAlteracoes
            .map((item) => item.modulo)
            .filter(Boolean)
        )
      ),
    ];
  }, [historicoAlteracoes]);

  const historicoFiltrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return historicoAlteracoes
      .filter((item) => {
        const passaTipo =
          filtroTipo === "Todos" || item.tipo === filtroTipo;

        const passaModulo =
          filtroModulo === "Todos" || item.modulo === filtroModulo;

        const textoBusca = [
          item.usuario,
          item.tipo,
          item.modulo,
          item.descricao,
          item.valorAntigo,
          item.valorNovo,
          item.dataHora,
          ...(item.detalhes || []).map(
            (detalhe) =>
              `${detalhe.campo} ${detalhe.valorAntigo} ${detalhe.valorNovo}`
          ),
        ]
          .join(" ")
          .toLowerCase();

        const passaBusca =
          !termo || textoBusca.includes(termo);

        return passaTipo && passaModulo && passaBusca;
      })
      .slice(0, limite);
  }, [
    historicoAlteracoes,
    busca,
    filtroTipo,
    filtroModulo,
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
      {
        type: "application/json",
      }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `historico-alteracoes-emplacar-${agora
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
    {
      titulo: "Registros",
      valor: historicoAlteracoes.length,
    },
    {
      titulo: "Exibindo",
      valor: historicoFiltrado.length,
    },
    {
      titulo: "Alterações",
      valor: historicoAlteracoes.filter(
        (item) => item.tipo === "Alteração"
      ).length,
    },
    {
      titulo: "Exclusões",
      valor: historicoAlteracoes.filter(
        (item) => item.tipo === "Exclusão"
      ).length,
    },
  ];

  const corTipo = {
    Adição: "#16a34a",
    Alteração: "#2563eb",
    Exclusão: "#dc2626",
    Exportação: "#7c3aed",
    Importação: "#f97316",
  };

  if (!ehAdmin) {
    return (
      <div style={container}>
        <div style={cardBloqueado}>
          <h1 style={titulo}>Acesso bloqueado</h1>
          <p style={textoSuave}>
            Esta página é exclusiva do administrador.
          </p>
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
            Auditoria completa de adições, edições, exclusões, backups e mudanças importantes.
          </p>
        </div>

        <div style={acoesTopo}>
          <button
            style={botaoPrimario}
            onClick={exportarHistorico}
          >
            Exportar histórico
          </button>

          <button
            style={botaoPerigo}
            onClick={limparHistorico}
          >
            Limpar histórico
          </button>
        </div>
      </div>

      <div style={gridCards}>
        {cards.map((card) => (
          <div
            key={card.titulo}
            style={cardResumo}
          >
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
            </tr>
          </thead>

          <tbody>
            {historicoFiltrado.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={vazio}
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}

            {historicoFiltrado.map((item) => (
              <tr key={item.id}>
                <td style={tdData}>
                  {formatarData(item.dataHora)}
                </td>

                <td style={td}>
                  {item.usuario || "-"}
                </td>

                <td style={td}>
                  <span
                    style={{
                      ...badge,
                      background:
                        corTipo[item.tipo] || "#475569",
                    }}
                  >
                    {item.tipo || "-"}
                  </span>
                </td>

                <td style={td}>
                  {item.modulo || "-"}
                </td>

                <td style={tdDescricao}>
                  {item.descricao || "-"}
                </td>

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
          {String(detalhe.valorAntigo || "-")}
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
          {String(detalhe.valorNovo || "-")}
        </div>
      ))}
    </div>
  ) : (
    "-"
  )}
</td>
                  
              </tr>
            ))}
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
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
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
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: 22,
  overflow: "auto",
  backdropFilter: "blur(14px)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.30)",
};

const tabela = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1180,
};

const th = {
  background: "rgba(2,6,23,0.95)",
  color: "#f8fafc",
  textAlign: "left",
  padding: "14px 12px",
  fontSize: 12,
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const td = {
  padding: "12px",
  borderBottom: "1px solid rgba(148,163,184,0.08)",
  fontSize: 13,
  color: "#e2e8f0",
  verticalAlign: "top",
  maxWidth: 190,
  background: "transparent",
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

const tdDetalhes = {
  ...td,
  minWidth: 240,
  maxWidth: 360,
};

const badge = {
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