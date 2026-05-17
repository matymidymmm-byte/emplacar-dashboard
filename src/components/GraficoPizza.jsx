import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

import styles from "../styles/styles.js";

export default function GraficoPizza({
  dados,
  moeda,
}) {
  const cores = [
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#38bdf8",
    "#7c3aed",
  ];

  if (!dados || dados.length === 0) {
    return (
      <p style={styles.vazio}>
        Nenhuma conta no período.
      </p>
    );
  }

  return (
    <div style={styles.graficoGrande}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={78}
            innerRadius={42}
            paddingAngle={4}
            label
          >
            {dados.map((_, index) => (
              <Cell
                key={index}
                fill={
                  cores[index % cores.length]
                }
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border:
                "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: 12,
              color: "#f8fafc",
            }}
            labelStyle={{
              color: "#f8fafc",
            }}
            formatter={(value) =>
              moeda.format(value)
            }
          />

          <Legend
            wrapperStyle={{
              color: "#cbd5e1",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}