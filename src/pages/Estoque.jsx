import { useMemo, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Kpi from "../components/Kpi.jsx";

import styles from "../styles/styles.js";

const PRODUTOS_BASE = [
  "VEICULAR PADRÃO",
  "VEICULAR PRETA",
  "VEICULAR MINI",
  "VEICULAR MINI-MINI",
  "MOTO PADRÃO",
  "MOTO PRETA",
  "MOTO MINI",
  "PLACA TESTE / PERSONALIZADA",
  "SUPORTE TRIÂNGULO MOTO",
  "SUPORTE RESINA MOTO",
  "SUPORTE RESINA CARRO",
  "RIBBON PRETO",
  "RIBBON VERMELHO",
  "RIBBON BRANCO",
  "RIBBON AZUL",
  "RIBBON VERDE",
];

const TIPOS_SIMULACAO = [
  "PAR VEICULAR PADRÃO",
  "PAR VEICULAR PRETA",
  "PAR VEICULAR MINI",
  "PAR VEICULAR MINI-MINI",
  "MOTO PADRÃO",
  "MOTO PRETA",
  "MOTO MINI",
  "REBOQUE PADRÃO",
  "REBOQUE PRETA",
  "REBOQUE MINI",
  "RIBBON CARRO",
  "RIBBON MOTO",
];

function listaUnica(lista = []) {
  return [...new Set(lista.filter(Boolean))];
}

export default function Estoque({
  entradas,
  clientes,

  modoRibbonPadrao,
  setModoRibbonPadrao,

  compraEstoqueForm,
  setCompraEstoqueForm,
  perdaEstoqueForm,
  setPerdaEstoqueForm,

  estoqueCompras,
  setEstoqueCompras,
  estoquePerdas,
  setEstoquePerdas,

  produtosEstoquePersonalizados = [],
  setProdutosEstoquePersonalizados,

  admin,

  numero,
  normalizar,
}) {
  const [novoProdutoEstoque, setNovoProdutoEstoque] = useState("");
  const [editandoCompraId, setEditandoCompraId] = useState(null);
  const [editandoPerdaId, setEditandoPerdaId] = useState(null);

  const [simulacao, setSimulacao] = useState({
    cliente: "",
  });

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const produtosDisponiveisEstoque = useMemo(() => {
    return listaUnica([...PRODUTOS_BASE, ...produtosEstoquePersonalizados]);
  }, [produtosEstoquePersonalizados]);

  function ehRibbon(produto) {
    return normalizar(produto).includes("RIBBON");
  }

  function normalizarProdutoEstoque(produto) {
    const p = normalizar(produto || "");

    if (p === "PLACA CARRO") return "VEICULAR PADRÃO";
    if (p === "PLACA MOTO") return "MOTO PADRÃO";
    if (p === "SUPORTE") return "SUPORTE TRIÂNGULO MOTO";

    return produto;
  }

  function lerPreco(valor) {
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

  function calcularUsoEstoque(produto) {
    const p = normalizar(produto || "");

    if (p.includes("SUPORTE TRIANGULO")) {
      return { item: "SUPORTE TRIÂNGULO MOTO", quantidade: 1 };
    }

    if (p.includes("SUPORTE RESINA") && p.includes("MOTO")) {
      return { item: "SUPORTE RESINA MOTO", quantidade: 1 };
    }

    if (p.includes("SUPORTE RESINA")) {
      return { item: "SUPORTE RESINA CARRO", quantidade: 1 };
    }

    if (p.includes("SUPORTE")) {
      return { item: "SUPORTE TRIÂNGULO MOTO", quantidade: 1 };
    }

    if (p.includes("TESTE") || p.includes("PERSONALIZADA")) {
      return { item: "PLACA TESTE / PERSONALIZADA", quantidade: 1 };
    }

    const ehMoto = p.includes("MOTO");
    const ehPreta =
      p.includes("PRETA") ||
      p.includes("BLACK") ||
      p.includes("COLECAO") ||
      p.includes("COLEÇÃO") ||
      p.includes("COLECIONADOR");

    const ehMiniMini =
      p.includes("MINI MINI") ||
      p.includes("MINI-MINI") ||
      p.includes("MINIMINI");

    const ehMini = p.includes("MINI") && !ehMiniMini;

    const ehReboque =
      p.includes("REBOQUE") ||
      p.includes("DOLLY") ||
      p.includes("CARRETINHA");

    const ehAvulsa =
      p.includes("AVULSA") ||
      p.includes("DIANTEIRA") ||
      p.includes("TRASEIRA");

    const quantidade = ehReboque || ehAvulsa ? 1 : 2;

    if (ehMoto) {
      if (ehPreta) return { item: "MOTO PRETA", quantidade: 1 };
      if (ehMini) return { item: "MOTO MINI", quantidade: 1 };
      return { item: "MOTO PADRÃO", quantidade: 1 };
    }

    if (ehPreta) return { item: "VEICULAR PRETA", quantidade };
    if (ehMiniMini) return { item: "VEICULAR MINI-MINI", quantidade };
    if (ehMini) return { item: "VEICULAR MINI", quantidade };

    return { item: "VEICULAR PADRÃO", quantidade };
  }

  function calcularConsumoSimulacao(tipo) {
    const t = normalizar(tipo || "");

    if (t.includes("RIBBON")) {
      const ehMoto = t.includes("MOTO");
      const passadas = modoRibbonPadrao === "2X" ? 2 : 1;
      const tamanhoPlacaMetro = ehMoto ? 0.2 : 0.4;

      return {
        item: "RIBBON PRETO",
        consumo: tamanhoPlacaMetro * passadas,
        unidade: "m",
      };
    }

    if (t.includes("MOTO PRETA")) return { item: "MOTO PRETA", consumo: 1 };
    if (t.includes("MOTO MINI")) return { item: "MOTO MINI", consumo: 1 };
    if (t.includes("MOTO")) return { item: "MOTO PADRÃO", consumo: 1 };

    if (t.includes("PRETA")) {
      return {
        item: "VEICULAR PRETA",
        consumo: t.includes("REBOQUE") ? 1 : 2,
      };
    }

    if (
      t.includes("MINI-MINI") ||
      t.includes("MINI MINI") ||
      t.includes("MINIMINI")
    ) {
      return {
        item: "VEICULAR MINI-MINI",
        consumo: t.includes("REBOQUE") ? 1 : 2,
      };
    }

    if (t.includes("MINI")) {
      return {
        item: "VEICULAR MINI",
        consumo: t.includes("REBOQUE") ? 1 : 2,
      };
    }

    return {
      item: "VEICULAR PADRÃO",
      consumo: t.includes("REBOQUE") ? 1 : 2,
    };
  }

  function precoClientePorServico(cliente, tipoServico) {
    if (!cliente) return 0;

    const tipo = normalizar(tipoServico);

    if (tipo.includes("RIBBON")) {
      if (tipo.includes("MOTO")) return lerPreco(cliente.precoMoto);
      return lerPreco(cliente.precoParVeicular);
    }

    if (tipo.includes("MOTO")) return lerPreco(cliente.precoMoto);
    if (tipo.includes("REBOQUE")) return lerPreco(cliente.precoReboque);
    if (tipo.includes("PRETA")) return lerPreco(cliente.precoPlacaPreta);
    if (tipo.includes("MINI")) return lerPreco(cliente.precoMini);

    return lerPreco(cliente.precoParVeicular);
  }

  function adicionarProdutoPersonalizado() {
    const nome = normalizar(novoProdutoEstoque);

    if (!nome) return;

    if (produtosDisponiveisEstoque.map(normalizar).includes(nome)) {
      alert("Produto já existe.");
      return;
    }

    setProdutosEstoquePersonalizados((old) => [...old, nome]);
    setNovoProdutoEstoque("");
  }

  function salvarCompraEstoque() {
    if (!compraEstoqueForm.produto || !compraEstoqueForm.quantidade) return;

    const item = {
      id: editandoCompraId || Date.now(),
      ...compraEstoqueForm,
      produto: normalizarProdutoEstoque(compraEstoqueForm.produto),
      quantidade: numero(compraEstoqueForm.quantidade),
      larguraRibbon: compraEstoqueForm.larguraRibbon || "",
      metragemRibbon: compraEstoqueForm.metragemRibbon || "",
      custoTotal: numero(compraEstoqueForm.custoTotal),
    };

    if (editandoCompraId) {
      setEstoqueCompras((old) =>
        old.map((x) => (x.id === editandoCompraId ? item : x))
      );
    } else {
      setEstoqueCompras((old) => [item, ...old]);
    }

    setEditandoCompraId(null);

    setCompraEstoqueForm({
      ...compraEstoqueForm,
      quantidade: "",
      larguraRibbon: "",
      metragemRibbon: "",
      custoTotal: "",
      observacao: "",
    });
  }

  function salvarPerdaEstoque() {
    if (!perdaEstoqueForm.produto || !perdaEstoqueForm.quantidade) return;

    const item = {
      id: editandoPerdaId || Date.now(),
      ...perdaEstoqueForm,
      produto: normalizarProdutoEstoque(perdaEstoqueForm.produto),
      quantidade: numero(perdaEstoqueForm.quantidade),
    };

    if (editandoPerdaId) {
      setEstoquePerdas((old) =>
        old.map((x) => (x.id === editandoPerdaId ? item : x))
      );
    } else {
      setEstoquePerdas((old) => [item, ...old]);
    }

    setEditandoPerdaId(null);

    setPerdaEstoqueForm({
      ...perdaEstoqueForm,
      quantidade: "",
      motivo: "Placa errada",
    });
  }

  function editarCompra(item) {
    if (!admin) return;

    setEditandoCompraId(item.id);

    setCompraEstoqueForm({
      data: item.data || "",
      produto: item.produto || "",
      quantidade: String(item.quantidade ?? ""),
      larguraRibbon: item.larguraRibbon || "",
      metragemRibbon: item.metragemRibbon || "",
      custoTotal: String(item.custoTotal ?? ""),
      observacao: item.observacao || "",
    });
  }

  function editarPerda(item) {
    if (!admin) return;

    setEditandoPerdaId(item.id);

    setPerdaEstoqueForm({
      data: item.data || "",
      produto: item.produto || "",
      quantidade: String(item.quantidade ?? ""),
      motivo: item.motivo || "",
    });
  }

  function cancelarEdicaoEstoque() {
    setEditandoCompraId(null);
    setEditandoPerdaId(null);

    setCompraEstoqueForm({
      ...compraEstoqueForm,
      quantidade: "",
      larguraRibbon: "",
      metragemRibbon: "",
      custoTotal: "",
      observacao: "",
    });

    setPerdaEstoqueForm({
      ...perdaEstoqueForm,
      quantidade: "",
      motivo: "Placa errada",
    });
  }

  function removerMovimentoEstoque(tipo, id) {
    if (!admin) {
      alert("Apenas administrador pode excluir lançamentos de estoque.");
      return;
    }

    if (tipo === "compra") {
      setEstoqueCompras((old) => old.filter((item) => item.id !== id));
    }

    if (tipo === "perda") {
      setEstoquePerdas((old) => old.filter((item) => item.id !== id));
    }
  }

  const estoqueResumo = useMemo(() => {
    return produtosDisponiveisEstoque.map((produto) => {
      const compras = estoqueCompras
        .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
        .reduce((soma, item) => soma + numero(item.quantidade), 0);

      const custoTotal = estoqueCompras
        .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
        .reduce((soma, item) => soma + numero(item.custoTotal), 0);

      const custoMedio = compras > 0 ? custoTotal / compras : 0;

      const usadoEmServicos = entradas.reduce((soma, entrada) => {
        const uso = calcularUsoEstoque(entrada.produto);
        if (!uso || uso.item !== produto) return soma;
        return soma + uso.quantidade;
      }, 0);

      const perdas = estoquePerdas
        .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
        .reduce((soma, item) => soma + numero(item.quantidade), 0);

      const saldo = compras - usadoEmServicos - perdas;

      return {
        produto,
        compras,
        custoTotal,
        custoMedio,
        usadoEmServicos,
        perdas,
        saldo,
        status: saldo <= 0 ? "CRÍTICO" : saldo <= 10 ? "BAIXO" : "OK",
      };
    });
  }, [produtosDisponiveisEstoque, estoqueCompras, estoquePerdas, entradas]);

  const usosEstoqueServicos = useMemo(() => {
    return entradas
      .map((entrada) => {
        const uso = calcularUsoEstoque(entrada.produto);
        if (!uso) return null;

        return {
          data: entrada.data,
          cliente: entrada.cliente,
          produtoServico: entrada.produto,
          placa: entrada.placa,
          itemEstoque: uso.item,
          quantidade: uso.quantidade,
        };
      })
      .filter(Boolean);
  }, [entradas]);

  const totalCompras = estoqueResumo.reduce((soma, item) => soma + item.compras, 0);
  const totalUsado = estoqueResumo.reduce(
    (soma, item) => soma + item.usadoEmServicos,
    0
  );
  const totalPerdas = estoqueResumo.reduce((soma, item) => soma + item.perdas, 0);
  const saldoTotal = estoqueResumo.reduce((soma, item) => soma + item.saldo, 0);
  const itensCriticos = estoqueResumo.filter((item) => item.status === "CRÍTICO").length;
  const itensBaixos = estoqueResumo.filter((item) => item.status === "BAIXO").length;

  const clienteSelecionado = clientes.find(
    (c) =>
      normalizar(c.nome).includes(normalizar(simulacao.cliente)) ||
      normalizar(simulacao.cliente).includes(normalizar(c.nome))
  );

  return (
    <>
      <div style={styles.kpis}>
        <Kpi titulo="Saldo total" valor={`${saldoTotal} un.`} />
        <Kpi titulo="Compras" valor={`${totalCompras} un.`} />
        <Kpi titulo="Usado em vendas" valor={`${totalUsado} un.`} />
        <Kpi titulo="Perdas / erros" valor={`${totalPerdas} un.`} />
        <Kpi titulo="Itens críticos" valor={itensCriticos} />
        <Kpi titulo="Estoque baixo" valor={itensBaixos} />
      </div>

      <Card titulo="Configuração industrial do ribbon">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{ ...styles.botao, opacity: modoRibbonPadrao === "1X" ? 1 : 0.6 }}
            onClick={() => setModoRibbonPadrao("1X")}
          >
            Ribbon padrão 1X
          </button>

          <button
            style={{ ...styles.botao, opacity: modoRibbonPadrao === "2X" ? 1 : 0.6 }}
            onClick={() => setModoRibbonPadrao("2X")}
          >
            Ribbon padrão 2X
          </button>

          <strong style={{ color: "#fff" }}>Modo atual: {modoRibbonPadrao}</strong>
        </div>
      </Card>

      <Card titulo="Projeção de faturamento pelo estoque disponível">
        <div style={styles.formGrid}>
          <Select
            label="Cliente"
            valor={simulacao.cliente}
            mudar={(v) => setSimulacao({ ...simulacao, cliente: v })}
            opcoes={clientes.map((cliente) => cliente.nome)}
          />
        </div>

        <Tabela
          colunas={[
            "Serviço",
            "Produto físico",
            "Consumo",
            "Saldo disponível",
            "Qtd possível",
            "Preço",
            "Custo projetado",
            "Lucro projetado",
            "Faturamento projetado",
          ]}
          dados={TIPOS_SIMULACAO.map((tipoServico) => {
            const regra = calcularConsumoSimulacao(tipoServico);
            const itemEstoque = estoqueResumo.find(
              (item) => item.produto === regra.item
            );

            const saldo = itemEstoque?.saldo || 0;
            const qtdPossivel = Math.max(
              Math.floor(saldo / regra.consumo),
              0
            );

            const preco = precoClientePorServico(clienteSelecionado, tipoServico);
            const custoProjetado =
              qtdPossivel * regra.consumo * (itemEstoque?.custoMedio || 0);
            const faturamentoProjetado = qtdPossivel * preco;
            const lucroProjetado = faturamentoProjetado - custoProjetado;

            return [
              tipoServico,
              regra.item,
              regra.consumo,
              saldo,
              qtdPossivel,
              moeda.format(preco),
              moeda.format(custoProjetado),
              moeda.format(lucroProjetado),
              moeda.format(faturamentoProjetado),
            ];
          })}
        />
      </Card>

      <Card titulo="Resumo profissional do estoque">
        <Tabela
          colunas={[
            "Produto físico",
            "Compras",
            "Custo total",
            "Custo médio",
            "Usado em serviços",
            "Perdas/erros",
            "Saldo atual",
            "Status",
          ]}
          dados={estoqueResumo.map((item) => [
            item.produto,
            item.compras,
            moeda.format(item.custoTotal || 0),
            moeda.format(item.custoMedio || 0),
            item.usadoEmServicos,
            item.perdas,
            item.saldo,
            item.status,
          ])}
        />
      </Card>

      <div style={styles.grid2}>
        <Card titulo={editandoCompraId ? "Editando compra de estoque" : "Adicionar compra de estoque"}>
          <div style={styles.formGrid}>
            <Campo
              label="Novo produto personalizado"
              valor={novoProdutoEstoque}
              mudar={setNovoProdutoEstoque}
            />

            <button style={styles.botaoSecundario || styles.botao} onClick={adicionarProdutoPersonalizado}>
              Adicionar produto ao estoque
            </button>

            <Campo
              label="Data"
              tipo="date"
              valor={compraEstoqueForm.data}
              mudar={(v) => setCompraEstoqueForm({ ...compraEstoqueForm, data: v })}
            />

            <Select
              label="Produto físico"
              valor={compraEstoqueForm.produto}
              mudar={(v) => setCompraEstoqueForm({ ...compraEstoqueForm, produto: v })}
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={compraEstoqueForm.quantidade}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, quantidade: v })
              }
            />

            {ehRibbon(compraEstoqueForm.produto) && (
              <>
                <Campo
                  label="Largura do ribbon (mm)"
                  tipo="number"
                  valor={compraEstoqueForm.larguraRibbon}
                  mudar={(v) =>
                    setCompraEstoqueForm({
                      ...compraEstoqueForm,
                      larguraRibbon: v,
                    })
                  }
                />

                <Campo
                  label="Metragem do rolo (m)"
                  tipo="number"
                  valor={compraEstoqueForm.metragemRibbon}
                  mudar={(v) =>
                    setCompraEstoqueForm({
                      ...compraEstoqueForm,
                      metragemRibbon: v,
                    })
                  }
                />
              </>
            )}

            <Campo
              label="Custo total da compra"
              tipo="number"
              valor={compraEstoqueForm.custoTotal}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, custoTotal: v })
              }
            />

            <Campo
              label="Observação"
              valor={compraEstoqueForm.observacao}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, observacao: v })
              }
            />

            <button style={styles.botao} onClick={salvarCompraEstoque}>
              {editandoCompraId ? "Salvar edição" : "Adicionar compra"}
            </button>

            {editandoCompraId && (
              <button style={styles.botaoCinza} onClick={cancelarEdicaoEstoque}>
                Cancelar edição
              </button>
            )}
          </div>
        </Card>

        <Card titulo={editandoPerdaId ? "Editando perda de estoque" : "Lançar perda / placa errada"}>
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={perdaEstoqueForm.data}
              mudar={(v) => setPerdaEstoqueForm({ ...perdaEstoqueForm, data: v })}
            />

            <Select
              label="Produto físico"
              valor={perdaEstoqueForm.produto}
              mudar={(v) => setPerdaEstoqueForm({ ...perdaEstoqueForm, produto: v })}
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={perdaEstoqueForm.quantidade}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, quantidade: v })
              }
            />

            <Campo
              label="Motivo"
              valor={perdaEstoqueForm.motivo}
              mudar={(v) => setPerdaEstoqueForm({ ...perdaEstoqueForm, motivo: v })}
            />

            <button style={styles.botao} onClick={salvarPerdaEstoque}>
              {editandoPerdaId ? "Salvar edição" : "Lançar perda"}
            </button>

            {editandoPerdaId && (
              <button style={styles.botaoCinza} onClick={cancelarEdicaoEstoque}>
                Cancelar edição
              </button>
            )}
          </div>
        </Card>
      </div>

      <div style={styles.grid2}>
        <Card titulo="Histórico de compras">
          <Tabela
            colunas={[
              "Data",
              "Produto",
              "Qtd",
              "Largura",
              "Metragem",
              "Custo total",
              "Custo médio",
              "Observação",
              "Ações",
            ]}
            dados={estoqueCompras.map((item) => [
              item.data,
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.larguraRibbon ? `${item.larguraRibbon} mm` : "-",
              item.metragemRibbon ? `${item.metragemRibbon} m` : "-",
              moeda.format(item.custoTotal || 0),
              moeda.format(
                (item.custoTotal || 0) /
                  ((item.quantidade || 1) === 0 ? 1 : item.quantidade || 1)
              ),
              item.observacao || "-",
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {admin && (
                  <button style={styles.detalhes} onClick={() => editarCompra(item)}>
                    Editar
                  </button>
                )}

                {admin && (
                  <button
                    style={styles.excluir}
                    onClick={() => removerMovimentoEstoque("compra", item.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>,
            ])}
          />
        </Card>

        <Card titulo="Histórico de perdas / placas erradas">
          <Tabela
            colunas={["Data", "Produto", "Quantidade", "Motivo", "Ações"]}
            dados={estoquePerdas.map((item) => [
              item.data,
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.motivo || "-",
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {admin && (
                  <button style={styles.detalhes} onClick={() => editarPerda(item)}>
                    Editar
                  </button>
                )}

                {admin && (
                  <button
                    style={styles.excluir}
                    onClick={() => removerMovimentoEstoque("perda", item.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>,
            ])}
          />
        </Card>
      </div>

      <Card titulo="Baixa automática pelas vendas antigas e atuais">
        <Tabela
          colunas={[
            "Data",
            "Cliente",
            "Serviço vendido",
            "Placa",
            "Produto físico baixado",
            "Quantidade",
          ]}
          dados={usosEstoqueServicos.map((item) => [
            item.data,
            item.cliente,
            item.produtoServico,
            item.placa,
            item.itemEstoque,
            item.quantidade,
          ])}
        />
      </Card>
    </>
  );
}