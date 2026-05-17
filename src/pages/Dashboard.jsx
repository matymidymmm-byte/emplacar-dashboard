import jsPDF from "jspdf";

import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Kpi from "../components/Kpi.jsx";
import GraficoLinha from "../components/GraficoLinha.jsx";
import GraficoBarras from "../components/GraficoBarras.jsx";
import GraficoPizza from "../components/GraficoPizza.jsx";

export default function Dashboard({
  inicioMes,
  setInicioMes,
  fimMes,
  setFimMes,
  indicadores,
  moeda,
  vendasPorDia,
  contasPorNome,
  statusContasPizza,
  rankingClientes,
  dadosPeriodo,
  statusConta,
  servicosPorDia,
}) {
  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function exportarPDF() {
    const doc = new jsPDF();

    let y = 16;

    doc.setFontSize(18);

    doc.text(
      "Relatório Financeiro - Emplacar",
      14,
      y
    );

    y += 10;

    doc.setFontSize(10);

    doc.text(
      `Período: ${inicioMes} até ${fimMes}`,
      14,
      y
    );

    y += 14;

    doc.setFontSize(13);

    doc.text(
      "Indicadores",
      14,
      y
    );

    y += 8;

    const indicadoresLista = [
      [
        "Entrada bruta",
        moeda.format(
          indicadores.entradaBruta
        ),
      ],

      [
        "Entrada líquida",
        moeda.format(
          indicadores.entradaLiquida
        ),
      ],

      [
        "Saídas",
        moeda.format(
          indicadores.saidasTotal
        ),
      ],

      [
        "Faturado em aberto",
        moeda.format(
          indicadores.faturadoEmAberto
        ),
      ],

      [
        "Banco",
        moeda.format(
          indicadores.tenhoNoBanco
        ),
      ],

      [
        "Caixa",
        moeda.format(
          indicadores.tenhoNoCaixa
        ),
      ],
    ];

    indicadoresLista.forEach(
      ([titulo, valor]) => {
        doc.text(
          `${titulo}: ${valor}`,
          18,
          y
        );

        y += 7;
      }
    );

    doc.save(
      "relatorio-financeiro-emplacar.pdf"
    );
  }

  const kpis = [
    {
      titulo: "Entrada Bruta",
      valor: moeda.format(
        indicadores.entradaBruta
      ),
    },

    {
      titulo: "Entrada Líquida",
      valor: moeda.format(
        indicadores.entradaLiquida
      ),
    },

    {
      titulo: "Saídas",
      valor: moeda.format(
        indicadores.saidasTotal
      ),
    },

    {
      titulo:
        "Faturado em Aberto",

      valor: moeda.format(
        indicadores.faturadoEmAberto
      ),
    },

    {
      titulo: "Banco",

      valor: moeda.format(
        indicadores.tenhoNoBanco
      ),
    },

    {
      titulo: "Caixa",

      valor: moeda.format(
        indicadores.tenhoNoCaixa
      ),
    },
  ];

  const clientesTop =
    (rankingClientes || []).slice(
      0,
      8
    );

  const contasPendentes =
    (
      dadosPeriodo?.contas || []
    ).filter(
      (conta) =>
        statusConta(conta) !==
        "Pago"
    );

  const totalClientesTop =
    clientesTop.reduce(
      (soma, cliente) =>
        soma + cliente.valor,
      0
    );

  return (
    <>
      <div
        style={
          styles.dashboardTopo
        }
      >
        <div>
          <h1
            style={
              styles.dashboardTitulo
            }
          >
            Dashboard
            Financeiro
          </h1>

          <p
            style={
              styles.dashboardSubtitulo
            }
          >
            Visão geral
            operacional e
            financeira
          </p>
        </div>

        <button
          style={
            styles.botaoDashboard
          }
          onClick={
            exportarPDF
          }
        >
          Exportar PDF
        </button>
      </div>

      <Card titulo="Período analisado">
        <div
          style={
            styles.formGrid
          }
        >
          <Campo
            label="Começa em"
            tipo="date"
            valor={inicioMes}
            mudar={
              setInicioMes
            }
          />

          <Campo
            label="Fecha em"
            tipo="date"
            valor={fimMes}
            mudar={setFimMes}
          />
        </div>
      </Card>

      <div
        style={
          styles.kpisModernos
        }
      >
        {kpis.map((kpi) => (
          <Kpi
            key={kpi.titulo}
            titulo={kpi.titulo}
            valor={kpi.valor}
          />
        ))}
      </div>

      <div
        style={
          styles.dashboardGridNova
        }
      >
        <Card titulo="Faturamento por dia">
          <GraficoLinha
            dados={
              vendasPorDia || []
            }
            moeda={moeda}
          />
        </Card>

        <Card titulo="Serviços por dia">
          <GraficoBarras
            dados={
              servicosPorDia ||
              []
            }
            dataKey="quantidade"
            xKey="data"
            nome="Serviços"
          />
        </Card>

        <Card titulo="Contas a pagar">
          <GraficoBarras
            dados={
              contasPorNome ||
              []
            }
            moeda={moeda}
            horizontal
            dataKey="valor"
            xKey="conta"
            nome="Contas"
          />
        </Card>

        <Card titulo="Status financeiro">
          <GraficoPizza
            dados={
              statusContasPizza ||
              []
            }
            moeda={moeda}
          />
        </Card>

        <Card titulo="Top clientes">
          <div
            style={{
              width: "100%",
              overflow:
                "hidden",
            }}
          >
            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 130px 90px",

                gap: 10,

                padding:
                  "8px 0",

                borderBottom:
                  "1px solid rgba(148, 163, 184, 0.22)",

                color:
                  "#cbd5e1",

                fontWeight:
                  "bold",

                fontSize: 12,
              }}
            >
              <span>
                Cliente
              </span>

              <span
                style={{
                  textAlign:
                    "right",
                }}
              >
                Valor
              </span>

              <span
                style={{
                  textAlign:
                    "right",
                }}
              >
                %
              </span>
            </div>

            {clientesTop.length ===
            0 ? (
              <p
                style={
                  styles.vazio
                }
              >
                Nenhum
                cliente no
                período.
              </p>
            ) : (
              clientesTop.map(
                (cliente) => {
                  const percentual =
                    totalClientesTop >
                    0
                      ? (cliente.valor /
                          totalClientesTop) *
                        100
                      : 0;

                  return (
                    <div
                      key={
                        cliente.cliente
                      }
                      style={{
                        display:
                          "grid",

                        gridTemplateColumns:
                          "1fr 130px 90px",

                        gap: 10,

                        padding:
                          "9px 0",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.12)",

                        alignItems:
                          "center",

                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#f8fafc",

                          overflow:
                            "hidden",

                          textOverflow:
                            "ellipsis",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          cliente.cliente
                        }
                      </span>

                      <strong
                        style={{
                          color:
                            "#38bdf8",

                          textAlign:
                            "right",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {moeda.format(
                          cliente.valor
                        )}
                      </strong>

                      <span
                        style={{
                          color:
                            "#94a3b8",

                          textAlign:
                            "right",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {percentual.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>
                  );
                }
              )
            )}
          </div>
        </Card>

        <Card titulo="Contas pendentes">
          {contasPendentes.length ===
          0 ? (
            <div
              style={{
                minHeight: 150,

                display:
                  "flex",

                flexDirection:
                  "column",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap: 12,

                color:
                  "#94a3b8",
              }}
            >
              <div
                style={{
                  width: 58,

                  height: 58,

                  borderRadius:
                    "50%",

                  border:
                    "1px solid rgba(148, 163, 184, 0.28)",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  fontSize: 26,
                }}
              >
                $
              </div>

              <span>
                Nenhuma
                conta
                pendente no
                período.
              </span>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "100px 1fr 120px 90px",

                  gap: 10,

                  padding:
                    "8px 0",

                  borderBottom:
                    "1px solid rgba(148, 163, 184, 0.22)",

                  color:
                    "#cbd5e1",

                  fontWeight:
                    "bold",

                  fontSize: 12,
                }}
              >
                <span>
                  Vencimento
                </span>

                <span>
                  Conta
                </span>

                <span
                  style={{
                    textAlign:
                      "right",
                  }}
                >
                  Valor
                </span>

                <span
                  style={{
                    textAlign:
                      "right",
                  }}
                >
                  Status
                </span>
              </div>

              {contasPendentes
                .slice(0, 8)
                .map(
                  (
                    conta
                  ) => (
                    <div
                      key={
                        conta.id
                      }
                      style={{
                        display:
                          "grid",

                        gridTemplateColumns:
                          "100px 1fr 120px 90px",

                        gap: 10,

                        padding:
                          "9px 0",

                        borderBottom:
                          "1px solid rgba(148, 163, 184, 0.12)",

                        alignItems:
                          "center",

                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#cbd5e1",
                        }}
                      >
                        {dataBR(
                          conta.vencimento
                        )}
                      </span>

                      <span
                        style={{
                          color:
                            "#f8fafc",

                          overflow:
                            "hidden",

                          textOverflow:
                            "ellipsis",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {
                          conta.conta
                        }
                      </span>

                      <strong
                        style={{
                          color:
                            "#f59e0b",

                          textAlign:
                            "right",

                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {moeda.format(
                          conta.valor
                        )}
                      </strong>

                      <span
                        style={{
                          justifySelf:
                            "end",

                          padding:
                            "4px 8px",

                          borderRadius: 999,

                          background:
                            statusConta(
                              conta
                            ) ===
                            "Atrasado"
                              ? "rgba(239, 68, 68, 0.18)"
                              : "rgba(245, 158, 11, 0.18)",

                          color:
                            statusConta(
                              conta
                            ) ===
                            "Atrasado"
                              ? "#fca5a5"
                              : "#fbbf24",

                          fontWeight:
                            "bold",

                          fontSize: 11,
                        }}
                      >
                        {statusConta(
                          conta
                        )}
                      </span>
                    </div>
                  )
                )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}