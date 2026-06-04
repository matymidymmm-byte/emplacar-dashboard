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
  }
    function IconBox({ children, cor = "#60a5fa" }) {
    return (
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background: "rgba(96, 165, 250, 0.12)",
          border: "1px solid rgba(96, 165, 250, 0.25)",
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

  function CardIndicador({
    titulo,
    valorTexto,
    destaque = false,
    icone = null,
    subtitulo = "",
    cor = "#60a5fa",
  }) {
    return (
      <div
        style={{
          background: destaque
            ? "linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%)"
            : "#0f172a",
          border: "1px solid #334155",
          borderRadius: 18,
          padding: 16,
          minHeight: 104,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {icone && <IconBox cor={destaque ? "#dbeafe" : cor}>{icone}</IconBox>}

        <div>
          <span style={{ color: destaque ? "#dbeafe" : "#94a3b8", fontSize: 13, fontWeight: 700 }}>
            {titulo}
          </span>

          <strong style={{ color: "#fff", fontSize: 22, display: "block", marginTop: 4 }}>
            {valorTexto}
          </strong>

          {subtitulo && (
            <span style={{ color: destaque ? "#bfdbfe" : "#64748b", fontSize: 12, fontWeight: 600 }}>
              {subtitulo}
            </span>
          )}
        </div>
      </div>
    );
  }

  function linhaValor({ label, value, cor = "#f8fafc", extra = null, icone = null, iconeCor = "#60a5fa" }) {
    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: 13,
          minHeight: 98,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {icone && <IconBox cor={iconeCor}>{icone}</IconBox>}

          <p style={{ color: "#94a3b8", margin: 0, fontSize: 12, fontWeight: 800 }}>
            {label}
          </p>
        </div>

        <strong style={{ color: cor, fontSize: 18, display: "block", marginTop: 5 }}>
          {value}
        </strong>

        {extra}
      </div>
    );
  }

  function linhaComparativo({ label, atual, anterior, tipo = "moeda", menorMelhor = false, icone = null }) {
    const variacao = calcularVariacao(atual, anterior);
    const positivo = menorMelhor ? variacao < 0 : variacao > 0;
    const neutro = Number(variacao || 0) === 0;

    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 16,
          padding: 13,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {icone && (
            <IconBox cor={positivo ? "#86efac" : neutro ? "#cbd5e1" : "#fca5a5"}>
              {icone}
            </IconBox>
          )}

          <p style={{ color: "#94a3b8", margin: 0, fontSize: 12, fontWeight: 800 }}>
            {label}
          </p>
        </div>

        <strong style={{ color: "#f8fafc", fontSize: 16, display: "block" }}>
          {tipo === "moeda" ? formatarMoeda(atual) : Number(atual || 0)}
        </strong>

        <span
          style={{
            color: corVariacao(variacao, menorMelhor),
            fontSize: 12,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
          }}
        >
          {variacao >= 0 ? "▲" : "▼"} {textoVariacao(variacao)} vs anterior
        </span>
      </div>
    );
  }

  function TituloSecao({ icone, titulo, subtitulo = "" }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {icone && <IconBox>{icone}</IconBox>}

        <div>
          <h3 style={{ color: "#f8fafc", margin: 0, fontSize: 16 }}>
            {titulo}
          </h3>

          {subtitulo && (
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 12, fontWeight: 600 }}>
              {subtitulo}
            </p>
          )}
        </div>
      </div>
    );
  }

  function BotaoSecundario({ children, onClick, perigo = false }) {
    return (
      <button
        style={{
          ...styles.botaoCinza,
          background: perigo ? "#dc2626" : styles.botaoCinza.background,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
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
            }}
            onClick={atualizarCarteirasHistoricas}
          >
            Atualizar Carteiras Históricas
          </button>
        </div>
      </div>

      <Card titulo="Resumo executivo dos fechamentos">
        <div style={styles.kpisModernos}>
          <CardIndicador
            titulo="Fechamentos salvos"
            valorTexto={resumoGeral.fechamentos}
            destaque
            icone={<ClipboardList size={18} />}
            subtitulo="Períodos encerrados"
          />

          <CardIndicador
            titulo="Faturamento acumulado"
            valorTexto={moeda.format(resumoGeral.faturamento)}
            icone={<TrendingUp size={18} />}
            cor="#86efac"
          />

          <CardIndicador
            titulo="Recebimentos antigos"
            valorTexto={moeda.format(resumoGeral.recebimentosAntigos)}
            icone={<History size={18} />}
            cor="#c4b5fd"
          />

          <CardIndicador
            titulo="Total recebido"
            valorTexto={moeda.format(resumoGeral.recebido)}
            icone={<CircleDollarSign size={18} />}
            cor="#93c5fd"
          />

          <CardIndicador
            titulo="Serviços realizados"
            valorTexto={resumoGeral.servicos}
            icone={<ReceiptText size={18} />}
            cor="#facc15"
          />

          <CardIndicador
            titulo="Notas em aberto"
            valorTexto={moeda.format(resumoGeral.notasAberto)}
            icone={<FileWarning size={18} />}
            cor="#fca5a5"
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
            {fechamentosOrdenados.map((fechamento) => {
              const carteira = analisarCarteira(fechamento);
              const anterior = fechamentoAnteriorDe(fechamento);
              const carteiraAnterior = anterior ? analisarCarteira(anterior) : null;
              const recebimentosAntigosDetalhados = listarRecebimentosAntigosDoFechamento(fechamento);
              const qtdRecebimentosAntigos = recebimentosAntigosDetalhados.length;
              const aberto = abertos[fechamento.id];

              const banco = valor(fechamento, "bancoEsperado", fechamento.recebidoBanco);
              const caixa = valor(fechamento, "caixaEsperado", fechamento.recebidoCaixa);
              const saldo = valor(fechamento, "saldoTotal", banco + caixa);
              const servicos = valor(fechamento, "servicosRealizados", fechamento.quantidadeEntradas);
              const entradasVista = valor(fechamento, "entradasVista");
              const recebimentosAntigos = calcularRecebimentosAntigosDoFechamento(fechamento);
              const qtdNotasAberto = carteira.notas.length;
              const valorNotasAberto = carteira.valorOriginal;
              const observacaoAtual = observacoes[fechamento.id] ?? fechamento.observacao ?? "";

              return (
                <div
                  key={fechamento.id}
                  style={{
                    background: "linear-gradient(180deg,#0f172a 0%,#020617 100%)",
                    border: "1px solid #334155",
                    borderRadius: 24,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div>
                    <strong style={{ color: "#f8fafc", fontSize: 19 }}>
                      {dataBR(fechamento.inicio)} até {dataBR(fechamento.fim)}
                    </strong>

                    <p style={{ color: "#94a3b8", marginTop: 6, marginBottom: 0, fontSize: 13 }}>
                      Fechado em {dataBR(fechamento.dataFechamento)}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                    {linhaValor({ label: "Faturamento", value: moeda.format(valor(fechamento, "faturamento")), icone: <TrendingUp size={16} />, iconeCor: "#86efac" })}
                    {linhaValor({ label: "Entradas à vista", value: moeda.format(entradasVista), icone: <Wallet size={16} />, iconeCor: "#93c5fd" })}

                    {linhaValor({
                      label: "Recebimentos antigos",
                      value: moeda.format(recebimentosAntigos),
                      icone: <History size={16} />,
                      iconeCor: "#c4b5fd",
                      extra: (
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
                          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <ReceiptText size={13} />
                            {qtdRecebimentosAntigos} nota(s) recebida(s)
                          </span>

                          {qtdRecebimentosAntigos > 0 && (
                            <button
                              style={{
                                ...styles.botaoCinza,
                                marginTop: 2,
                                padding: "7px 10px",
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                width: "fit-content",
                              }}
                              onClick={() =>
                                setRecebimentosAbertos((old) => ({
                                  ...old,
                                  [fechamento.id]: !old[fechamento.id],
                                }))
                              }
                            >
                              {recebimentosAbertos[fechamento.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {recebimentosAbertos[fechamento.id] ? "Ocultar" : "Detalhar"}
                            </button>
                          )}
                        </div>
                      ),
                    })}

                    {linhaValor({ label: "Serviços", value: servicos, icone: <ClipboardList size={16} />, iconeCor: "#facc15" })}
                    {linhaValor({ label: "Notas em aberto", value: moeda.format(valorNotasAberto), icone: <FileWarning size={16} />, iconeCor: "#fca5a5" })}
                    {linhaValor({ label: "Qtd notas em aberto", value: qtdNotasAberto, icone: <ReceiptText size={16} />, iconeCor: "#fca5a5" })}
                    {linhaValor({ label: "Saídas", value: moeda.format(valor(fechamento, "saidas")), cor: "#fca5a5", icone: <TrendingDown size={16} />, iconeCor: "#fca5a5" })}
                    {linhaValor({ label: "Resultado líquido", value: moeda.format(valor(fechamento, "lucro")), cor: valor(fechamento, "lucro") >= 0 ? "#86efac" : "#fca5a5", icone: <Scale size={16} />, iconeCor: valor(fechamento, "lucro") >= 0 ? "#86efac" : "#fca5a5" })}
                    {linhaValor({ label: "Banco esperado", value: moeda.format(banco), cor: "#93c5fd", icone: <Landmark size={16} />, iconeCor: "#93c5fd" })}
                    {linhaValor({ label: "Caixa esperado", value: moeda.format(caixa), cor: "#fde68a", icone: <Banknote size={16} />, iconeCor: "#fde68a" })}
                    {linhaValor({ label: "Saldo final", value: moeda.format(saldo), cor: "#c4b5fd", icone: <CircleDollarSign size={16} />, iconeCor: "#c4b5fd" })}
                    {linhaValor({ label: "Meta do período", value: moeda.format(valor(fechamento, "metaMensal")), icone: <Target size={16} />, iconeCor: "#60a5fa" })}
                  </div>

                  {recebimentosAbertos[fechamento.id] && recebimentosAntigosDetalhados.length > 0 && (
                    <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 18, padding: 14 }}>
                      <TituloSecao
                        icone={<History size={16} />}
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
                                <td style={styles.td}>{item.formaPagamento || "-"}</td>
                                <td style={styles.tdValor}>{moeda.format(item.valor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 18, padding: 14 }}>
                    <TituloSecao
                      icone={<TrendingUp size={16} />}
                      titulo="Comparação com fechamento anterior"
                      subtitulo="Variação dos principais indicadores"
                    />

                    {!anterior ? (
                      <p style={styles.vazio}>Não existe fechamento anterior para comparar.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                        {linhaComparativo({ label: "Faturamento", atual: valor(fechamento, "faturamento"), anterior: valor(anterior, "faturamento"), icone: <TrendingUp size={16} /> })}
                        {linhaComparativo({ label: "Serviços", atual: servicos, anterior: valor(anterior, "servicosRealizados", anterior.quantidadeEntradas), tipo: "numero", icone: <ClipboardList size={16} /> })}
                        {linhaComparativo({ label: "Resultado", atual: valor(fechamento, "lucro"), anterior: valor(anterior, "lucro"), icone: <Scale size={16} /> })}
                        {linhaComparativo({ label: "Receb. antigos", atual: recebimentosAntigos, anterior: calcularRecebimentosAntigosDoFechamento(anterior), icone: <History size={16} /> })}
                        {linhaComparativo({ label: "Notas abertas", atual: carteira.valorOriginal, anterior: carteiraAnterior?.valorOriginal || 0, tipo: "moeda", menorMelhor: true, icone: <FileWarning size={16} /> })}
                      </div>
                    )}
                  </div>

                  <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 18, padding: 14 }}>
                    <TituloSecao
                      icone={<ReceiptText size={16} />}
                      titulo="Recuperação da carteira"
                      subtitulo="Acompanhamento das notas que ficaram abertas no fechamento"
                    />

                    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 999, height: 10, overflow: "hidden", marginBottom: 14 }}>
                      <div
                        style={{
                          width: `${Math.min(100, carteira.taxa)}%`,
                          height: "100%",
                          background:
                            carteira.taxa >= 80
                              ? "linear-gradient(90deg,#22c55e,#86efac)"
                              : carteira.taxa >= 50
                              ? "linear-gradient(90deg,#facc15,#fde68a)"
                              : "linear-gradient(90deg,#ef4444,#fca5a5)",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
                      {linhaValor({ label: "Aberto no fechamento", value: moeda.format(carteira.valorOriginal), icone: <FileWarning size={16} />, iconeCor: "#fca5a5" })}
                      {linhaValor({ label: "Recebido depois", value: moeda.format(carteira.valorRecuperado), cor: "#86efac", icone: <CircleDollarSign size={16} />, iconeCor: "#86efac" })}
                      {linhaValor({ label: "Ainda pendente", value: moeda.format(carteira.valorPendente), cor: carteira.valorPendente > 0 ? "#fca5a5" : "#86efac", icone: <FileWarning size={16} />, iconeCor: carteira.valorPendente > 0 ? "#fca5a5" : "#86efac" })}
                      {linhaValor({ label: "Taxa recuperação", value: `${carteira.taxa.toFixed(1)}%`, cor: carteira.taxa >= 80 ? "#86efac" : carteira.taxa >= 50 ? "#fde68a" : "#fca5a5", icone: <TrendingUp size={16} /> })}
                    </div>
                  </div>

                  <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 18, padding: 14 }}>
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
                      style={{ ...styles.textarea, minHeight: 90, resize: "vertical" }}
                    />

                    <button style={{ ...styles.botao, marginTop: 10 }} onClick={() => salvarObservacao(fechamento)}>
                      Salvar observação
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                    <BotaoSecundario onClick={() => gerarPdfFechamento(fechamento)}>
                      Baixar PDF
                    </BotaoSecundario>

                    <BotaoSecundario onClick={() => alternarAberto(fechamento.id)}>
                      {aberto ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      {aberto ? "Ocultar notas" : "Ver notas"}
                    </BotaoSecundario>

                    <BotaoSecundario perigo onClick={() => excluirFechamento(fechamento.id)}>
                      Excluir fechamento
                    </BotaoSecundario>
                  </div>

                  {aberto && (
                    <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 18, padding: 14, marginTop: 4 }}>
                      <TituloSecao
                        icone={<FileWarning size={16} />}
                        titulo="Notas em aberto no fechamento"
                        subtitulo="Carteira detalhada salva no momento do fechamento"
                      />

                      {carteira.notas.length === 0 ? (
                        <p style={styles.vazio}>Nenhuma nota detalhada foi salva neste fechamento.</p>
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
                                  <td style={styles.td}>{nota.diaPagoAtual ? dataBR(nota.diaPagoAtual) : "-"}</td>
                                  <td style={styles.td}>{nota.formaPagamentoAtual || "-"}</td>
                                  <td style={styles.tdValor}>{moeda.format(Number(nota.valor || 0))}</td>
                                  <td style={styles.td}>
                                    <strong style={{ color: nota.recuperada ? "#86efac" : "#fca5a5" }}>
                                      {nota.recuperada ? "Recebida depois" : "Ainda pendente"}
                                    </strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
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