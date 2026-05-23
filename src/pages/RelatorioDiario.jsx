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
}) {
  const [dataSelecionada, setDataSelecionada] =
    useState(hoje);

  const entradasDia = entradas.filter(
    (x) => x.data === dataSelecionada
  );

  const recebimentosDia = entradas.filter((x) => {
    const dataRecebimento =
      dataRecebimentoEntrada(x);

    return (
      dataRecebimento === dataSelecionada &&
      x.status === "Pago"
    );
  });

  const vendasDia =
    entradasDia.filter(ehVendaReal);

  const faturamentoDia =
    vendasDia.reduce(
      (s, x) => s + x.valor,
      0
    );

  const recebimentosAntigos =
    recebimentosDia
      .filter(
        (x) =>
          x.data < dataSelecionada
      )
      .reduce(
        (s, x) => s + x.valor,
        0
      );

  const injecoesDia =
    recebimentosDia
      .filter(ehInjecaoSocios)
      .reduce(
        (s, x) => s + x.valor,
        0
      );

  const recuperacaoValeDia =
    recebimentosDia
      .filter(ehRecuperacaoVale)
      .reduce(
        (s, x) => s + x.valor,
        0
      );

  const caixaRecebidoDia =
    recebimentosDia.reduce(
      (s, x) => s + x.valor,
      0
    );

  const saidasDia =
    saidas.filter(
      (x) =>
        x.data === dataSelecionada
    );

  const totalSaidasDia =
    saidasDia.reduce(
      (s, x) => s + x.valor,
      0
    );

  const valesDia =
    saidasDia
      .filter(ehValeColaborador)
      .reduce(
        (s, x) => s + x.valor,
        0
      );

  const saldoDia =
    caixaRecebidoDia -
    totalSaidasDia;

  const ticketMedio =
    vendasDia.length > 0
      ? faturamentoDia /
        vendasDia.length
      : 0;

  const faturadoAberto =
    entradas
      .filter(
        (x) =>
          ehVendaReal(x) &&
          x.formaPagamento ===
            "Nota / Faturado" &&
          !x.diaPago
      )
      .reduce(
        (s, x) => s + x.valor,
        0
      );

  const contasVencidas =
    contas.filter(
      (x) =>
        x.status !== "Pago" &&
        x.vencimento <=
          dataSelecionada
    );

  const totalContasVencidas =
    contasVencidas.reduce(
      (s, x) => s + x.valor,
      0
    );

  const rankingClientes = {};

  vendasDia.forEach((venda) => {
    const nome =
      venda.cliente ||
      "Sem cliente";

    rankingClientes[nome] =
      (rankingClientes[nome] || 0) +
      venda.valor;
  });

  const topClientes =
    Object.entries(rankingClientes)
      .map(([cliente, valor]) => ({
        cliente,
        valor,
      }))
      .sort(
        (a, b) =>
          b.valor - a.valor
      )
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
`;

  navigator.clipboard.writeText(texto);

  alert("Resumo copiado para WhatsApp.");
}
  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1
            style={
              styles.dashboardTitulo
            }
          >
            Relatório Diário
          </h1>

          <p
            style={
              styles.dashboardSubtitulo
            }
          >
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
            mudar={
              setDataSelecionada
            }
          />
        </div>
      </Card>

      <div style={styles.kpisModernos}>
        <Kpi
          titulo="Faturamento"
          valor={moeda.format(
            faturamentoDia
          )}
        />

        <Kpi
          titulo="Caixa Recebido"
          valor={moeda.format(
            caixaRecebidoDia
          )}
        />

        <Kpi
          titulo="Saldo do Dia"
          valor={moeda.format(
            saldoDia
          )}
        />

        <Kpi
          titulo="Recebidos Antigos"
          valor={moeda.format(
            recebimentosAntigos
          )}
        />

        <Kpi
          titulo="Injeção Sócios"
          valor={moeda.format(
            injecoesDia
          )}
        />

        <Kpi
          titulo="Recuperação Vale"
          valor={moeda.format(
            recuperacaoValeDia
          )}
        />

        <Kpi
          titulo="Faturado Aberto"
          valor={moeda.format(
            faturadoAberto
          )}
        />

        <Kpi
          titulo="Contas Vencidas"
          valor={moeda.format(
            totalContasVencidas
          )}
        />
      </div>

      <div style={styles.dashboardGridNova}>
        <Card titulo="Resumo operacional">
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
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
                {moeda.format(
                  ticketMedio
                )}
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
                {moeda.format(
                  totalSaidasDia
                )}
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
                {moeda.format(
                  valesDia
                )}
              </strong>
            </div>
          </div>
        </Card>

        <Card titulo="Top clientes">
          {topClientes.length ===
          0 ? (
            <p style={styles.vazio}>
              Nenhuma venda nesse dia.
            </p>
          ) : (
            topClientes.map(
              (cliente) => (
                <div
                  key={
                    cliente.cliente
                  }
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    padding:
                      "10px 0",
                    borderBottom:
                      "1px solid #1e293b",
                  }}
                >
                  <span>
                    {
                      cliente.cliente
                    }
                  </span>

                  <strong
                    style={{
                      color:
                        "#38bdf8",
                    }}
                  >
                    {moeda.format(
                      cliente.valor
                    )}
                  </strong>
                </div>
              )
            )
          )}
        </Card>

        <Card titulo="Contas vencidas">
          {contasVencidas.length ===
          0 ? (
            <p style={styles.vazio}>
              Nenhuma conta vencida.
            </p>
          ) : (
            contasVencidas.map(
              (conta) => (
                <div
                  key={conta.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    padding:
                      "10px 0",
                    borderBottom:
                      "1px solid #1e293b",
                  }}
                >
                  <span>
                    {conta.conta}
                  </span>

                  <strong
                    style={{
                      color:
                        "#ef4444",
                    }}
                  >
                    {moeda.format(
                      conta.valor
                    )}
                  </strong>
                </div>
              )
            )
          )}
        </Card>
      </div>
    </>
  );
}