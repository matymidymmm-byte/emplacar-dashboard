import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Building2,
  Wallet,
} from "lucide-react";

import styles from "../styles/styles";

export default function Kpi({ titulo, valor }) {
  function pegarIcone() {
    const nome = String(titulo || "").toLowerCase();

    if (nome.includes("bruta")) return <DollarSign size={22} />;
    if (nome.includes("líquida") || nome.includes("liquida")) return <TrendingUp size={22} />;
    if (nome.includes("saída") || nome.includes("saida")) return <TrendingDown size={22} />;
    if (nome.includes("aberto") || nome.includes("pendente")) return <Clock size={22} />;
    if (nome.includes("banco")) return <Building2 size={22} />;
    if (nome.includes("caixa")) return <Wallet size={22} />;

    return <DollarSign size={22} />;
  }

  function pegarTema() {
    const nome = String(titulo || "").toLowerCase();

    if (nome.includes("bruta")) {
      return { cor: "#0ea5e9", fundo: "rgba(14,165,233,0.16)" };
    }

    if (nome.includes("líquida") || nome.includes("liquida")) {
      return { cor: "#22c55e", fundo: "rgba(34,197,94,0.16)" };
    }

    if (nome.includes("saída") || nome.includes("saida")) {
      return { cor: "#ef4444", fundo: "rgba(239,68,68,0.16)" };
    }

    if (nome.includes("aberto")) {
      return { cor: "#f59e0b", fundo: "rgba(245,158,11,0.16)" };
    }

    if (nome.includes("banco")) {
      return { cor: "#8b5cf6", fundo: "rgba(139,92,246,0.16)" };
    }

    if (nome.includes("caixa")) {
      return { cor: "#14b8a6", fundo: "rgba(20,184,166,0.16)" };
    }

    return { cor: "#38bdf8", fundo: "rgba(56,189,248,0.16)" };
  }

  const tema = pegarTema();

  return (
    <div
      style={{
        ...styles.kpi,
        background: "#131c31",
        border: "1px solid #1e293b",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            minWidth: 38,
            borderRadius: 14,
            background: tema.fundo,
            border: `1px solid ${tema.cor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tema.cor,
          }}
        >
          {pegarIcone()}
        </div>

        <div>
          <p style={{ margin: 0, marginBottom: 8, fontSize: 13, color: "#cbd5e1" }}>
            {titulo}
          </p>

          <strong style={{ fontSize: 20, color: tema.cor }}>
            {valor}
          </strong>
        </div>
      </div>
    </div>
  );
}