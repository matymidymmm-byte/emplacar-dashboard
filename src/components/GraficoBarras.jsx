import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

import styles from "../styles/styles.js";

export default function GraficoBarras({
  dados,
  moeda,
  horizontal = false,
  dataKey = "valor",
  xKey = "conta",
  nome = "Valor",
}) {
  if (!dados || dados.length === 0) {
    return (
      <p style={styles.vazio}>
        Nenhum dado no período.
      </p>
    );
  }

  function dataCurta(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}`;
  }

  function valorCurto(valor) {
    if (moeda) {
      if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(1)}k`;
      return moeda.format(valor);
    }

    return valor;
  }

  return (
    <div style={styles.graficoGrande}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{
            top: 20,
            right: horizontal ? 45 : 20,
            left: horizontal ? 30 : 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.18)"
          />

          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
              />

              <YAxis
                type="category"
                dataKey={xKey}
                width={120}
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tickFormatter={xKey === "data" ? dataCurta : undefined}
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
              />

              <YAxis
                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
              />
            </>
          )}

          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: 12,
              color: "#f8fafc",
            }}
            labelStyle={{
              color: "#f8fafc",
            }}
            labelFormatter={(value) =>
              xKey === "data" ? `Data: ${dataCurta(value)}` : value
            }
            formatter={(value) => (moeda ? moeda.format(value) : value)}
          />

          <Legend
            wrapperStyle={{
              color: "#cbd5e1",
              fontSize: 12,
            }}
          />

          <Bar
            dataKey={dataKey}
            name={nome}
            fill="#7c3aed"
            radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]}
          >
            <LabelList
              dataKey={dataKey}
              position={horizontal ? "right" : "top"}
              formatter={valorCurto}
              style={{
                fill: "#f8fafc",
                fontSize: 11,
                fontWeight: "bold",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}