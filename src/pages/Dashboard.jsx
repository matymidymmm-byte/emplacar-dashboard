import { useState } from "react";
import jsPDF from "jspdf";

import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Kpi from "../components/Kpi.jsx";
import GraficoLinha from "../components/GraficoLinha.jsx";
import GraficoBarras from "../components/GraficoBarras.jsx";
import GraficoPizza from "../components/GraficoPizza.jsx";

export default function Dashboard({
  usuario,
  fecharMesFinanceiro,
  setAba,

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
  const [modoDetalhado, setModoDetalhado] = useState(false);

  const emailUsuario = usuario?.email?.toLowerCase() || "";

  const podeEditarMeta =
    emailUsuario === "matymidy.mmm@gmail.com" ||
    emailUsuario !== "emplacarmcr@gmail.com";

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function dentroDoPeriodo(data) {
    if (!data) return false;

    return data >= inicioMes && data <= fimMes;
  }

  function confirmarFechamentoMes() {
    const confirmar = window.confirm(
      `Deseja fechar o mês financeiro de ${dataBR(inicioMes)} até ${dataBR(
        fimMes
      )}?\n\nEssa ação salvará uma foto dos indicadores atuais no histórico.`
    );

    if (!confirmar) return;

    fecharMesFinanceiro();

    window.alert("Mês financeiro salvo no histórico com sucesso.");
  }

  const hojeSistema = new Date();
  const diaAtual = hojeSistema.getDate();

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
      const dataRecebimento = dataRecebimentoEntrada(entrada);

      if (!dentroDoPeriodo(dataRecebimento)) return;
      if (entrada.status !== "Pago") return;

      criarDia(dataRecebimento);

      const valor = Number(entrada.valor || 0);

      if (destinoDinheiro(entrada.formaPagamento) === "Caixa") {
        mapa[dataRecebimento].entradaCaixa += valor;
      } else {
        mapa[dataRecebimento].entradaBanco += valor;
      }
    });

    saidas.forEach((saida) => {
      if (!dentroDoPeriodo(saida.data)) return;

      criarDia(saida.data);

      const valor = Number(saida.valor || 0);

      if (destinoDinheiro(saida.formaPagamento) === "Caixa") {
        mapa[saida.data].saidaCaixa += valor;
      } else {
        mapa[saida.data].saidaBanco += valor;
      }
    });

    contas.forEach((conta) => {
      if (!dentroDoPeriodo(conta.vencimento)) return;
      if (statusConta(conta) !== "Pago") return;

      criarDia(conta.vencimento);

      mapa[conta.vencimento].saidaBanco += Number(conta.valor || 0);
    });

    let saldoBancoAcumulado = 0;
    let saldoCaixaAcumulado = 0;

    return Object.values(mapa)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((dia) => {
        const saldoBancoDia = dia.entradaBanco - dia.saidaBanco;
        const saldoCaixaDia = dia.entradaCaixa - dia.saidaCaixa;

        saldoBancoAcumulado += saldoBancoDia;
        saldoCaixaAcumulado += saldoCaixaDia;

        return {
          ...dia,
          saldoBanco: saldoBancoAcumulado,
          saldoCaixa: saldoCaixaAcumulado,
          saldoTotal: saldoBancoAcumulado + saldoCaixaAcumulado,
        };
      });
  })();

  const receitaOperacional =
    indicadores.faturamentoCompetencia || indicadores.entradaBruta || 0;

  const despesasOperacionais = indicadores.saidasTotal || 0;

  const resultadoOperacional =
    receitaOperacional - despesasOperacionais;

  const margemOperacional =
    receitaOperacional > 0
      ? (resultadoOperacional / receitaOperacional) * 100
      : 0;

  const percentualMeta =
    metaMensal > 0
      ? (receitaOperacional / metaMensal) * 100
      : 0;

  const faltaMeta = metaMensal - receitaOperacional;

  const mediaNecessaria =
    faltaMeta > 0
      ? faltaMeta / Math.max(ultimoDiaMes - diaAtual, 1)
      : 0;

  const projecaoMes =
    diaAtual > 0
      ? (receitaOperacional / diaAtual) * ultimoDiaMes
      : 0;

  const despesasPorCategoria = (() => {
    const mapa = {};

    saidas.forEach((saida) => {
      if (!dentroDoPeriodo(saida.data)) return;

      const categoria = saida.categoria || "Outros";

      mapa[categoria] =
        (mapa[categoria] || 0) +
        Number(saida.valor || 0);
    });

    return Object.entries(mapa)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);
  })();

  const clientesTop = (rankingClientes || []).slice(0, 8);

  const contasPendentes =
    (dadosPeriodo?.contas || []).filter(
      (conta) => statusConta(conta) !== "Pago"
    );

  const totalClientesTop = clientesTop.reduce(
    (soma, cliente) => soma + cliente.valor,
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
    doc.text("Relatório Financeiro", 14, 20);

    doc.save("relatorio-financeiro.pdf");
  }

  const kpisSimples = [
    ["Faturamento", receitaOperacional],

    [
      "Entradas à Vista",
      indicadores.entradasVistaTotal || 0,
    ],

    [
      "Caixa Real",
      indicadores.entradaLiquida || 0,
    ],

    ["Saídas", indicadores.saidasTotal || 0],

    [
      "Faturado em Aberto",
      indicadores.faturadoEmAberto || 0,
    ],

    ["Banco", indicadores.tenhoNoBanco || 0],

    [
      "Caixa Físico",
      indicadores.tenhoNoCaixa || 0,
    ],
  ];

  const caixaOperacional =
    (indicadores.caixaRecebidoTotal || 0) -
    (indicadores.injecaoCapitalTotal || 0);

  const saldoOperacional =
    caixaOperacional -
    (indicadores.saidasTotal || 0);

  const kpisDetalhados = [
    ["Faturamento", receitaOperacional],

    [
      "Entradas à Vista",
      indicadores.entradasVistaTotal || 0,
    ],

    [
      "Recebimentos Antigos",
      indicadores.recebimentosAntigos || 0,
    ],

    [
      "Caixa Recebido",
      indicadores.caixaRecebidoTotal || 0,
    ],

    [
      "Caixa Operacional",
      caixaOperacional || 0,
    ],

    [
      "Saldo Operacional",
      saldoOperacional || 0,
    ],

    [
      "Faturado em Aberto",
      indicadores.faturadoEmAberto || 0,
    ],

    [
      "Saídas",
      indicadores.saidasTotal || 0,
    ],

    [
      "Injeção Sócios",
      indicadores.injecaoSociosTotal || 0,
    ],

    [
      "Injeção Loja",
      indicadores.injecaoLojaTotal || 0,
    ],

    [
      "Injeção Caixa",
      indicadores.injecaoCaixaTotal || 0,
    ],

    [
      "Aporte Total",
      indicadores.aporteTotal || 0,
    ],

    [
      "Banco Real",
      indicadores.tenhoNoBanco || 0,
    ],

    [
      "Caixa Físico",
      indicadores.tenhoNoCaixa || 0,
    ],

    [
      "Recuperação Vale",
      indicadores.recuperacaoValeTotal || 0,
    ],
  ];

  const kpis =
    modoDetalhado
      ? kpisDetalhados
      : kpisSimples;

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>
            Dashboard Financeiro
          </h1>

          <p style={styles.dashboardSubtitulo}>
            Visão geral operacional e financeira
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
              background: modoDetalhado
                ? "#334155"
                : "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
            }}
            onClick={() => setModoDetalhado(false)}
          >
            Simples
          </button>

          <button
            style={{
              ...styles.botaoDashboard,
              background: modoDetalhado
                ? "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)"
                : "#334155",
            }}
            onClick={() => setModoDetalhado(true)}
          >
            Detalhado
          </button>

          <button
            style={styles.botaoDashboard}
            onClick={exportarPDF}
          >
            Exportar PDF
          </button>

          <button
            style={{
              ...styles.botaoDashboard,
              background:
                "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
            }}
            onClick={confirmarFechamentoMes}
          >
            Fechar Mês Financeiro
            
          </button>
          <button
  style={{
    ...styles.botaoDashboard,
    background:
      "linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)",
  }}
  onClick={() => setAba("Histórico Financeiro")}
