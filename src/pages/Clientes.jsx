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
  function limparTelefone(telefone) {
    return String(telefone || "").replace(/\D/g, "");
  }

  function telefoneWhatsApp(telefone) {
    const numero = limparTelefone(telefone);

    if (!numero) return "";

    if (numero.startsWith("55")) return numero;

    return `55${numero}`;
  }

  function abrirWhatsApp(cliente, tipo) {
    const telefone = telefoneWhatsApp(cliente.telefone);

    if (!telefone) {
      alert("Cliente sem telefone cadastrado.");
      return;
    }

    const nome = cliente.nome || "cliente";

    const mensagens = {
      atendimento: `Olá ${nome}, tudo bem? Aqui é da Emplacar. Estou entrando em contato para falar sobre seu atendimento.`,

      placaPronta: `Olá ${nome}, tudo bem? Sua placa já está pronta para retirada. Emplacar agradece a preferência.`,

      cobranca: `Olá ${nome}, tudo bem? Identificamos uma pendência financeira em aberto. Poderia verificar para regularizarmos?`,
    };

    const mensagem = encodeURIComponent(mensagens[tipo]);

    window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
  }

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Clientes cadastrados:</strong> {clientes.length}
        </span>
      </div>

      <Card titulo={editando.tipo === "cliente" ? "Editando cliente" : "Cadastrar cliente"}>
        <div style={styles.formGrid}>
          <Campo
            label="Nome"
            valor={clienteForm.nome}
            mudar={(v) => setClienteForm({ ...clienteForm, nome: v })}
          />

          <Campo
            label="Telefone"
            valor={clienteForm.telefone}
            mudar={(v) => setClienteForm({ ...clienteForm, telefone: v })}
          />

          <Campo
            label="E-mail"
            valor={clienteForm.email}
            mudar={(v) => setClienteForm({ ...clienteForm, email: v })}
          />

          <Campo
            label="Observação"
            valor={clienteForm.observacao}
            mudar={(v) => setClienteForm({ ...clienteForm, observacao: v })}
          />

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
          colunas={["Nome", "Telefone", "E-mail", "Observação", "WhatsApp", "Ações"]}
          dados={clientes.map((cliente) => [
            cliente.nome,
            cliente.telefone,
            cliente.email,
            cliente.observacao,
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                style={styles.copiar}
                onClick={() => abrirWhatsApp(cliente, "atendimento")}
              >
                Atendimento
              </button>

              <button
                style={styles.detalhes}
                onClick={() => abrirWhatsApp(cliente, "placaPronta")}
              >
                Placa pronta
              </button>

              <button
                style={styles.excluir}
                onClick={() => abrirWhatsApp(cliente, "cobranca")}
              >
                Cobrança
              </button>
            </div>,
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