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
  setClientes,
  entradas,
  normalizar,
  editar,
  remover,
  dadosEmpresa = {},
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
    const nomeEmpresa = dadosEmpresa?.nome || "empresa"; 

    const mensagens = {
  atendimento: `Olá ${nome}, tudo bem? Aqui é da ${nomeEmpresa}. Estou entrando em contato para falar sobre seu atendimento.`,
  placaPronta: `Olá ${nome}, tudo bem? Sua placa já está pronta para retirada. ${nomeEmpresa} agradece a preferência.`,
  cobranca: `Olá ${nome}, tudo bem? Identificamos uma pendência financeira em aberto. Poderia verificar para regularizarmos?`,
};

    const mensagem = encodeURIComponent(mensagens[tipo]);

    window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
  }

  function sincronizarClientesPelasEntradas() {
    const clientesAtualizados = [...clientes];

    entradas.forEach((entrada) => {
      const nomeCliente = String(entrada.cliente || "").trim();

      if (!nomeCliente) return;

      const clienteExistente = clientesAtualizados.find(
        (c) => normalizar(c.nome) === normalizar(nomeCliente)
      );

      if (clienteExistente) {
        clienteExistente.tipoCliente =
          entrada.tipo || clienteExistente.tipoCliente || "";

        clienteExistente.telefone =
          entrada.celular || clienteExistente.telefone || "";
      } else {
        clientesAtualizados.push({
          id: Date.now() + Math.random(),
          nome: nomeCliente,
          tipoCliente: entrada.tipo || "",

          precoParVeicular: "",
          precoMoto: "",
          precoReboque: "",
          precoPlacaPreta: "",
          precoMini: "",

          precoSuporteTriangulo: "",
          precoSuporteResinaMoto: "",
          precoSuporteResinaCarro: "",

          

          telefone: entrada.celular || "",
          email: "",
          observacao: "Cliente sincronizado pelas entradas",
        });
      }
    });

    setClientes(clientesAtualizados);

    alert("Clientes sincronizados pelas entradas com sucesso.");
  }

  function formatarPreco(valor) {
    if (!valor) return "-";

    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Clientes cadastrados:</strong> {clientes.length}

          <button
            style={{
              background: "#1e293b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: 10,
            }}
            onClick={sincronizarClientesPelasEntradas}
          >
            Sincronizar CRM
          </button>
        </span>
      </div>

      <Card
        titulo={
          editando.tipo === "cliente" ? "Editando cliente" : "Cadastrar cliente"
        }
      >
        <div style={styles.formGrid}>
          <Campo
            label="Nome"
            valor={clienteForm.nome}
            mudar={(v) => setClienteForm({ ...clienteForm, nome: v })}
          />

          <Campo
            label="Tipo de cliente"
            valor={clienteForm.tipoCliente}
            mudar={(v) => setClienteForm({ ...clienteForm, tipoCliente: v })}
          />

          <Campo
            label="Preço par veicular"
            tipo="number"
            valor={clienteForm.precoParVeicular}
            mudar={(v) =>
              setClienteForm({ ...clienteForm, precoParVeicular: v })
            }
          />

          <Campo
            label="Preço moto"
            tipo="number"
            valor={clienteForm.precoMoto}
            mudar={(v) => setClienteForm({ ...clienteForm, precoMoto: v })}
          />

          <Campo
            label="Preço reboque / avulsa"
            tipo="number"
            valor={clienteForm.precoReboque}
            mudar={(v) => setClienteForm({ ...clienteForm, precoReboque: v })}
          />

          <Campo
            label="Preço placa preta"
            tipo="number"
            valor={clienteForm.precoPlacaPreta}
            mudar={(v) =>
              setClienteForm({ ...clienteForm, precoPlacaPreta: v })
            }
          />

          <Campo
            label="Preço mini"
            tipo="number"
            valor={clienteForm.precoMini}
            mudar={(v) => setClienteForm({ ...clienteForm, precoMini: v })}
          />

          <Campo
            label="Suporte triângulo moto"
            tipo="number"
            valor={clienteForm.precoSuporteTriangulo}
            mudar={(v) =>
              setClienteForm({ ...clienteForm, precoSuporteTriangulo: v })
            }
          />

          <Campo
            label="Suporte resina moto"
            tipo="number"
            valor={clienteForm.precoSuporteResinaMoto}
            mudar={(v) =>
              setClienteForm({ ...clienteForm, precoSuporteResinaMoto: v })
            }
          />

          <Campo
            label="Suporte resina carro"
            tipo="number"
            valor={clienteForm.precoSuporteResinaCarro}
            mudar={(v) =>
              setClienteForm({ ...clienteForm, precoSuporteResinaCarro: v })
            }
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
          colunas={[
            "Nome",
            "Tipo",
            "Par",
            "Moto",
            "Reboque",
            "Preta",
            "Mini",
            
            "Telefone",
            "WhatsApp",
            "Ações",
          ]}
          dados={clientes.map((cliente) => [
            cliente.nome,
            cliente.tipoCliente,
            formatarPreco(cliente.precoParVeicular),
            formatarPreco(cliente.precoMoto),
            formatarPreco(cliente.precoReboque),
            formatarPreco(cliente.precoPlacaPreta),
            formatarPreco(cliente.precoMini),
            
            cliente.telefone,
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