>
  Análise Financeira
</button>
        </div>
      </div>

      <Card titulo="Período analisado">
        <div style={styles.formGrid}>
          <label style={styles.label}>
            Começa em

            <input
              type="date"
              value={inicioMes}
              onChange={(e) =>
                setInicioMes(e.target.value)
              }
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Fecha em

            <input
              type="date"
              value={fimMes}
              onChange={(e) =>
                setFimMes(e.target.value)
              }
              style={styles.input}
            />
          </label>
        </div>
      </Card>

      <div style={styles.kpisModernos}>
        {kpis.map(([titulo, valor]) => (
          <Kpi
            key={titulo}
            titulo={titulo}
            valor={moeda.format(valor)}
          />
        ))}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                color: "#94a3b8",
                margin: 0,
                fontSize: 14,
              }}
            >
              Meta atual do mês
            </p>

            <h2
              style={{
                color: "#f8fafc",
                margin: "5px 0 0 0",
                fontSize: 30,
              }}
            >
              {moeda.format(metaMensal || 0)}
            </h2>
          </div>

          {podeEditarMeta && (
            <input
              type="number"
              value={metaMensal}
              onChange={(e) =>
                setMetaMensal(
                  Number(e.target.value)
                )
              }
              placeholder="Nova meta"
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 12,
                color: "#fff",
                padding: "12px 14px",
                minWidth: 180,
                fontSize: 15,
              }}
            />
          )}
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
              Math.max(faltaMeta, 0)
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
    </>
  );
}