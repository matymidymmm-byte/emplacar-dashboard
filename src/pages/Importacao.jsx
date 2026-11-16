import Card from "../components/Card.jsx";
import styles from "../styles/styles.js";

export default function Importacao(props) {
  const {
    aba,
    textoImportacao,
    setTextoImportacao,
    resultadoImportacao,
    setResultadoImportacao,
    entradas,
    setEntradas,
    saidas,
    setSaidas,
    contas,
    setContas,
    clientes,
    setClientes,
  } = props;
  const config = {
    "Importar Entradas": {
      titulo: "Importar entradas",

      ajuda:
        "Cole do Excel com cabeçalho: DATA, TIPO, CLIENTE, SERVIÇO, PLACA, RENAVAN, PROCESSO, PROPRIETÁRIO, CPF, CHASSI, VALOR, STATUS, PAGO VIA, PAGO DIA, CATEGORIA, OBSERVAÇÃO. Planilhas antigas com cabeçalhos reconhecidos também são aceitas.",

      exemplo:
        "DATA\tTIPO\tCLIENTE\tSERVIÇO\tPLACA\tRENAVAN\tPROCESSO\tPROPRIETÁRIO\tCPF\tCHASSI\tVALOR\tSTATUS\tPAGO VIA\tPAGO DIA\tCATEGORIA\tOBSERVAÇÃO\n15/05/2026\tPARTICULAR\tJOÃO\tREBOQUE\tABC1D23\t123456789\t192304316159\tJOÃO DA SILVA\t12345678900\t9BWZZZ377VT004251\t80,00\tEM ABERTO\tNOTA\t\tPARTICULAR\tCliente pediu entrega urgente",
    },

    "Importar Saídas": {
      titulo: "Importar saídas",

      ajuda:
        "Cole do Excel nesta ordem: DIA SAÍDA, FORMA DE PAGAMENTO SAÍDA, CENTRO DE CUSTO, TIPO SAÍDA, CONTA, VALOR SAÍDA, OBSERVAÇÃO.",

      exemplo:
        "DIA SAÍDA\tFORMA DE PAGAMENTO SAÍDA\tCENTRO DE CUSTO\tTIPO SAÍDA\tCONTA\tVALOR SAÍDA\tOBSERVAÇÃO\n15/05/2026\tDINHEIRO\tOutros\tMATERIAL\tCOMPRA DE MERCADO\t80,00\tComprei café, açúcar e produto de limpeza",
    },

    "Importar Contas": {
      titulo: "Importar contas a pagar",

      ajuda:
        "Cole do Excel nesta ordem: CONTA A PAGAR, DIA QUE VENCE, VALOR, ETATUS.",

      exemplo:
        "CONTA A PAGAR\tDIA QUE VENCE\tVALOR\tETATUS\nALUGUEL\t20/05/2026\t1000,00\tPENDENTE",
    },
  };

  const tela = config[aba];

  function numero(valor) {
    return (
      Number(
        String(valor || "")
          .replace("R$", "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      ) || 0
    );
  }

  function texto(valor) {
    return String(valor || "").trim();
  }

  function normalizar(valor) {
    return texto(valor)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function pegar(row, nomes) {
    for (const nome of nomes) {
      const chave = normalizar(nome);

      if (row[chave] !== undefined && row[chave] !== "") {
        return row[chave];
      }
    }

    return "";
  }

  function pegarObservacao(row) {
    return pegar(row, [
      "OBSERVAÇÃO",
      "OBSERVACAO",
      "OBS",
      "COMENTÁRIO",
      "COMENTARIO",
      "NOTA",
      "ANOTAÇÃO",
      "ANOTACAO",
    ]);
  }

  function formaPadrao(valor) {
    const v = normalizar(valor);

    if (v.includes("PIX")) return "Pix";
    if (v.includes("DEBITO")) return "Débito";
    if (v.includes("CREDITO")) return "Crédito";
    if (v.includes("DEPOSITO")) return "Depósito";
    if (v.includes("CHEQUE")) return "Cheque";
    if (v.includes("DINHEIRO")) return "Dinheiro";

    if (v.includes("NOTA") || v.includes("FATURADO")) {
      return "Nota / Faturado";
    }

    return texto(valor) || "Nota / Faturado";
  }

  function statusPadrao(valor) {
    const v = normalizar(valor);

    if (v.includes("NAO PAGO") || v.includes("NAO QUITADO")) return "Pendente";
    if (v === "PAGO" || v === "PAGA" || v.includes("EM DIA")) return "Pago";
    if (v.includes("ATRASADO")) return "Atrasado";
    if (v.includes("PENDENTE") || v.includes("ABERTO")) return "Pendente";

    return valor || "Pendente";
  }

  function formatarData(data) {
    const v = texto(data);

    if (!v) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return v;
    }

    const partes = v.split(/[\/\-.]/);

    if (partes.length === 3) {
      const d = partes[0].padStart(2, "0");
      const m = partes[1].padStart(2, "0");
      const a = partes[2].length === 2 ? `20${partes[2]}` : partes[2];

      return `${a}-${m}-${d}`;
    }

    return v;
  }

  function separarLinha(linha) {
    if (linha.includes("\t")) return linha.split("\t");

    if (linha.includes(";")) return linha.split(";");

    return linha.split(",");
  }

  function lerTabelaColada() {
    const linhas = textoImportacao
      .split(/\r?\n/)
      .filter((linha) => linha.trim());

    if (linhas.length < 2) return null;

    const cabecalho = separarLinha(linhas[0]).map((h) =>
      normalizar(h)
    );

    return linhas.slice(1).map((linha) => {
      const valores = separarLinha(linha);

      const row = {};

      cabecalho.forEach((coluna, i) => {
        row[coluna] = texto(valores[i]);
      });

      return row;
    });
  }

  // O lote fica nos próprios registros salvos no Firebase, por empresa.
  const colecaoAtual = aba === "Importar Entradas" ? entradas
    : aba === "Importar Saídas" ? saidas : contas;
  const ultimoLoteId = colecaoAtual.reduce((ultimo, item) => {
    const id = item?.loteImportacaoId || "";
    return id > ultimo ? id : ultimo;
  }, "");
  const registrosUltimoLote = ultimoLoteId
    ? colecaoAtual.filter((item) => item.loteImportacaoId === ultimoLoteId)
    : [];

  function importarDados() {
    const linhas = lerTabelaColada();

    if (!linhas) {
      setResultadoImportacao(
        "Cole a tabela com cabeçalho e dados."
      );

      return;
    }

    // Impede importar uma planilha errada ou sem os cabeçalhos essenciais.
    const cabecalhos = separarLinha(
      textoImportacao.split(/\r?\n/).find((linha) => linha.trim()) || ""
    ).map(normalizar);
    const possui = (...nomes) => nomes.some((nome) => cabecalhos.includes(normalizar(nome)));
    if (aba === "Importar Entradas" &&
        (!possui("DATA") || !possui("VALOR") || !possui("SERVIÇO", "SERVICO", "PRODUTO"))) {
      setResultadoImportacao("Importação cancelada: cabeçalhos DATA, VALOR e SERVIÇO (ou PRODUTO) são obrigatórios. Nenhum dado foi alterado.");
      return;
    }
const loteImportacaoId = `lote-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const marcarLote = (item) => ({
      ...item,
      importacaoSnapshot: JSON.stringify(item),
    });
    const novasEntradas = [];
    const novasSaidas = [];
    const novasContas = [];
    const novosClientes = [];

    linhas.forEach((row, index) => {
      if (aba === "Importar Entradas") {
        const cliente = pegar(row, ["CLIENTE"]);

        const celular = pegar(row, [
          "CELULAR",
          "TELEFONE",
          "WHATSAPP",
          "WHATS",
          "FONE",
        ]);

        const dataServico = formatarData(pegar(row, ["DATA"]));
        const statusImportado = statusPadrao(pegar(row, ["STATUS"]) || "Pendente");
        const formaImportada = formaPadrao(pegar(row, ["PAGO VIA", "FORMA DE PAGAMENTO", "PAGAMENTO", "PAGO COMO"]));
        const diaPagoInformado = formatarData(pegar(row, ["PAGO DIA", "DIA PAGO", "DATA PAGAMENTO"]));
        const pagamentoPresumido = statusImportado === "Pago" && !diaPagoInformado && !!dataServico && formaImportada !== "Nota / Faturado";
        const dataRecebimento = statusImportado === "Pago" ? (diaPagoInformado || (pagamentoPresumido ? dataServico : "")) : "";
        const cartaoPago = statusImportado === "Pago" && ["Débito", "Crédito"].includes(formaImportada) && !!dataRecebimento;

        const entrada = {
          loteImportacaoId,
          id: Date.now() + index,

          data: dataServico,

          tipo: pegar(row, ["TIPO"]),

          cliente,

          produto: pegar(row, [
            "PRODUTO",
            "SERVICO",
            "SERVIÇO",
          ]),

          placa: pegar(row, ["PLACA"]),

          renavan: pegar(row, ["RENAVAN"]),

          proprietario: pegar(row, ["PROPRIETÁRIO", "PROPIETÁRIO", "PROPRIETARIO", "PROPIETARIO"]),

          cpf: pegar(row, ["CPF"]),

          chassi: pegar(row, ["CHASSI"]),

          formaPagamento: formaImportada,

          valor: numero(pegar(row, ["VALOR"])),

          status: statusImportado,

          processo: pegar(row, ["PROCESSO"]),

          diaPago: dataRecebimento,
          dataPagamentoPresumida: pagamentoPresumido,
          avisoInternoPagamento: pagamentoPresumido
            ? "Data de pagamento não informada na importação. Utilizada a data do serviço; conferir recebimento."
            : "",
          recebimentoCartaoConfirmado: cartaoPago,
          dataRecebimentoCartao: cartaoPago ? dataRecebimento : "",
          valorLiquidoRecebido: cartaoPago ? numero(pegar(row, ["VALOR"])) : 0,
          taxaCartao: 0,

          categoriaPlaca: pegar(row, [
            "CATEGORIA",
            "CATEGORIA PLACA",
            "CATEGORIA DA PLACA",
          ]),

          celular,

          observacao: pegarObservacao(row),

          relacaoPagaId: "",
        };

        if (
          entrada.valor ||
          entrada.cliente ||
          entrada.produto
        ) {
          novasEntradas.push(marcarLote(entrada));
        }

        const tipoCliente = pegar(row, [
          "TIPO",
          "TIPO CLIENTE",
          "CATEGORIA",
        ]);

        const clienteExistente = clientes.find(
          (c) =>
            normalizar(c.nome) === normalizar(cliente)
        );

        const clienteNovoExistente = novosClientes.find(
          (c) =>
            normalizar(c.nome) === normalizar(cliente)
        );

        if (clienteNovoExistente) {
          clienteNovoExistente.tipoCliente =
            tipoCliente ||
            clienteNovoExistente.tipoCliente ||
            "";

          clienteNovoExistente.telefone =
            celular ||
            clienteNovoExistente.telefone ||
            "";
        }

        if (
          cliente &&
          !clienteExistente &&
          !clienteNovoExistente
        ) {
          novosClientes.push({
            id: Date.now() + index + 100000,

            nome: cliente,

            tipoCliente: tipoCliente || "",

            precoParVeicular: "",
            precoMoto: "",
            precoReboque: "",
            precoPlacaPreta: "",
            precoMini: "",

            telefone: celular || "",

            email: "",

            observacao:
              "Importado pelas entradas",
          });
        }
      }

      if (aba === "Importar Saídas") {
        const saida = {
          loteImportacaoId,
          id: Date.now() + index,

          data: formatarData(
            pegar(row, [
              "DIA SAIDA",
              "DIA SAÍDA",
            ])
          ),

          formaPagamento: formaPadrao(
            pegar(row, [
              "FORMA DE PAGAMENTO SAIDA",
              "FORMA DE PAGAMENTO SAÍDA",
            ])
          ),

          categoria:
            pegar(row, [
              "CENTRO DE CUSTO",
              "CATEGORIA",
              "CATEGORIA SAIDA",
              "CATEGORIA SAÍDA",
            ]) || "Outros",

          tipoSaida: pegar(row, [
            "TIPO SAIDA",
            "TIPO SAÍDA",
          ]),

          conta: pegar(row, ["CONTA"]),

          valor: numero(
            pegar(row, [
              "VALOR SAIDA",
              "VALOR SAÍDA",
            ])
          ),

          observacao: pegarObservacao(row),

          status: "Pago",
        };

        if (
          saida.valor ||
          saida.conta ||
          saida.tipoSaida
        ) {
          novasSaidas.push(marcarLote(saida));
        }
      }

      if (aba === "Importar Contas") {
        const conta = {
          loteImportacaoId,
          id: Date.now() + index,

          conta: pegar(row, [
            "CONTA A PAGAR",
          ]),

          vencimento: formatarData(
            pegar(row, [
              "DIA QUE VENCE",
            ])
          ),

          valor: numero(
            pegar(row, ["VALOR"])
          ),

          status: statusPadrao(
            pegar(row, [
              "ETATUS",
              "STATUS",
            ]) || "Pendente"
          ),
        };

        if (conta.valor || conta.conta) {
          novasContas.push(marcarLote(conta));
        }
      }
    });

    if (novasEntradas.length > 0) {
      setEntradas([
        ...entradas,
        ...novasEntradas,
      ]);
    }

    if (novasSaidas.length > 0) {
      setSaidas([
        ...saidas,
        ...novasSaidas,
      ]);
    }

    if (novasContas.length > 0) {
      setContas([
        ...contas,
        ...novasContas,
      ]);
    }

    if (novosClientes.length > 0) {
      setClientes([
        ...clientes,
        ...novosClientes,
      ]);
    }
    setResultadoImportacao(
      `Importado: ${novasEntradas.length} entradas, ${novasSaidas.length} saídas, ${novasContas.length} contas e ${novosClientes.length} clientes.`
    );

    setTextoImportacao("");
  }
  function desfazerUltimaImportacao() {
    if (!ultimoLoteId || !registrosUltimoLote.length) return;

    const alterados = registrosUltimoLote.filter((item) => {
      if (!item.importacaoSnapshot) return true; // lote antigo sem proteção
      const { importacaoSnapshot, ...dadosAtuais } = item;
      return JSON.stringify(dadosAtuais) !== item.importacaoSnapshot;
    });
    if (alterados.length) {
      setResultadoImportacao(
        `Desfazer bloqueado: ${alterados.length} registro(s) foram alterados ou não possuem verificação. Nenhum dado foi excluído.`
      );
      return;
    }

    if (!window.confirm(
      `Desfazer ${registrosUltimoLote.length} registro(s) da última importação de ${aba}?\n` +
      "Os clientes cadastrados serão preservados."
    )) return;

    const removerLote = (atual) => atual.filter(
      (item) => item.loteImportacaoId !== ultimoLoteId
    );
    if (aba === "Importar Entradas") setEntradas(removerLote);
    if (aba === "Importar Saídas") setSaidas(removerLote);
    if (aba === "Importar Contas") setContas(removerLote);

    setResultadoImportacao(
      `Desfazer solicitado: ${registrosUltimoLote.length} registro(s) removidos do lote. Clientes preservados.`
    );
  }
  return (
    <Card titulo={tela?.titulo || aba}>
      <p style={styles.ajuda}>
        {tela?.ajuda}
      </p>

      <textarea
        value={textoImportacao}
        onChange={(e) =>
          setTextoImportacao(
            e.target.value
          )
        }
        placeholder={tela?.exemplo}
        style={styles.textarea}
      />

      <button
        style={styles.botao}
        onClick={importarDados}
      >
        Importar
      </button>
      {ultimoLoteId && (
  <button
    type="button"
    onClick={desfazerUltimaImportacao}
    style={{
      ...styles.botao,
      marginLeft: 10,
      backgroundColor: "#b91c1c",
      color: "#ffffff",
    }}
  >
    Desfazer última importação ({registrosUltimoLote.length})
  </button>
)}

      {resultadoImportacao && (
        <p style={styles.resultado}>
          {resultadoImportacao}
        </p>
      )}
    </Card>
  );
}