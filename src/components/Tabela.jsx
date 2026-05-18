import { useMemo, useState } from "react";

import styles from "../styles/styles.js";

export default function Tabela({
  colunas,
  dados,
}) {
  const [filtros, setFiltros] = useState({});

  const dadosFiltrados = useMemo(() => {
    return dados.filter((linha) =>
      linha.every((celula, index) => {
        const filtro = filtros[index] || "";

        if (!filtro) return true;

        if (
          typeof celula === "object" &&
          celula !== null
        ) {
          return true;
        }

        return String(celula)
          .toLowerCase()
          .includes(
            filtro.toLowerCase()
          );
      })
    );
  }, [dados, filtros]);

  return (
    <div style={styles.tabelaContainer}>
      <div style={styles.tabelaBox}>
        <table style={styles.tabela}>
          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th
                  key={coluna}
                  style={styles.th}
                >
                  {coluna}
                </th>
              ))}
            </tr>

            <tr>
              {colunas.map(
                (coluna, index) => (
                  <th
                    key={`${coluna}-${index}`}
                    style={styles.thFiltro}
                  >
                    <input
                      style={
                        styles.filtroInput
                      }
                      placeholder="Filtrar"
                      value={
                        filtros[index] ||
                        ""
                      }
                      onChange={(e) =>
                        setFiltros({
                          ...filtros,
                          [index]:
                            e.target.value,
                        })
                      }
                    />
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {dadosFiltrados.length ===
            0 ? (
              <tr>
                <td
                  colSpan={
                    colunas.length
                  }
                  style={
                    styles.vazio
                  }
                >
                  Nenhum dado encontrado.
                </td>
              </tr>
            ) : (
              dadosFiltrados.map(
                (linha, index) => (
                  <tr key={index}>
                    {linha.map(
                      (
                        celula,
                        i
                      ) => (
                        <td
                          key={i}
                          style={
                            styles.td
                          }
                        >
                          {celula}
                        </td>
                      )
                    )}
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.totalTabela}>
        <strong>
          Registros:
        </strong>{" "}
        {dadosFiltrados.length}
      </div>
    </div>
  );
}