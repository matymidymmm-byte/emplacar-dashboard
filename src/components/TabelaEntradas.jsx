import { useState } from "react";

import styles from "../styles/styles.js";

export default function TabelaEntradas({
  entradas,
  moeda,
  destinoDinheiro,
  editar,
  remover,
}) {
  const [detalhesAbertos, setDetalhesAbertos] =
    useState({});

  const [copiados, setCopiados] =
    useState({});

  const [filtros, setFiltros] =
    useState({
      data: "",
      tipo: "",
      cliente: "",
      produto: "",
      placa: "",
      pagamento: "",
      status: "",
    });

  const colunas = [
    "Data",
    "Tipo",
    "Cliente",
    "Produto",
    "Placa",
    "Pagamento",
    "Valor",
    "Status",
    "Ações",
  ];

  function formatarDataVisual(data) {
    if (
      !data ||
      !data.includes("-")
    )
      return data || "Sem data";

    const [ano, mes, dia] =
      data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function copiarTexto(
    texto,
    nomeCampo = "Informação"
  ) {
    navigator.clipboard.writeText(
      texto || ""
    );

    setCopiados((prev) => ({
      ...prev,
      [nomeCampo]: true,
    }));

    setTimeout(() => {
      setCopiados((prev) => ({
        ...prev,
        [nomeCampo]: false,
      }));
    }, 2000);
  }

  function copiarTudo(item) {
    const texto = `PLACA: ${
      item.placa || ""
    }
RENAVAN: ${
      item.renavan || ""
    }
PROCESSO: ${
      item.processo || ""
    }`;

    copiarTexto(texto, "Dados");
  }

  const entradasFiltradas =
    entradas.filter((entrada) => {
      const dataVisual =
        formatarDataVisual(
          entrada.data
        );

      return (
        dataVisual
          .toLowerCase()
          .includes(
            filtros.data.toLowerCase()
          ) &&
        String(
          entrada.tipo || ""
        )
          .toLowerCase()
          .includes(
            filtros.tipo.toLowerCase()
          ) &&
        String(
          entrada.cliente || ""
        )
          .toLowerCase()
          .includes(
            filtros.cliente.toLowerCase()
          ) &&
        String(
          entrada.produto || ""
        )
          .toLowerCase()
          .includes(
            filtros.produto.toLowerCase()
          ) &&
        String(
          entrada.placa || ""
        )
          .toLowerCase()
          .includes(
            filtros.placa.toLowerCase()
          ) &&
        String(
          entrada.formaPagamento ||
            ""
        )
          .toLowerCase()
          .includes(
            filtros.pagamento.toLowerCase()
          ) &&
        String(
          entrada.status || ""
        )
          .toLowerCase()
          .includes(
            filtros.status.toLowerCase()
          )
      );
    });

  const resumoFiltro = {
    contagem:
      entradasFiltradas.length,

    soma:
      entradasFiltradas.reduce(
        (s, entrada) =>
          s + entrada.valor,
        0
      ),

    media:
      entradasFiltradas.length >
      0
        ? entradasFiltradas.reduce(
            (s, entrada) =>
              s + entrada.valor,
            0
          ) /
          entradasFiltradas.length
        : 0,
  };

  const grupos =
    entradasFiltradas.reduce(
      (acc, entrada) => {
        const data =
          entrada.data ||
          "Sem data";

        if (!acc[data])
          acc[data] = [];

        acc[data].push(entrada);

        return acc;
      },
      {}
    );

  const datasOrdenadas =
    Object.keys(grupos).sort(
      (a, b) =>
        b.localeCompare(a)
    );

  return (
    <div style={styles.tabelaBox}>
      <div
        style={styles.resumoFiltro}
      >
        <span>
          <strong>
            Contagem:
          </strong>{" "}
          {
            resumoFiltro.contagem
          }
        </span>

        <span>
          <strong>
            Soma:
          </strong>{" "}
          {moeda.format(
            resumoFiltro.soma
          )}
        </span>

        <span>
          <strong>
            Média:
          </strong>{" "}
          {moeda.format(
            resumoFiltro.media
          )}
        </span>
      </div>

      <table
        style={
          styles.tabelaCompacta
        }
      >
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                style={styles.th}
                key={c}
              >
                {c}
              </th>
            ))}
          </tr>

          <tr>
            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.data
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    data:
                      e.target
                        .value,
                  })
                }
              />
            </th>

            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.tipo
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    tipo:
                      e.target
                        .value,
                  })
                }
              />
            </th>

            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.cliente
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    cliente:
                      e.target
                        .value,
                  })
                }
              />
            </th>

            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.produto
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    produto:
                      e.target
                        .value,
                  })
                }
              />
            </th>

            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.placa
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    placa:
                      e.target.value.toUpperCase(),
                  })
                }
              />
            </th>

            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.pagamento
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    pagamento:
                      e.target
                        .value,
                  })
                }
              />
            </th>

            <th style={styles.th}></th>

            <th style={styles.th}>
              <input
                style={
                  styles.filtroInput
                }
                placeholder="Filtrar"
                value={
                  filtros.status
                }
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    status:
                      e.target
                        .value,
                  })
                }
              />
            </th>

            <th style={styles.th}></th>
          </tr>
        </thead>

        <tbody>
          {entradasFiltradas.length ===
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
                Nenhum dado lançado ainda.
              </td>
            </tr>
          ) : (
            datasOrdenadas.map(
              (data) => (
                <>
                  <tr
                    key={`grupo-${data}`}
                  >
                    <td
                      colSpan={
                        colunas.length
                      }
                      style={
                        styles.linhaData
                      }
                    >
                      {formatarDataVisual(
                        data
                      )}{" "}
                      ·{" "}
                      {
                        grupos[data]
                          .length
                      }{" "}
                      serviço
                      {grupos[data]
                        .length > 1
                        ? "s"
                        : ""}
                    </td>
                  </tr>

                  {grupos[data].map(
                    (x) => (
                      <>
                        <tr
                          key={
                            x.id
                          }
                        >
                          <td
                            style={
                              styles.tdData
                            }
                          >
                            {formatarDataVisual(
                              x.data
                            )}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {x.tipo}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {x.cliente}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {x.produto}
                          </td>

                          <td
                            style={
                              styles.tdPlaca
                            }
                          >
                            {x.placa}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {
                              x.formaPagamento
                            }
                          </td>

                          <td
                            style={
                              styles.tdValor
                            }
                          >
                            {moeda.format(
                              x.valor
                            )}
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {x.status}
                          </td>

                          <td
                            style={
                              styles.tdAcoes
                            }
                          >
                            <div
                              style={
                                styles.acoes
                              }
                            >
                              <button
                                style={
                                  styles.detalhes
                                }
                                onClick={() =>
                                  setDetalhesAbertos(
                                    {
                                      ...detalhesAbertos,
                                      [x.id]:
                                        !detalhesAbertos[
                                          x.id
                                        ],
                                    }
                                  )
                                }
                              >
                                {detalhesAbertos[
                                  x.id
                                ]
                                  ? "Ocultar"
                                  : "Ver detalhes"}
                              </button>

                              <button
                                style={
                                  styles.editar
                                }
                                onClick={() =>
                                  editar(
                                    "entrada",
                                    x
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                style={
                                  styles.excluir
                                }
                                onClick={() =>
                                  remover(
                                    "entrada",
                                    x.id
                                  )
                                }
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>

                        {detalhesAbertos[
                          x.id
                        ] && (
                          <tr
                            key={`detalhe-${x.id}`}
                          >
                            <td
                              colSpan={
                                colunas.length
                              }
                              style={
                                styles.detalheLinha
                              }
                            >
                              <div
                                style={
                                  styles.detalheGrid
                                }
                              >
                                <DetalheCopiavel
                                  label="Placa"
                                  valor={
                                    x.placa
                                  }
                                  copiado={
                                    copiados[
                                      "Placa"
                                    ]
                                  }
                                  copiar={() =>
                                    copiarTexto(
                                      x.placa,
                                      "Placa"
                                    )
                                  }
                                />

                                <DetalheCopiavel
                                  label="Renavan"
                                  valor={
                                    x.renavan
                                  }
                                  copiado={
                                    copiados[
                                      "Renavan"
                                    ]
                                  }
                                  copiar={() =>
                                    copiarTexto(
                                      x.renavan,
                                      "Renavan"
                                    )
                                  }
                                />

                                <DetalheCopiavel
                                  label="Processo"
                                  valor={
                                    x.processo
                                  }
                                  copiado={
                                    copiados[
                                      "Processo"
                                    ]
                                  }
                                  copiar={() =>
                                    copiarTexto(
                                      x.processo,
                                      "Processo"
                                    )
                                  }
                                />

                                <DetalheSimples
                                  label="Destino"
                                  valor={destinoDinheiro(
                                    x.formaPagamento
                                  )}
                                />

                                <DetalheSimples
                                  label="Dia pago"
                                  valor={
                                    x.diaPago
                                      ? formatarDataVisual(
                                          x.diaPago
                                        )
                                      : "Não recebido"
                                  }
                                />

                                <DetalheSimples
                                  label="Relação"
                                  valor={
                                    x.relacaoPagaId
                                      ? `#${x.relacaoPagaId}`
                                      : "Sem relação"
                                  }
                                />
                              </div>

                              <button
                                style={
                                  styles.botaoPequeno
                                }
                                onClick={() =>
                                  copiarTudo(
                                    x
                                  )
                                }
                              >
                                Copiar placa,
                                Renavan e
                                processo
                              </button>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  )}
                </>
              )
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function DetalheCopiavel({
  label,
  valor,
  copiar,
  copiado,
}) {
  return (
    <div
      style={
        styles.detalheItem
      }
    >
      <span
        style={
          styles.detalheLabel
        }
      >
        {label}
      </span>

      <strong>
        {valor ||
          "Não informado"}
      </strong>

      <button
        style={
          copiado
            ? styles.copiado
            : styles.copiar
        }
        onClick={copiar}
      >
        {copiado
          ? "Copiado"
          : "Copiar"}
      </button>
    </div>
  );
}

function DetalheSimples({
  label,
  valor,
}) {
  return (
    <div
      style={
        styles.detalheItem
      }
    >
      <span
        style={
          styles.detalheLabel
        }
      >
        {label}
      </span>

      <strong>
        {valor ||
          "Não informado"}
      </strong>
    </div>
  );
}