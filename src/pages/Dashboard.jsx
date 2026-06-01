import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Kpi from "../components/Kpi.jsx";
import GraficoLinha from "../components/GraficoLinha.jsx";
import GraficoBarras from "../components/GraficoBarras.jsx";
import Tabela from "../components/Tabela.jsx";

export default function Dashboard({
  fecharMesFinanceiro,
  setAba,

  inicioMes,
  setInicioMes,
  fimMes,
  setFimMes,

  indicadores,
  moeda,

  vendasPorDia,
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

  historicoFechamentos,

  podeEditarMeta = false,
}) {
  const [modoDetalhado, setModoDetalhado] = useState(false);
  const [diasComparativo, setDiasComparativo] = useState(10);
  const [tooltipAberto, setTooltipAberto] = useState("");
  const [mostrarRecebimentosAntigos, setMostrarRecebimentosAntigos] =
    useState(false);

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function dentroDoPeriodo(data) {
    if (!data) return false;
    return data >= inicioMes && data <= fimMes;
  }

  function adicionarDias(dataBase, dias) {
    const data = new Date(dataBase + "T00:00:00");
    data.setDate(data.getDate() + dias);
    return data.toISOString().slice(0, 10);
  }

  function calcularVariacao(atual, anterior) {
    if (!anterior || anterior <= 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  }

  function corVariacao(valor) {
    if (valor > 0) return "#22c55e";
    if (valor < 0) return "#ef4444";
    return "#94a3b8";
  }

  function textoVariacao(valor) {
    const numero = Number(valor || 0);
    const sinal = numero > 0 ? "+" : "";
    return `${sinal}${numero.toFixed(1)}%`;
  }

  function ehInjecaoOuAporte(item) {
    const texto = String(
      [
        item?.tipo,
        item?.produto,
        item?.processo,
        item?.cliente,
        item?.observacao,
      ].join(" ")
    )
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return (
      texto.includes("INJECAO") ||
      texto.includes("APORTE") ||
      texto.includes("CAPITAL")
    );
  }

  function somarEntradasPeriodo(inicio, fim) {
    return entradas
      .filter((entrada) => entrada.data >= inicio && entrada.data <= fim)
      .filter((entrada) => !ehInjecaoOuAporte(entrada))
      .reduce((soma, entrada) => soma + Number(entrada.valor || 0), 0);
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
  const resultadoOperacional = receitaOperacional - despesasOperacionais;

  const margemOperacional =
    receitaOperacional > 0
      ? (resultadoOperacional / receitaOperacional) * 100
      : 0;

  const percentualMeta =
    metaMensal > 0 ? (receitaOperacional / metaMensal) * 100 : 0;

  const faltaMeta = metaMensal - receitaOperacional;

  const mediaNecessaria =
    faltaMeta > 0 ? faltaMeta / Math.max(ultimoDiaMes - diaAtual, 1) : 0;

  const projecaoMes =
    diaAtual > 0 ? (receitaOperacional / diaAtual) * ultimoDiaMes : 0;

  const despesasPorCategoria = (() => {
    const mapa = {};

    saidas.forEach((saida) => {
      if (!dentroDoPeriodo(saida.data)) return;

      const categoria = saida.categoria || "Outros";
      mapa[categoria] = (mapa[categoria] || 0) + Number(saida.valor || 0);
    });

    return Object.entries(mapa)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
  })();

  const clientesTop = (rankingClientes || []).slice(0, 8);

  const contasPendentes = (dadosPeriodo?.contas || []).filter(
    (conta) => statusConta(conta) !== "Pago"
  );

  const totalClientesTop = clientesTop.reduce(
    (soma, cliente) => soma + cliente.valor,
    0
  );

  const diferencaFaturamentoCaixa =
    receitaOperacional -
    (indicadores.caixaRecebidoTotal || indicadores.recebidoTotal || 0);

  const entradasOperacionaisPeriodo = (dadosPeriodo?.entradas || []).filter(
    (entrada) => !ehInjecaoOuAporte(entrada)
  );

  const servicosRealizadosPeriodo = entradasOperacionaisPeriodo.length;

  const totalServicosGrafico = (servicosPorDia || []).reduce(
    (soma, item) => soma + Number(item.quantidade || 0),
    0
  );

  const recebimentosAntigosDetalhados = entradas
    .filter((entrada) => {
      const dataRecebimento = dataRecebimentoEntrada(entrada);

      if (!entrada?.data) return false;
      if (!dataRecebimento) return false;
      if (entrada.status !== "Pago") return false;
      if (ehInjecaoOuAporte(entrada)) return false;

      return (
        entrada.data < inicioMes &&
        dataRecebimento >= inicioMes &&
        dataRecebimento <= fimMes
      );
    })
    .sort((a, b) =>
      String(dataRecebimentoEntrada(b)).localeCompare(
        String(dataRecebimentoEntrada(a))
      )
    );

  const quantidadeRecebimentosAntigos = recebimentosAntigosDetalhados.length;

  const valorRecebimentosAntigos = recebimentosAntigosDetalhados.reduce(
    (soma, entrada) => soma + Number(entrada.valor || 0),
    0
  );

  async function exportarPDF() {
    const elemento = document.querySelector("main");

    if (!elemento) {
      alert("Dashboard não encontrado.");
      return;
    }

    const canvas = await html2canvas(elemento, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#020617",
      windowWidth: elemento.scrollWidth,
      windowHeight: elemento.scrollHeight,
    });

    const imagem = canvas.toDataURL("image/png");
    const doc = new jsPDF("p", "mm", "a4");

    const larguraPDF = 210;
    const alturaPagina = 297;
    const alturaImagem = (canvas.height * larguraPDF) / canvas.width;

    let alturaRestante = alturaImagem;
    let posicao = 0;

    doc.addImage(imagem, "PNG", 0, posicao, larguraPDF, alturaImagem);
    alturaRestante -= alturaPagina;

    while (alturaRestante > 0) {
      posicao -= alturaPagina;
      doc.addPage();
      doc.addImage(imagem, "PNG", 0, posicao, larguraPDF, alturaImagem);
      alturaRestante -= alturaPagina;
    }

    doc.save("dashboard-financeiro.pdf");
  }

  const explicacoesKpi = {
    Faturamento:
      "Tudo que foi vendido no período analisado, mesmo que ainda não tenha sido recebido.",
    "Entradas à Vista":
      "Vendas pagas na hora, como Pix, dinheiro, cartão ou depósito.",
    "Caixa Real":
      "Dinheiro real restante depois das entradas recebidas e das saídas pagas.",
    Saídas:
      "Tudo que saiu da empresa no período: contas, despesas, fornecedores, vales e pagamentos.",
    "Faturado em Aberto":
      "Valor vendido como Nota/Faturado que ainda não foi recebido.",
    Banco:
      "Quanto deveria existir no banco, considerando entradas bancárias menos saídas bancárias.",
    "Caixa Físico":
      "Quanto deveria existir em dinheiro físico, considerando entradas e saídas em caixa.",
    "Recebimentos Antigos":
      "Notas ou faturados de períodos anteriores que foram pagos agora.",
    "Caixa Recebido":
      "Tudo que realmente entrou no caixa/banco no período analisado.",
    "Caixa Operacional":
      "Dinheiro operacional da empresa sem contar aportes ou injeções de capital.",
    "Saldo Operacional":
      "Sobra operacional após descontar as saídas do caixa operacional.",
    "Injeção Sócios":
      "Dinheiro colocado pelos sócios na empresa. Não é venda.",
    "Injeção Loja":
      "Dinheiro colocado diretamente na operação da loja. Não é venda.",
    "Injeção Caixa":
      "Reforço manual de caixa físico. Não é venda.",
    "Aporte Total":
      "Soma de todas as injeções/aportes feitos na empresa.",
    "Banco Real":
      "Quanto deveria existir no banco segundo o sistema.",
    "Recuperação Vale":
      "Valor recuperado de vales ou adiantamentos descontados depois.",
    "Serviços Realizados":
      "Quantidade de serviços/vendas operacionais lançados dentro do período financeiro atual.",
    "Notas Antigas Recebidas":
      "Quantidade de vendas feitas antes do período atual, mas recebidas dentro deste período financeiro.",
    "Valor de Notas Antigas":
      "Valor financeiro recebido neste período referente a vendas de períodos anteriores.",
  };

  function KpiComAjuda({ titulo, valor }) {
    const aberto = tooltipAberto === titulo;

    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onMouseEnter={() => setTooltipAberto(titulo)}
          onMouseLeave={() => setTooltipAberto("")}
          onClick={() => setTooltipAberto(aberto ? "" : titulo)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 5,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#93c5fd",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ?
        </button>

        {aberto && (
          <div
            style={{
              position: "absolute",
              top: 40,
              right: 10,
              zIndex: 20,
              width: 260,
              background: "#020617",
              color: "#e5e7eb",
              border: "1px solid #334155",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              lineHeight: 1.45,
              boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
            }}
          >
            {explicacoesKpi[titulo] || "Indicador financeiro do período."}
          </div>
        )}

        <Kpi titulo={titulo} valor={valor} />
      </div>
    );
  }

  const caixaOperacional =
    (indicadores.caixaRecebidoTotal || 0) -
    (indicadores.injecaoCapitalTotal || 0);

  const saldoOperacional = caixaOperacional - (indicadores.saidasTotal || 0);

  const kpisSimples = [
    ["Faturamento", receitaOperacional],
    ["Caixa Real", indicadores.entradaLiquida || 0],
    ["Saídas", indicadores.saidasTotal || 0],
    ["Faturado em Aberto", indicadores.faturadoEmAberto || 0],
    ["Banco", indicadores.tenhoNoBanco || 0],
    ["Caixa Físico", indicadores.tenhoNoCaixa || 0],
  ];

  const kpisDetalhados = [
    ["Faturamento", receitaOperacional],
    ["Entradas à Vista", indicadores.entradasVistaTotal || 0],
    ["Recebimentos Antigos", indicadores.recebimentosAntigos || 0],
    ["Caixa Recebido", indicadores.caixaRecebidoTotal || 0],
    ["Caixa Operacional", caixaOperacional || 0],
    ["Saldo Operacional", saldoOperacional || 0],
    ["Faturado em Aberto", indicadores.faturadoEmAberto || 0],
    ["Saídas", indicadores.saidasTotal || 0],
    ["Injeção Sócios", indicadores.injecaoSociosTotal || 0],
    ["Injeção Loja", indicadores.injecaoLojaTotal || 0],
    ["Injeção Caixa", indicadores.injecaoCaixaTotal || 0],
    ["Aporte Total", indicadores.aporteTotal || 0],
    ["Banco Real", indicadores.tenhoNoBanco || 0],
    ["Caixa Físico", indicadores.tenhoNoCaixa || 0],
    ["Recuperação Vale", indicadores.recuperacaoValeTotal || 0],
  ];

  const kpis = modoDetalhado ? kpisDetalhados : kpisSimples;

  const inicioSemanaAtual = adicionarDias(fimMes, -6);
  const fimSemanaAtual = fimMes;

  const inicioSemanaAnterior = adicionarDias(inicioSemanaAtual, -7);
  const fimSemanaAnterior = adicionarDias(inicioSemanaAtual, -1);

  const vendaSemanaAtual = somarEntradasPeriodo(
    inicioSemanaAtual,
    fimSemanaAtual
  );

  const vendaSemanaAnterior = somarEntradasPeriodo(
    inicioSemanaAnterior,
    fimSemanaAnterior
  );

  const variacaoSemana = calcularVariacao(
    vendaSemanaAtual,
    vendaSemanaAnterior
  );

  const ultimoFechamento = historicoFechamentos?.[0];

  const fechamentoAnterior = historicoFechamentos?.[1];

  const inicioMesAnterior = ultimoFechamento?.inicio || "";

  const fimMesAnterior = ultimoFechamento?.fim || "";

  const quantidadeDiasAtual = Math.max(
    1,
    Math.floor(
      (new Date(fimMes + "T00:00:00") -
        new Date(inicioMes + "T00:00:00")) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const fimMesAnteriorComparativo = inicioMesAnterior
    ? adicionarDias(inicioMesAnterior, quantidadeDiasAtual - 1)
    : "";

  const vendaMesAtual = somarEntradasPeriodo(inicioMes, fimMes);

  const vendaMesAnterior =
    inicioMesAnterior && fimMesAnteriorComparativo
      ? somarEntradasPeriodo(inicioMesAnterior, fimMesAnteriorComparativo)
      : 0;

  const variacaoMes = calcularVariacao(vendaMesAtual, vendaMesAnterior);

  const fimComparativoAtual = adicionarDias(inicioMes, diasComparativo - 1);

  const fimComparativoAnterior = inicioMesAnterior
    ? adicionarDias(inicioMesAnterior, diasComparativo - 1)
    : "";

  const vendaPeriodoAtual = somarEntradasPeriodo(
    inicioMes,
    fimComparativoAtual
  );

  const vendaPeriodoAnterior =
    inicioMesAnterior && fimComparativoAnterior
      ? somarEntradasPeriodo(inicioMesAnterior, fimComparativoAnterior)
      : 0;

  const variacaoPeriodo = calcularVariacao(
    vendaPeriodoAtual,
    vendaPeriodoAnterior
  );

  function CardComparativo({
    titulo,
    descricao,
    periodoAtual,
    periodoAnterior,
    atual,
    anterior,
    variacao,
  }) {
    return (
      <div style={styles.card}>
        <h3
          style={{
            color: "#fff",
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          {titulo}
        </h3>

        <p
          style={{
            color: "#94a3b8",
            marginTop: 0,
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {descricao}
        </p>

        <p style={{ color: "#cbd5e1", marginBottom: 6 }}>
          <strong>Atual:</strong> {periodoAtual}
          <br />
          {moeda.format(atual)}
        </p>

        <p style={{ color: "#cbd5e1", marginBottom: 6 }}>
          <strong>Anterior:</strong> {periodoAnterior}
          <br />
          {moeda.format(anterior)}
        </p>

        <strong
          style={{
            color: corVariacao(variacao),
            fontSize: 24,
          }}
        >
          {textoVariacao(variacao)}
        </strong>
      </div>
    );
  }

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>Dashboard Financeiro</h1>

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

          <button style={styles.botaoDashboard} onClick={exportarPDF}>
            Exportar PDF
          </button>

          <button
            style={{
              ...styles.botaoDashboard,
              background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
            }}
            onClick={confirmarFechamentoMes}
          >
            Fechar Mês Financeiro
          </button>

          <button
            style={{
              ...styles.botaoDashboard,
              background: "linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)",
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
              onChange={(e) => setInicioMes(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Fecha em
            <input
              type="date"
              value={fimMes}
              onChange={(e) => setFimMes(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>
      </Card>

      <div style={styles.kpisModernos}>
        {kpis.map(([titulo, valor]) => (
          <KpiComAjuda
            key={titulo}
            titulo={titulo}
            valor={moeda.format(valor)}
          />
        ))}
      </div>

      {modoDetalhado && (
        <Card titulo="Fechamento do caixa">
          <div style={styles.kpisModernos}>
            <KpiComAjuda
              titulo="Serviços Realizados"
              valor={`${servicosRealizadosPeriodo}`}
            />

            <KpiComAjuda
              titulo="Notas Antigas Recebidas"
              valor={`${quantidadeRecebimentosAntigos}`}
            />

            <KpiComAjuda
              titulo="Valor de Notas Antigas"
              valor={moeda.format(valorRecebimentosAntigos)}
            />

            <KpiComAjuda
              titulo="Recebimentos Antigos"
              valor={moeda.format(indicadores.recebimentosAntigos || 0)}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              style={
                mostrarRecebimentosAntigos
                  ? styles.botao
                  : styles.botaoCinza
              }
              onClick={() =>
                setMostrarRecebimentosAntigos(!mostrarRecebimentosAntigos)
              }
            >
              {mostrarRecebimentosAntigos
                ? "Ocultar recebimentos antigos"
                : "Ver recebimentos antigos"}
            </button>
          </div>
        </Card>
      )}

      {modoDetalhado && mostrarRecebimentosAntigos && (
        <Card titulo="Notas antigas recebidas neste período">
          {recebimentosAntigosDetalhados.length === 0 ? (
            <p style={styles.vazio}>
              Nenhuma nota antiga foi recebida neste período.
            </p>
          ) : (
            <Tabela
              colunas={[
                "Cliente",
                "Placa",
                "Produto",
                "Data venda",
                "Dia pago",
                "Pagamento",
                "Valor",
                "Processo",
              ]}
              dados={recebimentosAntigosDetalhados.map((entrada) => [
                entrada.cliente || "-",
                entrada.placa || "-",
                entrada.produto || "-",
                dataBR(entrada.data),
                dataBR(dataRecebimentoEntrada(entrada)),
                entrada.formaPagamento || "-",
                moeda.format(Number(entrada.valor || 0)),
                entrada.processo || "-",
              ])}
            />
          )}
        </Card>
      )}

      {modoDetalhado && (
        <Card titulo="Comparativos Inteligentes">
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 20,
              alignItems: "flex-end",
            }}
          >
            <label style={styles.label}>
              Comparar primeiros dias do mês
              <input
                type="number"
                min={1}
                max={31}
                value={diasComparativo}
                onChange={(e) =>
                  setDiasComparativo(Number(e.target.value || 1))
                }
                style={{
                  ...styles.input,
                  maxWidth: 160,
                }}
              />
            </label>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 20,
            }}
          >
            <CardComparativo
              titulo="Semana atual vs semana anterior"
              descricao="Compara os últimos 7 dias do período selecionado com os 7 dias imediatamente anteriores."
              periodoAtual={`${dataBR(inicioSemanaAtual)} a ${dataBR(
                fimSemanaAtual
              )}`}
              periodoAnterior={`${dataBR(inicioSemanaAnterior)} a ${dataBR(
                fimSemanaAnterior
              )}`}
              atual={vendaSemanaAtual}
              anterior={vendaSemanaAnterior}
              variacao={variacaoSemana}
            />

            <CardComparativo
              titulo="Mês atual vs mês anterior"
              descricao="Compara o período financeiro atual selecionado com o mês anterior completo."
              periodoAtual={`${dataBR(inicioMes)} a ${dataBR(fimMes)}`}
              periodoAnterior={`${dataBR(inicioMesAnterior)} a ${dataBR(
                fimMesAnteriorComparativo
              )}`}
              atual={vendaMesAtual}
              anterior={vendaMesAnterior}
              variacao={variacaoMes}
            />

            <CardComparativo
              titulo={`Primeiros ${diasComparativo} dias vs mês anterior`}
              descricao="Compara a mesma quantidade de dias no início do mês atual contra o início do mês anterior."
              periodoAtual={`${dataBR(inicioMes)} a ${dataBR(
                fimComparativoAtual
              )}`}
              periodoAnterior={`${dataBR(inicioMesAnterior)} a ${dataBR(
                fimComparativoAnterior
              )}`}
              atual={vendaPeriodoAtual}
              anterior={vendaPeriodoAnterior}
              variacao={variacaoPeriodo}
            />
          </div>
        </Card>
      )}

      <div className="dashboard-graficos-executivos">
        <div style={{ minWidth: 0 }}>
          <Card titulo="Vendas por dia">
            <GraficoLinha
              dados={vendasPorDia}
              moeda={moeda}
              linhas={[
                {
                  dataKey: "valor",
                  name: "Vendas",
                  stroke: "#38bdf8",
                },
              ]}
            />
          </Card>
        </div>

        <div style={{ minWidth: 0 }}>
          <Card
            titulo={`Quantidade de serviços por dia · Total: ${totalServicosGrafico}`}
          >
            <GraficoBarras
              dados={servicosPorDia}
              moeda={null}
              xKey="data"
              dataKey="quantidade"
              nome="Serviços"
            />
          </Card>
        </div>
      </div>

      <Card titulo="DRE gerencial simples">
        <div style={styles.kpisModernos}>
          <KpiComAjuda
            titulo="Receita Operacional"
            valor={moeda.format(receitaOperacional)}
          />

          <KpiComAjuda
            titulo="Despesas Operacionais"
            valor={moeda.format(despesasOperacionais)}
          />

          <KpiComAjuda
            titulo="Resultado Operacional"
            valor={moeda.format(resultadoOperacional)}
          />

          <KpiComAjuda
            titulo="Margem Operacional"
            valor={`${margemOperacional.toFixed(1)}%`}
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
              onChange={(e) => setMetaMensal(Number(e.target.value))}
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
          <KpiComAjuda
            titulo="% Meta"
            valor={`${percentualMeta.toFixed(1)}%`}
          />

          <KpiComAjuda
            titulo="Falta para meta"
            valor={moeda.format(Math.max(faltaMeta, 0))}
          />

          <KpiComAjuda
            titulo="Meta diária necessária"
            valor={moeda.format(mediaNecessaria)}
          />

          <KpiComAjuda
            titulo="Projeção mês"
            valor={moeda.format(projecaoMes)}
          />
        </div>
      </Card>
    </>
  );
}