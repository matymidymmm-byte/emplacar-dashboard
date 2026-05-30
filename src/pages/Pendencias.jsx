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
    doc.setFontSize(horizontal ? 7 : 7);
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

  function desenharTabelaServicos(doc, itens, horizontal, yInicial) {
    const larguraPagina = doc.internal.pageSize.getWidth();
    const margem = 10;

    let y = yInicial;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 8 : 8);

    doc.setFillColor(219, 234, 254);
    doc.rect(margem, y - 5, larguraPagina - margem * 2, 8, "F");

    if (horizontal) {
      doc.text("Data", margem + 2, y);
      doc.text("Produto", margem + 27, y);
      doc.text("Placa", margem + 86, y);
      doc.text("Renavan", margem + 122, y);
      doc.text("Pagamento", margem + 165, y);
      doc.text("Valor", margem + 210, y);
      doc.text("Status", margem + 238, y);
    } else {
      doc.text("Data", margem + 2, y);
      doc.text("Produto", margem + 25, y);
      doc.text("Placa", margem + 82, y);
      doc.text("Valor", margem + 122, y);
      doc.text("Status", margem + 155, y);
    }

    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(horizontal ? 7 : 7.5);

    const limiteItens = horizontal ? 50 : 18;
    const alturaLinha = horizontal ? 4.5 : 6;

    itens.slice(0, limiteItens).forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margem, y - 3.5, larguraPagina - margem * 2, alturaLinha, "F");
      }

      doc.setTextColor(15, 23, 42);

      if (horizontal) {
        doc.text(dataBR(item.data), margem + 2, y);
        doc.text(String(item.produto || "Serviço").slice(0, 32), margem + 27, y);
        doc.text(String(item.placa || "-").slice(0, 12), margem + 86, y);
        doc.text(String(item.renavan || "-").slice(0, 16), margem + 122, y);
        doc.text(
          String(item.formaPagamento || item.formaPagamentoAnterior || "-").slice(
            0,
            18
          ),
          margem + 165,
          y
        );
        doc.text(moeda.format(Number(item.valor || 0)), margem + 210, y);
        doc.text(String(item.status || item.statusAnterior || "-").slice(0, 12), margem + 238, y);
      } else {
        doc.text(dataBR(item.data), margem + 2, y);
        doc.text(String(item.produto || "Serviço").slice(0, 28), margem + 25, y);
        doc.text(String(item.placa || "-").slice(0, 12), margem + 82, y);
        doc.text(moeda.format(Number(item.valor || 0)), margem + 122, y);
        doc.text(String(item.status || item.statusAnterior || "-").slice(0, 12), margem + 155, y);
      }

      y += alturaLinha;
    });

    if (itens.length > limiteItens) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(
        `+ ${itens.length - limiteItens} serviços não exibidos por limite de 1 página.`,
        margem + 2,
        y + 4
      );
    }

    return y;
  }

  async function gerarPdfPendencia(pendencia) {
    if (!pendencia) return;

    const horizontal = pendencia.itens.length > 18;
    const doc = new jsPDF(horizontal ? "l" : "p", "mm", "a4");
    const logo = await carregarLogo();

    const margem = 10;
    let y = horizontal ? 42 : 50;

    desenharCabecalho(doc, logo, "Relação de Serviços em Aberto", horizontal);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 10 : 11);

    if (horizontal) {
      doc.text(`Cliente: ${pendencia.cliente}`, 180, 12);
      doc.text(`Qtd: ${pendencia.quantidade}`, 180, 18);
      doc.text(`Total: ${moeda.format(pendencia.total)}`, 180, 24);
    } else {
      doc.text(`Cliente: ${pendencia.cliente}`, margem, y);
      y += 7;
      doc.text(`Qtd: ${pendencia.quantidade}`, margem, y);
      y += 7;
      doc.text(`Total em aberto: ${moeda.format(pendencia.total)}`, margem, y);
      y += 11;
    }

    desenharTabelaServicos(doc, pendencia.itens, horizontal, y);
    desenharRodape(doc, horizontal);

    doc.save(`relacao-aberta-${nomeArquivo(pendencia.cliente)}.pdf`);
  }

  async function gerarPdfRelacaoPaga(relacao) {
    if (!relacao) return;

    const itens = Array.isArray(relacao.itens) ? relacao.itens : [];
    const horizontal = itens.length > 18;
    const doc = new jsPDF(horizontal ? "l" : "p", "mm", "a4");
    const logo = await carregarLogo();

    const margem = 10;
    let y = horizontal ? 42 : 50;

    desenharCabecalho(doc, logo, "Comprovante de Relação Paga", horizontal);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 10 : 11);

    if (horizontal) {
      doc.text(`Cliente: ${relacao.cliente}`, 180, 12);
      doc.text(`Pago em: ${dataBR(relacao.diaPago)}`, 180, 18);
      doc.text(`Total: ${moeda.format(relacao.total)}`, 180, 24);
    } else {
      doc.text(`Cliente: ${relacao.cliente}`, margem, y);
      y += 7;
      doc.text(`Data do pagamento: ${dataBR(relacao.diaPago)}`, margem, y);
      y += 7;
      doc.text(`Forma de pagamento: ${relacao.formaPagamento || "-"}`, margem, y);
      y += 7;
      doc.text(`Quantidade paga: ${relacao.quantidade}`, margem, y);
      y += 7;
      doc.text(`Total recebido: ${moeda.format(relacao.total)}`, margem, y);
      y += 11;
    }

    desenharTabelaServicos(doc, itens, horizontal, y);
    desenharRodape(doc, horizontal);

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