import { useMemo, useState } from "react";
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
  const [diaPagamento, setDiaPagamento] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [selecionados, setSelecionados] = useState([]);

  const dadosEmpresa = {
    nome: "Emplacar",
    subtitulo: "Relação de Serviços em Aberto",
    cnpj: "63.488.249/0001-08",
    email: "emplacarmcr@gmail.com",
    whatsapp: "45 2031-1407",
    endereco: "Rua Rio de Janeiro, 1766 - Centro - Marechal Cândido Rondon/PR",
  };

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function carregarLogo() {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/logo-emplacar.png";
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

    const itensSelecionados = detalhePendencia.itens.filter((item) =>
      selecionados.includes(item.id)
    );

    if (itensSelecionados.length === 0) {
      alert("Selecione pelo menos um serviço.");
      return;
    }

    salvarRelacaoPaga(
      {
        cliente: detalhePendencia.cliente,
        quantidade: itensSelecionados.length,
        total: itensSelecionados.reduce(
          (soma, item) => soma + Number(item.valor || 0),
          0
        ),
        itens: itensSelecionados,
      },
      diaPagamento
    );

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

Segue a relação das placas em aberto:

${linhas}

Total em aberto: ${moeda.format(pendencia.total)}

Chave Pix: ${chavePix}

Observação: quando houver acréscimo de R$ 25,00 no serviço, o valor corresponde ao procedimento de replaca.

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

  async function gerarPdfPendencia(pendencia) {
    if (!pendencia) return;

    const horizontal = pendencia.itens.length > 18;
    const doc = new jsPDF(horizontal ? "l" : "p", "mm", "a4");
    const logo = await carregarLogo();

    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const margem = 10;

    let y = 10;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, larguraPagina, horizontal ? 30 : 36, "F");

    if (logo) {
      doc.addImage(logo, "PNG", margem, 5, horizontal ? 20 : 24, horizontal ? 20 : 24);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 16 : 18);
    doc.text(dadosEmpresa.nome, logo ? (horizontal ? 36 : 42) : margem, horizontal ? 13 : 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(horizontal ? 8 : 9);
    doc.text(dadosEmpresa.subtitulo, logo ? (horizontal ? 36 : 42) : margem, horizontal ? 19 : 23);
    doc.text(`CNPJ: ${dadosEmpresa.cnpj}`, logo ? (horizontal ? 36 : 42) : margem, horizontal ? 24 : 29);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(horizontal ? 10 : 11);

    if (horizontal) {
      doc.text(`Cliente: ${pendencia.cliente}`, 180, 12);
      doc.text(`Qtd: ${pendencia.quantidade}`, 180, 18);
      doc.text(`Total: ${moeda.format(pendencia.total)}`, 180, 24);
      y = 38;
    } else {
      y = 48;
      doc.setTextColor(15, 23, 42);
      doc.text(`Cliente: ${pendencia.cliente}`, margem, y);
      y += 7;
      doc.text(`Qtd: ${pendencia.quantidade}`, margem, y);
      y += 7;
      doc.text(`Total: ${moeda.format(pendencia.total)}`, margem, y);
      y += 11;
    }

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

    pendencia.itens.slice(0, limiteItens).forEach((item, index) => {
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
        doc.text(String(item.formaPagamento || "-").slice(0, 18), margem + 165, y);
        doc.text(moeda.format(Number(item.valor || 0)), margem + 210, y);
        doc.text(String(item.status || "-").slice(0, 12), margem + 238, y);
      } else {
        doc.text(dataBR(item.data), margem + 2, y);
        doc.text(String(item.produto || "Serviço").slice(0, 28), margem + 25, y);
        doc.text(String(item.placa || "-").slice(0, 12), margem + 82, y);
        doc.text(moeda.format(Number(item.valor || 0)), margem + 122, y);
        doc.text(String(item.status || "-").slice(0, 12), margem + 155, y);
      }

      y += alturaLinha;
    });

    if (pendencia.itens.length > limiteItens) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(
        `+ ${pendencia.itens.length - limiteItens} serviços não exibidos por limite de 1 página.`,
        margem + 2,
        y + 4
      );
    }

    const rodapeY = alturaPagina - 22;

    doc.setDrawColor(226, 232, 240);
    doc.line(margem, rodapeY - 8, larguraPagina - margem, rodapeY - 8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(horizontal ? 9 : 9);
    doc.text(`Chave Pix: ${chavePix}`, margem, rodapeY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(horizontal ? 7 : 7);
    doc.text(
      "Observação: quando houver acréscimo de R$ 25,00 no serviço, o valor corresponde ao procedimento de replaca.",
      margem,
      rodapeY + 5
    );

    doc.setTextColor(100, 116, 139);
    doc.text(dadosEmpresa.endereco, margem, rodapeY + 11);
    doc.text(
      `E-mail: ${dadosEmpresa.email} | WhatsApp: ${dadosEmpresa.whatsapp}`,
      margem,
      rodapeY + 16
    );

    doc.save(
      `relacao-${pendencia.cliente.toLowerCase().replace(/\s+/g, "-")}.pdf`
    );
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
            <strong>
              Total em aberto: {moeda.format(detalhePendencia.total)}
            </strong>

            <p>Chave Pix: {chavePix}</p>

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

              <button style={styles.botaoCinza} onClick={selecionarTodos}>
                Selecionar tudo
              </button>

              <button style={styles.botaoCinza} onClick={limparSelecao}>
                Limpar seleção
              </button>

              <button style={styles.botao} onClick={salvarSelecionados}>
                Salvar selecionados como pagos
              </button>

              <button
                style={styles.botao}
                onClick={() => salvarRelacaoPaga(detalhePendencia, diaPagamento)}
              >
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
            colunas={["Cliente", "Dia pago", "Qtd", "Total", "Ações"]}
            dados={historicoRelacoes.map((relacao) => [
              relacao.cliente,
              dataBR(relacao.diaPago),
              relacao.quantidade,
              moeda.format(relacao.total),
              <button
                style={styles.excluir}
                onClick={() => excluirRelacaoHistorico(relacao.id)}
              >
                Excluir do histórico
              </button>,
            ])}
          />
        )}
      </Card>
    </>
  );
}