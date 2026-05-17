import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

import styles from "../styles/styles.js";

export default function Clientes({
  clienteForm,
  setClienteForm,
  salvarCliente,
  editando,
  cancelarEdicao,
  clientes,
  editar,
  remover,
}) {
  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Clientes cadastrados:</strong> {clientes.length}
        </span>
      </div>

      <Card titulo={editando.tipo === "cliente" ? "Editando cliente" : "Cadastrar cliente"}>
        <div style={styles.formGrid}>
          <Campo label="Nome" valor={clienteForm.nome} mudar={(v) => setClienteForm({ ...clienteForm, nome: v })} />
          <Campo label="Telefone" valor={clienteForm.telefone} mudar={(v) => setClienteForm({ ...clienteForm, telefone: v })} />
          <Campo label="E-mail" valor={clienteForm.email} mudar={(v) => setClienteForm({ ...clienteForm, email: v })} />
          <Campo label="Observação" valor={clienteForm.observacao} mudar={(v) => setClienteForm({ ...clienteForm, observacao: v })} />

          <button style={styles.botao} onClick={salvarCliente}>
            {editando.tipo === "cliente" ? "Salvar edição" : "Adicionar"}
          </button>

          {editando.tipo === "cliente" && (
            <button style={styles.botaoCinza} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>

        <Tabela
          colunas={["Nome", "Telefone", "E-mail", "Observação", "Ações"]}
          dados={clientes.map((cliente) => [
            cliente.nome,
            cliente.telefone,
            cliente.email,
            cliente.observacao,
            <Acoes
              editar={() => editar("cliente", cliente)}
              excluir={() => remover("cliente", cliente.id)}
            />,
          ])}
        />
      </Card>
    </>
  );
}