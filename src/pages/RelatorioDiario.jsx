import { useState } from "react";
import jsPDF from "jspdf";

import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Kpi from "../components/Kpi.jsx";
import html2canvas from "html2canvas";

export default function RelatorioDiario({
  hoje,

  entradas,
  saidas,
  contas,

  moeda,

  ehVendaReal,
  ehInjecaoSocios,
  ehRecuperacaoVale,
  ehValeColaborador,

  dataRecebimentoEntrada,

  metaMensal = 0,
  inicioMes = "",
  fimMes = "",
  fechamentoProvavel = "",
}) {
  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  function dataValida(data) {
    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

    const teste = new Date(data + "T00:00:00");

    return !Number.isNaN(teste.getTime());
  }

  function dataSegura(data, fallback = hoje) {
    return dataValida(data) ? data : fallback;
  }

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
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
    const dataRecebimento = dataRecebimentoEntrada(entrada);

    if (!dataRecebimento) return "";

    if (ehDebito(entrada.formaPagamento)) {
      return adicionarDiasUteis(dataRecebimento, 1);
    }

    if (ehCredito(entrada.formaPagamento)) {
      return adicionarDiasUteis(dataRecebimento, 1);
    }

    return dataRecebimento;
  }

  const entradasDia = entradas.filter((x) => x.data === dataSelecionada);

  const recebimentosDia = entradas.filter((x) => {
    const dataRecebimento = dataRecebimentoEntrada(x);

    return dataRecebimento === dataSelecionada && x.status === "Pago";
  });

  const vendasDia = entradasDia.filter(ehVendaReal);

  const faturamentoDia = vendasDia.reduce((s, x) => s + Number(x.valor || 0), 0);

  const recebimentosAntigos = recebimentosDia
    .filter((x) => x.data < dataSelecionada)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const injecoesDia = recebimentosDia
    .filter(ehInjecaoSocios)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const recuperacaoValeDia = recebimentosDia
    .filter(ehRecuperacaoVale)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const caixaRecebidoDia = recebimentosDia.reduce(
    (s, x) => s + Number(x.valor || 0),
    0
  );

  const cartoesLiquidadosDia = entradas
    .filter((x) => x.status === "Pago")
    .filter((x) => ehVendaReal(x))
    .filter((x) => ehCartaoBanco(x.formaPagamento))
    .filter((x) => dataLiquidacaoEntrada(x) === dataSelecionada)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const cartoesPagosDiaNaoLiquidados = entradas
    .filter((x) => x.status === "Pago")
    .filter((x) => ehVendaReal(x))
    .filter((x) => ehCartaoBanco(x.formaPagamento))
    .filter((x) => dataRecebimentoEntrada(x) === dataSelecionada)
    .filter((x) => dataLiquidacaoEntrada(x) > dataSelecionada)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const proximoDiaUtil = adicionarDiasUteis(dataSelecionada, 1);

  const cartoesACairProximoDiaUtil = entradas
    .filter((x) => x.status === "Pago")
    .filter((x) => ehVendaReal(x))
    .filter((x) => ehCartaoBanco(x.formaPagamento))
    .filter((x) => dataLiquidacaoEntrada(x) === proximoDiaUtil)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const saidasDia = saidas.filter((x) => x.data === dataSelecionada);

  const totalSaidasDia = saidasDia.reduce(
    (s, x) => s + Number(x.valor || 0),
    0
  );

  const valesDia = saidasDia
    .filter(ehValeColaborador)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const saldoDia = caixaRecebidoDia - totalSaidasDia;

  const saldoBancoLiquidadoDia = caixaRecebidoDia - cartoesPagosDiaNaoLiquidados;

  const ticketMedio =
    vendasDia.length > 0 ? faturamentoDia / vendasDia.length : 0;

  const faturadoAberto = entradas
    .filter(
      (x) =>
        ehVendaReal(x) &&
        x.formaPagamento === "Nota / Faturado" &&
        !x.diaPago
    )
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const contasVencidas = contas.filter(
    (x) => x.status !== "Pago" && x.vencimento <= dataSelecionada
  );

  const totalContasVencidas = contasVencidas.reduce(
    (s, x) => s + Number(x.valor || 0),
    0
  );

  const fimMeta =
    fechamentoProvavel && fechamentoProvavel >= inicioMes
      ? fechamentoProvavel
      : fimMes;

  const inicioMetaSeguro = dataSegura(inicioMes, dataSelecionada);
  const fimMetaSeguro = dataSegura(fimMeta, dataSelecionada);
  const dataFinalMeta =
    dataSelecionada > fimMetaSeguro ? fimMetaSeguro : dataSelecionada;

  const faturadoAteHoje = entradas
    .filter((x) => ehVendaReal(x))
    .filter((x) => x.data >= inicioMetaSeguro)
    .filter((x) => x.data <= dataFinalMeta)
    .reduce((s, x) => s + Number(x.valor || 0), 0);

  const diasTotaisMeta = Math.max(
    1,
    Math.floor(
      (new Date(fimMetaSeguro + "T00:00:00") -
        new Date(inicioMetaSeguro + "T00:00:00")) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const diasDecorridosMeta = Math.max(
    1,
    Math.floor(
      (new Date(dataFinalMeta + "T00:00:00") -
        new Date(inicioMetaSeguro + "T00:00:00")) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );

  const percentualMeta =
    metaMensal > 0 ? (faturadoAteHoje / metaMensal) * 100 : 0;

  const metaIdealAteHoje =
    metaMensal > 0 ? (metaMensal / diasTotaisMeta) * diasDecorridosMeta : 0;

  const ritmoAtual = faturadoAteHoje / diasDecorridosMeta;

  const ritmoIdeal = metaMensal > 0 ? metaMensal / diasTotaisMeta : 0;

  const diferencaRitmo = faturadoAteHoje - metaIdealAteHoje;

  const faltaParaMeta = Math.max(metaMensal - faturadoAteHoje, 0);

  const diasRestantesMeta = Math.max(
  Math.ceil(
    (new Date(fimMetaSeguro + "T00:00:00") -
      new Date(dataFinalMeta + "T00:00:00")) /
      (1000 * 60 * 60 * 24)
  ),
  1
);

  const metaDiariaNecessaria =
    faltaParaMeta > 0 ? faltaParaMeta / diasRestantesMeta : 0;

  const projecaoMeta = ritmoAtual * diasTotaisMeta;

  const statusMeta =
    percentualMeta >= 100
      ? "Meta batida"
      : diferencaRitmo >= 0
      ? "No ritmo certo"
      : "Abaixo do ritmo";

  const corStatusMeta =
    percentualMeta >= 100 ? "#22c55e" : diferencaRitmo >= 0 ? "#38bdf8" : "#f59e0b";

  const rankingClientes = {};

  vendasDia.forEach((venda) => {
    const nome = venda.cliente || "Sem cliente";

    rankingClientes[nome] = (rankingClientes[nome] || 0) + Number(venda.valor || 0);
  });

  const topClientes = Object.entries(rankingClientes)
    .map(([cliente, valor]) => ({
      cliente,
      valor,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  async function exportarPDF() {
    const elemento = document.querySelector("main");

    if (!elemento) {
      alert("Relatório não encontrado.");
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

    doc.save(`relatorio-diario-${dataSelecionada}.pdf`);
  }

  function copiarWhatsApp() {
    const texto = `
📊 RELATÓRIO DIÁRIO

📅 Data: ${dataSelecionada}

💰 Faturamento:
${moeda.format(faturamentoDia)}

💵 Caixa recebido:
${moeda.format(caixaRecebidoDia)}

🏦 Banco liquidado estimado:
${moeda.format(saldoBancoLiquidadoDia)}

💳 Cartões pagos hoje que ainda vão cair:
${moeda.format(cartoesPagosDiaNaoLiquidados)}

📆 Próximo dia útil cai:
${moeda.format(cartoesACairProximoDiaUtil)}

📉 Saídas:
${moeda.format(totalSaidasDia)}

📈 Saldo do dia:
${moeda.format(saldoDia)}

🧾 Ticket médio:
${moeda.format(ticketMedio)}

🚗 Serviços realizados:
${vendasDia.length}

📌 Faturado em aberto:
${moeda.format(faturadoAberto)}

⚠️ Contas vencidas:
${moeda.format(totalContasVencidas)}

🎯 META

Meta mensal:
${moeda.format(metaMensal || 0)}

Faturado até hoje:
${moeda.format(faturadoAteHoje)}

Meta atingida:
${percentualMeta.toFixed(1)}%

Status:
${statusMeta}

Falta para meta:
${moeda.format(faltaParaMeta)}

Projeção:
${moeda.format(projecaoMeta)}
`;

    navigator.clipboard.writeText(texto);

    alert("Resumo copiado para WhatsApp.");
  }

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>Relatório Diário</h1>

          <p style={styles.dashboardSubtitulo}>
            Fechamento executivo operacional
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <button style={styles.botaoDashboard} onClick={exportarPDF}>
            Exportar PDF
          </button>

          <button
            style={{
              ...styles.botaoDashboard,
              background: "linear-gradient(135deg,#16a34a 0%,#15803d 100%)",
            }}
            onClick={copiarWhatsApp}
          >
            Copiar WhatsApp
          </button>
        </div>
      </div>

      <Card titulo="Data analisada">
        <div style={styles.formGrid}>
          <Campo
            label="Selecionar dia"
            tipo="date"
            valor={dataSelecionada}
            mudar={setDataSelecionada}
          />
        </div>
      </Card>

      <div style={styles.kpisModernos}>
        <Kpi titulo="Faturamento" valor={moeda.format(faturamentoDia)} />

        <Kpi titulo="Caixa Recebido" valor={moeda.format(caixaRecebidoDia)} />

        <Kpi
          titulo="Banco Liquidado"
          valor={moeda.format(saldoBancoLiquidadoDia)}
        />

        <Kpi
          titulo="Cartão a Cair"
          valor={moeda.format(cartoesPagosDiaNaoLiquidados)}
        />

        <Kpi
          titulo="Cai Próximo Dia Útil"
          valor={moeda.format(cartoesACairProximoDiaUtil)}
        />

        <Kpi titulo="Saldo do Dia" valor={moeda.format(saldoDia)} />

        <Kpi
          titulo="Recebidos Antigos"
          valor={moeda.format(recebimentosAntigos)}
        />

        <Kpi titulo="Injeção Sócios" valor={moeda.format(injecoesDia)} />

        <Kpi
          titulo="Recuperação Vale"
          valor={moeda.format(recuperacaoValeDia)}
        />

        <Kpi titulo="Faturado Aberto" valor={moeda.format(faturadoAberto)} />

        <Kpi
          titulo="Contas Vencidas"
          valor={moeda.format(totalContasVencidas)}
        />
      </div>

      <Card titulo="Status da Meta">
        <div style={styles.kpisModernos}>
          <Kpi titulo="Meta Mensal" valor={moeda.format(metaMensal || 0)} />

          <Kpi titulo="Faturado até hoje" valor={moeda.format(faturadoAteHoje)} />

          <Kpi titulo="Meta atingida" valor={`${percentualMeta.toFixed(1)}%`} />

          <Kpi titulo="Falta para meta" valor={moeda.format(faltaParaMeta)} />

          <Kpi
            titulo="Meta diária necessária"
            valor={moeda.format(metaDiariaNecessaria)}
          />

          <Kpi titulo="Projeção" valor={moeda.format(projecaoMeta)} />
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 18,
            borderRadius: 18,
            background: "linear-gradient(135deg,#0f172a 0%,#111827 100%)",
            border: `1px solid ${corStatusMeta}`,
            color: "#e5e7eb",
            boxShadow: "0 18px 35px rgba(0,0,0,0.28)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            Situação da meta
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 6,
              color: corStatusMeta,
              fontSize: 26,
            }}
          >
            {statusMeta}
          </strong>

          <p
            style={{
              margin: "10px 0 0 0",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            Ritmo atual: {moeda.format(ritmoAtual)} por dia.
            <br />
            Ritmo ideal: {moeda.format(ritmoIdeal)} por dia.
            <br />
            Diferença contra o ritmo ideal: {moeda.format(diferencaRitmo)}.
          </p>
        </div>
      </Card>

      <div style={styles.dashboardGridNova}>
        <Card titulo="Resumo operacional">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                }}
              >
                Serviços realizados
              </p>

              <strong
                style={{
                  fontSize: 28,
                  color: "#38bdf8",
                }}
              >
                {vendasDia.length}
              </strong>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                }}
              >
                Ticket médio
              </p>

              <strong
                style={{
                  fontSize: 28,
                  color: "#22c55e",
                }}
              >
                {moeda.format(ticketMedio)}
              </strong>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                }}
              >
                Saídas do dia
              </p>

              <strong
                style={{
                  fontSize: 28,
                  color: "#ef4444",
                }}
              >
                {moeda.format(totalSaidasDia)}
              </strong>
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  color: "#94a3b8",
                }}
              >
                Vales concedidos
              </p>

              <strong
                style={{
                  fontSize: 28,
                  color: "#f59e0b",
                }}
              >
                {moeda.format(valesDia)}
              </strong>
            </div>
          </div>
        </Card>

        <Card titulo="Top clientes">
          {topClientes.length === 0 ? (
            <p style={styles.vazio}>Nenhuma venda nesse dia.</p>
          ) : (
            topClientes.map((cliente) => (
              <div
                key={cliente.cliente}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                <span>{cliente.cliente}</span>

                <strong
                  style={{
                    color: "#38bdf8",
                  }}
                >
                  {moeda.format(cliente.valor)}
                </strong>
              </div>
            ))
          )}
        </Card>

        <Card titulo="Contas vencidas">
          {contasVencidas.length === 0 ? (
            <p style={styles.vazio}>Nenhuma conta vencida.</p>
          ) : (
            contasVencidas.map((conta) => (
              <div
                key={conta.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                <span>{conta.conta}</span>

                <strong
                  style={{
                    color: "#ef4444",
                  }}
                >
                  {moeda.format(conta.valor)}
                </strong>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}