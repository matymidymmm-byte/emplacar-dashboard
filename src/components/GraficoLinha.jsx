import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import styles from "../styles/styles.js";

export default function GraficoLinha({
  dados,
  moeda,
}) {
  if (!dados || dados.length === 0) {
    return (
      <p style={styles.vazio}>
        Nenhuma venda no período.
      </p>
    );
  }

  function dataCurta(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}`;
  }

  function dataCompleta(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));

    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    return `${diasSemana[dataObj.getDay()]} - ${dia}/${mes}/${ano}`;
  }

  return (
    <div style={styles.graficoGrande}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dados}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.18)"
          />

          <XAxis
            dataKey="data"
            tickFormatter={dataCurta}
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
            tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
          />

          <YAxis
            tick={{ fill: "#cbd5e1", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
            tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
          />

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
            labelFormatter={(value) => dataCompleta(value)}
            formatter={(value) => moeda.format(value)}
          />

          <Legend
            wrapperStyle={{
              color: "#cbd5e1",
              fontSize: 12,
            }}
          />

          <Line
            type="monotone"
            dataKey="valor"
            name="Faturamento"
            stroke="#38bdf8"
            strokeWidth={4}
            dot={{
              r: 4,
              fill: "#38bdf8",
              stroke: "#0f172a",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 7,
              fill: "#7c3aed",
              stroke: "#f8fafc",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}