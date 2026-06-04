import { useEffect, useMemo, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

import styles from "../styles/styles.js";

const SERVICOS_BASE = [
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

const IDS_CATEGORIAS_PADRAO = [
  "DESPACHANTES",
  "PARTICULAR_BALCAO",
  "CONCESSIONARIAS_GARAGENS",
];

const CATEGORIAS_PRECO_PADRAO = [
  {
    id: "DESPACHANTES",
    nome: "Despachantes",
    palavrasChave: ["DESPACHANTE", "DESPACHANTES", "DESPACH"],
    precosServicos: {},
    padraoSistema: true,
  },
  {
    id: "PARTICULAR_BALCAO",
    nome: "Particular / Balcão",
    palavrasChave: ["PARTICULAR", "BALCAO", "BALCÃO", "CLIENTE FINAL", "AVULSO"],
    precosServicos: {},
    padraoSistema: true,
  },
  {
    id: "CONCESSIONARIAS_GARAGENS",
    nome: "Concessionárias / Garagens / Personal Cars",
    palavrasChave: [
      "CONCESSIONARIA",
      "CONCESSIONÁRIA",
      "CONCESSIONARIAS",
      "CONCESSIONÁRIAS",
      "CONCECIONARIA",
      "CONCECIONÁRIA",
      "GARAGEM",
      "GARAGENS",
      "GARAGE",
      "PERSONAL",
      "PERSONAL CAR",
      "PERSONAL CARS",
    ],
    precosServicos: {},
    padraoSistema: true,
  },
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
  tabelasPrecoClientes = [],
  setTabelasPrecoClientes = () => {},
}) {
  const [novoServico, setNovoServico] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const [clientePrecosAberto, setClientePrecosAberto] = useState(null);

  const [categoriaAbertaId, setCategoriaAbertaId] = useState("");
  const [novaPalavraChave, setNovaPalavraChave] = useState("");
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [novaCategoriaPalavras, setNovaCategoriaPalavras] = useState("");

  const [tabelasPrecoEdicao, setTabelasPrecoEdicao] = useState([]);
  const [tabelasAlteradas, setTabelasAlteradas] = useState(false);

  useEffect(() => {
    if (Array.isArray(tabelasPrecoClientes) && tabelasPrecoClientes.length > 0) {
      setTabelasPrecoEdicao(tabelasPrecoClientes);
    } else {
      setTabelasPrecoEdicao(CATEGORIAS_PRECO_PADRAO);
    }

    setTabelasAlteradas(false);
  }, [tabelasPrecoClientes]);

  const tabelasPreco = useMemo(() => {
    if (Array.isArray(tabelasPrecoEdicao) && tabelasPrecoEdicao.length > 0) {
      return tabelasPrecoEdicao;
    }

    return CATEGORIAS_PRECO_PADRAO;
  }, [tabelasPrecoEdicao]);

  function normalizarTexto(valor) {
    return String(valor || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9 ]+/g, " ")
      .replace(/\s+/g, " ");
  }

  function criarIdCategoria(nome) {
    const idBase = normalizarTexto(nome).replace(/\s+/g, "_");

    if (!idBase) return `CATEGORIA_${Date.now()}`;

    const existe = tabelasPreco.some((categoria) => categoria.id === idBase);

    if (!existe) return idBase;

    return `${idBase}_${Date.now()}`;
  }

  function salvarTabelasPrecoEdicao(novasTabelas) {
    setTabelasPrecoEdicao(novasTabelas);
    setTabelasAlteradas(true);
  }

  function salvarTabelasPreco() {
    setTabelasPrecoClientes(tabelasPrecoEdicao);
    setTabelasAlteradas(false);
    alert("Tabelas de preço salvas com sucesso.");
  }

  function cancelarAlteracoesTabelas() {
    if (Array.isArray(tabelasPrecoClientes) && tabelasPrecoClientes.length > 0) {
      setTabelasPrecoEdicao(tabelasPrecoClientes);
    } else {
      setTabelasPrecoEdicao(CATEGORIAS_PRECO_PADRAO);
    }

    setTabelasAlteradas(false);
  }

  function inicializarTabelasPreco() {
    if (tabelasPrecoClientes.length > 0) {
      alert("As categorias de preço já foram inicializadas.");
      return;
    }

    setTabelasPrecoEdicao(CATEGORIAS_PRECO_PADRAO);
    setTabelasAlteradas(true);
    alert("Categorias padrão carregadas. Clique em Salvar tabelas de preço.");
  }

  function adicionarCategoria() {
    const nome = String(novaCategoriaNome || "").trim();

    if (!nome) {
      alert("Digite o nome da categoria.");
      return;
    }

    const palavras = String(novaCategoriaPalavras || "")
      .split(",")
      .map((item) => normalizarTexto(item))
      .filter(Boolean);

    const novaCategoria = {
      id: criarIdCategoria(nome),
      nome,
      palavrasChave: palavras,
      precosServicos: {},
      criadaPelaEmpresa: true,
      padraoSistema: false,
    };

    salvarTabelasPrecoEdicao([...tabelasPreco, novaCategoria]);

    setNovaCategoriaNome("");
    setNovaCategoriaPalavras("");
    setCategoriaAbertaId(novaCategoria.id);
  }

  function alterarNomeCategoria(categoriaId, novoNome) {
    const atualizadas = tabelasPreco.map((categoria) => {
      if (categoria.id !== categoriaId) return categoria;

      return {
        ...categoria,
        nome: novoNome,
      };
    });

    salvarTabelasPrecoEdicao(atualizadas);
  }

  function categoriaPodeSerExcluida(categoria) {
    if (IDS_CATEGORIAS_PADRAO.includes(categoria.id)) return false;
    if (categoria.padraoSistema) return false;
    return true;
  }

  function excluirCategoria(categoria) {
    if (!categoriaPodeSerExcluida(categoria)) {
      alert("Categorias padrão do sistema não podem ser excluídas.");
      return;
    }

    const clientesUsando = clientes.filter(
      (cliente) =>
        cliente.categoriaPrecoId === categoria.id ||
        categoriaDoCliente(cliente)?.id === categoria.id
    ).length;

    const confirmar = confirm(
      clientesUsando > 0
        ? `Esta categoria está ligada a ${clientesUsando} cliente(s). Deseja excluir mesmo assim?`
        : "Deseja excluir esta categoria?"
    );

    if (!confirmar) return;

    const atualizadas = tabelasPreco.filter((item) => item.id !== categoria.id);

    salvarTabelasPrecoEdicao(atualizadas);

    setClientes((old) =>
      old.map((cliente) =>
        cliente.categoriaPrecoId === categoria.id
          ? { ...cliente, categoriaPrecoId: "" }
          : cliente
      )
    );

    if (categoriaAbertaId === categoria.id) {
      setCategoriaAbertaId("");
    }
  }

  function categoriaPorTipo(tipoCliente) {
    const tipo = normalizarTexto(tipoCliente);

    if (!tipo) return null;

    return tabelasPreco.find((categoria) =>
      (categoria.palavrasChave || []).some((palavra) => {
        const chave = normalizarTexto(palavra);
        return tipo.includes(chave) || chave.includes(tipo);
      })
    );
  }

  function categoriaDoCliente(cliente) {
    if (cliente?.categoriaPrecoId) {
      const direta = tabelasPreco.find(
        (categoria) => categoria.id === cliente.categoriaPrecoId
      );

      if (direta) return direta;
    }

    return categoriaPorTipo(cliente?.tipoCliente);
  }

  function contarClientesDaCategoria(categoria) {
    return clientes.filter((cliente) => categoriaDoCliente(cliente)?.id === categoria.id)
      .length;
  }

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

  function precoDaCategoria(cliente, servico) {
    const categoria = categoriaDoCliente(cliente);
    return categoria?.precosServicos?.[servico] ?? "";
  }

  function montarPrecosServicos(cliente = {}) {
    const precosCategoria = {};
    const categoria = categoriaDoCliente(cliente);

    SERVICOS_BASE.forEach((servico) => {
      precosCategoria[servico] = categoria?.precosServicos?.[servico] ?? "";
    });

    return {
      ...precosCategoria,

      "PAR VEICULAR PADRÃO":
        cliente.precosServicos?.["PAR VEICULAR PADRÃO"] ??
        cliente.precoParVeicular ??
        precosCategoria["PAR VEICULAR PADRÃO"] ??
        "",

      "MOTO PADRÃO":
        cliente.precosServicos?.["MOTO PADRÃO"] ??
        cliente.precoMoto ??
        precosCategoria["MOTO PADRÃO"] ??
        "",

      "REBOQUE PADRÃO":
        cliente.precosServicos?.["REBOQUE PADRÃO"] ??
        cliente.precoReboque ??
        precosCategoria["REBOQUE PADRÃO"] ??
        "",

      "PLACA AVULSA":
        cliente.precosServicos?.["PLACA AVULSA"] ??
        cliente.precoReboque ??
        precosCategoria["PLACA AVULSA"] ??
        "",

      "PAR VEICULAR PRETA":
        cliente.precosServicos?.["PAR VEICULAR PRETA"] ??
        cliente.precoPlacaPreta ??
        precosCategoria["PAR VEICULAR PRETA"] ??
        "",

      "PAR VEICULAR MINI":
        cliente.precosServicos?.["PAR VEICULAR MINI"] ??
        cliente.precoMini ??
        precosCategoria["PAR VEICULAR MINI"] ??
        "",

      "SUPORTE TRIÂNGULO MOTO":
        cliente.precosServicos?.["SUPORTE TRIÂNGULO MOTO"] ??
        cliente.precoSuporteTriangulo ??
        precosCategoria["SUPORTE TRIÂNGULO MOTO"] ??
        "",

      "SUPORTE RESINA MOTO":
        cliente.precosServicos?.["SUPORTE RESINA MOTO"] ??
        cliente.precoSuporteResinaMoto ??
        precosCategoria["SUPORTE RESINA MOTO"] ??
        "",

      "SUPORTE RESINA CARRO":
        cliente.precosServicos?.["SUPORTE RESINA CARRO"] ??
        cliente.precoSuporteResinaCarro ??
        precosCategoria["SUPORTE RESINA CARRO"] ??
        "",

      ...(cliente.precosServicos || {}),
    };
  }

  const precosServicosAtuais = useMemo(() => {
    return montarPrecosServicos(clienteForm);
  }, [clienteForm, tabelasPreco]);

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

  function atualizarCategoriaPrecoCliente(tipoCliente) {
    const categoria = categoriaPorTipo(tipoCliente);

    setClienteForm({
      ...clienteForm,
      tipoCliente,
      categoriaPrecoId: categoria?.id || clienteForm.categoriaPrecoId || "",
    });
  }

  function sincronizarClientesPelasEntradas() {
    const clientesAtualizados = [...clientes];

    entradas.forEach((entrada) => {
      const nomeCliente = String(entrada.cliente || "").trim();
      if (!nomeCliente) return;

      const tipoCliente = entrada.tipo || "";
      const categoria = categoriaPorTipo(tipoCliente);

      const clienteExistente = clientesAtualizados.find(
        (c) => normalizar(c.nome) === normalizar(nomeCliente)
      );

      if (clienteExistente) {
        clienteExistente.tipoCliente = tipoCliente || clienteExistente.tipoCliente || "";
        clienteExistente.categoriaPrecoId =
          categoria?.id || clienteExistente.categoriaPrecoId || "";
        clienteExistente.telefone =
          entrada.celular || clienteExistente.telefone || "";
        clienteExistente.precosServicos = clienteExistente.precosServicos || {};
      } else {
        clientesAtualizados.push({
          id: Date.now() + Math.random(),
          nome: nomeCliente,
          tipoCliente,
          categoriaPrecoId: categoria?.id || "",

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

  function aplicarCategoriasAosClientes() {
    const atualizados = clientes.map((cliente) => {
      const categoria = categoriaDoCliente(cliente);

      return {
        ...cliente,
        categoriaPrecoId: categoria?.id || cliente.categoriaPrecoId || "",
      };
    });

    setClientes(atualizados);
    alert("Categorias aplicadas aos clientes existentes.");
  }

  function alterarPrecoCategoria(categoriaId, servico, valor) {
    const atualizadas = tabelasPreco.map((categoria) => {
      if (categoria.id !== categoriaId) return categoria;

      return {
        ...categoria,
        precosServicos: {
          ...(categoria.precosServicos || {}),
          [servico]: valor,
        },
      };
    });

    salvarTabelasPrecoEdicao(atualizadas);
  }

  function adicionarPalavraChave(categoriaId) {
    const palavra = normalizarTexto(novaPalavraChave);

    if (!palavra) {
      alert("Digite uma palavra-chave.");
      return;
    }

    const atualizadas = tabelasPreco.map((categoria) => {
      if (categoria.id !== categoriaId) return categoria;

      const palavras = categoria.palavrasChave || [];

      if (palavras.map(normalizarTexto).includes(palavra)) {
        return categoria;
      }

      return {
        ...categoria,
        palavrasChave: [...palavras, palavra],
      };
    });

    salvarTabelasPrecoEdicao(atualizadas);
    setNovaPalavraChave("");
  }

  function removerPalavraChave(categoriaId, palavra) {
    const atualizadas = tabelasPreco.map((categoria) => {
      if (categoria.id !== categoriaId) return categoria;

      return {
        ...categoria,
        palavrasChave: (categoria.palavrasChave || []).filter(
          (item) => item !== palavra
        ),
      };
    });

    salvarTabelasPrecoEdicao(atualizadas);
  }

  function formatarPreco(valor) {
    if (valor === "" || valor === null || valor === undefined) return "-";
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function contarPrecos(cliente) {
    return Object.values(montarPrecosServicos(cliente)).filter((valor) => valor)
      .length;
  }

  function abrirTabelaPrecos(cliente) {
    setClientePrecosAberto({
      ...cliente,
      precosServicos: montarPrecosServicos(cliente),
    });
  }

  function fecharTabelaPrecos() {
    setClientePrecosAberto(null);
  }

  const precosModal = clientePrecosAberto
    ? Object.entries(montarPrecosServicos(clientePrecosAberto)).filter(
        ([, valor]) => valor
      )
    : [];

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

          <button
            style={{
              background: "#334155",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              marginLeft: 10,
            }}
            onClick={aplicarCategoriasAosClientes}
          >
            Aplicar categorias
          </button>
        </span>
      </div>

      <Card titulo="Categorias de preço">
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 150px",
              gap: 10,
              alignItems: "end",
            }}
          >
            <Campo
              label="Nova categoria"
              valor={novaCategoriaNome}
              mudar={setNovaCategoriaNome}
            />

            <Campo
              label="Palavras-chave iniciais"
              valor={novaCategoriaPalavras}
              mudar={setNovaCategoriaPalavras}
            />

            <button style={styles.botao} onClick={adicionarCategoria}>
              Adicionar
            </button>
          </div>

          <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
            Separe palavras-chave por vírgula. Exemplo: transportadora, frota,
            caminhão.
          </p>
        </div>
      </Card>

      <Card titulo="Tabelas de preço">
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <button style={styles.botao} onClick={inicializarTabelasPreco}>
            Criar categorias padrão
          </button>

          <button
            style={styles.botao}
            onClick={salvarTabelasPreco}
            disabled={!tabelasAlteradas}
          >
            Salvar tabelas de preço
          </button>

          <button
            style={styles.botaoCinza}
            onClick={cancelarAlteracoesTabelas}
            disabled={!tabelasAlteradas}
          >
            Cancelar alterações
          </button>

          {tabelasAlteradas && (
            <span
              style={{
                color: "#fbbf24",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Alterações não salvas
            </span>
          )}
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          {tabelasPreco.map((categoria) => (
            <div
              key={categoria.id}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  {categoriaAbertaId === categoria.id ? (
                    <Campo
                      label="Nome da categoria"
                      valor={categoria.nome}
                      mudar={(v) => alterarNomeCategoria(categoria.id, v)}
                    />
                  ) : (
                    <strong>{categoria.nome}</strong>
                  )}

                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      marginTop: 6,
                    }}
                  >
                    Clientes usando: {contarClientesDaCategoria(categoria)}
                  </div>

                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Palavras-chave: {(categoria.palavrasChave || []).join(", ")}
                  </div>
                </div>

                <button
                  style={styles.detalhes}
                  onClick={() =>
                    setCategoriaAbertaId(
                      categoriaAbertaId === categoria.id ? "" : categoria.id
                    )
                  }
                >
                  {categoriaAbertaId === categoria.id ? "Fechar" : "Editar"}
                </button>

                {categoriaPodeSerExcluida(categoria) && (
                  <button
                    style={styles.excluir}
                    onClick={() => excluirCategoria(categoria)}
                  >
                    Excluir
                  </button>
                )}
              </div>

              {categoriaAbertaId === categoria.id && (
                <>
                  <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                    {SERVICOS_BASE.map((servico) => (
                      <div
                        key={servico}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 160px",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div>{servico}</div>

                        <Campo
                          label=""
                          tipo="number"
                          valor={categoria.precosServicos?.[servico] || ""}
                          mudar={(v) =>
                            alterarPrecoCategoria(categoria.id, servico, v)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px",
                      gap: 10,
                      alignItems: "end",
                      marginTop: 12,
                    }}
                  >
                    <Campo
                      label="Nova palavra-chave"
                      valor={novaPalavraChave}
                      mudar={setNovaPalavraChave}
                    />

                    <button
                      style={styles.botao}
                      onClick={() => adicionarPalavraChave(categoria.id)}
                    >
                      Adicionar
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    {(categoria.palavrasChave || []).map((palavra) => (
                      <button
                        key={palavra}
                        type="button"
                        style={styles.botaoCinza}
                        onClick={() => removerPalavraChave(categoria.id, palavra)}
                      >
                        {palavra} ×
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

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
            mudar={atualizarCategoriaPrecoCliente}
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
            marginTop: 14,
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          Categoria identificada:{" "}
          <strong style={{ color: "#fff" }}>
            {categoriaDoCliente(clienteForm)?.nome || "Não identificada"}
          </strong>
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
            Exceções de preço do cliente
          </h3>

          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 0 }}>
            Deixe vazio para usar o preço da categoria. Preencha apenas quando
            este cliente tiver um valor diferente.
          </p>

          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(precosServicosAtuais).map(([servico]) => (
              <div
                key={servico}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 140px 90px",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 600 }}>{servico}</div>

                <div style={{ color: "#94a3b8", fontSize: 13 }}>
                  Categoria: {formatarPreco(precoDaCategoria(clienteForm, servico))}
                </div>

                <Campo
                  label=""
                  tipo="number"
                  valor={clienteForm.precosServicos?.[servico] || ""}
                  mudar={(v) => alterarPrecoServico(servico, v)}
                />

                <button
                  type="button"
                  style={styles.excluir}
                  onClick={() => removerServicoCliente(servico)}
                >
                  Limpar
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
          colunas={[
            "Nome",
            "Tipo",
            "Categoria",
            "Preços",
            "Telefone",
            "WhatsApp",
            "Ações",
          ]}
          dados={clientes.map((cliente) => [
            cliente.nome,
            cliente.tipoCliente,
            categoriaDoCliente(cliente)?.nome || "-",
            <button
              style={styles.detalhes}
              onClick={() => abrirTabelaPrecos(cliente)}
            >
              Ver preços ({contarPrecos(cliente)})
            </button>,
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
                  categoriaPrecoId:
                    cliente.categoriaPrecoId ||
                    categoriaDoCliente(cliente)?.id ||
                    "",
                  precosServicos: cliente.precosServicos || {},
                })
              }
              excluir={() => remover("cliente", cliente.id)}
            />,
          ])}
        />
      </Card>

      {clientePrecosAberto && (
        <div
          onClick={fecharTabelaPrecos}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "85vh",
              overflow: "auto",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 18,
              padding: 20,
              color: "#fff",
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>
                  Tabela de preços
                </h2>

                <p
                  style={{
                    margin: "6px 0 0 0",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  {clientePrecosAberto.nome || "Cliente"} •{" "}
                  {categoriaDoCliente(clientePrecosAberto)?.nome ||
                    clientePrecosAberto.tipoCliente ||
                    "Sem categoria"}
                </p>
              </div>

              <button style={styles.excluir} onClick={fecharTabelaPrecos}>
                Fechar
              </button>
            </div>

            {precosModal.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>
                Nenhum preço cadastrado para este cliente.
              </p>
            ) : (
              <div style={styles.tabelaBox}>
                <table style={styles.tabelaCompacta}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Serviço</th>
                      <th style={styles.th}>Preço final</th>
                    </tr>
                  </thead>

                  <tbody>
                    {precosModal.map(([servico, preco]) => (
                      <tr key={servico}>
                        <td style={styles.td}>{servico}</td>
                        <td style={styles.tdValor}>{formatarPreco(preco)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}