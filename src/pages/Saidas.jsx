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
        <span><strong>Saídas:</strong> {saidas.length}</span>
        <span><strong>Total:</strong> {moeda.format(total)}</span>
        <span><strong>Média:</strong> {moeda.format(media)}</span>
      </div>

      <Card titulo={editando.tipo === "saida" ? "Editando saída" : "Lançar saída"}>
        <div style={styles.formGrid}>
          <Campo label="Dia saída" tipo="date" valor={saidaForm.data} mudar={(v) => setSaidaForm({ ...saidaForm, data: v })} />
          <Select label="Forma de pagamento saída" valor={saidaForm.formaPagamento} mudar={(v) => setSaidaForm({ ...saidaForm, formaPagamento: v })} opcoes={formasPagamento} />
          <Campo label="Tipo saída" valor={saidaForm.tipoSaida} mudar={(v) => setSaidaForm({ ...saidaForm, tipoSaida: v })} />
          <Campo label="Conta" valor={saidaForm.conta} mudar={(v) => setSaidaForm({ ...saidaForm, conta: v })} />
          <Campo label="Valor saída" tipo="number" valor={saidaForm.valor} mudar={(v) => setSaidaForm({ ...saidaForm, valor: v })} />

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
          colunas={["Dia saída", "Pagamento", "Tipo saída", "Conta", "Valor", "Destino", "Ações"]}
          dados={saidas.map((saida) => [
            dataBR(saida.data),
            saida.formaPagamento,
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