import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Kpi from "../components/Kpi.jsx";
import GraficoLinha from "../components/GraficoLinha.jsx";
import GraficoBarras from "../components/GraficoBarras.jsx";
import Tabela from "../components/Tabela.jsx";
import Campo from "../components/Campo.jsx";

function brasilParaISO(data) {
  if (!data) return "";

  const partes = data.split("/");

  if (partes.length !== 3) return "";

  const [dia, mes, ano] = partes;

  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function isoParaBrasil(data) {
  if (!data) return "";

  const partes = data.split("-");

  if (partes.length !== 3) return data;

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

export default function Dashboard({
  fecharMesFinanceiro,
  setAba,

  inicioMes,
  setInicioMes,
  fimMes,
  setFimMes,
  fechamentoProvavel,
  setFechamentoProvavel,

  indicadores,
  moeda,

  vendasPorDia,
  rankingClientes,

  dadosPeriodo,
  statusConta,

  servicosPorDia,
  confirmarRecebimentoCartao,
  confirmarRecebimentoCartoesEmLote,

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
  const [inicioDigitando, setInicioDigitando] = useState(
    isoParaBrasil(inicioMes)
  );
  const [fimDigitando, setFimDigitando] = useState(isoParaBrasil(fimMes));
  const [diasComparativo, setDiasComparativo] = useState(10);
  const [tooltipAberto, setTooltipAberto] = useState("");
  const [mostrarRecebimentosAntigos, setMostrarRecebimentosAntigos] =
    useState(false);
  const [mostrarCartoesAReceber, setMostrarCartoesAReceber] = useState(false);
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);
const [modalCartaoAberto, setModalCartaoAberto] = useState(false);
const [dataRecebimentoCartao, setDataRecebimentoCartao] = useState("");
const [valorLiquidoCartao, setValorLiquidoCartao] = useState("");
const [cartoesSelecionados, setCartoesSelecionados] = useState([]);
const [mesCartoesFiltro, setMesCartoesFiltro] = useState("");

  const hojeSistema = new Date();
  const hojeReferencia = hojeSistema.toISOString().slice(0, 10);
  const diaAtual = hojeSistema.getDate();

  const ultimoDiaMes = new Date(
    hojeSistema.getFullYear(),
    hojeSistema.getMonth() + 1,
    0
  ).getDate();

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function dentroDoPeriodo(data) {
    if (!data) return false;
    return data >= inicioMes && data <= fimMes;
  }

  function dataValida(data) {
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

    const teste = new Date(data + "T00:00:00");

    return !Number.isNaN(teste.getTime());
  }

  function dataSegura(data, fallback = hojeReferencia) {
    return dataValida(data) ? data : fallback;
  }

  function adicionarDias(dataBase, dias) {
    const base = dataSegura(dataBase);
    const data = new Date(base + "T00:00:00");

    data.setDate(data.getDate() + dias);

    if (Number.isNaN(data.getTime())) {
      return dataSegura("");
    }

    return data.toISOString().slice(0, 10);
  }

  function adicionarDiasUteis(dataBase, diasUteis) {
    const base = dataSegura(dataBase);
    const data = new Date(base + "T00:00:00");

    let adicionados = 0;

    while (adicionados < diasUteis) {
      data.setDate(data.getDate() + 1);

      const diaSemana = data.getDay();

      if (diaSemana !== 0 && diaSemana !== 6) {
        adicionados += 1;
      }
    }

    return data.toISOString().slice(0, 10);
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function ehDebito(formaPagamento) {
    const forma = normalizarTexto(formaPagamento);
    return forma.includes("DEBITO");
  }

  function ehCredito(formaPagamento) {
    const forma = normalizarTexto(formaPagamento);
    return forma.includes("CREDITO");
  }

  function ehCartaoBanco(formaPagamento) {
    return ehDebito(formaPagamento) || ehCredito(formaPagamento);
  }

  function dataLiquidacaoEntrada(entrada) {
  if (entrada?.recebimentoCartaoConfirmado) {
    return entrada.dataRecebimentoCartao || "";
  }

  return "";
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
    const texto = normalizarTexto(
      [
        item?.tipo,
        item?.produto,
        item?.processo,
        item?.cliente,
        item?.observacao,
      ].join(" ")
    );

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

  const fimAnalise =
    fechamentoProvavel && fechamentoProvavel >= inicioMes
      ? fechamentoProvavel
      : fimMes;

  const fimPeriodoSeguro = dataSegura(fimAnalise, hojeReferencia);
  const inicioPeriodoSeguro = dataSegura(inicioMes, hojeReferencia);

  const dataFinalDecorrida =
    hojeReferencia > fimPeriodoSeguro ? fimPeriodoSeguro : hojeReferencia;

  const diasTotaisPeriodo = Math.max(
    1,
    Math.floor(
      (new Date(fimPeriodoSeguro + "T00:00:00") -
        new Date(inicioPeriodoSeguro + "T00:00:00")) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const diasDecorridosPeriodo = Math.max(
    1,
    Math.floor(
      (new Date(dataFinalDecorrida + "T00:00:00") -
        new Date(inicioPeriodoSeguro + "T00:00:00")) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const cartoesLiquidados = entradas
    .filter((entrada) => entrada.status === "Pago")
    .filter((entrada) => !ehInjecaoOuAporte(entrada))
    .filter((entrada) => ehCartaoBanco(entrada.formaPagamento))
    .map((entrada) => {
      const dataPagamento = dataRecebimentoEntrada(entrada);
      const dataLiquidacao = dataLiquidacaoEntrada(entrada);

      return {
        ...entrada,
        dataPagamento,
        dataLiquidacao,
        valorNumerico: Number(entrada.valor || 0),
      };
    })
    .filter((entrada) => entrada.dataPagamento && entrada.dataLiquidacao);

  const cartoesPendentesLiquidacao = entradas
  .filter((entrada) => entrada.status === "Pago")
  .filter((entrada) => !ehInjecaoOuAporte(entrada))
  .filter((entrada) => ehCartaoBanco(entrada.formaPagamento))
  .filter((entrada) => !entrada.recebimentoCartaoConfirmado)
  .map((entrada) => ({
    ...entrada,
    dataPagamento: dataRecebimentoEntrada(entrada),
    valorNumerico: Number(entrada.valor || 0),
  }));

  const proximoDiaUtil = adicionarDiasUteis(hojeReferencia, 1);

  const cartoesAReceberHoje = cartoesLiquidados.filter(
    (entrada) => entrada.dataLiquidacao === hojeReferencia
  );

  const cartoesAReceberAmanha = cartoesLiquidados.filter(
    (entrada) => entrada.dataLiquidacao === proximoDiaUtil
  );

  const cartoesAReceberProximosDias = cartoesLiquidados.filter(
    (entrada) => entrada.dataLiquidacao > proximoDiaUtil
  );
const mesesCartoesPendentes = [
  ...new Set(
    cartoesPendentesLiquidacao.map((entrada) =>
      String(entrada.dataPagamento || entrada.data || "").slice(0, 7)
    )
  ),
].sort();

const cartoesPendentesFiltrados = mesCartoesFiltro
  ? cartoesPendentesLiquidacao.filter(
      (entrada) =>
        String(entrada.dataPagamento || entrada.data || "").slice(0, 7) ===
        mesCartoesFiltro
    )
  : cartoesPendentesLiquidacao;
  const valorCartoesAReceberHoje = cartoesPendentesLiquidacao.reduce(
  (soma, entrada) => soma + Number(entrada.valor || 0),
  0
);

const valorCartoesAReceberAmanha = 0;

const valorCartoesAReceberProximosDias = 0;

  const cartoesContadosMasNaoLiquidadosPeriodo = cartoesLiquidados
    .filter((entrada) => entrada.dataPagamento >= inicioMes)
    .filter((entrada) => entrada.dataPagamento <= fimAnalise)
    .filter((entrada) => entrada.dataLiquidacao > fimAnalise)
    .reduce((soma, entrada) => soma + entrada.valorNumerico, 0);

  const cartoesPagosAntesELiquidadosNoPeriodo = cartoesLiquidados
    .filter((entrada) => entrada.dataPagamento < inicioMes)
    .filter((entrada) => entrada.dataLiquidacao >= inicioMes)
    .filter((entrada) => entrada.dataLiquidacao <= fimAnalise)
    .reduce((soma, entrada) => soma + entrada.valorNumerico, 0);

  const bancoRealAjustado = Number(indicadores.tenhoNoBanco || 0);

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

      if (!dataRecebimento) return;
      if (entrada.status !== "Pago") return;

      const valor = Number(entrada.valor || 0);

      if (destinoDinheiro(entrada.formaPagamento) === "Caixa") {
        if (!dentroDoPeriodo(dataRecebimento)) return;

        criarDia(dataRecebimento);
        mapa[dataRecebimento].entradaCaixa += valor;
        return;
      }

      const dataBanco = dataLiquidacaoEntrada(entrada);

      if (!dentroDoPeriodo(dataBanco)) return;

      criarDia(dataBanco);
      mapa[dataBanco].entradaBanco += valor;
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

  const tiposForaDRE = [
  "Distribuição de Lucro",
  "Aporte de Capital",
  "Vale / Adiantamento",
  "Patrimonial",
  "Outros Não Operacionais",
];  

const despesasOperacionais = saidas
  .filter((saida) => dentroDoPeriodo(saida.data))
  .filter((saida) => !tiposForaDRE.includes(saida.tipoSaida))
  .reduce((soma, saida) => soma + Number(saida.valor || 0), 0);
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
    (receitaOperacional / diasDecorridosPeriodo) * diasTotaisPeriodo;

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

      return historicoFechamentos.some((fechamento) => {
        const fimFechamento = fechamento?.fim || "";

        if (!fimFechamento) return false;

        return (
          entrada.data <= fimFechamento &&
          dataRecebimento > fimFechamento &&
          dataRecebimento >= inicioMes &&
          dataRecebimento <= fimAnalise
        );
      });
    })
    .sort((a, b) =>
      String(b.diaPago || b.data).localeCompare(String(a.diaPago || a.data))
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
      "Quanto deveria existir no banco, considerando entradas bancárias liquidadas menos saídas bancárias.",
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
      "Quanto deveria existir no banco segundo o sistema, já considerando liquidação de débito e crédito.",
    "Recuperação Vale":
      "Valor recuperado de vales ou adiantamentos descontados depois.",
    "Serviços Realizados":
      "Quantidade de serviços/vendas operacionais lançados dentro do período financeiro atual.",
    "Notas Antigas Recebidas":
      "Quantidade de vendas feitas antes do período atual, mas recebidas dentro deste período financeiro.",
    "Valor de Notas Antigas":
      "Valor financeiro recebido neste período referente a vendas de períodos anteriores.",
    "Movimentação Geral":
      "Soma das vendas recebidas, notas em aberto e aportes realizados no período.",
    "A Receber Cartão":
      "Valores pagos no débito/crédito que ainda não caíram no banco por causa do prazo de liquidação.",
  };

  function KpiComAjuda({ titulo, valor }) {
    const aberto = tooltipAberto === titulo;

    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"

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
  function abrirModalReceberCartao(entrada) {
  setCartaoSelecionado(entrada);
  setDataRecebimentoCartao(hojeReferencia);
  setValorLiquidoCartao(String(Number(entrada.valor || 0).toFixed(2)));
  setModalCartaoAberto(true);
}

function fecharModalReceberCartao() {
  setCartaoSelecionado(null);
  setModalCartaoAberto(false);
  setDataRecebimentoCartao(hojeReferencia);
  setValorLiquidoCartao("");
    
  }

  const caixaOperacional =
    (indicadores.caixaRecebidoTotal || 0) -
    (indicadores.injecaoCapitalTotal || 0);

  const saldoOperacional = caixaOperacional - (indicadores.saidasTotal || 0);

  const kpisSimples = [
    ["Faturamento", receitaOperacional],
    ["Movimentação Geral", indicadores.movimentacaoGeral || 0],
    ["Caixa Real", indicadores.entradaLiquida || 0],
    ["Saídas", indicadores.saidasTotal || 0],
    ["Faturado em Aberto", indicadores.faturadoEmAberto || 0],
    ["Banco", bancoRealAjustado || 0],
    ["Caixa Físico", indicadores.tenhoNoCaixa || 0],
    ["A Receber Cartão", valorCartoesAReceberAmanha || 0],
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
    ["Banco Real", bancoRealAjustado || 0],
    ["Caixa Físico", indicadores.tenhoNoCaixa || 0],
    ["A Receber Cartão", valorCartoesAReceberAmanha || 0],
    ["Recuperação Vale", indicadores.recuperacaoValeTotal || 0],
    ["Vale Concedido", indicadores.valeConcedidoTotal || 0],
    ["Vale em Aberto", indicadores.valeEmAbertoTotal || 0],
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

  const inicioMesAnterior = ultimoFechamento?.inicio || "";

  const quantidadeDiasAtual = Math.max(
    1,
    Math.floor(
      (new Date(dataSegura(fimMes) + "T00:00:00") -
        new Date(dataSegura(inicioMes) + "T00:00:00")) /
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
function nomeMesCartao(mesAno) {
  const nomes = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const [ano, mes] = String(mesAno || "").split("-");
  const indiceMes = Number(mes) - 1;

  if (!ano || indiceMes < 0 || indiceMes > 11) return mesAno;

  const quantidade = cartoesPendentesLiquidacao.filter(
    (entrada) =>
      String(entrada.dataPagamento || entrada.data || "").slice(0, 7) === mesAno
  ).length;

  return `${nomes[indiceMes]}/${ano} (${quantidade})`;
}
  return (
    <>
    {modalCartaoAberto && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: 20,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        background: "#081428",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 24,
      }}
    >
      <h2 style={{ marginBottom: 20 }}>
        Confirmar recebimento de cartão
      </h2>

      <div style={{ marginBottom: 12 }}>
        <strong>Cliente:</strong>{" "}
        {cartaoSelecionado?.cliente || "-"}
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Valor bruto:</strong>{" "}
        {moeda.format(Number(cartaoSelecionado?.valor || 0))}
      </div>

      <Campo
        label="Data do recebimento"
        tipo="date"
        valor={dataRecebimentoCartao}
        mudar={setDataRecebimentoCartao}
      />

      <Campo
        label="Valor líquido recebido"
        valor={valorLiquidoCartao}
        mudar={setValorLiquidoCartao}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button
          style={styles.botao}
          onClick={() => {
  confirmarRecebimentoCartao(
    cartaoSelecionado.id,
    dataRecebimentoCartao,
    valorLiquidoCartao
  );

  fecharModalReceberCartao();
}}
        >
          Confirmar
        </button>

        <button
          style={styles.botaoCinza}
          onClick={fecharModalReceberCartao}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
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
              type="text"
              placeholder="DD/MM/AAAA"
              value={inicioDigitando}
              onChange={(e) => {
                const valor = e.target.value;

                setInicioDigitando(valor);

                const dataISO = brasilParaISO(valor);

                if (dataValida(dataISO)) {
                  setInicioMes(dataISO);
                }
              }}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Fecha em
            <input
              type="text"
              placeholder="DD/MM/AAAA"
              value={fimDigitando}
              onChange={(e) => {
                const valor = e.target.value;

                setFimDigitando(valor);

                const dataISO = brasilParaISO(valor);

                if (dataValida(dataISO)) {
                  setFimMes(dataISO);
                }
              }}
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

      <Card titulo="Cartões a receber">
  <div style={styles.kpisModernos}>
    <KpiComAjuda
      titulo="Cartões Pendentes"
      valor={moeda.format(valorCartoesAReceberHoje)}
    />

    <KpiComAjuda titulo="Confirmados Hoje" valor={moeda.format(0)} />

    <KpiComAjuda titulo="Taxas Pendentes" valor={moeda.format(0)} />
  </div>

  <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
    <button
      style={mostrarCartoesAReceber ? styles.botao : styles.botaoCinza}
      onClick={() => setMostrarCartoesAReceber(!mostrarCartoesAReceber)}
    >
      {mostrarCartoesAReceber
        ? "Ocultar cartões a receber"
        : "Ver cartões a receber"}
    </button>
  </div>
</Card>

{mostrarCartoesAReceber && (
  <Card titulo="Detalhes dos cartões a receber">
    <div
  style={{
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
  <span style={{ color: "#cbd5e1" }}>
    Filtrar mês:
  </span>

  <select
    value={mesCartoesFiltro}
    onChange={(e) => setMesCartoesFiltro(e.target.value)}
    style={{
      background: "#0f172a",
      color: "#fff",
      border: "1px solid #334155",
      borderRadius: 10,
      padding: "10px 12px",
    }}
  >
    <option value="">Todos</option>

    {mesesCartoesPendentes.map((mes) => (
      <option key={mes} value={mes}>
  {nomeMesCartao(mes)}
</option>
    ))}
  </select>
</div>
    <div
  style={{
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  }}
>
  <button
  style={styles.botaoCinza}
  onClick={() => {
    if (!mesCartoesFiltro) {
      alert("Escolha um mês primeiro.");
      return;
    }

    setCartoesSelecionados(
      cartoesPendentesFiltrados.map((x) => x.id)
    );
  }}
>
  Selecionar mês
</button>
  <button
    style={styles.botaoCinza}
    onClick={() =>
        setCartoesSelecionados(
  cartoesPendentesFiltrados.map((x) => x.id)
)
    }
  >
    Selecionar todos
  </button>

  <button
    style={styles.botaoCinza}
    onClick={() => setCartoesSelecionados([])}
  >
    Limpar seleção
  </button>

  <button
  style={styles.botao}
  onClick={() => {
    if (!cartoesSelecionados.length) return;

    const confirmar = window.confirm(
      `Receber ${cartoesSelecionados.length} cartões selecionados?`
    );

    if (!confirmar) return;

    confirmarRecebimentoCartoesEmLote(cartoesSelecionados);

    setCartoesSelecionados([]);
  }}
>
  Receber selecionados ({cartoesSelecionados.length})
</button>
</div>
    {cartoesPendentesFiltrados.length === 0 ? (
      <p style={styles.vazio}>Nenhum cartão pendente de recebimento.</p>
    ) : (
      <Tabela
        colunas={[
  "",
  "Cliente",
  "Placa",
  "Produto",
  "Pagamento",
  "Previsão",
  "Valor venda",
  "Processo",
  "Ação",
]}
        dados={cartoesPendentesFiltrados
          .sort((a, b) =>
            String(a.dataPagamento || "").localeCompare(
              String(b.dataPagamento || "")
            )
          )
          .map((entrada) => [
            <input
  type="checkbox"
  checked={cartoesSelecionados.includes(entrada.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setCartoesSelecionados((old) => [...old, entrada.id]);
    } else {
      setCartoesSelecionados((old) =>
        old.filter((id) => id !== entrada.id)
      );
    }
  }}
/>,
            entrada.cliente || "-",
            entrada.placa || "-",
            entrada.produto || "-",
            entrada.formaPagamento || "-",
            dataBR(entrada.dataPagamento),
            moeda.format(Number(entrada.valor || 0)),
            entrada.processo || "-",

            <button
              key={entrada.id}
              style={styles.botao}
              onClick={() => abrirModalReceberCartao(entrada)}
            >
              Receber
            </button>,
          ])}
      />
    )}
  </Card>
)}

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
                mostrarRecebimentosAntigos ? styles.botao : styles.botaoCinza
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
                onChange={(e) => setDiasComparativo(Number(e.target.value || 1))}
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
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

              <label
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                Data Provável de Fechamento
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  Usada para calcular a projeção do período.
                </span>

                <input
                  type="date"
                  value={fechamentoProvavel}
                  onChange={(e) => {
                    const novaData = e.target.value;
                    setFechamentoProvavel(novaData);
                  }}
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
              </label>
            </div>
          )}
        </div>

        <div style={styles.kpisModernos}>
          <KpiComAjuda titulo="% Meta" valor={`${percentualMeta.toFixed(1)}%`} />

          <KpiComAjuda
            titulo="Falta para meta"
            valor={moeda.format(Math.max(faltaMeta, 0))}
          />

          <KpiComAjuda
            titulo="Meta diária necessária"
            valor={moeda.format(mediaNecessaria)}
          />

          <KpiComAjuda titulo="Projeção mês" valor={moeda.format(projecaoMes)} />
        </div>
      </Card>
    </>
  );
}