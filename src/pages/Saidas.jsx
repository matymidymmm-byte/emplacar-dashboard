import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

import styles from "../styles/styles.js";

export default function Saidas({
  saidaForm,
  setSaidaForm,
  formasPagamento,
  salvarSaida,
  editando,
  cancelarEdicao,
  saidas,
  moeda,
  destinoDinheiro,
  editar,
  remover,
}) {
  const categoriasSaida = [
    "Placas / Matéria-prima",
    "Aluguel",
    "Energia",
    "Água",
    "Internet",
    "Marketing",
    "Taxas",
    "Vale colaborador",
    "Manutenção",
    "Pró-labore",
    "Combustível",
    "Sistema / Software",
    "Material de escritório",
    "Outros",
  ];

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  const total = saidas.reduce((soma, saida) => soma + saida.valor, 0);
  const media = saidas.length > 0 ? total / saidas.length : 0;

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Saídas:</strong> {saidas.length}
        </span>

        <span>
          <strong>Total:</strong> {moeda.format(total)}
        </span>

        <span>
          <strong>Média:</strong> {moeda.format(media)}
        </span>
      </div>

      <Card titulo={editando.tipo === "saida" ? "Editando saída" : "Lançar saída"}>
        <div style={styles.formGrid}>
          <Campo
            label="Dia saída"
            tipo="date"
            valor={saidaForm.data}
            mudar={(v) => setSaidaForm({ ...saidaForm, data: v })}
          />

          <Select
            label="Forma de pagamento saída"
            valor={saidaForm.formaPagamento}
            mudar={(v) => setSaidaForm({ ...saidaForm, formaPagamento: v })}
            opcoes={formasPagamento}
          />

          <Select
            label="Centro de custo"
            valor={saidaForm.categoria || "Outros"}
            mudar={(v) => setSaidaForm({ ...saidaForm, categoria: v })}
            opcoes={categoriasSaida}
          />

          <Campo
            label="Tipo saída"
            valor={saidaForm.tipoSaida}
            mudar={(v) => setSaidaForm({ ...saidaForm, tipoSaida: v })}
          />

          <Campo
            label="Conta"
            valor={saidaForm.conta}
            mudar={(v) => setSaidaForm({ ...saidaForm, conta: v })}
          />

          <Campo
            label="Valor saída"
            tipo="number"
            valor={saidaForm.valor}
            mudar={(v) => setSaidaForm({ ...saidaForm, valor: v })}
          />

          <button style={styles.botao} onClick={salvarSaida}>
            {editando.tipo === "saida" ? "Salvar edição" : "Adicionar"}
          </button>

          {editando.tipo === "saida" && (
            <button style={styles.botaoCinza} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>

        <Tabela
          colunas={[
            "Dia saída",
            "Pagamento",
            "Centro de custo",
            "Tipo saída",
            "Conta",
            "Valor",
            "Destino",
            "Ações",
          ]}
          dados={[...saidas]
  .sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;

    return new Date(b.data) - new Date(a.data);
  }).map((saida) => [
            dataBR(saida.data),
            saida.formaPagamento,
            saida.categoria || "Outros",
            saida.tipoSaida,
            saida.conta,
            moeda.format(saida.valor),
            destinoDinheiro(saida.formaPagamento),
            <Acoes editar={() => editar("saida", saida)} excluir={() => remover("saida", saida.id)} />,
          ])}
        />
      </Card>
    </>
  );
}