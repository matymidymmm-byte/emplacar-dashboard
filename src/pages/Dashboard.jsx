  import { useEffect, useState } from "react";
  import jsPDF from "jspdf";
  import html2canvas from "html2canvas";

  import styles from "../styles/styles.js";

  import Card from "../components/Card.jsx";
  import Kpi from "../components/Kpi.jsx";
  import GraficoLinha from "../components/GraficoLinha.jsx";
  import GraficoBarras from "../components/GraficoBarras.jsx";
  import Tabela from "../components/Tabela.jsx";
  import Campo from "../components/Campo.jsx";
  import {
    TrendingUp,
    Wallet,
    Landmark,
    BarChart3,
  } from "lucide-react";

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
    salvarInicioPeriodo,
salvarFimPeriodo,  
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
    desfazerRecebimentoCartao,
  excluirHistoricoRecebimentoCartao,


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
    const [modoDashboard, setModoDashboard] = useState("simples");

  const modoDetalhado = modoDashboard === "detalhado";
  const modoFechamento = modoDashboard === "fechamento";
    const [inicioDigitando, setInicioDigitando] = useState(
      isoParaBrasil(inicioMes)
    );
    const [fimDigitando, setFimDigitando] = useState(isoParaBrasil(fimMes));
    useEffect(() => {
  setInicioDigitando(isoParaBrasil(inicioMes));
}, [inicioMes]);

useEffect(() => {
  setFimDigitando(isoParaBrasil(fimMes));
}, [fimMes]);
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
  const [mostrarConferenciaExcel, setMostrarConferenciaExcel] = useState(false);
const [textoConferenciaExcel, setTextoConferenciaExcel] = useState("");
const [resultadoConferenciaExcel, setResultadoConferenciaExcel] = useState(null);

    const hojeSistema = new Date();
    const hojeReferencia = hojeSistema.toISOString().slice(0, 10);
    const fimAnaliseComparativo =
  hojeReferencia < fimMes ? hojeReferencia : fimMes;
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
function valorExcelParaNumero(valor) {
  const limpo = String(valor || "")
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  const resultado = Number(limpo);
  return Number.isFinite(resultado) ? resultado : 0;
}

function cabecalhoExcel(texto) {
  return normalizarTexto(texto).replace(/[^A-Z0-9]/g, "");
}

function valorReal(texto) {
  const valor = normalizarTexto(texto).trim();

  return (
    valor &&
    valor !== "NAO CONSTA" &&
    valor !== "N/A" &&
    valor !== "-"
  );
}

function lerTabelaConferencia(textoColado) {
  const linhas = String(textoColado || "")
    .split(/\r?\n/)
    .filter((linha) => linha.trim());

  if (linhas.length < 2) {
    throw new Error(
      "Cole o cabeçalho e pelo menos uma linha do Excel."
    );
  }

  const cabecalhos = linhas[0]
    .split("\t")
    .map(cabecalhoExcel);

  const indice = (...nomes) =>
    cabecalhos.findIndex((item) =>
      nomes.map(cabecalhoExcel).includes(item)
    );

  const colunas = {
    data: indice("DATA"),
    tipo: indice("TIPO"),
    cliente: indice("CLIENTE"),
    produto: indice("SERVIÇO", "SERVICO", "PRODUTO"),
    placa: indice("PLACA"),
    renavan: indice("RENAVAN"),
    formaPagamento: indice(
      "FORMA DE PAGAMENTO",
      "FORMAPAGAMENTO"
    ),
    valor: indice("VALOR"),
    status: indice("STATUS"),
    processo: indice("PROCESSO"),
    diaPago: indice("PAGO DIA", "DIAPAGO"),
    categoria: indice("CATEGORIA"),
  };

  if (colunas.data < 0 || colunas.valor < 0) {
    throw new Error(
      "O Excel precisa ter, no mínimo, as colunas DATA e VALOR."
    );
  }

  const pegar = (celulas, posicao) =>
    posicao >= 0
      ? String(celulas[posicao] || "").trim()
      : "";

  return linhas.slice(1).map((linha, posicao) => {
    const celulas = linha.split("\t");

    return {
      linhaExcel: posicao + 2,
      data: brasilParaISO(pegar(celulas, colunas.data)),
      tipo: pegar(celulas, colunas.tipo),
      cliente: pegar(celulas, colunas.cliente),
      produto: pegar(celulas, colunas.produto),
      placa: pegar(celulas, colunas.placa),
      renavan: pegar(celulas, colunas.renavan),
      formaPagamento: pegar(
        celulas,
        colunas.formaPagamento
      ),
      valor: valorExcelParaNumero(
        pegar(celulas, colunas.valor)
      ),
      status: pegar(celulas, colunas.status),
      processo: pegar(celulas, colunas.processo),
      diaPago: brasilParaISO(
        pegar(celulas, colunas.diaPago)
      ),
      categoria: pegar(celulas, colunas.categoria),
    };
  });
}

function statusConferencia(status, diaPago = "") {
  const texto = normalizarTexto(status);

  if (
    diaPago ||
    texto.includes("PAGO") ||
    texto.includes("RECEBIDO") ||
    texto.includes("QUITADO")
  ) {
    return "Pago";
  }

  return "Pendente";
}

function destinoConferencia(formaPagamento, status, diaPago = "") {
  const forma = normalizarTexto(formaPagamento);
  const situacao = statusConferencia(status, diaPago);

  if (situacao === "Pendente") {
    return "Faturado";
  }

  if (
    forma.includes("DINHEIRO") ||
    forma.includes("CHEQUE") ||
    forma.includes("CAIXA")
  ) {
    return "Caixa";
  }

  if (
    forma.includes("PIX") ||
    forma.includes("DEBITO") ||
    forma.includes("CREDITO") ||
    forma.includes("DEPOSITO") ||
    forma.includes("TRANSFERENCIA") ||
    forma.includes("BANCO")
  ) {
    return "Banco";
  }

  if (
    forma.includes("FATURADO") ||
    forma.includes("NOTA") ||
    forma.includes("BOLETO") ||
    forma.includes("PRAZO")
  ) {
    return diaPago ? "Banco" : "Faturado";
  }

  return destinoDinheiro(formaPagamento) === "Caixa"
    ? "Caixa"
    : "Banco";
}

