import { useMemo, useState } from "react";
import jsPDF from "jspdf";

import Card from "../components/Card.jsx";
import Tabela from "../components/Tabela.jsx";
import styles from "../styles/styles.js";

export default function Pendencias({
  entradas,
  moeda,
  chavePix,
  dadosEmpresa = {},
  clientePendenciaSelecionado,
  setClientePendenciaSelecionado,
  salvarRelacaoPaga,
  historicoRelacoes,
  desfazerUltimaRelacaoPaga,
  excluirRelacaoHistorico,
}) {
  const [diaPagamento, setDiaPagamento] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [selecionados, setSelecionados] = useState([]);

  const formasPagamento = [
    "Pix",
    "Débito",
    "Crédito",
    "Depósito",
    "Cheque",
    "Dinheiro",
  ];

  const empresaPdf = {
    nome: dadosEmpresa.nome || "Empresa não configurada",
    subtitulo: "Relação de Serviços",
    cnpj: dadosEmpresa.cnpj || "",
    ie: dadosEmpresa.ie || "",
    email: dadosEmpresa.email || "",
    whatsapp: dadosEmpresa.whatsapp || "",
    pix: dadosEmpresa.pix || chavePix || "",
    logo: dadosEmpresa.logo || "",
    endereco: [
      dadosEmpresa.logradouro,
      dadosEmpresa.numero,
      dadosEmpresa.bairro,
      dadosEmpresa.cidade,
      dadosEmpresa.cep,
    ]
      .filter(Boolean)
      .join(" - "),
  };

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function nomeArquivo(texto) {
    return String(texto || "relacao")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function carregarLogo() {
    return new Promise((resolve) => {
      if (!empresaPdf.logo) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = empresaPdf.logo;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  }

  const pendenciasClientes = useMemo(() => {
    const mapa = {};

    entradas
      .filter(
        (entrada) =>
          entrada.status !== "Pago" ||
          (entrada.formaPagamento === "Nota / Faturado" && !entrada.diaPago)
      )
      .forEach((entrada) => {
        const cliente = entrada.cliente || "Sem cliente";

        if (!mapa[cliente]) {
          mapa[cliente] = {
            cliente,
            quantidade: 0,
            total: 0,
            itens: [],
          };
        }

        mapa[cliente].quantidade += 1;
        mapa[cliente].total += Number(entrada.valor || 0);
        mapa[cliente].itens.push(entrada);
      });

    return Object.values(mapa).sort((a, b) => b.total - a.total);
  }, [entradas]);

  const detalhePendencia = pendenciasClientes.find(
    (item) => item.cliente === clientePendenciaSelecionado
  );

  const itensSelecionados = useMemo(() => {
    if (!detalhePendencia) return [];

    return detalhePendencia.itens.filter((item) =>
      selecionados.includes(item.id)
    );
  }, [detalhePendencia, selecionados]);

  const totalSelecionado = itensSelecionados.reduce(
    (soma, item) => soma + Number(item.valor || 0),
    0
  );

  function alternarSelecionado(id) {
    setSelecionados((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  }

  function selecionarTodos() {
    if (!detalhePendencia) return;
    setSelecionados(detalhePendencia.itens.map((item) => item.id));
  }

  function limparSelecao() {
    setSelecionados([]);
  }

  function salvarSelecionados() {
    if (!detalhePendencia) return;

    if (itensSelecionados.length === 0) {
      alert("Selecione pelo menos um serviço.");
      return;
    }

    salvarRelacaoPaga(
      {
        cliente: detalhePendencia.cliente,
        quantidade: itensSelecionados.length,
        total: totalSelecionado,
        itens: itensSelecionados,
      },
      diaPagamento,
      formaPagamento
    );

    setSelecionados([]);
  }

  function salvarRelacaoInteira() {
    if (!detalhePendencia) return;

    salvarRelacaoPaga(detalhePendencia, diaPagamento, formaPagamento);

    setSelecionados([]);
  }

  function gerarMensagemCobranca(pendencia) {
    if (!pendencia) return "";

    const linhas = pendencia.itens
      .map(
        (item) =>
          `${item.placa || "Sem placa"} - ${moeda.format(
            item.valor
          )} - ${item.produto || "Serviço"}`
      )
      .join("\n");

    return `Olá, tudo bem?

Segue a relação dos serviços em aberto:

${linhas}

Total em aberto: ${moeda.format(pendencia.total)}

Chave Pix: ${empresaPdf.pix || "-"}

Após o pagamento, nos envie o comprovante, por favor.`;
  }

  function copiarCobranca(pendencia) {
    navigator.clipboard.writeText(gerarMensagemCobranca(pendencia));
    alert("Cobrança copiada.");
  }

  function abrirWhatsAppCobranca(pendencia) {
    const mensagem = encodeURIComponent(gerarMensagemCobranca(pendencia));
    window.open(`https://web.whatsapp.com/send?text=${mensagem}`, "_blank");
  }

  function desenharCabecalho(doc, logo, titulo, horizontal) {
    const larguraPagina = doc.internal.pageSize.getWidth();
    const margem = 10;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, larguraPagina, horizontal ? 32 : 38, "F");

    if (logo) {
      doc.addImage(
        logo,
        "PNG",
        margem,
        6,
        horizontal ? 20 : 24,
        horizontal ? 20 : 24
      );
    }

    const xTexto = logo ? (horizontal ? 36 : 42) : margem;

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 15 : 18);
    doc.text(empresaPdf.nome, xTexto, horizontal ? 13 : 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(horizontal ? 8 : 9);
    doc.text(titulo, xTexto, horizontal ? 19 : 23);

    const linhaDocumento = [
      empresaPdf.cnpj ? `CNPJ: ${empresaPdf.cnpj}` : "",
      empresaPdf.ie ? `IE: ${empresaPdf.ie}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    if (linhaDocumento) {
      doc.text(linhaDocumento, xTexto, horizontal ? 25 : 30);
    }
  }

  function desenharRodape(doc, horizontal) {
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const margem = 10;
    const rodapeY = alturaPagina - 24;

    doc.setDrawColor(226, 232, 240);
    doc.line(margem, rodapeY - 8, larguraPagina - margem, rodapeY - 8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(horizontal ? 8 : 9);

    if (empresaPdf.pix) {
      doc.text(`Chave Pix: ${empresaPdf.pix}`, margem, rodapeY);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    if (empresaPdf.endereco) {
      doc.text(empresaPdf.endereco.slice(0, 120), margem, rodapeY + 7);
    }

    const contato = [
      empresaPdf.email ? `E-mail: ${empresaPdf.email}` : "",
      empresaPdf.whatsapp ? `WhatsApp: ${empresaPdf.whatsapp}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    if (contato) {
      doc.text(contato.slice(0, 120), margem, rodapeY + 13);
    }
  }

  function desenharResumoRelacao(doc, dados, horizontal, yInicial, tipo = "aberta") {
    const margem = 10;
    let y = yInicial;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 9 : 11);

    if (horizontal) {
      const totalTexto =
        tipo === "paga"
          ? `Total recebido: ${moeda.format(Number(dados.total || 0))}`
          : `Total em aberto: ${moeda.format(Number(dados.total || 0))}`;

      doc.text(`Cliente: ${dados.cliente || "-"}`, margem, y);
      doc.text(`Qtd: ${dados.quantidade || dados.itens?.length || 0}`, 105, y);
      doc.text(totalTexto, 135, y);

      if (tipo === "paga") {
        y += 6;
        doc.text(`Pago em: ${dataBR(dados.diaPago)}`, margem, y);
        doc.text(`Forma: ${dados.formaPagamento || "-"}`, 105, y);
      }

      return y + 9;
    }

    doc.text(`Cliente: ${dados.cliente || "-"}`, margem, y);
    y += 7;

    if (tipo === "paga") {
      doc.text(`Data do pagamento: ${dataBR(dados.diaPago)}`, margem, y);
      y += 7;
      doc.text(`Forma de pagamento: ${dados.formaPagamento || "-"}`, margem, y);
      y += 7;
      doc.text(`Quantidade paga: ${dados.quantidade || dados.itens?.length || 0}`, margem, y);
      y += 7;
      doc.text(`Total recebido: ${moeda.format(Number(dados.total || 0))}`, margem, y);
      y += 11;
    } else {
      doc.text(`Qtd: ${dados.quantidade || dados.itens?.length || 0}`, margem, y);
      y += 7;
      doc.text(`Total em aberto: ${moeda.format(Number(dados.total || 0))}`, margem, y);
      y += 11;
    }

    return y;
  }

  function desenharTabelaServicos(doc, itens, horizontal, yInicial) {
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const margem = 10;
    const limiteRodape = alturaPagina - 42;

    function cabecalhoTabela(x, y, larguraTabela, compacto) {
      doc.setFillColor(219, 234, 254);
      doc.rect(x, y - 5, larguraTabela, 8, "F");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(compacto ? 6.5 : 7.5);

      doc.text("Data", x + 2, y);
      doc.text("Produto", x + (compacto ? 22 : 25), y);
      doc.text("Placa", x + (compacto ? 70 : 88), y);
      doc.text("Renavam", x + (compacto ? 94 : 122), y);
      doc.text("Valor", x + (compacto ? larguraTabela - 18 : larguraTabela - 24), y);
    }

    function linhaTabela(item, index, x, y, larguraTabela, compacto) {
      const alturaLinha = compacto ? 3.9 : 5.4;

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y - 3.3, larguraTabela, alturaLinha, "F");
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(compacto ? 6.1 : 7);

      doc.text(dataBR(item.data), x + 2, y);
      doc.text(
        String(item.produto || "Serviço").slice(0, compacto ? 20 : 32),
        x + (compacto ? 22 : 25),
        y
      );
      doc.text(
        String(item.placa || "-").slice(0, 10),
        x + (compacto ? 70 : 88),
        y
      );
      doc.text(
        String(item.renavan || "-").slice(0, 14),
        x + (compacto ? 94 : 122),
        y
      );
      doc.text(
        moeda.format(Number(item.valor || 0)),
        x + (compacto ? larguraTabela - 18 : larguraTabela - 24),
        y
      );

      return alturaLinha;
    }

    if (horizontal) {
      const gap = 8;
      const larguraTabela = (larguraPagina - margem * 2 - gap) / 2;
      const xEsquerda = margem;
      const xDireita = margem + larguraTabela + gap;
      const alturaLinha = 3.9;
      const linhasPorColuna = Math.max(
        1,
        Math.floor((limiteRodape - (yInicial + 5)) / alturaLinha)
      );

      let paginaItens = itens;
      let pagina = 0;

      while (paginaItens.length > 0) {
        if (pagina > 0) {
          doc.addPage("a4", "l");
          yInicial = 42;

          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text("Continuação da relação", margem, yInicial - 8);
        }

        let yEsquerda = yInicial;
        let yDireita = yInicial;

        cabecalhoTabela(xEsquerda, yEsquerda, larguraTabela, true);
        cabecalhoTabela(xDireita, yDireita, larguraTabela, true);

        yEsquerda += 5;
        yDireita += 5;

        const limitePagina = linhasPorColuna * 2;
        const itensDaPagina = paginaItens.slice(0, limitePagina);

        itensDaPagina.forEach((item, index) => {
          if (index < linhasPorColuna) {
            linhaTabela(item, index, xEsquerda, yEsquerda, larguraTabela, true);
            yEsquerda += alturaLinha;
          } else {
            linhaTabela(item, index, xDireita, yDireita, larguraTabela, true);
            yDireita += alturaLinha;
          }
        });

        desenharRodape(doc, true);

        paginaItens = paginaItens.slice(limitePagina);
        pagina += 1;
      }

      return;
    }

    let y = yInicial;
    const larguraTabela = larguraPagina - margem * 2;
    const alturaLinha = 5.4;

    cabecalhoTabela(margem, y, larguraTabela, false);
    y += 5;

    itens.forEach((item, index) => {
      if (y > limiteRodape) {
        desenharRodape(doc, false);
        doc.addPage("a4", "p");
        y = 50;

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Continuação da relação", margem, y - 8);

        cabecalhoTabela(margem, y, larguraTabela, false);
        y += 5;
      }

      linhaTabela(item, index, margem, y, larguraTabela, false);
      y += alturaLinha;
    });

    desenharRodape(doc, false);
  }

  async function gerarPdfPendencia(pendencia) {
    if (!pendencia) return;

    const itens = Array.isArray(pendencia.itens) ? pendencia.itens : [];
    const horizontal = itens.length > 34;
    const doc = new jsPDF(horizontal ? "l" : "p", "mm", "a4");
    const logo = await carregarLogo();

    desenharCabecalho(doc, logo, "Relação de Serviços em Aberto", horizontal);

    const yResumo = horizontal ? 42 : 50;
    const yTabela = desenharResumoRelacao(
      doc,
      {
        ...pendencia,
        quantidade: pendencia.quantidade || itens.length,
        total: pendencia.total || 0,
      },
      horizontal,
      yResumo,
      "aberta"
    );

    desenharTabelaServicos(doc, itens, horizontal, yTabela);

    doc.save(`relacao-aberta-${nomeArquivo(pendencia.cliente)}.pdf`);
  }

  function desenharCarimboPago(doc, relacao, horizontal) {
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();

    doc.saveGraphicsState();
    doc.setTextColor(248, 113, 113);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 82 : 68);

    doc.text("PAGO", larguraPagina / 2, alturaPagina / 2 + 40, {
      align: "center",
      angle: -22,
    });

    doc.restoreGraphicsState();

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(horizontal ? 6.5 : 6);

    const margem = 12;
    const infoX = larguraPagina - margem;
    const infoY = alturaPagina - 10;

    doc.text(`Pago em: ${dataBR(relacao.diaPago)}`, infoX, infoY - 8, {
      align: "right",
    });

    doc.text(
      `Forma: ${String(relacao.formaPagamento || "-").toUpperCase()}`,
      infoX,
      infoY - 4,
      { align: "right" }
    );

    doc.text(`Valor: ${moeda.format(Number(relacao.total || 0))}`, infoX, infoY, {
      align: "right",
    });
  }

  async function gerarPdfRelacaoPaga(relacao) {
    if (!relacao) return;

    const itens = Array.isArray(relacao.itens) ? relacao.itens : [];
    const horizontal = itens.length > 34;
    const doc = new jsPDF(horizontal ? "l" : "p", "mm", "a4");
    const logo = await carregarLogo();

    desenharCabecalho(doc, logo, "Comprovante de Relação Paga", horizontal);

    const yResumo = horizontal ? 42 : 50;
    const yTabela = desenharResumoRelacao(
      doc,
      {
        ...relacao,
        quantidade: relacao.quantidade || itens.length,
        total: relacao.total || 0,
      },
      horizontal,
      yResumo,
      "paga"
    );

    desenharTabelaServicos(doc, itens, horizontal, yTabela);
    desenharCarimboPago(doc, relacao, horizontal);

    doc.save(`comprovante-pago-${nomeArquivo(relacao.cliente)}.pdf`);
  }

  return (
    <>
      <Card titulo="Clientes com pendência">
        <Tabela
          colunas={["Cliente", "Placas em aberto", "Total", "Ações"]}
          dados={pendenciasClientes.map((pendencia) => [
            pendencia.cliente,
            pendencia.quantidade,
            moeda.format(pendencia.total),
            <div style={styles.acoes}>
              <button
                style={styles.editar}
                onClick={() => {
                  setClientePendenciaSelecionado(pendencia.cliente);
                  setSelecionados([]);
                }}
              >
                Ver relação
              </button>

              <button
                style={styles.copiar}
                onClick={() => abrirWhatsAppCobranca(pendencia)}
              >
                WhatsApp cobrança
              </button>

              <button
                style={styles.botaoPequeno}
                onClick={() => copiarCobranca(pendencia)}
              >
                Copiar cobrança
              </button>

              <button
                style={styles.detalhes}
                onClick={() => gerarPdfPendencia(pendencia)}
              >
                Gerar PDF
              </button>
            </div>,
          ])}
        />
      </Card>

      {detalhePendencia && (
        <Card titulo={`Relação em aberto - ${detalhePendencia.cliente}`}>
          <div style={styles.caixaCobranca}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div>
                <strong>Total em aberto</strong>
                <p style={{ margin: "6px 0 0 0" }}>
                  {moeda.format(detalhePendencia.total)}
                </p>
              </div>

              <div>
                <strong>Selecionados</strong>
                <p style={{ margin: "6px 0 0 0" }}>
                  {itensSelecionados.length}
                </p>
              </div>

              <div>
                <strong>Total selecionado</strong>
                <p
                  style={{
                    margin: "6px 0 0 0",
                    color: totalSelecionado > 0 ? "#22c55e" : "#94a3b8",
                    fontWeight: 800,
                  }}
                >
                  {moeda.format(totalSelecionado)}
                </p>
              </div>

              <div>
                <strong>Chave Pix</strong>
                <p style={{ margin: "6px 0 0 0" }}>{empresaPdf.pix || "-"}</p>
              </div>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.label}>
                Dia do pagamento
                <input
                  type="date"
                  value={diaPagamento}
                  onChange={(e) => setDiaPagamento(e.target.value)}
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Forma de pagamento
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  style={styles.input}
                >
                  {formasPagamento.map((forma) => (
                    <option key={forma} value={forma}>
                      {forma}
                    </option>
                  ))}
                </select>
              </label>

              <button style={styles.botaoCinza} onClick={selecionarTodos}>
                Selecionar tudo
              </button>

              <button style={styles.botaoCinza} onClick={limparSelecao}>
                Limpar seleção
              </button>

              <button style={styles.botao} onClick={salvarSelecionados}>
                Salvar selecionados como pagos
              </button>

              <button style={styles.botao} onClick={salvarRelacaoInteira}>
                Salvar relação inteira como paga
              </button>
            </div>
          </div>

          <div style={styles.tabelaBox}>
            <table style={styles.tabelaCompacta}>
              <thead>
                <tr>
                  <th style={styles.th}>✓</th>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Produto</th>
                  <th style={styles.th}>Placa</th>
                  <th style={styles.th}>Renavan</th>
                  <th style={styles.th}>Pagamento</th>
                  <th style={styles.th}>Valor</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Pago dia</th>
                </tr>
              </thead>

              <tbody>
                {detalhePendencia.itens.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selecionados.includes(item.id)}
                        onChange={() => alternarSelecionado(item.id)}
                      />
                    </td>

                    <td style={styles.td}>{dataBR(item.data)}</td>
                    <td style={styles.td}>{item.cliente}</td>
                    <td style={styles.td}>{item.produto}</td>
                    <td style={styles.tdPlaca}>{item.placa}</td>
                    <td style={styles.td}>{item.renavan}</td>
                    <td style={styles.td}>{item.formaPagamento}</td>
                    <td style={styles.tdValor}>{moeda.format(item.valor)}</td>
                    <td style={styles.td}>{item.status}</td>
                    <td style={styles.td}>
                      {item.diaPago ? dataBR(item.diaPago) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.acoes}>
            <button
              style={styles.copiar}
              onClick={() => abrirWhatsAppCobranca(detalhePendencia)}
            >
              Enviar cobrança no WhatsApp
            </button>

            <button
              style={styles.botao}
              onClick={() => copiarCobranca(detalhePendencia)}
            >
              Copiar cobrança
            </button>

            <button
              style={styles.detalhes}
              onClick={() => gerarPdfPendencia(detalhePendencia)}
            >
              Gerar PDF da relação
            </button>
          </div>
        </Card>
      )}

      <Card titulo="Histórico de relações pagas">
        {historicoRelacoes.length === 0 ? (
          <p style={styles.vazio}>Nenhuma relação salva ainda.</p>
        ) : (
          <Tabela
            colunas={["Cliente", "Dia pago", "Forma", "Qtd", "Total", "Ações"]}
            dados={historicoRelacoes.map((relacao) => [
              relacao.cliente,
              dataBR(relacao.diaPago),
              relacao.formaPagamento || "-",
              relacao.quantidade,
              moeda.format(relacao.total),
              <div style={styles.acoes}>
                <button
                  style={styles.detalhes}
                  onClick={() => gerarPdfRelacaoPaga(relacao)}
                >
                  Baixar PDF
                </button>

                <button
                  style={styles.botao}
                  onClick={() => desfazerUltimaRelacaoPaga(relacao.id)}
                >
                  Desfazer pagamento
                </button>

                <button
                  style={styles.excluir}
                  onClick={() => excluirRelacaoHistorico(relacao.id)}
                >
                  Excluir histórico
                </button>
              </div>,
            ])}
          />
        )}
      </Card>
    </>
  );
}