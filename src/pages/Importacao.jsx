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
        "Cole do Excel nesta ordem: DATA, TIPO, CLIENTE, PRODUTO/SERVIÇO, PLACA, RENAVAN, FORMA DE PAGAMENTO, VALOR, STATUS, PROCESSO, PAGO DIA, CELULAR, OBSERVAÇÃO.",
      exemplo:
        "DATA\tTIPO\tCLIENTE\tSERVIÇO\tPLACA\tRENAVAN\tFORMA DE PAGAMENTO\tVALOR\tSTATUS\tPROCESSO\tPAGO DIA\tCELULAR\tOBSERVAÇÃO\n15/05/2026\tPARTICULAR\tJOÃO\tREBOQUE\tABC1D23\t123456789\tPIX\t80,00\tPAGO\t192304316159\t16/05/2026\t45999999999\tCliente pediu entrega urgente",
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
      if (row[chave] !== undefined && row[chave] !== "") return row[chave];
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
    if (v.includes("NOTA") || v.includes("FATURADO")) return "Nota / Faturado";

    return valor || "Pix";
  }

  function statusPadrao(valor) {
    const v = normalizar(valor);

    if (v.includes("PAGO") || v.includes("EM DIA")) return "Pago";
    if (v.includes("ATRASADO")) return "Atrasado";
    if (v.includes("PENDENTE") || v.includes("ABERTO")) return "Pendente";

    return valor || "Pendente";
  }

  function formatarData(data) {
    const v = texto(data);

    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

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

    const cabecalho = separarLinha(linhas[0]).map((h) => normalizar(h));

    return linhas.slice(1).map((linha) => {
      const valores = separarLinha(linha);
      const row = {};

      cabecalho.forEach((coluna, i) => {
        row[coluna] = texto(valores[i]);
      });

      return row;
    });
  }

  function importarDados() {
    const linhas = lerTabelaColada();

    if (!linhas) {
      setResultadoImportacao("Cole a tabela com cabeçalho e dados.");
      return;
    }

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

        const entrada = {
          id: Date.now() + index,
          data: formatarData(pegar(row, ["DATA"])),
          tipo: pegar(row, ["TIPO"]),
          cliente,
          produto: pegar(row, ["PRODUTO", "SERVICO", "SERVIÇO"]),
          placa: pegar(row, ["PLACA"]),
          renavan: pegar(row, ["RENAVAN"]),
          formaPagamento: formaPadrao(pegar(row, ["FORMA DE PAGAMENTO"])),
          valor: numero(pegar(row, ["VALOR"])),
          status: statusPadrao(pegar(row, ["STATUS"]) || "Pago"),
          processo: pegar(row, ["PROCESSO"]),
          diaPago:
            formatarData(
              pegar(row, ["PAGO DIA", "DIA PAGO", "DATA PAGAMENTO"])
            ) || "",
          celular,
          observacao: pegarObservacao(row),
          relacaoPagaId: "",
        };

        if (entrada.valor || entrada.cliente || entrada.produto) {
          novasEntradas.push(entrada);
        }

        const tipoCliente = pegar(row, ["TIPO", "TIPO CLIENTE", "CATEGORIA"]);

        const clienteExistente = clientes.find(
          (c) => normalizar(c.nome) === normalizar(cliente)
        );

        const clienteNovoExistente = novosClientes.find(
          (c) => normalizar(c.nome) === normalizar(cliente)
        );

        if (clienteExistente) {
          clienteExistente.tipoCliente =
            tipoCliente || clienteExistente.tipoCliente || "";

          clienteExistente.telefone =
            celular || clienteExistente.telefone || "";
        }

        if (clienteNovoExistente) {
          clienteNovoExistente.tipoCliente =
            tipoCliente || clienteNovoExistente.tipoCliente || "";

          clienteNovoExistente.telefone =
            celular || clienteNovoExistente.telefone || "";
        }

        if (cliente && !clienteExistente && !clienteNovoExistente) {
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
            observacao: "Importado pelas entradas",
          });
        }
      }

      if (aba === "Importar Saídas") {
        const saida = {
          id: Date.now() + index,
          data: formatarData(pegar(row, ["DIA SAIDA", "DIA SAÍDA"])),
          formaPagamento: formaPadrao(
            pegar(row, ["FORMA DE PAGAMENTO SAIDA", "FORMA DE PAGAMENTO SAÍDA"])
          ),
          categoria:
            pegar(row, [
              "CENTRO DE CUSTO",
              "CATEGORIA",
              "CATEGORIA SAIDA",
              "CATEGORIA SAÍDA",
            ]) || "Outros",
          tipoSaida: pegar(row, ["TIPO SAIDA", "TIPO SAÍDA"]),
          conta: pegar(row, ["CONTA"]),
          valor: numero(pegar(row, ["VALOR SAIDA", "VALOR SAÍDA"])),
          observacao: pegarObservacao(row),
          status: "Pago",
        };

        if (saida.valor || saida.conta || saida.tipoSaida) {
          novasSaidas.push(saida);
        }
      }

      if (aba === "Importar Contas") {
        const conta = {
          id: Date.now() + index,
          conta: pegar(row, ["CONTA A PAGAR"]),
          vencimento: formatarData(pegar(row, ["DIA QUE VENCE"])),
          valor: numero(pegar(row, ["VALOR"])),
          status: statusPadrao(pegar(row, ["ETATUS", "STATUS"]) || "Pendente"),
        };

        if (conta.valor || conta.conta) {
          novasContas.push(conta);
        }
      }
    });

    if (novasEntradas.length > 0) {
      setEntradas([...entradas, ...novasEntradas]);
    }

    if (novasSaidas.length > 0) {
      setSaidas([...saidas, ...novasSaidas]);
    }

    if (novasContas.length > 0) {
      setContas([...contas, ...novasContas]);
    }

    if (novosClientes.length > 0) {
      setClientes([...clientes, ...novosClientes]);
    }

    setResultadoImportacao(
      `Importado: ${novasEntradas.length} entradas, ${novasSaidas.length} saídas, ${novasContas.length} contas e ${novosClientes.length} clientes.`
    );

    setTextoImportacao("");
  }

  return (
    <Card titulo={tela?.titulo || aba}>
      <p style={styles.ajuda}>{tela?.ajuda}</p>

      <textarea
        value={textoImportacao}
        onChange={(e) => setTextoImportacao(e.target.value)}
        placeholder={tela?.exemplo}
        style={styles.textarea}
      />

      <button style={styles.botao} onClick={importarDados}>
        Importar
      </button>

      {resultadoImportacao && (
        <p style={styles.resultado}>{resultadoImportacao}</p>
      )}
    </Card>
  );
}