function criarResumoDia(data) {
  return {
    data,
    quantidade: 0,
    valorTotal: 0,

    quantidadePagos: 0,
    valorPago: 0,

    quantidadePendentes: 0,
    valorPendente: 0,

    quantidadeCaixa: 0,
    valorCaixa: 0,

    quantidadeBanco: 0,
    valorBanco: 0,

    quantidadeFaturado: 0,
    valorFaturado: 0,
  };
}

function adicionarAoResumo(resumo, item, origem) {
  const valor = Number(item.valor || 0);
  const diaPago =
    origem === "excel"
      ? item.diaPago || ""
      : dataRecebimentoEntrada(item) || "";

  const situacao = statusConferencia(
    item.status,
    diaPago
  );

  const destino = destinoConferencia(
    item.formaPagamento,
    item.status,
    diaPago
  );

  resumo.quantidade += 1;
  resumo.valorTotal += valor;

  if (situacao === "Pago") {
    resumo.quantidadePagos += 1;
    resumo.valorPago += valor;
  } else {
    resumo.quantidadePendentes += 1;
    resumo.valorPendente += valor;
  }

  if (destino === "Caixa") {
    resumo.quantidadeCaixa += 1;
    resumo.valorCaixa += valor;
  }

  if (destino === "Banco") {
    resumo.quantidadeBanco += 1;
    resumo.valorBanco += valor;
  }

  if (destino === "Faturado") {
    resumo.quantidadeFaturado += 1;
    resumo.valorFaturado += valor;
  }
}

function resumirPorDia(lista, origem) {
  const mapa = {};

  lista.forEach((item) => {
    if (!item.data) return;

    if (!mapa[item.data]) {
      mapa[item.data] = criarResumoDia(item.data);
    }

    adicionarAoResumo(mapa[item.data], item, origem);
  });

  return mapa;
}

function compararNumero(
  divergencias,
  nome,
  valorExcel,
  valorSistema,
  tipo = "quantidade"
) {
  const excel = Number(valorExcel || 0);
  const sistema = Number(valorSistema || 0);

  if (Math.abs(excel - sistema) <= 0.009) return;

  divergencias.push({
    nome,
    excel:
      tipo === "valor"
        ? moeda.format(excel)
        : excel,
    sistema:
      tipo === "valor"
        ? moeda.format(sistema)
        : sistema,
  });
}

function compararResumoDia(excel, sistema) {
  const divergencias = [];

  compararNumero(
    divergencias,
    "Quantidade de lançamentos",
    excel.quantidade,
    sistema.quantidade
  );

  compararNumero(
    divergencias,
    "Valor total",
    excel.valorTotal,
    sistema.valorTotal,
    "valor"
  );

  compararNumero(
    divergencias,
    "Quantidade paga",
    excel.quantidadePagos,
    sistema.quantidadePagos
  );

  compararNumero(
    divergencias,
    "Valor pago",
    excel.valorPago,
    sistema.valorPago,
    "valor"
  );

  compararNumero(
    divergencias,
    "Quantidade pendente",
    excel.quantidadePendentes,
    sistema.quantidadePendentes
  );

  compararNumero(
    divergencias,
    "Valor pendente",
    excel.valorPendente,
    sistema.valorPendente,
    "valor"
  );

  compararNumero(
    divergencias,
    "Quantidade no Caixa",
    excel.quantidadeCaixa,
    sistema.quantidadeCaixa
  );

  compararNumero(
    divergencias,
    "Valor no Caixa",
    excel.valorCaixa,
    sistema.valorCaixa,
    "valor"
  );

  compararNumero(
    divergencias,
    "Quantidade no Banco",
    excel.quantidadeBanco,
    sistema.quantidadeBanco
  );

  compararNumero(
    divergencias,
    "Valor no Banco",
    excel.valorBanco,
    sistema.valorBanco,
    "valor"
  );

  compararNumero(
    divergencias,
    "Quantidade faturada",
    excel.quantidadeFaturado,
    sistema.quantidadeFaturado
  );

  compararNumero(
    divergencias,
    "Valor faturado",
    excel.valorFaturado,
    sistema.valorFaturado,
    "valor"
  );

  return divergencias;
}

