import { useMemo, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

import styles from "../styles/styles.js";

const SERVICOS_PADRAO_CLIENTE = [
  "PAR VEICULAR PADRÃO",
  "MOTO PADRÃO",
  "REBOQUE PADRÃO",
  "PLACA AVULSA",
  "PAR VEICULAR PRETA",
  "PAR VEICULAR MINI",
  "SUPORTE TRIÂNGULO MOTO",
  "SUPORTE RESINA MOTO",
  "SUPORTE RESINA CARRO",
];

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
  const [novoServico, setNovoServico] = useState("");
  const [novoPreco, setNovoPreco] = useState("");

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

  function montarPrecosServicos(cliente = {}) {
    return {
      ...(cliente.precosServicos || {}),

      "PAR VEICULAR PADRÃO":
        cliente.precosServicos?.["PAR VEICULAR PADRÃO"] ||
        cliente.precoParVeicular ||
        "",

      "MOTO PADRÃO":
        cliente.precosServicos?.["MOTO PADRÃO"] || cliente.precoMoto || "",

      "REBOQUE PADRÃO":
        cliente.precosServicos?.["REBOQUE PADRÃO"] ||
        cliente.precoReboque ||
        "",

      "PLACA AVULSA":
        cliente.precosServicos?.["PLACA AVULSA"] ||
        cliente.precoReboque ||
        "",

      "PAR VEICULAR PRETA":
        cliente.precosServicos?.["PAR VEICULAR PRETA"] ||
        cliente.precoPlacaPreta ||
        "",

      "PAR VEICULAR MINI":
        cliente.precosServicos?.["PAR VEICULAR MINI"] ||
        cliente.precoMini ||
        "",

      "SUPORTE TRIÂNGULO MOTO":
        cliente.precosServicos?.["SUPORTE TRIÂNGULO MOTO"] ||
        cliente.precoSuporteTriangulo ||
        "",

      "SUPORTE RESINA MOTO":
        cliente.precosServicos?.["SUPORTE RESINA MOTO"] ||
        cliente.precoSuporteResinaMoto ||
        "",

      "SUPORTE RESINA CARRO":
        cliente.precosServicos?.["SUPORTE RESINA CARRO"] ||
        cliente.precoSuporteResinaCarro ||
        "",
    };
  }

  const precosServicosAtuais = useMemo(() => {
    return montarPrecosServicos(clienteForm);
  }, [clienteForm]);

  function alterarPrecoServico(servico, valor) {
    setClienteForm({
      ...clienteForm,
      precosServicos: {
        ...(clienteForm.precosServicos || {}),
        [servico]: valor,
      },
    });
  }

  function adicionarServicoCliente() {
    const servico = String(novoServico || "").trim().toUpperCase();

    if (!servico) {
      alert("Informe o nome do serviço.");
      return;
    }

    setClienteForm({
      ...clienteForm,
      precosServicos: {
        ...(clienteForm.precosServicos || {}),
        [servico]: novoPreco || "",
      },
    });

    setNovoServico("");
    setNovoPreco("");
  }

  function removerServicoCliente(servico) {
    const precos = { ...(clienteForm.precosServicos || {}) };
    delete precos[servico];

    setClienteForm({
      ...clienteForm,
      precosServicos: precos,
    });
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

        clienteExistente.precosServicos =
          clienteExistente.precosServicos || {};
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

          precosServicos: {},

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

  function resumoPrecos(cliente) {
    const precos = montarPrecosServicos(cliente);
    const ativos = Object.entries(precos).filter(([, valor]) => valor);

    if (ativos.length === 0) return "-";

    return ativos
      .slice(0, 4)
      .map(([servico, valor]) => `${servico}: ${formatarPreco(valor)}`)
      .join(" | ");
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
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>
            Preços por serviço
          </h3>

          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(precosServicosAtuais).map(([servico, preco]) => (
              <div
                key={servico}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 160px 90px",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 600 }}>{servico}</div>

                <Campo
                  label=""
                  tipo="number"
                  valor={preco}
                  mudar={(v) => alterarPrecoServico(servico, v)}
                />

                <button
                  type="button"
                  style={styles.excluir}
                  onClick={() => removerServicoCliente(servico)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 110px",
              gap: 10,
              marginTop: 16,
              alignItems: "end",
            }}
          >
            <Campo
              label="Novo serviço"
              valor={novoServico}
              mudar={setNovoServico}
            />

            <Campo
              label="Preço"
              tipo="number"
              valor={novoPreco}
              mudar={setNovoPreco}
            />

            <button
              type="button"
              style={styles.botao}
              onClick={adicionarServicoCliente}
            >
              Adicionar
            </button>
          </div>
        </div>

        <div style={{ ...styles.formGrid, marginTop: 18 }}>
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
          colunas={["Nome", "Tipo", "Preços", "Telefone", "WhatsApp", "Ações"]}
          dados={clientes.map((cliente) => [
            cliente.nome,
            cliente.tipoCliente,
            resumoPrecos(cliente),
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
              editar={() =>
                editar("cliente", {
                  ...cliente,
                  precosServicos: montarPrecosServicos(cliente),
                })
              }
              excluir={() => remover("cliente", cliente.id)}
            />,
          ])}
        />
      </Card>
    </>
  );
}