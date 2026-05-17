import {
  useMemo,
  useState,
} from "react";

import jsPDF from "jspdf";

import Card from "../components/Card.jsx";
import Tabela from "../components/Tabela.jsx";

import styles from "../styles/styles.js";

export default function Pendencias({
  entradas,
  moeda,
  chavePix,
  clientePendenciaSelecionado,
  setClientePendenciaSelecionado,
  salvarRelacaoPaga,
  historicoRelacoes,
  excluirRelacaoHistorico,
}) {
  const [
    diaPagamento,
    setDiaPagamento,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const dadosEmpresa = {
    nome: "Emplacar",

    subtitulo:
      "Relação de Serviços em Aberto",

    cnpj:
      "63.488.249/0001-08",

    email:
      "emplacarmcr@gmail.com",

    whatsapp:
      "45 2031-1407",

    endereco:
      "Rua Rio de Janeiro, 1766 - Centro - Marechal Cândido Rondon/PR",
  };

  const pendenciasClientes =
    useMemo(() => {
      const mapa = {};

      entradas
        .filter(
          (entrada) =>
            entrada.status !==
              "Pago" ||
            (entrada.formaPagamento ===
              "Nota / Faturado" &&
              !entrada.diaPago)
        )
        .forEach((entrada) => {
          const cliente =
            entrada.cliente ||
            "Sem cliente";

          if (!mapa[cliente]) {
            mapa[cliente] = {
              cliente,
              quantidade: 0,
              total: 0,
              itens: [],
            };
          }

          mapa[
            cliente
          ].quantidade += 1;

          mapa[
            cliente
          ].total +=
            entrada.valor;

          mapa[
            cliente
          ].itens.push(
            entrada
          );
        });

      return Object.values(
        mapa
      ).sort(
        (a, b) =>
          b.total - a.total
      );
    }, [entradas]);

  const detalhePendencia =
    pendenciasClientes.find(
      (item) =>
        item.cliente ===
        clientePendenciaSelecionado
    );

  function dataBR(data) {
    if (
      !data ||
      !data.includes("-")
    )
      return data || "";

    const [ano, mes, dia] =
      data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function gerarMensagemCobranca(
    pendencia
  ) {
    if (!pendencia)
      return "";

    const linhas =
      pendencia.itens
        .map(
          (item) =>
            `${
              item.placa ||
              "Sem placa"
            } - ${moeda.format(
              item.valor
            )} - ${
              item.produto ||
              "Serviço"
            }`
        )
        .join("\n");

    return `Olá, tudo bem?

Segue a relação das placas em aberto:

${linhas}

Total em aberto: ${moeda.format(
      pendencia.total
    )}

Chave Pix: ${chavePix}

Observação: quando houver acréscimo de R$ 25,00 no serviço, o valor corresponde ao procedimento de replaca, aplicado quando necessário para regularização ou substituição da placa.

Após o pagamento, nos envie o comprovante, por favor.`;
  }

  function copiarCobranca(
    pendencia
  ) {
    navigator.clipboard.writeText(
      gerarMensagemCobranca(
        pendencia
      )
    );
  }

  function carregarLogo() {
    return new Promise(
      (resolve) => {
        const img =
          new Image();

        img.src =
          "/logo-emplacar.png";

        img.onload = () =>
          resolve(img);

        img.onerror = () =>
          resolve(null);
      }
    );
  }

  async function gerarPdfPendencia(
    pendencia
  ) {
    if (!pendencia)
      return;

    const doc = new jsPDF(
      "p",
      "mm",
      "a4"
    );

    const logo =
      await carregarLogo();

    const larguraPagina =
      doc.internal.pageSize.getWidth();

    const margem = 14;

    let y = 16;

    doc.setFillColor(
      15,
      23,
      42
    );

    doc.rect(
      0,
      0,
      larguraPagina,
      38,
      "F"
    );

    if (logo) {
      doc.addImage(
        logo,
        "PNG",
        margem,
        8,
        24,
        24
      );
    }

    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(18);

    doc.text(
      dadosEmpresa.nome,
      logo ? 44 : margem,
      17
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      dadosEmpresa.subtitulo,
      logo ? 44 : margem,
      24
    );

    doc.text(
      `CNPJ: ${dadosEmpresa.cnpj}`,
      logo ? 44 : margem,
      30
    );

    y = 50;

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(14);

    doc.text(
      "Cliente",
      margem,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(11);

    doc.text(
      pendencia.cliente,
      margem,
      y
    );

    y += 10;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.text(
      "Resumo",
      margem,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.text(
      `Quantidade de serviços em aberto: ${pendencia.quantidade}`,
      margem,
      y
    );

    y += 6;

    doc.text(
      `Total em aberto: ${moeda.format(
        pendencia.total
      )}`,
      margem,
      y
    );

    y += 12;

    doc.setFillColor(
      219,
      234,
      254
    );

    doc.rect(
      margem,
      y,
      larguraPagina -
        margem * 2,
      9,
      "F"
    );

    doc.setTextColor(
      30,
      64,
      175
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "Data",
      margem + 2,
      y + 6
    );

    doc.text(
      "Serviço",
      margem + 25,
      y + 6
    );

    doc.text(
      "Placa",
      margem + 90,
      y + 6
    );

    doc.text(
      "Valor",
      margem + 130,
      y + 6
    );

    doc.text(
      "Status",
      margem + 160,
      y + 6
    );

    y += 11;

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    pendencia.itens.forEach(
      (item) => {
        if (y > 260) {
          doc.addPage();
          y = 18;
        }

        doc.text(
          dataBR(item.data),
          margem + 2,
          y
        );

        doc.text(
          String(
            item.produto ||
              "Serviço"
          ).slice(0, 32),
          margem + 25,
          y
        );

        doc.text(
          String(
            item.placa || "-"
          ),
          margem + 90,
          y
        );

        doc.text(
          moeda.format(
            item.valor
          ),
          margem + 130,
          y
        );

        doc.text(
          String(
            item.status || "-"
          ),
          margem + 160,
          y
        );

        y += 8;
      }
    );

    y += 6;

    doc.setDrawColor(
      226,
      232,
      240
    );

    doc.line(
      margem,
      y,
      larguraPagina -
        margem,
      y
    );

    y += 10;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(13);

    doc.text(
      `Total em aberto: ${moeda.format(
        pendencia.total
      )}`,
      margem,
      y
    );

    y += 9;

    doc.setFontSize(11);

    doc.text(
      `Chave Pix: ${chavePix}`,
      margem,
      y
    );

    y += 12;

    doc.setFillColor(
      248,
      250,
      252
    );

    doc.rect(
      margem,
      y,
      larguraPagina -
        margem * 2,
      25,
      "F"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(10);

    doc.text(
      "Observação",
      margem + 3,
      y + 7
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9);

    const observacao =
      "Quando houver acréscimo de R$ 25,00 no serviço, o valor corresponde ao procedimento de replaca, aplicado quando necessário para regularização, substituição ou ajuste da placa.";

    const textoQuebrado =
      doc.splitTextToSize(
        observacao,
        larguraPagina -
          margem * 2 -
          6
      );

    doc.text(
      textoQuebrado,
      margem + 3,
      y + 14
    );

    y += 35;

    doc.setTextColor(
      100,
      116,
      139
    );

    doc.setFontSize(9);

    doc.text(
      dadosEmpresa.endereco,
      margem,
      y
    );

    doc.text(
      `E-mail: ${dadosEmpresa.email} | WhatsApp: ${dadosEmpresa.whatsapp}`,
      margem,
      y + 5
    );

    const nomeArquivo = `relacao-${pendencia.cliente
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      )}.pdf`;

    doc.save(nomeArquivo);
  }

  return (
    <>
      <Card titulo="Clientes com pendência">
        <Tabela
          colunas={[
            "Cliente",
            "Placas em aberto",
            "Total",
            "Ações",
          ]}
          dados={pendenciasClientes.map(
            (pendencia) => [
              pendencia.cliente,

              pendencia.quantidade,

              moeda.format(
                pendencia.total
              ),

              <div
                style={
                  styles.acoes
                }
              >
                <button
                  style={
                    styles.editar
                  }
                  onClick={() =>
                    setClientePendenciaSelecionado(
                      pendencia.cliente
                    )
                  }
                >
                  Ver relação
                </button>

                <button
                  style={
                    styles.botaoPequeno
                  }
                  onClick={() =>
                    copiarCobranca(
                      pendencia
                    )
                  }
                >
                  Copiar cobrança
                </button>

                <button
                  style={
                    styles.detalhes
                  }
                  onClick={() =>
                    gerarPdfPendencia(
                      pendencia
                    )
                  }
                >
                  Gerar PDF
                </button>
              </div>,
            ]
          )}
        />
      </Card>

      {detalhePendencia && (
        <Card
          titulo={`Relação em aberto - ${detalhePendencia.cliente}`}
        >
          <Tabela
            colunas={[
              "Data",
              "Cliente",
              "Produto",
              "Placa",
              "Renavan",
              "Valor",
              "Status",
              "Processo",
            ]}
            dados={detalhePendencia.itens.map(
              (item) => [
                dataBR(
                  item.data
                ),

                item.cliente,

                item.produto,

                item.placa,

                item.renavan,

                moeda.format(
                  item.valor
                ),

                item.status,

                item.processo,
              ]
            )}
          />

          <div
            style={
              styles.caixaCobranca
            }
          >
            <strong>
              Total em aberto:{" "}
              {moeda.format(
                detalhePendencia.total
              )}
            </strong>

            <p>
              Chave Pix:{" "}
              {chavePix}
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap:
                  "wrap",
                alignItems:
                  "center",
              }}
            >
              <label
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap: 6,
                  fontSize: 13,
                  fontWeight:
                    "bold",
                }}
              >
                Dia do pagamento

                <input
                  type="date"
                  value={
                    diaPagamento
                  }
                  onChange={(
                    e
                  ) =>
                    setDiaPagamento(
                      e.target
                        .value
                    )
                  }
                  style={
                    styles.input
                  }
                />
              </label>

              <button
                style={
                  styles.botao
                }
                onClick={() =>
                  salvarRelacaoPaga(
                    detalhePendencia,
                    diaPagamento
                  )
                }
              >
                Salvar relação como paga
              </button>
            </div>

            <p>
              Observação:
              quando houver
              acréscimo de R$
              25,00 no
              serviço, o
              valor
              corresponde ao
              procedimento
              de replaca,
              aplicado
              quando
              necessário
              para
              regularização
              ou substituição
              da placa.
            </p>

            <div
              style={
                styles.acoes
              }
            >
              <button
                style={
                  styles.botao
                }
                onClick={() =>
                  copiarCobranca(
                    detalhePendencia
                  )
                }
              >
                Copiar
                cobrança para
                WhatsApp
              </button>

              <button
                style={
                  styles.detalhes
                }
                onClick={() =>
                  gerarPdfPendencia(
                    detalhePendencia
                  )
                }
              >
                Gerar PDF da
                relação
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card titulo="Histórico de relações pagas">
        {historicoRelacoes
          .length === 0 ? (
          <p
            style={
              styles.vazio
            }
          >
            Nenhuma relação
            salva ainda.
          </p>
        ) : (
          <Tabela
            colunas={[
              "Cliente",
              "Dia pago",
              "Qtd",
              "Total",
              "Ações",
            ]}
            dados={historicoRelacoes.map(
              (relacao) => [
                relacao.cliente,

                dataBR(
                  relacao.diaPago
                ),

                relacao.quantidade,

                moeda.format(
                  relacao.total
                ),

                <button
                  style={
                    styles.excluir
                  }
                  onClick={() =>
                    excluirRelacaoHistorico(
                      relacao.id
                    )
                  }
                >
                  Excluir do histórico
                </button>,
              ]
            )}
          />
        )}
      </Card>
    </>
  );
}