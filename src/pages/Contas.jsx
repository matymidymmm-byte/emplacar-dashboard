import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

import styles from "../styles/styles.js";

export default function Contas({
  contaForm,
  setContaForm,
  salvarConta,
  editando,
  cancelarEdicao,
  contas,
  moeda,
  statusConta,
  alternarConta,
  editar,
  remover,
}) {
  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function diasParaVencer(data) {
    if (!data) return null;

    const hoje = new Date();
    const vencimento = new Date(data + "T00:00:00");

    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);

    const diferenca = vencimento - hoje;

    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  function situacaoConta(conta) {
    if (statusConta(conta) === "Pago") {
      return "Pago";
    }

    const dias = diasParaVencer(conta.vencimento);

    if (dias === null) return "Pendente";
    if (dias < 0) return "Atrasado";
    if (dias === 0) return "Vence hoje";

    return "Em dia";
  }

  function textoVencimento(conta) {
    if (statusConta(conta) === "Pago") {
      return "Conta paga";
    }

    const dias = diasParaVencer(conta.vencimento);

    if (dias === null) return "Sem vencimento";
    if (dias < 0) return `Atrasada há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`;
    if (dias === 0) return "Vence hoje";

    return `Faltam ${dias} dia${dias > 1 ? "s" : ""}`;
  }

  function corSituacao(conta) {
    const situacao = situacaoConta(conta);

    if (situacao === "Pago") return styles.status;
    if (situacao === "Em dia") return styles.status;
    if (situacao === "Vence hoje") return styles.botaoPequeno;
    if (situacao === "Atrasado") return styles.excluir;

    return styles.editar;
  }

  const totalAberto = contas
    .filter((conta) => statusConta(conta) !== "Pago")
    .reduce((soma, conta) => soma + conta.valor, 0);

  const totalPago = contas
    .filter((conta) => statusConta(conta) === "Pago")
    .reduce((soma, conta) => soma + conta.valor, 0);

  const total = contas.reduce((soma, conta) => soma + conta.valor, 0);

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Contas:</strong> {contas.length}
        </span>

        <span>
          <strong>Total:</strong> {moeda.format(total)}
        </span>

        <span>
          <strong>Em aberto:</strong> {moeda.format(totalAberto)}
        </span>

        <span>
          <strong>Pagas:</strong> {moeda.format(totalPago)}
        </span>
      </div>

      <Card
        titulo={
          editando.tipo === "conta"
            ? "Editando conta"
            : "Lançar conta a pagar"
        }
      >
        <div style={styles.formGrid}>
          <Campo
            label="Conta a pagar"
            valor={contaForm.conta}
            mudar={(v) =>
              setContaForm({
                ...contaForm,
                conta: v,
              })
            }
          />

          <Campo
            label="Dia que vence"
            tipo="date"
            valor={contaForm.vencimento}
            mudar={(v) =>
              setContaForm({
                ...contaForm,
                vencimento: v,
              })
            }
          />

          <Campo
            label="Valor"
            tipo="number"
            valor={contaForm.valor}
            mudar={(v) =>
              setContaForm({
                ...contaForm,
                valor: v,
              })
            }
          />
<Select
  label="Forma de pagamento"
  valor={contaForm.formaPagamento || "Pix"}
  mudar={(v) =>
    setContaForm({
      ...contaForm,
      formaPagamento: v,
    })
  }
  opcoes={["Pix", "Débito", "Crédito", "Depósito", "Cheque", "Dinheiro"]}
/>
          <Select
            label="Status"
            valor={contaForm.status}
            mudar={(v) =>
              setContaForm({
                ...contaForm,
                status: v,
              })
            }
            opcoes={["Pendente", "Pago", "Atrasado"]}
          />

          <button style={styles.botao} onClick={salvarConta}>
            {editando.tipo === "conta" ? "Salvar edição" : "Adicionar"}
          </button>

          {editando.tipo === "conta" && (
            <button style={styles.botaoCinza} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>

        <Tabela
          colunas={[
            "Conta a pagar",
            "Dia que vence",
            "Valor",
            "Situação",
            "Prazo",
            "Status",
            "Ações",
          ]}
          dados={contas.map((conta) => [
            conta.conta,

            dataBR(conta.vencimento),

            moeda.format(conta.valor),

            <span style={corSituacao(conta)}>
              {situacaoConta(conta)}
            </span>,

            textoVencimento(conta),

            <button style={styles.status} onClick={() => alternarConta(conta.id)}>
              {statusConta(conta) === "Pago" ? "Pago ✓" : "Pagar"}
            </button>,

            <Acoes
              editar={() => editar("conta", conta)}
              excluir={() => remover("conta", conta.id)}
            />,
          ])}
        />
      </Card>
    </>
  );
}