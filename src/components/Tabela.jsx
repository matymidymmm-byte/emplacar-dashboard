import { useState } from "react";
import styles from "../styles/styles.js";

export default function Tabela({ colunas, dados }) {
  const [filtros, setFiltros] = useState({});

  const dadosFiltrados = dados.filter((linha) =>
    linha.every((celula, index) => {
      const filtro = filtros[index] || "";

      if (!filtro) return true;

      return String(celula?.props ? "" : celula)
        .toLowerCase()
        .includes(filtro.toLowerCase());
    })
  );

  return (
    <div style={styles.tabelaBox}>
      <table style={styles.tabela}>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna} style={styles.th}>
                {coluna}
              </th>
            ))}
          </tr>

          <tr>
            {colunas.map((coluna, index) => (
              <th key={`${coluna}-filtro`} style={styles.th}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros[index] || ""}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      [index]: e.target.value,
                    })
                  }
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dadosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} style={styles.vazio}>
                Nenhum dado encontrado.
              </td>
            </tr>
          ) : (
            dadosFiltrados.map((linha, index) => (
              <tr key={index}>
                {linha.map((celula, i) => (
                  <td key={i} style={styles.td}>
                    {celula}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}