import { useState } from "react";

import styles from "../styles/styles.js";

export default function TabelaEntradas({
  entradas,
  moeda,
  editar,
  remover,
}) {
  const [detalhesAbertos, setDetalhesAbertos] = useState({});

  function formatarData(data) {
    if (!data) return "-";

    if (data.includes("-")) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    return data;
  }

  const colunas = ["Data", "Cliente", "Produto", "Placa", "Valor", "Status", "⋮"];

  const grupos = entradas.reduce((acc, entrada) => {
    const data = entrada.data || "Sem data";

    if (!acc[data]) acc[data] = [];

    acc[data].push(entrada);

    return acc;
  }, {});

  const datasOrdenadas = Object.keys(grupos).sort((a, b) =>
    b.localeCompare(a)
  );

  function totalDoDia(lista) {
    return lista.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  }

  return (
    <div style={styles.tabelaContainer}>
      <div
        style={{
          ...styles.tabelaBox,
          overflowX: "auto",
          maxWidth: "100%",
        }}
      >
        <table
          style={{
            ...styles.tabelaCompacta,
            minWidth: 900,
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
          </thead>

          <tbody>
            {datasOrdenadas.map((data) => {
              const itensDoDia = grupos[data];
              const total = totalDoDia(itensDoDia);

              return (
                <>
                  <tr key={`grupo-${data}`}>
                    <td colSpan={colunas.length} style={styles.linhaData}>
                      {formatarData(data)} · {itensDoDia.length} serviços · Total do dia:{" "}
                      {moeda.format(total)}
                    </td>
                  </tr>

                  {itensDoDia.map((x) => (
                    <>
                      <tr key={x.id}>
                        <td style={styles.td}>{formatarData(x.data)}</td>

                        <td style={styles.td}>{x.cliente}</td>

                        <td
                          style={{
                            ...styles.td,
                            fontWeight: 700,
                            color: "#c4b5fd",
                          }}
                        >
                          {x.produto}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            color: "#5ecbff",
                            fontWeight: 700,
                          }}
                        >
                          {x.placa}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            fontWeight: 700,
                          }}
                        >
                          {moeda.format(Number(x.valor || 0))}
                        </td>

                        <td style={styles.td}>{x.status}</td>

                        <td style={styles.td}>
                          <button
                            style={{
                              background: "#243041",
                              border: "none",
                              color: "#fff",
                              borderRadius: 10,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 18,
                            }}
                            onClick={() =>
                              setDetalhesAbertos({
                                ...detalhesAbertos,
                                [x.id]: !detalhesAbertos[x.id],
                              })
                            }
                          >
                            ⋮
                          </button>
                        </td>
                      </tr>

                      {detalhesAbertos[x.id] && (
                        <tr>
                          <td
                            colSpan={colunas.length}
                            style={{
                              background: "#101c33",
                              padding: 18,
                              borderBottom: "1px solid #1f2d4a",
                            }}
                          >
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(180px,1fr))",
                                gap: 14,
                              }}
                            >
                              <div>
                                <strong>Tipo:</strong>
                                <br />
                                {x.tipo || "-"}
                              </div>

                              <div>
                                <strong>Pagamento:</strong>
                                <br />
                                {x.formaPagamento || "-"}
                              </div>

                              <div>
                                <strong>Renavan:</strong>
                                <br />
                                {x.renavan || "-"}
                              </div>

                              <div>
                                <strong>Processo:</strong>
                                <br />
                                {x.processo || "-"}
                              </div>

                              <div>
                                <strong>Pago dia:</strong>
                                <br />
                                {formatarData(x.diaPago)}
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 18,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                style={styles.editar}
                                onClick={() => editar("entrada", x)}
                              >
                                Editar
                              </button>

                              <button
                                style={styles.excluir}
                                onClick={() => remover("entrada", x.id)}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}