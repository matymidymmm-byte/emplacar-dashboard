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

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
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

    const doc = new jsPDF("p", "mm", "a4");
    let y = 20;

    doc.setFontSize(18);
    doc.text("Relação de Serviços em Aberto", 14, y);

    y += 12;
    doc.setFontSize(12);
    doc.text(`Cliente: ${pendencia.cliente}`, 14, y);

    y += 8;
    doc.text(`Total: ${moeda.format(pendencia.total)}`, 14, y);

    y += 8;
    doc.text(`Chave Pix: ${chavePix}`, 14, y);

    y += 12;

    pendencia.itens.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        `${dataBR(item.data)} | ${item.placa || "-"} | ${
          item.produto || "Serviço"
        } | ${moeda.format(item.valor)}`,
        14,
        y
      );

      y += 7;
    });

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