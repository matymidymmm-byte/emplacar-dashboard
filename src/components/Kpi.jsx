import { useState } from "react";
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
  const [hover, setHover] = useState(false);

  function pegarIcone() {
    const nome = String(titulo || "").toLowerCase();

    if (nome.includes("bruta")) return <DollarSign size={24} />;
    if (nome.includes("líquida") || nome.includes("liquida")) return <TrendingUp size={24} />;
    if (nome.includes("saída") || nome.includes("saida")) return <TrendingDown size={24} />;
    if (nome.includes("aberto") || nome.includes("pendente")) return <Clock size={24} />;
    if (nome.includes("banco")) return <Building2 size={24} />;
    if (nome.includes("caixa")) return <Wallet size={24} />;

    return <DollarSign size={24} />;
  }

  function pegarTema() {
    const nome = String(titulo || "").toLowerCase();

    if (nome.includes("bruta") || nome.includes("faturamento")) {
      return { cor: "#0ea5e9", fundo: "rgba(14,165,233,0.16)" };
    }

    if (nome.includes("líquida") || nome.includes("liquida") || nome.includes("resultado")) {
      return { cor: "#22c55e", fundo: "rgba(34,197,94,0.16)" };
    }

    if (nome.includes("saída") || nome.includes("saida") || nome.includes("despesa")) {
      return { cor: "#ef4444", fundo: "rgba(239,68,68,0.16)" };
    }

    if (nome.includes("aberto") || nome.includes("pendente") || nome.includes("falta")) {
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
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.kpi,
        background: "#131c31",
        border: hover ? `1px solid ${tema.cor}` : "1px solid #1e293b",
        boxShadow: hover
          ? `0 18px 40px rgba(0,0,0,0.45), 0 0 28px ${tema.cor}33`
          : "0 12px 30px rgba(0,0,0,0.35)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.22s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            borderRadius: 16,
            background: tema.fundo,
            border: `1px solid ${tema.cor}`,
            boxShadow: hover ? `0 0 22px ${tema.cor}44` : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tema.cor,
            transition: "all 0.22s ease",
          }}
        >
          {pegarIcone()}
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 13,
              color: "#cbd5e1",
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {titulo}
          </p>

          <strong
            style={{
              fontSize: 21,
              color: tema.cor,
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            {valor}
          </strong>
        </div>
      </div>
    </div>
  );
}