function executarConferenciaExcel() {
  try {
    const linhasExcel = lerTabelaConferencia(
      textoConferenciaExcel
    );

    const datasInformadas = linhasExcel
      .map((item) => item.data)
      .filter(Boolean)
      .sort();

    if (datasInformadas.length === 0) {
      throw new Error(
        "Nenhuma data válida foi encontrada na tabela."
      );
    }

    const primeiraData = datasInformadas[0];
    const ultimaData = datasInformadas[datasInformadas.length - 1];

    const candidatosSistema = entradas.filter((entrada) =>
  dentroDoPeriodo(entrada.data)
);

    const resumoExcel = resumirPorDia(
      linhasExcel,
      "excel"
    );

    const resumoSistema = resumirPorDia(
      candidatosSistema,
      "sistema"
    );

    const todasAsDatas = [
      ...new Set([
        ...Object.keys(resumoExcel),
        ...Object.keys(resumoSistema),
      ]),
    ].sort();

    const diasCorretos = [];
    const diasDivergentes = [];

    todasAsDatas.forEach((data) => {
      const excel =
        resumoExcel[data] || criarResumoDia(data);

      const sistema =
        resumoSistema[data] || criarResumoDia(data);

      const divergencias = compararResumoDia(
        excel,
        sistema
      );

      if (divergencias.length === 0) {
        diasCorretos.push({
          data,
          excel,
          sistema,
        });
      } else {
        diasDivergentes.push({
          data,
          excel,
          sistema,
          divergencias,
        });
      }
    });

    setResultadoConferenciaExcel({
      totalExcel: linhasExcel.length,
      totalSistema: candidatosSistema.length,
      diasCorretos,
      diasDivergentes,
      primeiraData,
      ultimaData,
    });
  } catch (erro) {
    alert(
      erro.message ||
        "Não foi possível conferir a tabela."
    );
  }
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
      .filter((entrada) => entrada.dataLiquidacao);

    const cartoesPendentesLiquidacao = entradas
    .filter((entrada) => entrada.status === "Pago" || entrada.status === "Pendente")
    .filter((entrada) => !ehInjecaoOuAporte(entrada))
    .filter((entrada) => ehCartaoBanco(entrada.formaPagamento))
    .filter((entrada) => !entrada.historicoCartaoOculto)
    .map((entrada) => ({
      ...entrada,
      dataPagamento: dataRecebimentoEntrada(entrada) || entrada.data,
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
    const valorCartoesAReceberHoje = cartoesPendentesLiquidacao
    .filter((entrada) => !entrada.recebimentoCartaoConfirmado)
    .reduce((soma, entrada) => soma + Number(entrada.valor || 0), 0);

  const quantidadeCartoesPendentes = cartoesPendentesLiquidacao.filter(
  (entrada) => !entrada.recebimentoCartaoConfirmado
).length;

const valorRecebidoHoje = cartoesAReceberHoje.reduce(
  (soma, entrada) =>
    soma + Number(entrada.valorLiquidoRecebido || entrada.valor || 0),
  0
);

const quantidadeRecebidosHoje = cartoesAReceberHoje.length;

const valorCartoesAReceberAmanha = cartoesAReceberAmanha.reduce(
  (soma, entrada) =>
    soma + Number(entrada.valorLiquidoRecebido || entrada.valor || 0),
  0
);

const quantidadeCartoesAmanha = cartoesAReceberAmanha.length;

const valorCartoesAReceberProximosDias = cartoesAReceberProximosDias.reduce(
  (soma, entrada) =>
    soma + Number(entrada.valorLiquidoRecebido || entrada.valor || 0),
  0
);

    const cartoesPagosAntesELiquidadosNoPeriodo = entradas
  .filter((entrada) => {
    if (ehInjecaoOuAporte(entrada)) return false;
    if (!ehCartaoBanco(entrada.formaPagamento)) return false;
    if (!entrada.recebimentoCartaoConfirmado) return false;

    const vendaFoiDoPeriodoPassado =
      entrada.data && !dentroDoPeriodo(entrada.data);

    const liquidacaoFoiNoPeriodoAtual =
      entrada.dataRecebimentoCartao &&
      dentroDoPeriodo(entrada.dataRecebimentoCartao);

    return vendaFoiDoPeriodoPassado && liquidacaoFoiNoPeriodoAtual;
  })
  .reduce(
    (soma, entrada) => soma + Number(entrada.valor || 0),
    0
  );
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

    const recebimentosAntigosDetalhados = [
  ...(indicadores.recebimentosAntigosDetalhados || []),
].sort((a, b) =>
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

    function KpiComAjuda({ titulo, valor, subtitulo = "" }) {
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

          <Kpi
  titulo={titulo}
  valor={valor}
  subtitulo={subtitulo}
/>
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
      
      
    ];

    const kpisDetalhados = [
      ["Faturamento", receitaOperacional],
      ["Entradas à Vista", indicadores.entradasVistaTotal || 0],
      ["Recebimentos Antigos", indicadores.recebimentosAntigos || 0],
      ["Cartões Antigos Recebidos", cartoesPagosAntesELiquidadosNoPeriodo || 0],
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
      
      ["Recuperação Vale", indicadores.recuperacaoValeTotal || 0],
      ["Vale Concedido", indicadores.valeConcedidoTotal || 0],
      ["Vale em Aberto", indicadores.valeEmAbertoTotal || 0],
    ];

    const kpis = modoDetalhado ? kpisDetalhados : kpisSimples;
    const fechamentoFaturamento = [
    ["Faturamento Total", indicadores.faturamentoCompetencia || receitaOperacional || 0],
    ["Notas em Aberto", indicadores.faturadoEmAberto || 0],
    ["Recebidos à Vista", indicadores.entradasVistaTotal || 0],
    ["Recebidos Antigos", indicadores.recebimentosAntigos || 0],
  ];

  const fechamentoCaixa = [
    ["Total Entrou no Caixa", indicadores.recebidoCaixa || 0],
    ["Saídas no Caixa", indicadores.saidasCaixa || 0],
    ["Depósitos para Banco", indicadores.totalCaixaParaBanco || 0],
    ["Saldo Caixa", indicadores.tenhoNoCaixa || 0],
  ];

  const fechamentoBanco = [
    ["Total Entrou no Banco", indicadores.recebidoBanco || 0],
    ["Saídas no Banco", indicadores.saidasBanco || 0],
    ["Recebido do Caixa", indicadores.totalCaixaParaBanco || 0],
    ["Saldo Banco", indicadores.tenhoNoBanco || 0],
  ];

  const fechamentoResultado = [
    ["Saídas Totais", indicadores.saidasTotal || 0],
    ["Lucro Operacional", indicadores.entradaLiquida || 0],
  ];

    const fimSemanaAtual = fimAnaliseComparativo;
const inicioSemanaAtual = adicionarDias(fimSemanaAtual, -6);

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

    const fimMesAnterior = ultimoFechamento?.fim || "";

const quantidadeDiasDecorridosComparativo = Math.max(
  1,
  Math.floor(
    (new Date(dataSegura(fimAnaliseComparativo) + "T00:00:00") -
      new Date(dataSegura(inicioMes) + "T00:00:00")) /
      (1000 * 60 * 60 * 24)
  ) + 1
);

const fimMesAnteriorCalculado = inicioMesAnterior
  ? adicionarDias(
      inicioMesAnterior,
      quantidadeDiasDecorridosComparativo - 1
    )
  : "";

const fimMesAnteriorComparativo =
  fimMesAnterior &&
  fimMesAnteriorCalculado > fimMesAnterior
    ? fimMesAnterior
    : fimMesAnteriorCalculado;

    const vendaMesAtual = somarEntradasPeriodo(
  inicioMes,
  fimAnaliseComparativo
);

    const vendaMesAnterior =
      inicioMesAnterior && fimMesAnteriorComparativo
        ? somarEntradasPeriodo(inicioMesAnterior, fimMesAnteriorComparativo)
        : 0;

    const variacaoMes = calcularVariacao(vendaMesAtual, vendaMesAnterior);

   const mediaDiariaComparativo =
  vendaMesAtual / quantidadeDiasDecorridosComparativo;

const quantidadeDiasTotaisPeriodoComparativo = Math.max(
  1,
  Math.floor(
    (new Date(dataSegura(fimMes) + "T00:00:00") -
      new Date(dataSegura(inicioMes) + "T00:00:00")) /
      (1000 * 60 * 60 * 24)
  ) + 1
);

const diasRestantesComparativo = Math.max(
  0,
  quantidadeDiasTotaisPeriodoComparativo -
    quantidadeDiasDecorridosComparativo
);

const diasJanelaRecente = Math.min(
  7,
  quantidadeDiasDecorridosComparativo
);

const inicioUltimos7DiasComparativo = adicionarDias(
  fimAnaliseComparativo,
  -(diasJanelaRecente - 1)
);

const vendaUltimos7DiasComparativo = somarEntradasPeriodo(
  inicioUltimos7DiasComparativo,
  fimAnaliseComparativo
);

const mediaDiariaRecente =
  vendaUltimos7DiasComparativo / diasJanelaRecente;

let mediaDiariaProjetada =
  mediaDiariaComparativo * 0.4 +
  mediaDiariaRecente * 0.6;

// Evita distorções por dias extremamente fora da curva
const limiteSuperior = mediaDiariaComparativo * 1.5;
const limiteInferior = mediaDiariaComparativo * 0.5;

mediaDiariaProjetada = Math.min(
  limiteSuperior,
  Math.max(limiteInferior, mediaDiariaProjetada)
);

const projecaoRitmoMes =
  vendaMesAtual +
  mediaDiariaProjetada * diasRestantesComparativo;
  const diferencaMetaProjetada = projecaoRitmoMes - metaMensal;

const bateMetaProjetada = diferencaMetaProjetada >= 0;
const percentualMetaProjetada =
  metaMensal > 0
    ? Math.min(
        100,
        Math.max(
          0,
          (projecaoRitmoMes / metaMensal) * 100
        )
      )
    : 0;
  const confiancaProjecao = Math.min(
  100,
  Math.round(
    (quantidadeDiasDecorridosComparativo /
      quantidadeDiasTotaisPeriodoComparativo) *
      100
  )
);
const nivelConfiancaProjecao =
  confiancaProjecao < 30
    ? "Baixa"
    : confiancaProjecao < 70
    ? "Moderada"
    : "Alta";

    function CardComparativo({
      destaque = false,
  titulo,
  descricao,
  periodoAtual,
  periodoAnterior,
  atual,
  anterior,
  variacao,
  rotuloAtual,
  rotuloAnterior,
  rotuloVariacao,
  maturidadeProjecao,
nivelMaturidadeProjecao,meta,
diferencaMeta,
bateMeta,
percentualMeta,
}) {
      return (
        <div
  style={{
    ...styles.card,
    border: destaque
      ? "1px solid rgba(59,130,246,0.30)"
      : styles.card.border,
    boxShadow: destaque
      ? "0 0 30px rgba(59,130,246,0.12)"
      : styles.card.boxShadow,
  }}
>
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
<div
  style={{
    display: destaque ? "grid" : "block",
    gridTemplateColumns: destaque
      ? "repeat(2, minmax(180px,1fr))"
      : undefined,
    gap: destaque ? 24 : 0,
  }}
>
  <p style={{ color: "#cbd5e1", marginBottom: 6 }}>
    <strong>{rotuloAtual || "Atual"}:</strong>
    <br />
    <span style={{ fontSize: 12, color: "#94a3b8" }}>
      {periodoAtual}
    </span>
    <br />
    {moeda.format(atual)}
  </p>

  <p style={{ color: "#cbd5e1", marginBottom: 6 }}>
    <strong>{rotuloAnterior || "Anterior"}:</strong>
    <br />
    <span style={{ fontSize: 12, color: "#94a3b8" }}>
      {periodoAnterior}
    </span>
    <br />
    {moeda.format(anterior)}
  </p>
</div>
{typeof meta === "number" && (
  <div
    style={{
      marginBottom: 14,
      padding: "12px",
      borderRadius: 10,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(148,163,184,0.15)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 12,
            marginBottom: 3,
          }}
        >
          Meta do período
        </div>

        <strong
          style={{
            color: "#e2e8f0",
            fontSize: 15,
          }}
        >
          {moeda.format(meta)}
        </strong>
      </div>

      <strong
        style={{
          color: bateMeta ? "#22c55e" : "#f59e0b",
          fontSize: 18,
        }}
      >
        {Number(percentualMeta || 0).toFixed(1)}%
      </strong>
    </div>

    <div
      style={{
        width: "100%",
        height: 7,
        background: "rgba(148,163,184,0.15)",
        borderRadius: 999,
        overflow: "hidden",
        marginBottom: 9,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, percentualMeta || 0))}%`,
          height: "100%",
          background: bateMeta ? "#22c55e" : "#f59e0b",
          borderRadius: 999,
        }}
      />
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span
        style={{
          color: bateMeta ? "#22c55e" : "#f59e0b",
          fontSize: 12,
        }}
      >
        {bateMeta ? "Acima da meta" : "Para atingir a meta"}
      </span>

      <strong
        style={{
          color: bateMeta ? "#22c55e" : "#f59e0b",
          fontSize: 13,
        }}
      >
        {moeda.format(Math.abs(diferencaMeta || 0))}
      </strong>
    </div>
  </div>
)}

          <div>
  {rotuloVariacao && (
    <div
      style={{
        color: "#94a3b8",
        fontSize: 12,
        marginBottom: 4,
      }}
    >
      {rotuloVariacao}
    </div>
  )}

  <strong
    style={{
      color: corVariacao(variacao),
      fontSize: 24,
    }}
  >
    {textoVariacao(variacao)}
  </strong>
</div>
{typeof maturidadeProjecao === "number" && (
  <div
    style={{
      marginTop: 16,
      paddingTop: 14,
      borderTop: "1px solid rgba(148, 163, 184, 0.15)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <span
        style={{
          color: "#94a3b8",
          fontSize: 12,
        }}
      >
        Maturidade da projeção
      </span>

      <strong
        style={{
          color: "#e2e8f0",
          fontSize: 13,
        }}
      >
        {maturidadeProjecao}%
      </strong>
    </div>

    <div
      style={{
        width: "100%",
        height: 7,
        background: "rgba(148, 163, 184, 0.15)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${maturidadeProjecao}%`,
          height: "100%",
          background:
            maturidadeProjecao < 30
              ? "#ef4444"
              : maturidadeProjecao < 70
              ? "#f59e0b"
              : "#22c55e",
          borderRadius: 999,
        }}
      />
    </div>

    <div
      style={{
        marginTop: 7,
        color: "#cbd5e1",
        fontSize: 12,
      }}
    >
      Maturidade {nivelMaturidadeProjecao?.toLowerCase()}
    </div>
  </div>
)}
        </div>  
      );
      
  }
function CardRitmoMes({
  periodoAtual,
  periodoProjecao,
  faturado,
  projecao,
  meta = 0,
  diferencaMeta = 0,
  bateMeta = false,
  percentualMeta = 0,
  variacao = 0,
  maturidadeProjecao = 0,
  nivelMaturidadeProjecao = "Baixa",
}) {
  const percentualMetaSeguro = Math.min(
    100,
    Math.max(0, Number(percentualMeta || 0))
  );

  const maturidadeSegura = Math.min(
    100,
    Math.max(0, Number(maturidadeProjecao || 0))
  );

  const corMeta = bateMeta ? "#22c55e" : "#f59e0b";

  const corMaturidade =
    maturidadeSegura < 30
      ? "#ef4444"
      : maturidadeSegura < 70
      ? "#f59e0b"
      : "#22c55e";

  const textoCrescimento =
    variacao > 0
      ? `+${Number(variacao).toFixed(1)}%`
      : `${Number(variacao).toFixed(1)}%`;

  const estiloKpi = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(148,163,184,0.15)",
    borderRadius: 14,
    padding: 18,
    minWidth: 0,
  };

  return (
    <div
      style={{
        ...styles.card,
        border: "1px solid rgba(59,130,246,0.30)",
        boxShadow: "0 0 30px rgba(59,130,246,0.12)",
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              color: "#fff",
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            Ritmo do mês
          </h3>

          <p
            style={{
              color: "#94a3b8",
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              maxWidth: 700,
            }}
          >
            Mantendo o ritmo atual de vendas, esta é a projeção estimada para
            o fechamento do período financeiro.
          </p>
        </div>

        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: `${corMaturidade}18`,
            border: `1px solid ${corMaturidade}55`,
            color: corMaturidade,
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          Confiança {nivelMaturidadeProjecao}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 16,
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <div style={estiloKpi}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Faturado até hoje
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 11,
            }}
          >
            {periodoAtual}
          </div>

          <strong
            style={{
              display: "block",
              color: "#f8fafc",
              fontSize: 22,
              marginTop: 10,
              overflowWrap: "anywhere",
            }}
          >
            {moeda.format(Number(faturado || 0))}
          </strong>
        </div>

        <div style={estiloKpi}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Projeção de fechamento
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 11,
            }}
          >
            {periodoProjecao}
          </div>

          <strong
            style={{
              display: "block",
              color: "#38bdf8",
              fontSize: 22,
              marginTop: 10,
              overflowWrap: "anywhere",
            }}
          >
            {moeda.format(Number(projecao || 0))}
          </strong>
        </div>

        <div style={estiloKpi}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Meta do período
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 11,
            }}
          >
            Meta configurada
          </div>

          <strong
            style={{
              display: "block",
              color: "#f8fafc",
              fontSize: 22,
              marginTop: 10,
              overflowWrap: "anywhere",
            }}
          >
            {moeda.format(Number(meta || 0))}
          </strong>
        </div>

        <div style={estiloKpi}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            {bateMeta ? "Acima da meta" : "Falta para a meta"}
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 11,
            }}
          >
            Pela projeção atual
          </div>

          <strong
            style={{
              display: "block",
              color: corMeta,
              fontSize: 22,
              marginTop: 10,
              overflowWrap: "anywhere",
            }}
          >
            {moeda.format(Math.abs(Number(diferencaMeta || 0)))}
          </strong>
        </div>

        <div style={estiloKpi}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Crescimento
          </div>

          <div
            style={{
              color: "#64748b",
              fontSize: 11,
            }}
          >
            Mesmo ponto do período anterior
          </div>

          <strong
            style={{
              display: "block",
              color: corVariacao(variacao),
              fontSize: 22,
              marginTop: 10,
            }}
          >
            {textoCrescimento}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(148,163,184,0.12)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Projeção em relação à meta
            </span>

            <strong
              style={{
                color: corMeta,
                fontSize: 14,
              }}
            >
              {Number(percentualMeta || 0).toFixed(1)}%
            </strong>
          </div>

          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 999,
              background: "rgba(148,163,184,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${percentualMetaSeguro}%`,
                height: "100%",
                borderRadius: 999,
                background: corMeta,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 9,
              color: "#cbd5e1",
              fontSize: 12,
            }}
          >
            {bateMeta
              ? "A projeção indica fechamento acima da meta."
              : "A projeção ainda está abaixo da meta configurada."}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(148,163,184,0.12)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Maturidade da projeção
            </span>

            <strong
              style={{
                color: corMaturidade,
                fontSize: 14,
              }}
            >
              {maturidadeSegura}%
            </strong>
          </div>

          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 999,
              background: "rgba(148,163,184,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${maturidadeSegura}%`,
                height: "100%",
                borderRadius: 999,
                background: corMaturidade,
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 9,
              color: "#cbd5e1",
              fontSize: 12,
            }}
          >
            Quanto mais próximo do fechamento, mais confiável fica a
            estimativa.
          </div>
        </div>
      </div>
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
  function TituloFechamento({ icone: Icone, titulo, subtitulo, cor = "#38bdf8" }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: `${cor}22`,
            border: `1px solid ${cor}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 18px ${cor}33`,
          }}
        >
          <Icone size={18} color={cor} />
        </div>

        <div>
          <div style={{ color: "#f8fafc", fontWeight: 900 }}>
            {titulo}
          </div>

          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
            {subtitulo}
          </div>
        </div>
      </div>
    );
  }
  function CardFechamento({ titulo, linhas = [], totalLabel = "", totalValor = 0 }) {
    return (
      <Card titulo={titulo}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {linhas.map((linha, index) => (
            <div
              key={`${linha.label}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                padding: "10px 0",
                borderBottom: "1px solid rgba(148,163,184,0.16)",
                color: linha.negativo
    ? "#fca5a5"
    : linha.label === "Recebido Total"
    ? "#22c55e"
    : "#cbd5e1",

  fontSize:
    linha.label === "Recebido Total"
      ? 16
      : 15,

  fontWeight:
    linha.label === "Recebido Total"
      ? 800
      : 600,
              }}
            >
              <span>{linha.label}</span>
              <span>{moeda.format(linha.valor || 0)}</span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              marginTop: 8,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.24)",
              color: "#f8fafc",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            <span>{totalLabel}</span>
            <span>{moeda.format(totalValor || 0)}</span>
          </div>
        </div>
      </Card>
    );
  }

  function PainelFechamento() {
  const linhasFaturamento = [
    {
      label: "Movimentação Total",
      valor: indicadores.movimentacaoGeral || 0,
    },
    {
      label: "Recebido Total",
      valor:
        Number(indicadores.aporteTotal || 0) +
        Number(indicadores.recebimentosAntigos || 0) +
        Number(indicadores.entradasVistaTotal || 0),
    },
  
    {
    label: "Faturamento Bruto",
    valor: indicadores.faturamentoCompetencia || receitaOperacional || 0,
  },
    {
      label: "Recebidos à Vista",
      valor: indicadores.entradasVistaTotal || 0,
    },
    {
      label: "Recebidos Antigos",
      valor: indicadores.recebimentosAntigos || 0,
    },
    {
      label: "Aportes",
      valor: indicadores.aporteTotal || 0,
    },
    {
      label: "Notas em Aberto",
      valor: indicadores.faturadoEmAberto || 0,
      negativo: true,
    },
  ];

  const faturamentoLiquidoFechamento =
    Number(indicadores.faturamentoCompetencia || receitaOperacional || 0) -
    Number(indicadores.faturadoEmAberto || 0);

  const linhasCaixa = [
    {
      label: "Entrou no Caixa",
      valor: indicadores.recebidoCaixa || 0,
    },
    {
      label: "(-) Saídas no Caixa",
      valor: indicadores.saidasCaixa || 0,
      negativo: true,
    },
    {
      label: "(-) Depósitos para Banco",
      valor: indicadores.totalCaixaParaBanco || 0,
      negativo: true,
    },
  ];

  const linhasBanco = [
    {
      label: "Entrou no Banco",
      valor: indicadores.recebidoBanco || 0,
    },
    {
  label: "Cartões recebidos do período passado",
  valor: cartoesPagosAntesELiquidadosNoPeriodo || 0,
},
    {
      label: "(+) Recebido do Caixa",
      valor: indicadores.totalCaixaParaBanco || 0,
    },
    {
      label: "(-) Saídas no Banco",
      valor: indicadores.saidasBanco || 0,
      negativo: true,
    },
  ];
  const saidasFinanceirasTotais = dadosPeriodo.saidas.reduce(
    (soma, saida) => soma + Number(saida.valor || 0),
    0
  );
  const linhasResultado = [
    {
      label: "Faturamento Total",
      valor: indicadores.faturamentoCompetencia || receitaOperacional || 0,
    },
    {
      label: "(-) Saídas Totais",
      valor: indicadores.saidasTotal || 0,
      negativo: true,
    },
    {
      label: "(-) Notas em Aberto",
      valor: indicadores.faturadoEmAberto || 0,
      negativo: true,
    },
  ];

    return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card titulo="Painel de Conferência de Fechamento">
        <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 16,
    }}
  >
    <div>
      <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
        Período do Fechamento
      </p>

      <h2 style={{ color: "#fff", margin: "6px 0 0" }}>
        {dataBR(inicioMes)} até {dataBR(fimAnalise)}
      </h2>
    </div>

    <div>
      <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
        Saldo Caixa + Banco
      </p>

      <h2 style={{ color: "#22c55e", margin: "6px 0 0" }}>
        {moeda.format(
          Number(indicadores.tenhoNoCaixa || 0) +
            Number(indicadores.tenhoNoBanco || 0)
        )}
      </h2>
    </div>

    <div>
      <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
        Saídas Financeiras Totais
      </p>

      <h2 style={{ color: "#ef4444", margin: "6px 0 0" }}>
        {moeda.format(saidasFinanceirasTotais || 0)}
      </h2>
    </div>

    <div>
      <p style={{ color: "#94a3b8", margin: 0, fontSize: 13 }}>
        Saldo do Fechamento
      </p>

      <h2 style={{ color: "#38bdf8", margin: "6px 0 0" }}>
        {moeda.format(indicadores.entradaLiquida || 0)}
      </h2>
    </div>
  </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
          gap: 22,
        }}
      >
        <CardFechamento
    titulo={
      <TituloFechamento
        icone={TrendingUp}
        titulo="Faturamento"
        subtitulo="Vendas, recebidos e notas abertas"
        cor="#38bdf8"
      />
    }
    linhas={linhasFaturamento}
    totalLabel="Faturamento Líquido"
    totalValor={faturamentoLiquidoFechamento}
  />

  <CardFechamento
    titulo={
      <TituloFechamento
        icone={Wallet}
        titulo="Caixa"
        subtitulo="Entradas, saídas e depósitos"
        cor="#22c55e"
      />
    }
    linhas={linhasCaixa}
    totalLabel="Saldo Caixa"
    totalValor={indicadores.tenhoNoCaixa || 0}
  />

  <CardFechamento
    titulo={
      <TituloFechamento
        icone={Landmark}
        titulo="Banco"
        subtitulo="Recebimentos, depósitos e saídas"
        cor="#f59e0b"
      />
    }
    linhas={linhasBanco}
    totalLabel="Saldo Banco"
    totalValor={indicadores.tenhoNoBanco || 0}
  />

  <CardFechamento
    titulo={
      <TituloFechamento
        icone={BarChart3}
        titulo="Resultado"
        subtitulo="Resumo do fechamento financeiro"
        cor="#8b5cf6"
      />
    }
    linhas={linhasResultado}
    totalLabel="Saldo do Fechamento"
    totalValor={indicadores.entradaLiquida || 0}
  />
      </div>
      <Card titulo="Conferência por Excel">
  <p style={{ color: "#94a3b8", marginTop: 0, lineHeight: 1.5 }}>
    Cole a tabela do início do período até hoje. Esta ferramenta apenas
    compara os dados e não salva nem altera lançamentos.
  </p>

  {!mostrarConferenciaExcel ? (
    <button
      type="button"
      style={{
        ...styles.botaoDashboard,
        background: "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
      }}
      onClick={() => setMostrarConferenciaExcel(true)}
    >
      Abrir Conferência por Excel
    </button>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <textarea
        value={textoConferenciaExcel}
        onChange={(e) => {
          setTextoConferenciaExcel(e.target.value);
          setResultadoConferenciaExcel(null);
        }}
        placeholder="Cole aqui o cabeçalho e as linhas copiadas do Excel..."
        style={{
          ...styles.input,
          width: "100%",
          minHeight: 180,
          resize: "vertical",
          fontFamily: "monospace",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          style={{
            ...styles.botaoDashboard,
            background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
          }}
          onClick={executarConferenciaExcel}
        >
          Conferir Agora
        </button>

        <button
          type="button"
          style={styles.botaoDashboard}
          onClick={() => {
            setTextoConferenciaExcel("");
            setResultadoConferenciaExcel(null);
          }}
        >
          Limpar
        </button>

        <button
          type="button"
          style={styles.botaoDashboard}
          onClick={() => setMostrarConferenciaExcel(false)}
        >
          Fechar Janela
        </button>
      </div>

      {resultadoConferenciaExcel && (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        border: `1px solid ${
          resultadoConferenciaExcel.diasDivergentes.length === 0
            ? "rgba(34,197,94,0.55)"
            : "rgba(245,158,11,0.55)"
        }`,
        background:
          resultadoConferenciaExcel.diasDivergentes.length === 0
            ? "rgba(34,197,94,0.10)"
            : "rgba(245,158,11,0.10)",
      }}
    >
      <strong style={{ color: "#fff", fontSize: 17 }}>
        {resultadoConferenciaExcel.diasDivergentes.length === 0
          ? "Tudo bate — conferência concluída"
          : "Conferência concluída com diferenças"}
      </strong>

      <div style={{ color: "#cbd5e1", marginTop: 8 }}>
        {resultadoConferenciaExcel.diasCorretos.length} dias corretos ·{" "}
        {resultadoConferenciaExcel.diasDivergentes.length} dias com diferenças
      </div>

      <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 13 }}>
        Período conferido:{" "}
        {dataBR(resultadoConferenciaExcel.primeiraData)} até{" "}
        {dataBR(resultadoConferenciaExcel.ultimaData)}
      </div>
    </div>

    {resultadoConferenciaExcel.diasCorretos.length > 0 && (
      <div>
        <h4 style={{ color: "#22c55e", marginBottom: 10 }}>
          Dias que estão corretos
        </h4>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {resultadoConferenciaExcel.diasCorretos.map((item) => (
            <div
              key={`correto-${item.data}`}
              style={{
                padding: "9px 12px",
                borderRadius: 10,
                color: "#bbf7d0",
                background: "rgba(34,197,94,0.10)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              {dataBR(item.data)} — {item.excel.quantidade} lançamentos —{" "}
              {moeda.format(item.excel.valorTotal)}
            </div>
          ))}
        </div>
      </div>
    )}

    {resultadoConferenciaExcel.diasDivergentes.length > 0 && (
      <div>
        <h4 style={{ color: "#f59e0b", marginBottom: 10 }}>
          Dias com diferenças
        </h4>

        {resultadoConferenciaExcel.diasDivergentes.map((item) => (
          <div
            key={`divergente-${item.data}`}
            style={{
              padding: 14,
              marginBottom: 10,
              borderRadius: 12,
              background: "rgba(15,23,42,0.75)",
              border: "1px solid rgba(245,158,11,0.30)",
            }}
          >
            <strong style={{ color: "#fff", fontSize: 16 }}>
              {dataBR(item.data)}
            </strong>

            <div
              style={{
                color: "#94a3b8",
                marginTop: 6,
                marginBottom: 10,
                fontSize: 13,
              }}
            >
              Excel: {item.excel.quantidade} lançamentos —{" "}
              {moeda.format(item.excel.valorTotal)}
              {" · "}
              Sistema: {item.sistema.quantidade} lançamentos —{" "}
              {moeda.format(item.sistema.valorTotal)}
            </div>

            {item.divergencias.map((divergencia, indice) => (
              <div
                key={`${item.data}-${indice}`}
                style={{
                  color: "#fbbf24",
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop:
                    indice === 0
                      ? "none"
                      : "1px solid rgba(148,163,184,0.12)",
                }}
              >
                <strong>{divergencia.nome}:</strong>{" "}
                Excel {divergencia.excel} / Sistema {divergencia.sistema}
              </div>
            ))}
          </div>
        ))}
      </div>
    )}
  </div>
)}
    </div>
  )}
</Card>
    </div>
  );
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
      background:
        modoDashboard === "simples"
          ? "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)"
          : "#334155",
    }}
    onClick={() => setModoDashboard("simples")}
  >
    Simples
  </button>

  <button
    style={{
      ...styles.botaoDashboard,
      background:
        modoDashboard === "detalhado"
          ? "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)"
          : "#334155",
    }}
    onClick={() => setModoDashboard("detalhado")}
  >
    Detalhado
  </button>

  <button
    style={{
      ...styles.botaoDashboard,
      background:
        modoDashboard === "fechamento"
          ? "linear-gradient(135deg,#16a34a 0%,#15803d 100%)"
          : "#334155",
    }}
    onClick={() => setModoDashboard("fechamento")}
  >
    Fechamento
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
  salvarInicioPeriodo(dataISO);
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
  salvarFimPeriodo(dataISO);
}
                }}
                style={styles.input}
              />
            </label>
          </div>
        </Card>

        {modoFechamento ? (
    <PainelFechamento />
  ) : (
    <div style={styles.kpisModernos}>
      {kpis.map(([titulo, valor]) => (
        <KpiComAjuda
          key={titulo}
          titulo={titulo}
          valor={moeda.format(valor)}
        />
      ))}
    </div>
  )}

        <Card titulo="Cartões a receber">
    <div style={styles.kpisModernos}>
      <KpiComAjuda
  titulo="Cartões Pendentes"
  valor={moeda.format(valorCartoesAReceberHoje)}
  subtitulo={`${quantidadeCartoesPendentes} cartões`}
/>

<KpiComAjuda
  titulo="Recebidos Hoje"
  valor={moeda.format(valorRecebidoHoje)}
  subtitulo={`${quantidadeRecebidosHoje} cartões`}
/>

<KpiComAjuda
  titulo="Próximo Recebimento"
  valor={moeda.format(valorCartoesAReceberAmanha)}
  subtitulo={`${quantidadeCartoesAmanha} cartões previstos`}
/>
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
    <button
      style={{
        ...styles.botaoCinza,
        background: "#7f1d1d",
      }}
      onClick={() => {
        if (!cartoesSelecionados.length) {
          alert("Selecione pelo menos um cartão.");
          return;
        }

        const confirmar = window.confirm(
          `Excluir histórico de ${cartoesSelecionados.length} cartões selecionados?`
        );

        if (!confirmar) return;

        cartoesSelecionados.forEach((id) => {
          excluirHistoricoRecebimentoCartao(id);
        });

        setCartoesSelecionados([]);
      }}
    >
      Excluir histórico selecionados ({cartoesSelecionados.length})
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
      "Data da venda",
"Recebido em",
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
                dataBR(entrada.data),
entrada.recebimentoCartaoConfirmado
  ? dataBR(entrada.dataRecebimentoCartao)
  : "-",
                moeda.format(Number(entrada.valor || 0)),
                entrada.processo || "-",
    <div
      key={entrada.id}
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      {!entrada.recebimentoCartaoConfirmado ? (
        <button
          style={styles.botao}
          onClick={() => abrirModalReceberCartao(entrada)}
        >
          Receber
        </button>
      ) : (
        <>
          <span
            style={{
              color: "#22c55e",
              fontWeight: 700,
              alignSelf: "center",
            }}
          >
            ✔ Recebido
          </span>

          <button
            style={styles.botaoCinza}
            onClick={() => desfazerRecebimentoCartao(entrada.id)}
          >
            Desfazer
          </button>

          <button
            style={{
              ...styles.botaoCinza,
              background: "#7f1d1d",
            }}
            onClick={() =>
              excluirHistoricoRecebimentoCartao(entrada.id)
            }
          >
            Excluir histórico
          </button>
        </>
      )}
    </div>
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
              
 <CardRitmoMes
  periodoAtual={`${dataBR(inicioMes)} a ${dataBR(
    fimAnaliseComparativo
  )}`}
  periodoProjecao={`${dataBR(inicioMes)} a ${dataBR(fimMes)}`}
  faturado={vendaMesAtual}
  projecao={projecaoRitmoMes}
  meta={metaMensal}
  diferencaMeta={diferencaMetaProjetada}
  bateMeta={bateMetaProjetada}
  percentualMeta={percentualMetaProjetada}
  variacao={variacaoMes}
  maturidadeProjecao={confiancaProjecao}
  nivelMaturidadeProjecao={nivelConfiancaProjecao}
/>
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
                  descricao="Compara o mês atual até a data de hoje com o mesmo ponto do mês financeiro anterior."
                  periodoAtual={`${dataBR(inicioMes)} a ${dataBR(fimAnaliseComparativo)}`}
                  periodoAnterior={`${dataBR(inicioMesAnterior)} a ${dataBR(
                    fimMesAnteriorComparativo
                  )}`}
                  atual={vendaMesAtual}
                  anterior={vendaMesAnterior}
                  variacao={variacaoMes}
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