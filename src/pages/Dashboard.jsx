import { useState } from "react";
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

  entradas,
  saidas,
  contas,

  dataRecebimentoEntrada,
  destinoDinheiro,

  metaMensal,
  setMetaMensal,
}) {
  const [modoDetalhado, setModoDetalhado] =
    useState(false);

  function dataBR(data) {
    if (!data || !data.includes("-"))
      return data || "";

    const [ano, mes, dia] =
      data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function dentroDoPeriodo(data) {
    if (!data) return false;

    return (
      data >= inicioMes &&
      data <= fimMes
    );
  }

  const hojeSistema = new Date();

  const diaAtual =
    hojeSistema.getDate();

  const ultimoDiaMes = new Date(
    hojeSistema.getFullYear(),
    hojeSistema.getMonth() + 1,
    0
  ).getDate();

  const fluxoCaixaDiario = (() => {
    const mapa = {};

    function criarDia(data) {
      if (!mapa[data]) {
        mapa[data] = {
          data,

          entradaBanco: 0,
          entradaCaixa: 0,

          saidaBanco: 0,
          saidaCaixa: 0,

          saldoBanco: 0,
          saldoCaixa: 0,

          saldoTotal: 0,
        };
      }
    }

    entradas.forEach((entrada) => {
      const dataRecebimento =
        dataRecebimentoEntrada(
          entrada
        );

      if (
        !dentroDoPeriodo(
          dataRecebimento
        )
      )
        return;

      if (entrada.status !== "Pago")
        return;

      criarDia(dataRecebimento);

      const valor = Number(
        entrada.valor || 0
      );

      if (
        destinoDinheiro(
          entrada.formaPagamento
        ) === "Caixa"
      ) {
        mapa[
          dataRecebimento
        ].entradaCaixa += valor;
      } else {
        mapa[
          dataRecebimento
        ].entradaBanco += valor;
      }
    });

    saidas.forEach((saida) => {
      if (
        !dentroDoPeriodo(saida.data)
      )
        return;

      criarDia(saida.data);

      const valor = Number(
        saida.valor || 0
      );

      if (
        destinoDinheiro(
          saida.formaPagamento
        ) === "Caixa"
      ) {
        mapa[
          saida.data
        ].saidaCaixa += valor;
      } else {
        mapa[
          saida.data
        ].saidaBanco += valor;
      }
    });

    contas.forEach((conta) => {
      if (
        !dentroDoPeriodo(
          conta.vencimento
        )
      )
        return;

      if (
        statusConta(conta) !==
        "Pago"
      )
        return;

      criarDia(conta.vencimento);

      mapa[
        conta.vencimento
      ].saidaBanco += Number(
        conta.valor || 0
      );
    });

    let saldoBancoAcumulado = 0;

    let saldoCaixaAcumulado = 0;

    return Object.values(mapa)
      .sort((a, b) =>
        a.data.localeCompare(b.data)
      )
      .map((dia) => {
        const saldoBancoDia =
          dia.entradaBanco -
          dia.saidaBanco;

        const saldoCaixaDia =
          dia.entradaCaixa -
          dia.saidaCaixa;

        saldoBancoAcumulado +=
          saldoBancoDia;

        saldoCaixaAcumulado +=
          saldoCaixaDia;

        return {
          ...dia,

          saldoBanco:
            saldoBancoAcumulado,

          saldoCaixa:
            saldoCaixaAcumulado,

          saldoTotal:
            saldoBancoAcumulado +
            saldoCaixaAcumulado,
        };
      });
  })();

  const receitaOperacional =
    indicadores
      .faturamentoCompetencia ||
    indicadores.entradaBruta ||
    0;

  const despesasOperacionais =
    indicadores.saidasTotal || 0;

  const resultadoOperacional =
    receitaOperacional -
    despesasOperacionais;

  const margemOperacional =
    receitaOperacional > 0
      ? (resultadoOperacional /
          receitaOperacional) *
        100
      : 0;

  const percentualMeta =
    metaMensal > 0
      ? (receitaOperacional /
          metaMensal) *
        100
      : 0;

  const faltaMeta =
    metaMensal -
    receitaOperacional;

  const mediaNecessaria =
    faltaMeta > 0
      ? faltaMeta /
        Math.max(
          ultimoDiaMes - diaAtual,
          1
        )
      : 0;

  const projecaoMes =
    diaAtual > 0
      ? (receitaOperacional /
          diaAtual) *
        ultimoDiaMes
      : 0;

  const despesasPorCategoria =
    (() => {
      const mapa = {};

      saidas.forEach((saida) => {
        if (
          !dentroDoPeriodo(
            saida.data
          )
        )
          return;

        const categoria =
          saida.categoria ||
          "Outros";

        mapa[categoria] =
          (mapa[categoria] || 0) +
          Number(saida.valor || 0);
      });

      return Object.entries(mapa)
        .map(
          ([categoria, valor]) => ({
            categoria,
            valor,
          })
        )
        .sort(
          (a, b) =>
            b.valor - a.valor
        );
    })();

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

  const diferencaFaturamentoCaixa =
    receitaOperacional -
    (indicadores.caixaRecebidoTotal ||
      indicadores.recebidoTotal ||
      0);

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Relatório Financeiro",
      14,
      20
    );

    doc.save(
      "relatorio-financeiro.pdf"
    );
  }

  const kpisSimples = [
    [
      "Faturamento",
      receitaOperacional,
    ],

    [
      "Caixa Real",
      indicadores.entradaLiquida ||
        0,
    ],

    [
      "Saídas",
      indicadores.saidasTotal || 0,
    ],

    [
      "Faturado em Aberto",
      indicadores.faturadoEmAberto ||
        0,
    ],

    [
      "Banco",
      indicadores.tenhoNoBanco ||
        0,
    ],

    [
      "Caixa Físico",
      indicadores.tenhoNoCaixa ||
        0,
    ],
  ];

  const kpisDetalhados = [
  [
    "Faturamento",
    receitaOperacional,
  ],

  [
    "Caixa Real",
    indicadores.entradaLiquida ||
      0,
  ],

  [
    "Caixa Recebido",
    indicadores.caixaRecebidoTotal ||
      indicadores.recebidoTotal ||
      0,
  ],

  [
    "Saídas",
    indicadores.saidasTotal || 0,
  ],

  [
    "Faturado em Aberto",
    indicadores.faturadoEmAberto ||
      0,
  ],

  [
    "Recebidos Antigos",
    indicadores.recebimentosAntigos ||
      0,
  ],

  [
    "Injeção Caixa",
    indicadores.injecaoCaixaTotal ||
      0,
  ],

  [
    "Injeção Loja",
    indicadores.injecaoLojaTotal ||
      0,
  ],

  [
    "Injeção Sócios",
    indicadores.injecaoSociosTotal ||
      0,
  ],

  [
    "Aporte Total",
    indicadores.aporteTotal ||
      0,
  ],

  [
    "Recuperação Vale",
    indicadores.recuperacaoValeTotal ||
      0,
  ],

  [
    "Banco",
    indicadores.tenhoNoBanco ||
      0,
  ],

  [
    "Caixa Físico",
    indicadores.tenhoNoCaixa ||
      0,
  ],
];
  const kpis = modoDetalhado
    ? kpisDetalhados
    : kpisSimples;

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1
            style={
              styles.dashboardTitulo
            }
          >
            Dashboard Financeiro
          </h1>

          <p
            style={
              styles.dashboardSubtitulo
            }
          >
            Visão geral operacional
            e financeira
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              ...styles.botaoDashboard,

              background:
                modoDetalhado
                  ? "#334155"
                  : "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
            }}
            onClick={() =>
              setModoDetalhado(false)
            }
          >
            Simples
          </button>

          <button
            style={{
              ...styles.botaoDashboard,

              background:
                modoDetalhado
                  ? "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)"
                  : "#334155",
            }}
            onClick={() =>
              setModoDetalhado(true)
            }
          >
            Detalhado
          </button>

          <button
            style={
              styles.botaoDashboard
            }
            onClick={exportarPDF}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <Card titulo="Período analisado">
        <div style={styles.formGrid}>
          <Campo
            label="Começa em"
            tipo="date"
            valor={inicioMes}
            mudar={setInicioMes}
          />

          <Campo
            label="Fecha em"
            tipo="date"
            valor={fimMes}
            mudar={setFimMes}
          />
        </div>
      </Card>

      <div style={styles.kpisModernos}>
        {kpis.map(
          ([titulo, valor]) => (
            <Kpi
              key={titulo}
              titulo={titulo}
              valor={moeda.format(
                valor
              )}
            />
          )
        )}
      </div>

      <Card titulo="Fluxo de caixa acumulado">
        <GraficoLinha
          dados={fluxoCaixaDiario}
          moeda={moeda}
          linhas={[
            {
              dataKey: "saldoBanco",
              name: "Banco",
              stroke: "#38bdf8",
            },

            {
              dataKey: "saldoCaixa",
              name: "Caixa físico",
              stroke: "#22c55e",
            },

            {
              dataKey: "saldoTotal",
              name: "Saldo total",
              stroke: "#a855f7",
            },
          ]}
        />
      </Card>

      <Card titulo="DRE gerencial simples">
        <div style={styles.kpisModernos}>
          <Kpi
            titulo="Receita Operacional"
            valor={moeda.format(
              receitaOperacional
            )}
          />

          <Kpi
            titulo="Despesas Operacionais"
            valor={moeda.format(
              despesasOperacionais
            )}
          />

          <Kpi
            titulo="Resultado Operacional"
            valor={moeda.format(
              resultadoOperacional
            )}
          />

          <Kpi
            titulo="Margem Operacional"
            valor={`${margemOperacional.toFixed(
              1
            )}%`}
          />
        </div>
      </Card>

      <Card titulo="Meta mensal">
        <div style={styles.formGrid}>
          <Campo
            label="Meta do mês"
            tipo="number"
            valor={metaMensal}
            mudar={setMetaMensal}
          />
        </div>

        <div style={styles.kpisModernos}>
          <Kpi
            titulo="% Meta"
            valor={`${percentualMeta.toFixed(
              1
            )}%`}
          />

          <Kpi
            titulo="Falta para meta"
            valor={moeda.format(
              Math.max(
                faltaMeta,
                0
              )
            )}
          />

          <Kpi
            titulo="Meta diária necessária"
            valor={moeda.format(
              mediaNecessaria
            )}
          />

          <Kpi
            titulo="Projeção mês"
            valor={moeda.format(
              projecaoMes
            )}
          />
        </div>
      </Card>

      <div style={styles.dashboardGridNova}>
        <Card titulo="Faturamento por dia">
          <GraficoLinha
            dados={vendasPorDia || []}
            moeda={moeda}
          />
        </Card>

        <Card titulo="Serviços por dia">
          <GraficoBarras
            dados={
              servicosPorDia || []
            }
            dataKey="quantidade"
            xKey="data"
            nome="Serviços"
          />
        </Card>
      </div>

      {modoDetalhado && (
        <>
          <Card titulo="Leitura executiva do caixa">
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(220px,1fr))",

                gap: 14,
              }}
            >
              <div>
                <p
                  style={{
                    color: "#94a3b8",
                    margin: 0,
                    fontSize: 13,
                  }}
                >
                  Diferença
                  faturamento x caixa
                </p>

                <strong
                  style={{
                    color:
                      diferencaFaturamentoCaixa >
                      0
                        ? "#f59e0b"
                        : "#22c55e",

                    fontSize: 22,
                  }}
                >
                  {moeda.format(
                    diferencaFaturamentoCaixa
                  )}
                </strong>
              </div>
            </div>
          </Card>

          <div style={styles.dashboardGridNova}>
            <Card titulo="Contas a pagar">
              <GraficoBarras
                dados={
                  contasPorNome || []
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

            <Card titulo="Despesas por centro de custo">
              <GraficoBarras
                dados={
                  despesasPorCategoria
                }
                moeda={moeda}
                horizontal
                dataKey="valor"
                xKey="categoria"
                nome="Despesas"
              />
            </Card>

            <Card titulo="Top clientes">
              {clientesTop.length ===
              0 ? (
                <p style={styles.vazio}>
                  Nenhum cliente no
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
                            "1px solid rgba(148,163,184,0.12)",

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
            </Card>

            <Card titulo="Contas pendentes">
              {contasPendentes.length ===
              0 ? (
                <p style={styles.vazio}>
                  Nenhuma conta
                  pendente.
                </p>
              ) : (
                contasPendentes
                  .slice(0, 8)
                  .map((conta) => (
                    <div
                      key={conta.id}
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        padding:
                          "10px 0",

                        borderBottom:
                          "1px solid rgba(148,163,184,0.12)",

                        gap: 12,
                      }}
                    >
                      <span>
                        {dataBR(
                          conta.vencimento
                        )}{" "}
                        -{" "}
                        {
                          conta.conta
                        }
                      </span>

                      <strong
                        style={{
                          color:
                            "#f59e0b",
                        }}
                      >
                        {moeda.format(
                          conta.valor
                        )}
                      </strong>
                    </div>
                  ))
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}