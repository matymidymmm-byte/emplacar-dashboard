import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
  Banknote,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileWarning,
  History,
  Landmark,
  ReceiptText,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import Card from "../components/Card.jsx";
import Kpi from "../components/Kpi.jsx";
import GraficoBarras from "../components/GraficoBarras.jsx";
import styles from "../styles/styles.js";

export default function HistoricoFinanceiro({
  historicoFechamentos = [],
  entradas = [],
  dadosEmpresa = {},
  moeda,
  setHistoricoFechamentos,
  setAba,
}) {
  const [abertos, setAbertos] = useState({});
  const [observacoes, setObservacoes] = useState({});
  const [recebimentosAbertos, setRecebimentosAbertos] = useState({});

  function dataBR(data) {
    if (!data || !String(data).includes("-")) return data || "";
    const [ano, mes, dia] = String(data).split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function valor(item, campo, fallback = 0) {
    return Number(item?.[campo] ?? fallback ?? 0);
  }

  function formatarMoeda(valorNumerico) {
    return moeda.format(Number(valorNumerico || 0));
  }

  function calcularVariacao(atual, anterior) {
    const a = Number(atual || 0);
    const b = Number(anterior || 0);

    if (b === 0) return a > 0 ? 100 : 0;

    return ((a - b) / b) * 100;
  }

  function textoVariacao(valorVariacao) {
    const numero = Number(valorVariacao || 0);
    const sinal = numero > 0 ? "+" : "";
    return `${sinal}${numero.toFixed(1)}%`;
  }

  function corVariacao(valorVariacao, menorMelhor = false) {
    const numero = Number(valorVariacao || 0);

    if (numero === 0) return "#cbd5e1";

    if (menorMelhor) {
      return numero < 0 ? "#86efac" : "#fca5a5";
    }

    return numero > 0 ? "#86efac" : "#fca5a5";
  }

  function alternarAberto(id) {
    setAbertos((old) => ({
      ...old,
      [id]: !old[id],
    }));
  }

  function excluirFechamento(id) {
    const confirmar = window.confirm(
      "Deseja excluir este fechamento financeiro?"
    );

    if (!confirmar) return;

    setHistoricoFechamentos((old) =>
      old.filter((item) => String(item.id) !== String(id))
    );
  }

  function salvarObservacao(fechamento) {
    const texto = observacoes[fechamento.id] ?? fechamento.observacao ?? "";

    setHistoricoFechamentos((old) =>
      old.map((item) =>
        String(item.id) === String(fechamento.id)
          ? {
              ...item,
              observacao: texto,
              observacaoAtualizadaEm: new Date().toISOString(),
            }
          : item
      )
    );

    alert("Observação do fechamento salva.");
  }

  function localizarEntradaAtual(nota) {
    return entradas.find((entrada) => {
      if (String(entrada.id) === String(nota.id)) return true;

      const mesmaPlaca =
        nota.placa &&
        entrada.placa &&
        String(entrada.placa).toUpperCase() ===
          String(nota.placa).toUpperCase();

      const mesmoProcesso =
        nota.processo &&
        entrada.processo &&
        String(entrada.processo) === String(nota.processo);

      const mesmaData = String(entrada.data || "") === String(nota.data || "");
      const mesmoValor = Number(entrada.valor || 0) === Number(nota.valor || 0);

      return mesmaData && mesmoValor && (mesmaPlaca || mesmoProcesso);
    });
  }

  function dataRecebimentoEntrada(entrada) {
    if (entrada?.diaPago) return entrada.diaPago;

    if (
      entrada?.status === "Pago" &&
      entrada?.formaPagamento !== "Nota / Faturado"
    ) {
      return entrada.data;
    }

    return "";
  }

  function listarRecebimentosAntigosDoFechamento(fechamento) {
    const inicio = fechamento.inicio;
    const fim = fechamento.fim || fechamento.dataFechamento;

    if (!inicio || !fim) return [];

    return entradas
      .filter((entrada) => {
        const dataVenda = entrada.data;
        const dataRecebimento = dataRecebimentoEntrada(entrada);

        if (!dataVenda || !dataRecebimento) return false;

        return (
          dataVenda < inicio &&
          dataRecebimento >= inicio &&
          dataRecebimento <= fim
        );
      })
      .map((entrada) => ({
        id: entrada.id,
        cliente: entrada.cliente || "",
        placa: entrada.placa || "",
        produto: entrada.produto || "",
        data: entrada.data || "",
        diaPago: dataRecebimentoEntrada(entrada),
        formaPagamento: entrada.formaPagamento || "",
        valor: Number(entrada.valor || 0),
      }));
  }

  function calcularRecebimentosAntigosDoFechamento(fechamento) {
    return listarRecebimentosAntigosDoFechamento(fechamento).reduce(
      (soma, entrada) => soma + Number(entrada.valor || 0),
      0
    );
  }

  function analisarCarteira(fechamento) {
    const notas = Array.isArray(fechamento.notasEmAbertoDetalhadas)
      ? fechamento.notasEmAbertoDetalhadas
      : [];

    const analisadas = notas.map((nota) => {
      const atual = localizarEntradaAtual(nota);

      const diaPagoAtual = atual?.diaPago || nota.diaPago || "";
      const statusAtual = atual?.status || nota.status || "";
      const formaPagamentoAtual =
        atual?.formaPagamento || nota.formaPagamento || "";

      const recuperada =
        diaPagoAtual &&
        diaPagoAtual > fechamento.fim &&
        String(statusAtual).toLowerCase() === "pago";

      return {
        ...nota,
        atual,
        diaPagoAtual,
        statusAtual,
        formaPagamentoAtual,
        recuperada,
      };
    });

    const valorOriginal = analisadas.reduce(
      (soma, nota) => soma + Number(nota.valor || 0),
      0
    );

    const recuperadas = analisadas.filter((nota) => nota.recuperada);
    const pendentes = analisadas.filter((nota) => !nota.recuperada);

    const valorRecuperado = recuperadas.reduce(
      (soma, nota) => soma + Number(nota.valor || 0),
      0
    );

    const valorPendente = pendentes.reduce(
      (soma, nota) => soma + Number(nota.valor || 0),
      0
    );

    const taxa =
      valorOriginal > 0 ? (valorRecuperado / valorOriginal) * 100 : 0;

    const mapaDevedores = {};

    pendentes.forEach((nota) => {
      const cliente = nota.cliente || "Sem cliente";

      if (!mapaDevedores[cliente]) {
        mapaDevedores[cliente] = {
          cliente,
          quantidade: 0,
          valor: 0,
        };
      }

      mapaDevedores[cliente].quantidade += 1;
      mapaDevedores[cliente].valor += Number(nota.valor || 0);
    });

    const topDevedores = Object.values(mapaDevedores).sort(
      (a, b) => b.valor - a.valor
    );

    return {
      notas: analisadas,
      recuperadas,
      pendentes,
      valorOriginal,
      valorRecuperado,
      valorPendente,
      taxa,
      topDevedores,
    };
  }

  function ordenarFechamentos(lista) {
    return [...lista].sort((a, b) =>
      String(b.fim || b.dataFechamento || "").localeCompare(
        String(a.fim || a.dataFechamento || "")
      )
    );
  }

  function fechamentoAnteriorDe(fechamento) {
    const ordenadosCrescente = [...historicoFechamentos].sort((a, b) =>
      String(a.fim || a.dataFechamento || "").localeCompare(
        String(b.fim || b.dataFechamento || "")
      )
    );

    const indexAtual = ordenadosCrescente.findIndex(
      (item) => String(item.id) === String(fechamento.id)
    );

    if (indexAtual <= 0) return null;

    return ordenadosCrescente[indexAtual - 1];
  }

  const dadosGraficos = useMemo(() => {
    return [...historicoFechamentos]
      .reverse()
      .map((item) => ({
        data: (() => {
          const dataBase = item.inicio || item.dataFechamento || item.fim;

          if (!dataBase) return "-";

          const data = new Date(dataBase + "T00:00:00");

          return data.toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          });
        })(),

        valor: Number(item.faturamento || 0),
      }));
  }, [historicoFechamentos]);

  const resumoGeral = useMemo(() => {
    return historicoFechamentos.reduce(
      (acc, item) => {
        const carteira = analisarCarteira(item);
        const recebimentosAntigos =
          calcularRecebimentosAntigosDoFechamento(item);

        acc.fechamentos += 1;
        acc.faturamento += valor(item, "faturamento");
        acc.recebido += valor(item, "recebido");
        acc.recebimentosAntigos += recebimentosAntigos;
        acc.saidas += valor(item, "saidas");
        acc.lucro += valor(item, "lucro");
        acc.servicos += valor(
          item,
          "servicosRealizados",
          item.quantidadeEntradas || 0
        );
        acc.notasAberto += carteira.valorOriginal;
        acc.saldoTotal += valor(
          item,
          "saldoTotal",
          valor(item, "recebidoBanco") + valor(item, "recebidoCaixa")
        );

        return acc;
      },
      {
        fechamentos: 0,
        faturamento: 0,
        recebido: 0,
        recebimentosAntigos: 0,
        saidas: 0,
        lucro: 0,
        servicos: 0,
        notasAberto: 0,
        saldoTotal: 0,
      }
    );
  }, [historicoFechamentos, entradas]);

  function atualizarCarteirasHistoricas() {
    const confirmar = window.confirm(
      "Deseja reconstruir as carteiras dos fechamentos antigos?"
    );

    if (!confirmar) return;

    const fechamentosAtualizados = historicoFechamentos.map((fechamento) => {
      const notasPeriodo = entradas.filter((entrada) => {
        if (!entrada.data) return false;

        const dentroPeriodo =
          entrada.data >= fechamento.inicio && entrada.data <= fechamento.fim;

        if (!dentroPeriodo) return false;

        const estavaAbertaNoFechamento =
          !entrada.diaPago || entrada.diaPago > fechamento.fim;

        return estavaAbertaNoFechamento;
      });

      return {
        ...fechamento,
        quantidadeNotasEmAberto: notasPeriodo.length,
        notasEmAbertoDetalhadas: notasPeriodo.map((entrada) => ({
          id: entrada.id,
          cliente: entrada.cliente || "",
          placa: entrada.placa || "",
          produto: entrada.produto || "",
          valor: Number(entrada.valor || 0),
          data: entrada.data || "",
          status: entrada.status || "",
          diaPago: entrada.diaPago || "",
          formaPagamento: entrada.formaPagamento || "",
          categoriaPlaca: entrada.categoriaPlaca || "",
                    processo: entrada.processo || "",
        })),
      };
    });

    setHistoricoFechamentos(fechamentosAtualizados);

    alert("Carteiras históricas atualizadas.");
  }

  function desenharCabecalhoPdf(doc, fechamento) {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, "F");

    const nomeEmpresa = dadosEmpresa.nome || "Empresa não configurada";

    const documentoEmpresa = [
      dadosEmpresa.cnpj ? `CNPJ: ${dadosEmpresa.cnpj}` : "",
      dadosEmpresa.cidade ? `Cidade: ${dadosEmpresa.cidade}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(nomeEmpresa, 12, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Relatório Executivo de Fechamento", 12, 18);

    if (documentoEmpresa) {
      doc.text(documentoEmpresa, 12, 25);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Período: ${dataBR(fechamento.inicio)} até ${dataBR(fechamento.fim)}`,
      110,
      18
    );

    doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 150, 21);
  }

  function pdfTexto(doc, label, valorTexto, x, y) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, 42, 18, 2, 2, "F");

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label, x + 3, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(valorTexto).slice(0, 22), x + 3, y + 13);
  }

  function pdfComparativo(
    doc,
    label,
    atual,
    anterior,
    x,
    y,
    tipo = "moeda",
    menorMelhor = false
  ) {
    const variacao = calcularVariacao(atual, anterior);
    const textoAtual =
      tipo === "moeda" ? formatarMoeda(atual) : String(atual || 0);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, 42, 18, 2, 2, "F");

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label, x + 3, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(textoAtual).slice(0, 18), x + 3, y + 12);

    doc.setTextColor(
      corVariacao(variacao, menorMelhor) === "#86efac" ? 22 : 220,
      corVariacao(variacao, menorMelhor) === "#86efac" ? 163 : 38,
      corVariacao(variacao, menorMelhor) === "#86efac" ? 74 : 38
    );
    doc.setFontSize(7);
    doc.text(textoVariacao(variacao), x + 3, y + 16);
  }

  function gerarPdfFechamento(fechamento) {
    const carteira = analisarCarteira(fechamento);
    const fechamentoAnterior = fechamentoAnteriorDe(fechamento);
    const carteiraAnterior = fechamentoAnterior
      ? analisarCarteira(fechamentoAnterior)
      : null;

    const banco = valor(fechamento, "bancoEsperado", fechamento.recebidoBanco);
    const caixa = valor(fechamento, "caixaEsperado", fechamento.recebidoCaixa);
    const saldo = valor(fechamento, "saldoTotal", banco + caixa);
    const servicos = valor(
      fechamento,
      "servicosRealizados",
      fechamento.quantidadeEntradas
    );
    const entradasVista = valor(fechamento, "entradasVista");
    const recebimentosAntigos =
      calcularRecebimentosAntigosDoFechamento(fechamento);
    const lucro = valor(fechamento, "lucro");

    const doc = new jsPDF("p", "mm", "a4");

    desenharCabecalhoPdf(doc, fechamento);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumo executivo", 12, 42);

    pdfTexto(
      doc,
      "Faturamento",
      formatarMoeda(valor(fechamento, "faturamento")),
      12,
      48
    );
    pdfTexto(doc, "Entradas à vista", formatarMoeda(entradasVista), 57, 48);
    pdfTexto(doc, "Receb. antigos", formatarMoeda(recebimentosAntigos), 102, 48);
    pdfTexto(doc, "Serviços", servicos, 147, 48);

    pdfTexto(doc, "Saídas", formatarMoeda(valor(fechamento, "saidas")), 12, 70);
    pdfTexto(doc, "Resultado", formatarMoeda(lucro), 57, 70);
    pdfTexto(doc, "Banco esperado", formatarMoeda(banco), 102, 70);
    pdfTexto(doc, "Caixa esperado", formatarMoeda(caixa), 147, 70);

    pdfTexto(doc, "Saldo final", formatarMoeda(saldo), 12, 92);
    pdfTexto(doc, "Notas abertas", formatarMoeda(carteira.valorOriginal), 57, 92);
    pdfTexto(doc, "Qtd notas", carteira.notas.length, 102, 92);
    pdfTexto(doc, "Meta", formatarMoeda(valor(fechamento, "metaMensal")), 147, 92);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Comparação com fechamento anterior", 12, 125);

    if (fechamentoAnterior) {
      pdfComparativo(
        doc,
        "Faturamento",
        valor(fechamento, "faturamento"),
        valor(fechamentoAnterior, "faturamento"),
        12,
        132
      );

      pdfComparativo(
        doc,
        "Serviços",
        servicos,
        valor(
          fechamentoAnterior,
          "servicosRealizados",
          fechamentoAnterior.quantidadeEntradas
        ),
        57,
        132,
        "numero"
      );

      pdfComparativo(
        doc,
        "Resultado",
        lucro,
        valor(fechamentoAnterior, "lucro"),
        102,
        132
      );

      pdfComparativo(
        doc,
        "Receb. antigos",
        recebimentosAntigos,
        calcularRecebimentosAntigosDoFechamento(fechamentoAnterior),
        147,
        132
      );

      pdfComparativo(
        doc,
        "Notas abertas",
        carteira.valorOriginal,
        carteiraAnterior?.valorOriginal || 0,
        12,
        154,
        "moeda",
        true
      );
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Não existe fechamento anterior para comparação.", 12, 135);
    }

    doc.addPage();
    desenharCabecalhoPdf(doc, fechamento);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Recuperação da carteira", 12, 42);

    pdfTexto(doc, "Aberto fechamento", formatarMoeda(carteira.valorOriginal), 12, 48);
    pdfTexto(doc, "Recebido depois", formatarMoeda(carteira.valorRecuperado), 57, 48);
    pdfTexto(doc, "Ainda pendente", formatarMoeda(carteira.valorPendente), 102, 48);
    pdfTexto(doc, "Taxa", `${carteira.taxa.toFixed(1)}%`, 147, 48);

    doc.save(`fechamento-${fechamento.fim || fechamento.dataFechamento}.pdf`);
  }

  function IconBox({ children, cor = "#60a5fa", grande = false }) {
    return (
      <div
        style={{
          width: grande ? 48 : 38,
          height: grande ? 48 : 38,
          minWidth: grande ? 48 : 38,
          borderRadius: grande ? 16 : 14,
          background: `linear-gradient(135deg, ${cor}22 0%, rgba(124,58,237,0.14) 100%)`,
          border: `1px solid ${cor}66`,
          boxShadow: `0 0 22px ${cor}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: cor,
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    );
  }

  function CaixaPremium({ children, destaque = false }) {
    return (
      <div
        style={{
          ...styles.card,
          marginBottom: 0,
          padding: 16,
          background: destaque
            ? "linear-gradient(135deg, rgba(37,99,235,0.28) 0%, rgba(124,58,237,0.24) 55%, rgba(14,165,233,0.14) 100%)"
            : "linear-gradient(180deg, #131c31 0%, #0f172a 100%)",
          border: destaque
            ? "1px solid rgba(147,197,253,0.38)"
            : "1px solid rgba(51,65,85,0.95)",
          boxShadow: destaque
            ? "0 18px 46px rgba(37,99,235,0.20), 0 14px 34px rgba(0,0,0,0.35)"
            : "0 14px 34px rgba(0,0,0,0.35)",
        }}
      >
        {children}
      </div>
    );
  }

  function MiniKpi({
    titulo,
    valorTexto,
    icone = null,
    cor = "#38bdf8",
    subtitulo = "",
    acao = null,
  }) {
    return (
      <div
        style={{
          ...styles.kpi,
          background: "#131c31",
border: "1px solid #1e293b",
boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          minHeight: 112,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
          {icone && <IconBox cor={cor}>{icone}</IconBox>}

          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                marginBottom: 7,
                color: "#cbd5e1",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {titulo}
            </p>

            <strong
              style={{
                color: cor,
                fontSize: "clamp(17px, 2vw, 21px)",
                display: "block",
                lineHeight: 1.15,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {valorTexto}
            </strong>

            {subtitulo && (
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "block",
                  marginTop: 6,
                }}
              >
                {subtitulo}
              </span>
            )}

            {acao && <div style={{ marginTop: 10 }}>{acao}</div>}
          </div>
        </div>
      </div>
    );
  }

  function ComparativoPremium({
    label,
    atual,
    anterior,
    tipo = "moeda",
    menorMelhor = false,
    icone = null,
  }) {
    const variacao = calcularVariacao(atual, anterior);
    const positivo = menorMelhor ? variacao < 0 : variacao > 0;
    const neutro = Number(variacao || 0) === 0;
    const cor = neutro ? "#cbd5e1" : positivo ? "#22c55e" : "#ef4444";

    return (
      <div
        style={{
          ...styles.kpi,
          background:
            "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.92) 100%)",
          border: `1px solid ${cor}44`,
          boxShadow: `0 12px 28px rgba(0,0,0,0.35), 0 0 24px ${cor}16`,
          minHeight: 116,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconBox cor={cor}>
            {icone || (positivo ? <TrendingUp size={20} /> : <TrendingDown size={20} />)}
          </IconBox>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                marginBottom: 7,
                color: "#cbd5e1",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              {label}
            </p>

            <strong style={{ color: "#f8fafc", fontSize: 18, display: "block" }}>
              {tipo === "moeda" ? formatarMoeda(atual) : Number(atual || 0)}
            </strong>

            <span
              style={{
                color: cor,
                fontSize: 13,
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
              }}
            >
              {variacao >= 0 ? "▲" : "▼"} {textoVariacao(variacao)} vs anterior
            </span>
          </div>
        </div>
      </div>
    );
  }
    function TituloSecao({ icone, titulo, subtitulo = "" }) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {icone && <IconBox cor="#38bdf8" grande>{icone}</IconBox>}

        <div>
          <h3
            style={{
              color: "#f8fafc",
              margin: 0,
              fontSize: 17,
              fontWeight: 900,
            }}
          >
            {titulo}
          </h3>

          {subtitulo && (
            <p
              style={{
                color: "#94a3b8",
                margin: "5px 0 0 0",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {subtitulo}
            </p>
          )}
        </div>
      </div>
    );
  }

  function BotaoSecundario({ children, onClick, perigo = false, destaque = false }) {
    return (
      <button
        style={{
          ...styles.botaoDashboard,
          background: perigo
            ? "linear-gradient(135deg,#dc2626 0%,#991b1b 100%)"
            : destaque
            ? "linear-gradient(135deg,#16a34a 0%,#15803d 100%)"
            : "linear-gradient(135deg,#334155 0%,#475569 100%)",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          boxShadow: perigo
            ? "0 10px 24px rgba(220,38,38,0.22)"
            : destaque
            ? "0 10px 24px rgba(22,163,74,0.22)"
            : "0 10px 24px rgba(0,0,0,0.28)",
        }}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  const fechamentosOrdenados = ordenarFechamentos(historicoFechamentos);

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>Dashboard de Fechamentos</h1>

          <p style={styles.dashboardSubtitulo}>
            Visão executiva, auditoria da carteira e evolução dos fechamentos
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.botaoDashboard} onClick={() => setAba("Dashboard")}>
            Voltar ao Dashboard
          </button>

          <button
            style={{
              ...styles.botaoDashboard,
              background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
              boxShadow: "0 10px 24px rgba(22,163,74,0.22)",
            }}
            onClick={atualizarCarteirasHistoricas}
          >
            Atualizar Carteiras Históricas
          </button>
        </div>
      </div>

      <Card titulo="Resumo executivo dos fechamentos">
        <div style={styles.kpisModernos}>
          <Kpi titulo="Fechamentos salvos" valor={resumoGeral.fechamentos} />
          <Kpi
            titulo="Faturamento acumulado"
            valor={moeda.format(resumoGeral.faturamento)}
          />
          <Kpi
            titulo="Recebimentos antigos"
            valor={moeda.format(resumoGeral.recebimentosAntigos)}
          />
          <Kpi titulo="Total recebido" valor={moeda.format(resumoGeral.recebido)} />
          <Kpi titulo="Serviços realizados" valor={resumoGeral.servicos} />
          <Kpi
            titulo="Notas em aberto"
            valor={moeda.format(resumoGeral.notasAberto)}
          />
        </div>
      </Card>

      <Card titulo="Faturamento total por mês">
        <GraficoBarras
          dados={dadosGraficos}
          moeda={moeda}
          xKey="data"
          dataKey="valor"
          nome="Faturamento"
        />
      </Card>

      <Card titulo="Fechamentos financeiros">
        {fechamentosOrdenados.length === 0 ? (
          <p style={styles.vazio}>Nenhum fechamento salvo ainda.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
              gap: 18,
            }}
          >
            {fechamentosOrdenados.map((fechamento) => {
              const carteira = analisarCarteira(fechamento);
              const anterior = fechamentoAnteriorDe(fechamento);
              const carteiraAnterior = anterior ? analisarCarteira(anterior) : null;
              const recebimentosAntigosDetalhados =
                listarRecebimentosAntigosDoFechamento(fechamento);
              const qtdRecebimentosAntigos = recebimentosAntigosDetalhados.length;
              const aberto = abertos[fechamento.id];

              const banco = valor(
                fechamento,
                "bancoEsperado",
                fechamento.recebidoBanco
              );
              const caixa = valor(
                fechamento,
                "caixaEsperado",
                fechamento.recebidoCaixa
              );
              const saldo = valor(fechamento, "saldoTotal", banco + caixa);
              const servicos = valor(
                fechamento,
                "servicosRealizados",
                fechamento.quantidadeEntradas
              );
              const entradasVista = Math.max(
  0,
  valor(
    fechamento,
    "entradasVista",
    valor(fechamento, "faturamento") - carteira.valorOriginal
  )
);
              const recebimentosAntigos =
                calcularRecebimentosAntigosDoFechamento(fechamento);
              const qtdNotasAberto = carteira.notas.length;
              const valorNotasAberto = carteira.valorOriginal;
              const observacaoAtual =
                observacoes[fechamento.id] ?? fechamento.observacao ?? "";

              return (
                <div
                  key={fechamento.id}
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(19,28,49,0.98) 0%, rgba(15,23,42,0.98) 100%)",
                    border: "1px solid rgba(147,197,253,0.25)",
                    borderRadius: 26,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    boxShadow:
                      "0 18px 46px rgba(0,0,0,0.38), 0 0 34px rgba(56,189,248,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 22,
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,0.30) 0%, rgba(124,58,237,0.25) 60%, rgba(14,165,233,0.14) 100%)",
                      border: "1px solid rgba(147,197,253,0.30)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <IconBox cor="#38bdf8" grande>
                        <ClipboardList size={24} />
                      </IconBox>

                      <div>
                        <strong style={{ color: "#f8fafc", fontSize: 20 }}>
                          {dataBR(fechamento.inicio)} até {dataBR(fechamento.fim)}
                        </strong>

                        <p
                          style={{
                            color: "#cbd5e1",
                            marginTop: 6,
                            marginBottom: 0,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          Fechado em {dataBR(fechamento.dataFechamento)}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(15,23,42,0.72)",
                        border: "1px solid rgba(148,163,184,0.22)",
                        borderRadius: 999,
                        padding: "8px 12px",
                        color: "#bfdbfe",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {qtdNotasAberto} nota(s) na carteira
                    </div>
                  </div>

                  <div style={styles.kpisModernos}>
                    <MiniKpi
                      titulo="Faturamento"
                      valorTexto={moeda.format(valor(fechamento, "faturamento"))}
                      icone={<TrendingUp size={20} />}
                      cor="#22c55e"
                    />

                    <MiniKpi
                      titulo="Entradas à vista"
                      valorTexto={moeda.format(entradasVista)}
                      icone={<Wallet size={20} />}
                      cor="#38bdf8"
                    />

                    <MiniKpi
                      titulo="Recebimentos antigos"
                      valorTexto={moeda.format(recebimentosAntigos)}
                      icone={<History size={20} />}
                      cor="#a78bfa"
                      subtitulo={`${qtdRecebimentosAntigos} nota(s) recebida(s)`}
                      acao={
                        qtdRecebimentosAntigos > 0 ? (
                          <button
                            style={{
                              ...styles.botaoCinza,
                              padding: "7px 10px",
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background:
                                "linear-gradient(135deg,#334155 0%,#475569 100%)",
                            }}
                            onClick={() =>
                              setRecebimentosAbertos((old) => ({
                                ...old,
                                [fechamento.id]: !old[fechamento.id],
                              }))
                            }
                          >
                            {recebimentosAbertos[fechamento.id] ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                            {recebimentosAbertos[fechamento.id]
                              ? "Ocultar"
                              : "Detalhar"}
                          </button>
                        ) : null
                      }
                    />

                    <MiniKpi
                      titulo="Serviços"
                      valorTexto={servicos}
                      icone={<ClipboardList size={20} />}
                      cor="#facc15"
                    />

                    <MiniKpi
                      titulo="Notas em aberto"
                      valorTexto={moeda.format(valorNotasAberto)}
                      icone={<FileWarning size={20} />}
                      cor="#f87171"
                    />

                    <MiniKpi
                      titulo="Qtd notas em aberto"
                      valorTexto={qtdNotasAberto}
                      icone={<ReceiptText size={20} />}
                      cor="#fb7185"
                    />

                    <MiniKpi
                      titulo="Saídas"
                      valorTexto={moeda.format(valor(fechamento, "saidas"))}
                      icone={<TrendingDown size={20} />}
                      cor="#ef4444"
                    />

                    <MiniKpi
                      titulo="Resultado líquido"
                      valorTexto={moeda.format(valor(fechamento, "lucro"))}
                      icone={<Scale size={20} />}
                      cor={
                        valor(fechamento, "lucro") >= 0 ? "#22c55e" : "#ef4444"
                      }
                    />

                    <MiniKpi
                      titulo="Banco esperado"
                      valorTexto={moeda.format(banco)}
                      icone={<Landmark size={20} />}
                      cor="#818cf8"
                    />

                    <MiniKpi
                      titulo="Caixa esperado"
                      valorTexto={moeda.format(caixa)}
                      icone={<Banknote size={20} />}
                      cor="#fbbf24"
                    />

                    <MiniKpi
                      titulo="Saldo final"
                      valorTexto={moeda.format(saldo)}
                      icone={<CircleDollarSign size={20} />}
                      cor="#c084fc"
                    />

                    <MiniKpi
                      titulo="Meta do período"
                      valorTexto={moeda.format(valor(fechamento, "metaMensal"))}
                      icone={<Target size={20} />}
                      cor="#38bdf8"
                    />
                  </div>

                  {recebimentosAbertos[fechamento.id] &&
                    recebimentosAntigosDetalhados.length > 0 && (
                      <CaixaPremium>
                        <TituloSecao
                          icone={<History size={22} />}
                          titulo="Recebimentos antigos detalhados"
                          subtitulo="Notas antigas recebidas dentro deste fechamento"
                        />

                        <div style={{ overflowX: "auto" }}>
                          <table style={{ ...styles.tabela, minWidth: 760 }}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Cliente</th>
                                <th style={styles.th}>Placa</th>
                                <th style={styles.th}>Venda</th>
                                <th style={styles.th}>Pagamento</th>
                                <th style={styles.th}>Forma</th>
                                <th style={styles.th}>Valor</th>
                              </tr>
                            </thead>

                            <tbody>
                              {recebimentosAntigosDetalhados.map((item) => (
                                <tr key={item.id}>
                                  <td style={styles.td}>{item.cliente}</td>
                                  <td style={styles.tdPlaca}>{item.placa || "-"}</td>
                                  <td style={styles.td}>{dataBR(item.data)}</td>
                                  <td style={styles.td}>{dataBR(item.diaPago)}</td>
                                  <td style={styles.td}>
                                    {item.formaPagamento || "-"}
                                  </td>
                                  <td style={styles.tdValor}>
                                    {moeda.format(item.valor)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CaixaPremium>
                    )}

                  <CaixaPremium>
                    <TituloSecao
                      icone={<TrendingUp size={22} />}
                      titulo="Comparação com fechamento anterior"
                      subtitulo="Variação dos principais indicadores"
                    />

                    {!anterior ? (
                      <p style={styles.vazio}>
                        Não existe fechamento anterior para comparar.
                      </p>
                    ) : (
                      <div style={styles.kpisModernos}>
                        <ComparativoPremium
                          label="Faturamento"
                          atual={valor(fechamento, "faturamento")}
                          anterior={valor(anterior, "faturamento")}
                          icone={<TrendingUp size={20} />}
                        />

                        <ComparativoPremium
                          label="Serviços"
                          atual={servicos}
                          anterior={valor(
                            anterior,
                            "servicosRealizados",
                            anterior.quantidadeEntradas
                          )}
                          tipo="numero"
                          icone={<ClipboardList size={20} />}
                        />

                        <ComparativoPremium
                          label="Resultado"
                          atual={valor(fechamento, "lucro")}
                          anterior={valor(anterior, "lucro")}
                          icone={<Scale size={20} />}
                        />

                        <ComparativoPremium
                          label="Receb. antigos"
                          atual={recebimentosAntigos}
                          anterior={calcularRecebimentosAntigosDoFechamento(
                            anterior
                          )}
                          icone={<History size={20} />}
                        />

                        <ComparativoPremium
                          label="Notas abertas"
                          atual={carteira.valorOriginal}
                          anterior={carteiraAnterior?.valorOriginal || 0}
                          tipo="moeda"
                          menorMelhor
                          icone={<FileWarning size={20} />}
                        />
                      </div>
                    )}
                  </CaixaPremium>

                  <CaixaPremium destaque>
                    <TituloSecao
                      icone={<ReceiptText size={22} />}
                      titulo="Recuperação da carteira"
                      subtitulo="Acompanhamento das notas que ficaram abertas no fechamento"
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                        gap: 14,
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color: "#cbd5e1",
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          Taxa de recuperação
                        </p>

                        <strong
                          style={{
                            display: "block",
                            marginTop: 4,
                            color:
                              carteira.taxa >= 80
                                ? "#86efac"
                                : carteira.taxa >= 50
                                ? "#fde68a"
                                : "#fca5a5",
                            fontSize: "clamp(34px, 5vw, 48px)",
                            lineHeight: 1,
                            fontWeight: 950,
                          }}
                        >
                          {carteira.taxa.toFixed(1)}%
                        </strong>
                      </div>

                      <div>
                        <div
                          style={{
                            background: "rgba(15,23,42,0.88)",
                            border: "1px solid rgba(148,163,184,0.28)",
                            borderRadius: 999,
                            height: 16,
                            overflow: "hidden",
                            boxShadow: "inset 0 0 18px rgba(0,0,0,0.35)",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, carteira.taxa)}%`,
                              height: "100%",
                              background:
                                carteira.taxa >= 80
                                  ? "linear-gradient(90deg,#16a34a,#86efac)"
                                  : carteira.taxa >= 50
                                  ? "linear-gradient(90deg,#f59e0b,#fde68a)"
                                  : "linear-gradient(90deg,#dc2626,#fca5a5)",
                              boxShadow:
                                carteira.taxa >= 80
                                  ? "0 0 26px rgba(34,197,94,0.45)"
                                  : carteira.taxa >= 50
                                  ? "0 0 26px rgba(250,204,21,0.35)"
                                  : "0 0 26px rgba(239,68,68,0.45)",
                            }}
                          />
                        </div>

                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "#94a3b8",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Quanto maior a barra, melhor a recuperação da carteira.
                        </p>
                      </div>
                    </div>

                    <div style={styles.kpisModernos}>
                      <MiniKpi
                        titulo="Aberto no fechamento"
                        valorTexto={moeda.format(carteira.valorOriginal)}
                        icone={<FileWarning size={20} />}
                        cor="#f87171"
                      />

                      <MiniKpi
                        titulo="Recebido depois"
                        valorTexto={moeda.format(carteira.valorRecuperado)}
                        icone={<CircleDollarSign size={20} />}
                        cor="#22c55e"
                      />

                      <MiniKpi
                        titulo="Ainda pendente"
                        valorTexto={moeda.format(carteira.valorPendente)}
                        icone={<FileWarning size={20} />}
                        cor={carteira.valorPendente > 0 ? "#ef4444" : "#22c55e"}
                      />

                      <MiniKpi
                        titulo="Taxa recuperação"
                        valorTexto={`${carteira.taxa.toFixed(1)}%`}
                        icone={<TrendingUp size={20} />}
                        cor={
                          carteira.taxa >= 80
                            ? "#22c55e"
                            : carteira.taxa >= 50
                            ? "#facc15"
                            : "#ef4444"
                        }
                      />
                    </div>
                  </CaixaPremium>

                  <CaixaPremium>
                    <label style={{ ...styles.label, marginBottom: 8 }}>
                      Observação do fechamento
                    </label>

                    <textarea
                      value={observacaoAtual}
                      onChange={(e) =>
                        setObservacoes((old) => ({
                          ...old,
                          [fechamento.id]: e.target.value,
                        }))
                      }
                      placeholder="Escreva observações do fechamento, conferências, diferenças, decisões dos sócios ou pontos importantes..."
                      style={{
                        ...styles.textarea,
                        minHeight: 90,
                        resize: "vertical",
                      }}
                    />

                    <button
                      style={{ ...styles.botao, marginTop: 10 }}
                      onClick={() => salvarObservacao(fechamento)}
                    >
                      Salvar observação
                    </button>
                  </CaixaPremium>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 4,
                    }}
                  >
                    <BotaoSecundario
                      destaque
                      onClick={() => gerarPdfFechamento(fechamento)}
                    >
                      Baixar PDF
                    </BotaoSecundario>

                    <BotaoSecundario onClick={() => alternarAberto(fechamento.id)}>
                      {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      {aberto ? "Ocultar notas" : "Ver notas"}
                    </BotaoSecundario>

                    <BotaoSecundario
                      perigo
                      onClick={() => excluirFechamento(fechamento.id)}
                    >
                      Excluir fechamento
                    </BotaoSecundario>
                  </div>

                  {aberto && (
                    <CaixaPremium>
                      <TituloSecao
                        icone={<FileWarning size={22} />}
                        titulo="Notas em aberto no fechamento"
                        subtitulo="Carteira detalhada salva no momento do fechamento"
                      />

                      {carteira.notas.length === 0 ? (
                        <p style={styles.vazio}>
                          Nenhuma nota detalhada foi salva neste fechamento.
                        </p>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ ...styles.tabela, minWidth: 860 }}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Cliente</th>
                                <th style={styles.th}>Placa</th>
                                <th style={styles.th}>Produto</th>
                                <th style={styles.th}>Data venda</th>
                                <th style={styles.th}>Dia pago</th>
                                <th style={styles.th}>Pagamento</th>
                                <th style={styles.th}>Valor</th>
                                <th style={styles.th}>Status carteira</th>
                              </tr>
                            </thead>

                            <tbody>
                              {carteira.notas.map((nota, index) => (
                                <tr key={`${nota.id || index}`}>
                                  <td style={styles.td}>{nota.cliente || "-"}</td>
                                  <td style={styles.tdPlaca}>{nota.placa || "-"}</td>
                                  <td style={styles.td}>{nota.produto || "-"}</td>
                                  <td style={styles.td}>{dataBR(nota.data)}</td>
                                  <td style={styles.td}>
                                    {nota.diaPagoAtual ? dataBR(nota.diaPagoAtual) : "-"}
                                  </td>
                                  <td style={styles.td}>
                                    {nota.formaPagamentoAtual || "-"}
                                  </td>
                                  <td style={styles.tdValor}>
                                    {moeda.format(Number(nota.valor || 0))}
                                  </td>
                                  <td style={styles.td}>
                                    <strong
                                      style={{
                                        color: nota.recuperada
                                          ? "#86efac"
                                          : "#fca5a5",
                                      }}
                                    >
                                      {nota.recuperada
                                        ? "Recebida depois"
                                        : "Ainda pendente"}
                                    </strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CaixaPremium>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}