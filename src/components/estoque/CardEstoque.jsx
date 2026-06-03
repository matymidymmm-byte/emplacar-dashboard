import {
  Package,
  ScrollText,
  Wrench,
  Bike,
} from "lucide-react";

import BarraEstoque from "./BarraEstoque";

export default function CardEstoque({
  item,
  ehRibbon,
  lotesEstoque,
}) {
  function corStatus(status) {
    if (status === "CRÍTICO") return "#ef4444";
    if (status === "BAIXO") return "#f59e0b";
    return "#22c55e";
  }

  function textoStatus(status) {
    if (status === "CRÍTICO") return "Crítico";
    if (status === "BAIXO") return "Baixo";
    return "OK";
  }

  function dadosVisuaisProduto(produto) {
    const nome = String(produto || "").toUpperCase();

    if (nome.includes("RIBBON")) {
      return {
        Icone: ScrollText,
        cor: "#8b5cf6",
        fundo: "rgba(139,92,246,0.16)",
      };
    }

    if (nome.includes("SUPORTE")) {
      return {
        Icone: Wrench,
        cor: "#14b8a6",
        fundo: "rgba(20,184,166,0.16)",
      };
    }

    if (nome.includes("MOTO")) {
      return {
        Icone: Bike,
        cor: "#38bdf8",
        fundo: "rgba(56,189,248,0.16)",
      };
    }

    return {
      Icone: Package,
      cor: "#2563eb",
      fundo: "rgba(37,99,235,0.16)",
    };
  }

  const visual = dadosVisuaisProduto(item.produto);
  const Icone = visual.Icone;

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #111827 0%, #020617 100%)",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 18px 40px rgba(15,23,42,0.32)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              width: 44,
              height: 44,
              minWidth: 44,
              borderRadius: 16,
              background: visual.fundo,
              border: `1px solid ${visual.cor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: visual.cor,
              marginBottom: 10,
              boxShadow: `0 0 22px ${visual.fundo}`,
            }}
          >
            <Icone size={23} />
          </div>

          <strong
            style={{
              color: "#fff",
              fontSize: 15,
            }}
          >
            {item.produto}
          </strong>

          <p
            style={{
              color: "#94a3b8",
              margin: "6px 0 0",
              fontSize: 13,
            }}
          >
            {item.saldoDisponivel.toFixed(
              ehRibbon(item.produto) ? 2 : 0
            )}{" "}
            {item.unidade} disponíveis
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <span
            style={{
              display: "inline-block",
              padding: "5px 9px",
              borderRadius: 999,
              background: `${corStatus(item.status)}22`,
              color: corStatus(item.status),
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {textoStatus(item.status)}
          </span>

          <div
            style={{
              color: "#fff",
              marginTop: 10,
              fontWeight: 800,
            }}
          >
            {item.percentual.toFixed(0)}%
          </div>
        </div>
      </div>

      <BarraEstoque
        percentual={item.percentual}
        status={item.status}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginTop: 14,
        }}
      >
        <div>
          <small style={{ color: "#64748b" }}>
            Comprado
          </small>

          <div
            style={{
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {item.compras.toFixed(
  ehRibbon(item.produto) ? 1 : 0
)} {item.unidade}
          </div>
        </div>

        <div>
          <small style={{ color: "#64748b" }}>
            Usado
          </small>

          <div
            style={{
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {item.usadoEmServicos.toFixed(
  ehRibbon(item.produto) ? 1 : 0
)} {item.unidade}
          </div>
        </div>

        <div>
          <small style={{ color: "#64748b" }}>
            Lotes
          </small>

          <div
            style={{
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {
              lotesEstoque.filter(
                (lote) =>
                  lote.produto === item.produto
              ).length
            }
          </div>
        </div>
      </div>
    </div>
  );
}