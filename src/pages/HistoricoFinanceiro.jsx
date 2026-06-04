import { useMemo, useState } from "react";
import jsPDF from "jspdf";

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

function calcularRecebimentosAntigosDoFechamento(fechamento) {
  const inicio = fechamento.inicio;
  const fim = fechamento.fim || fechamento.dataFechamento;

  if (!inicio || !fim) return 0;

  return entradas
    .filter((entrada) => {
      const dataVenda = entrada.data;
      const dataRecebimento = dataRecebimentoEntrada(entrada);

      if (!dataVenda || !dataRecebimento) return false;

      return dataVenda < inicio && dataRecebimento >= inicio && dataRecebimento <= fim;
    })
    .reduce((soma, entrada) => soma + Number(entrada.valor || 0), 0);
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
        acc.fechamentos += 1;
        acc.faturamento += valor(item, "faturamento");
        acc.recebido += valor(item, "recebido");
        acc.saidas += valor(item, "saidas");
        acc.lucro += valor(item, "lucro");
        acc.servicos += valor(
          item,
          "servicosRealizados",
          item.quantidadeEntradas || 0
        );
        const carteira = analisarCarteira(item);

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
        saidas: 0,
        lucro: 0,
        servicos: 0,
        notasAberto: 0,
        saldoTotal: 0,
      }
    );
  }, [historicoFechamentos]);

  function CardIndicador({ titulo, valorTexto, destaque = false }) {
    return (
      <div
        style={{
          background: destaque
            ? "linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%)"
            : "#0f172a",
          border: "1px solid #334155",
          borderRadius: 18,
          padding: 16,
          minHeight: 92,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            color: destaque ? "#dbeafe" : "#94a3b8",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {titulo}
        </span>

        <strong
          style={{
            color: "#fff",
            fontSize: 22,
            lineHeight: 1.2,
          }}
        >
          {valorTexto}
        </strong>
      </div>
    );
  }

  function linhaValor(label, value, cor = "#f8fafc") {
    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <p
          style={{
            color: "#94a3b8",
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {label}
        </p>

        <strong
          style={{
            color: cor,
            fontSize: 18,
            display: "block",
            marginTop: 5,
          }}
        >
          {value}
        </strong>
      </div>
    );
  }

  function linhaComparativo(label, atual, anterior, tipo = "moeda", menorMelhor = false) {
    const variacao = calcularVariacao(atual, anterior);

    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1e293b",
          borderRadius: 14,
          padding: 12,
        }}
      >
        <p
          style={{
            color: "#94a3b8",
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {label}
        </p>

        <strong
          style={{
            color: "#f8fafc",
            fontSize: 16,
            display: "block",
            marginTop: 5,
          }}
        >
          {tipo === "moeda" ? formatarMoeda(atual) : Number(atual || 0)}
        </strong>

        <span
          style={{
            color: corVariacao(variacao, menorMelhor),
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {textoVariacao(variacao)} vs anterior
        </span>
      </div>
    );
  }

  function atualizarCarteirasHistoricas() {
    const confirmar = window.confirm(
      "Deseja reconstruir as carteiras dos fechamentos antigos?"
    );

    if (!confirmar) return;

    const fechamentosAtualizados = historicoFechamentos.map((fechamento) => {
      const notasPeriodo = entradas.filter((entrada) => {
        if (!entrada.data) return false;

        const dentroPeriodo =
          entrada.data >= fechamento.inicio &&
          entrada.data <= fechamento.fim;

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

  function pdfComparativo(doc, label, atual, anterior, x, y, tipo = "moeda", menorMelhor = false) {
    const variacao = calcularVariacao(atual, anterior);
    const textoAtual = tipo === "moeda" ? formatarMoeda(atual) : String(atual || 0);

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
    const recebimentosAntigos = calcularRecebimentosAntigosDoFechamento(fechamento);
    const lucro = valor(fechamento, "lucro");

    const doc = new jsPDF("p", "mm", "a4");

    desenharCabecalhoPdf(doc, fechamento);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumo executivo", 12, 42);

    pdfTexto(doc, "Faturamento", formatarMoeda(valor(fechamento, "faturamento")), 12, 48);
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
        valor(fechamentoAnterior, "servicosRealizados", fechamentoAnterior.quantidadeEntradas),
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
        valor(fechamentoAnterior, "recebimentosAntigos"),
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

    let y = 82;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Top devedores restantes", 12, y);

    y += 8;

    if (carteira.topDevedores.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Nenhum devedor restante nesta carteira.", 12, y);
      y += 8;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Cliente", 12, y);
      doc.text("Qtd", 125, y);
      doc.text("Valor", 150, y);

      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      carteira.topDevedores.slice(0, 8).forEach((cliente) => {
        doc.text(String(cliente.cliente || "-").slice(0, 48), 12, y);
        doc.text(String(cliente.quantidade || 0), 125, y);
        doc.text(formatarMoeda(cliente.valor), 150, y);
        y += 5;
      });
    }

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Observações do fechamento", 12, y);

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const textoObservacao =
      observacoes[fechamento.id] ??
      fechamento.observacao ??
      "Nenhuma observação registrada.";

    const linhasObs = doc.splitTextToSize(textoObservacao, 180);
    doc.text(linhasObs, 12, y);

    doc.addPage();
    desenharCabecalhoPdf(doc, fechamento);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Notas da carteira do fechamento", 12, 42);

    y = 52;

    doc.setFillColor(219, 234, 254);
    doc.rect(12, y - 5, 186, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Cliente", 14, y);
    doc.text("Placa", 70, y);
    doc.text("Data", 98, y);
    doc.text("Pago", 122, y);
    doc.text("Valor", 148, y);
    doc.text("Status", 172, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    carteira.notas.forEach((nota, index) => {
      if (y > 270) {
        doc.addPage();
        desenharCabecalhoPdf(doc, fechamento);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Notas da carteira do fechamento", 12, 42);

        y = 52;

        doc.setFillColor(219, 234, 254);
        doc.rect(12, y - 5, 186, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Cliente", 14, y);
        doc.text("Placa", 70, y);
        doc.text("Data", 98, y);
        doc.text("Pago", 122, y);
        doc.text("Valor", 148, y);
        doc.text("Status", 172, y);

        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, y - 4, 186, 6, "F");
      }

      doc.text(String(nota.cliente || "-").slice(0, 28), 14, y);
      doc.text(String(nota.placa || "-").slice(0, 10), 70, y);
      doc.text(dataBR(nota.data), 98, y);
      doc.text(nota.diaPagoAtual ? dataBR(nota.diaPagoAtual) : "-", 122, y);
      doc.text(formatarMoeda(nota.valor), 148, y);
      doc.text(nota.recuperada ? "Recebida" : "Pendente", 172, y);

      y += 6;
    });

    doc.setDrawColor(226, 232, 240);
    doc.line(12, 260, 198, 260);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Conferência do fechamento", 12, 268);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Este relatório consolida os dados financeiros registrados no sistema até a data de emissão.",
      12,
      275
    );

    doc.text(
      "Responsável pela conferência: __________________________________________",
      12,
      284
    );

    doc.text("Relatório gerado automaticamente pelo sistema.", 12, 292);

    doc.save(
      `fechamento-${fechamento.inicio || "periodo"}-${fechamento.fim || ""}.pdf`
    );
  }

  const fechamentosOrdenados = ordenarFechamentos(historicoFechamentos);

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>Dashboard de Fechamentos</h1>

          <p style={styles.dashboardSubtitulo}>
            Visão gerencial dos fechamentos financeiros salvos
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
            style={styles.botaoDashboard}
            onClick={() => setAba("Dashboard")}
          >
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
              gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))",
              gap: 18,
            }}
          >
            {fechamentosOrdenados.map((fechamento) => {
              const carteira = analisarCarteira(fechamento);
              const anterior = fechamentoAnteriorDe(fechamento);
              const carteiraAnterior = anterior ? analisarCarteira(anterior) : null;

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

              const entradasVista = valor(fechamento, "entradasVista");

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
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 22,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: "#f8fafc",
                        fontSize: 19,
                      }}
                    >
                      {dataBR(fechamento.inicio)} até {dataBR(fechamento.fim)}
                    </strong>

                    <p
                      style={{
                        color: "#94a3b8",
                        marginTop: 6,
                        marginBottom: 0,
                        fontSize: 13,
                      }}
                    >
                      Fechado em {dataBR(fechamento.dataFechamento)}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                      gap: 10,
                    }}
                  >
                    {linhaValor(
                      "Faturamento",
                      moeda.format(valor(fechamento, "faturamento"))
                    )}

                    {linhaValor("Entradas à vista", moeda.format(entradasVista))}

                    {linhaValor(
                      "Recebimentos antigos",
                      moeda.format(recebimentosAntigos)
                    )}

                    {linhaValor("Serviços", servicos)}

                    {linhaValor("Notas em aberto", moeda.format(valorNotasAberto))}

                    {linhaValor("Qtd notas em aberto", qtdNotasAberto)}

                    {linhaValor(
                      "Saídas",
                      moeda.format(valor(fechamento, "saidas")),
                      "#fca5a5"
                    )}

                    {linhaValor(
                      "Resultado líquido",
                      moeda.format(valor(fechamento, "lucro")),
                      valor(fechamento, "lucro") >= 0 ? "#86efac" : "#fca5a5"
                    )}

                    {linhaValor("Banco esperado", moeda.format(banco), "#93c5fd")}

                    {linhaValor("Caixa esperado", moeda.format(caixa), "#fde68a")}

                    {linhaValor("Saldo final", moeda.format(saldo), "#c4b5fd")}

                    {linhaValor(
                      "Meta do período",
                      moeda.format(valor(fechamento, "metaMensal"))
                    )}
                  </div>

                  <div
                    style={{
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: 14,
                    }}
                  >
                    <h3
                      style={{
                        color: "#f8fafc",
                        marginTop: 0,
                        marginBottom: 12,
                        fontSize: 16,
                      }}
                    >
                      Comparação com fechamento anterior
                    </h3>

                    {!anterior ? (
                      <p style={styles.vazio}>
                        Não existe fechamento anterior para comparar.
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(130px,1fr))",
                          gap: 10,
                        }}
                      >
                        {linhaComparativo(
                          "Faturamento",
                          valor(fechamento, "faturamento"),
                          valor(anterior, "faturamento")
                        )}

                        {linhaComparativo(
                          "Serviços",
                          servicos,
                          valor(anterior, "servicosRealizados", anterior.quantidadeEntradas),
                          "numero"
                        )}

                        {linhaComparativo(
                          "Resultado",
                          valor(fechamento, "lucro"),
                          valor(anterior, "lucro")
                        )}

                        {linhaComparativo(
                          "Receb. antigos",
                          recebimentosAntigos,
                          valor(anterior, "recebimentosAntigos")
                        )}

                        {linhaComparativo(
                          "Notas abertas",
                          carteira.valorOriginal,
                          carteiraAnterior?.valorOriginal || 0,
                          "moeda",
                          true
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: 14,
                    }}
                  >
                    <h3
                      style={{
                        color: "#f8fafc",
                        marginTop: 0,
                        marginBottom: 12,
                        fontSize: 16,
                      }}
                    >
                      Recuperação da carteira
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                        gap: 10,
                      }}
                    >
                      {linhaValor(
                        "Aberto no fechamento",
                        moeda.format(carteira.valorOriginal)
                      )}

                      {linhaValor(
                        "Recebido depois",
                        moeda.format(carteira.valorRecuperado),
                        "#86efac"
                      )}

                      {linhaValor(
                        "Ainda pendente",
                        moeda.format(carteira.valorPendente),
                        carteira.valorPendente > 0 ? "#fca5a5" : "#86efac"
                      )}

                      {linhaValor(
                        "Taxa recuperação",
                        `${carteira.taxa.toFixed(1)}%`,
                        carteira.taxa >= 80
                          ? "#86efac"
                          : carteira.taxa >= 50
                          ? "#fde68a"
                          : "#fca5a5"
                      )}
                    </div>

                    {carteira.topDevedores.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <strong
                          style={{
                            color: "#f8fafc",
                            fontSize: 14,
                          }}
                        >
                          Top devedores restantes
                        </strong>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 10,
                          }}
                        >
                          {carteira.topDevedores.slice(0, 5).map((cliente) => (
                            <div
                              key={cliente.cliente}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                background: "#0f172a",
                                border: "1px solid #1e293b",
                                borderRadius: 12,
                                padding: "9px 10px",
                              }}
                            >
                              <span style={{ color: "#cbd5e1" }}>
                                {cliente.cliente} · {cliente.quantidade} nota(s)
                              </span>

                              <strong style={{ color: "#fca5a5" }}>
                                {moeda.format(cliente.valor)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      background: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: 18,
                      padding: 14,
                    }}
                  >
                    <label
                      style={{
                        ...styles.label,
                        marginBottom: 8,
                      }}
                    >
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
                      style={{
                        ...styles.botao,
                        marginTop: 10,
                      }}
                      onClick={() => salvarObservacao(fechamento)}
                    >
                      Salvar observação
                    </button>

                    {fechamento.observacaoAtualizadaEm && (
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          margin: "8px 0 0 0",
                        }}
                      >
                        Última atualização:{" "}
                        {new Date(
                          fechamento.observacaoAtualizadaEm
                        ).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 4,
                    }}
                  >
                    <button
                      style={styles.botaoCinza}
                      onClick={() => gerarPdfFechamento(fechamento)}
                    >
                      Baixar PDF
                    </button>

                    <button
                      style={styles.botaoCinza}
                      onClick={() => alternarAberto(fechamento.id)}
                    >
                      {aberto ? "Ocultar notas" : "Ver notas"}
                    </button>

                    <button
                      style={{
                        ...styles.botaoDashboard,
                        background: "#dc2626",
                      }}
                      onClick={() => excluirFechamento(fechamento.id)}
                    >
                      Excluir fechamento
                    </button>
                  </div>

                  {aberto && (
                    <div
                      style={{
                        background: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: 18,
                        padding: 14,
                        marginTop: 4,
                      }}
                    >
                      <h3
                        style={{
                          color: "#f8fafc",
                          marginTop: 0,
                          marginBottom: 12,
                          fontSize: 16,
                        }}
                      >
                        Notas em aberto no fechamento
                      </h3>

                      {carteira.notas.length === 0 ? (
                        <p style={styles.vazio}>
                          Nenhuma nota detalhada foi salva neste fechamento.
                        </p>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              ...styles.tabela,
                              minWidth: 860,
                            }}
                          >
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
                                  <td style={styles.tdPlaca}>
                                    {nota.placa || "-"}
                                  </td>
                                  <td style={styles.td}>{nota.produto || "-"}</td>
                                  <td style={styles.td}>{dataBR(nota.data)}</td>
                                  <td style={styles.td}>
                                    {nota.diaPagoAtual
                                      ? dataBR(nota.diaPagoAtual)
                                      : "-"}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card titulo="Resumo acumulado dos fechamentos">
        <div style={styles.kpisModernos}>
          <CardIndicador
            titulo="Fechamentos salvos"
            valorTexto={resumoGeral.fechamentos}
            destaque
          />

          <CardIndicador
            titulo="Faturamento acumulado"
            valorTexto={moeda.format(resumoGeral.faturamento)}
          />

          <CardIndicador
            titulo="Total recebido"
            valorTexto={moeda.format(resumoGeral.recebido)}
          />

          <CardIndicador
            titulo="Serviços realizados"
            valorTexto={resumoGeral.servicos}
          />

          <CardIndicador
            titulo="Notas em aberto"
            valorTexto={moeda.format(resumoGeral.notasAberto)}
          />

          <CardIndicador
            titulo="Saldo final acumulado"
            valorTexto={moeda.format(resumoGeral.saldoTotal)}
          />
        </div>
      </Card>
    </>
  );
}