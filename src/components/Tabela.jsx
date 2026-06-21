import { useEffect, useMemo, useState } from "react";

import styles from "../styles/styles.js";

export default function Tabela({ colunas, dados, aoFiltrar }) {
  const [filtros, setFiltros] = useState({});

  function ehComponenteReact(celula) {
    return typeof celula === "object" && celula !== null;
  }

  function textoFiltro(celula) {
    if (ehComponenteReact(celula)) return "";

    return String(celula || "").toLowerCase();
  }

  const dadosFiltrados = useMemo(() => {
    return dados.filter((linha) =>
      linha.every((celula, index) => {
        const filtro = filtros[index] || "";

        if (!filtro) return true;

        if (ehComponenteReact(celula)) {
          return true;
        }

        return textoFiltro(celula).includes(filtro.toLowerCase());
      })
    );
  }, [dados, filtros]);

  useEffect(() => {
    if (aoFiltrar) {
      aoFiltrar(dadosFiltrados);
    }
  }, [dadosFiltrados, aoFiltrar]);

  return (
    <div style={styles.tabelaContainer}>
      <div
        style={{
          ...styles.tabelaBox,
          overflowX: "auto",
          overflowY: "hidden",
          maxWidth: "100%",
        }}
      >
        <table
          style={{
            ...styles.tabela,
            minWidth: 980,
          }}
        >
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
                <th key={`${coluna}-${index}`} style={styles.thFiltro}>
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
              dadosFiltrados.map((linha, index) => {
                const temObservacaoVisual = linha.some((celula) => {
                  if (!ehComponenteReact(celula)) return false;

                  const titulo = celula?.props?.title || "";
return String(titulo).toLowerCase().includes("observação");
                });

                return (
                  <tr
                    key={index}
                    style={{
                      boxShadow: temObservacaoVisual
                        ? "inset 3px 0 0 #facc15"
                        : "none",
                    }}
                  >
                    {linha.map((celula, i) => (
                      <td
                        key={i}
                        style={{
                          ...styles.td,
                          maxWidth: i === linha.length - 1 ? 260 : 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle",
                        }}
                      >
                        {celula}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.totalTabela}>
        <strong>Registros:</strong> {dadosFiltrados.length}
      </div>
    </div>
  );
}