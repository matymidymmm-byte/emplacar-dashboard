import { useMemo, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Kpi from "../components/Kpi.jsx";

import styles from "../styles/styles.js";

const PRODUTOS_ESTOQUE_PROFISSIONAL = [
  "VEICULAR PADRÃO",
  "VEICULAR PRETA",
  "VEICULAR MINI",
  "VEICULAR MINI-MINI",
  "MOTO PADRÃO",
  "MOTO PRETA",
  "MOTO MINI",
  "SUPORTE",
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
];

export default function Estoque({
  entradas,
  clientes,
  compraEstoqueForm,
  setCompraEstoqueForm,
  perdaEstoqueForm,
  setPerdaEstoqueForm,
  estoqueCompras,
  setEstoqueCompras,
  estoquePerdas,
  setEstoquePerdas,
  numero,
  normalizar,
}) {
  const [simulacao, setSimulacao] = useState({
  tipoServico: "PAR VEICULAR PADRÃO",
  cliente: "",
  precoVenda: "",
  usarPrecoManual: false,
});
  function calcularUsoEstoque(produto) {
    const p = normalizar(produto || "");

    if (p.includes("SUPORTE")) return { item: "SUPORTE", quantidade: 1 };

    const ehMoto = p.includes("MOTO");

    const ehPreta =
      p.includes("PRETA") || p.includes("BLACK") || p.includes("COLECAO") || p.includes("COLEÇÃO") || p.includes("COLECIONADOR");

    const ehMiniMini =
      p.includes("MINI MINI") || p.includes("MINI-MINI") || p.includes("MINIMINI");

    const ehMini = p.includes("MINI") && !ehMiniMini;

    const ehReboque =
      p.includes("REBOQUE") || p.includes("DOLLY") || p.includes("CARRETINHA");

    const ehAvulsa =
      p.includes("AVULSA") || p.includes("DIANTEIRA") || p.includes("TRASEIRA");

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

  function normalizarProdutoEstoque(produto) {
    const p = normalizar(produto || "");

    if (p === "PLACA CARRO") return "VEICULAR PADRÃO";
    if (p === "PLACA MOTO") return "MOTO PADRÃO";
    if (p === "SUPORTE") return "SUPORTE";

    return produto;
  }

  function calcularConsumoSimulacao(tipo) {
    const t = normalizar(tipo || "");

    if (t.includes("MOTO PRETA")) return { item: "MOTO PRETA", consumo: 1 };
    if (t.includes("MOTO MINI")) return { item: "MOTO MINI", consumo: 1 };
    if (t.includes("MOTO")) return { item: "MOTO PADRÃO", consumo: 1 };

    if (t.includes("PRETA")) {
      return { item: "VEICULAR PRETA", consumo: t.includes("REBOQUE") ? 1 : 2 };
    }

    if (t.includes("MINI-MINI") || t.includes("MINI MINI") || t.includes("MINIMINI")) {
      return { item: "VEICULAR MINI-MINI", consumo: t.includes("REBOQUE") ? 1 : 2 };
    }

    if (t.includes("MINI")) {
      return { item: "VEICULAR MINI", consumo: t.includes("REBOQUE") ? 1 : 2 };
    }

    return { item: "VEICULAR PADRÃO", consumo: t.includes("REBOQUE") ? 1 : 2 };
  }

  function salvarCompraEstoque() {
    if (!compraEstoqueForm.produto || !compraEstoqueForm.quantidade) return;

    setEstoqueCompras((old) => [
      {
        id: Date.now(),
        ...compraEstoqueForm,
        produto: normalizarProdutoEstoque(compraEstoqueForm.produto),
        quantidade: numero(compraEstoqueForm.quantidade),
      },
      ...old,
    ]);

    setCompraEstoqueForm({
      ...compraEstoqueForm,
      quantidade: "",
      observacao: "",
    });
  }

  function salvarPerdaEstoque() {
    if (!perdaEstoqueForm.produto || !perdaEstoqueForm.quantidade) return;

    setEstoquePerdas((old) => [
      {
        id: Date.now(),
        ...perdaEstoqueForm,
        produto: normalizarProdutoEstoque(perdaEstoqueForm.produto),
        quantidade: numero(perdaEstoqueForm.quantidade),
      },
      ...old,
    ]);

    setPerdaEstoqueForm({
      ...perdaEstoqueForm,
      quantidade: "",
      motivo: "Placa errada",
    });
  }

  function removerMovimentoEstoque(tipo, id) {
    if (tipo === "compra") {
      setEstoqueCompras((old) => old.filter((item) => item.id !== id));
    }

    if (tipo === "perda") {
      setEstoquePerdas((old) => old.filter((item) => item.id !== id));
    }
  }

  const estoqueResumo = useMemo(() => {
    return PRODUTOS_ESTOQUE_PROFISSIONAL.map((produto) => {
      const compras = estoqueCompras
        .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
        .reduce((soma, item) => soma + numero(item.quantidade), 0);

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
        usadoEmServicos,
        perdas,
        saldo,
        status: saldo <= 0 ? "CRÍTICO" : saldo <= 10 ? "BAIXO" : "OK",
      };
    });
  }, [estoqueCompras, estoquePerdas, entradas]);

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

  const regraSimulacao = calcularConsumoSimulacao(simulacao.tipoServico);

  const itemSimulado = estoqueResumo.find(
    (item) => item.produto === regraSimulacao.item
  );

  const saldoDisponivel = itemSimulado?.saldo || 0;
  const quantidadePossivel = Math.floor(saldoDisponivel / regraSimulacao.consumo);
  const precoVenda = numero(simulacao.precoVenda);
  const faturamentoProjetado = quantidadePossivel * precoVenda;

  const totalCompras = estoqueResumo.reduce((soma, item) => soma + item.compras, 0);
  const totalUsado = estoqueResumo.reduce((soma, item) => soma + item.usadoEmServicos, 0);
  const totalPerdas = estoqueResumo.reduce((soma, item) => soma + item.perdas, 0);
  const saldoTotal = estoqueResumo.reduce((soma, item) => soma + item.saldo, 0);
  const itensCriticos = estoqueResumo.filter((item) => item.status === "CRÍTICO").length;
  const itensBaixos = estoqueResumo.filter((item) => item.status === "BAIXO").length;

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

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

      <Card titulo="Projeção de faturamento pelo estoque disponível">
  <div style={styles.formGrid}>
    <Select
      label="Cliente"
      valor={simulacao.cliente}
      mudar={(v) =>
        setSimulacao({
          ...simulacao,
          cliente: v,
        })
      }
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
      "Faturamento projetado",
    ]}
    dados={TIPOS_SIMULACAO.map((tipoServico) => {
      const clienteSelecionado = clientes.find(
  (c) =>
    normalizar(c.nome).includes(normalizar(simulacao.cliente)) ||
    normalizar(simulacao.cliente).includes(normalizar(c.nome))
);


      const regra = calcularConsumoSimulacao(tipoServico);

      const itemEstoque = estoqueResumo.find(
        (item) => item.produto === regra.item
      );

      const saldo = itemEstoque?.saldo || 0;

      const qtdPossivel = Math.floor(
        saldo / regra.consumo
      );

      const tipo = normalizar(tipoServico);

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

let preco = 0;

if (clienteSelecionado) {
  if (tipo.includes("MOTO")) {
    preco = lerPreco(clienteSelecionado.precoMoto);
  } else if (tipo.includes("REBOQUE")) {
    preco = lerPreco(clienteSelecionado.precoReboque);
  } else if (tipo.includes("PRETA")) {
    preco = lerPreco(clienteSelecionado.precoPlacaPreta);
  } else if (tipo.includes("MINI")) {
    preco = lerPreco(clienteSelecionado.precoMini);
  } else {
    preco = lerPreco(clienteSelecionado.precoParVeicular);
  }
}

      return [
        tipoServico,
        regra.item,
        regra.consumo,
        saldo,
        Math.max(qtdPossivel, 0),
        moeda.format(preco),
        moeda.format(Math.max(qtdPossivel, 0) * preco),
      ];
    })}
  />
</Card>

      <Card titulo="Resumo profissional do estoque">
        <Tabela
          colunas={[
            "Produto físico",
            "Compras",
            "Usado em serviços",
            "Perdas/erros",
            "Saldo atual",
            "Status",
          ]}
          dados={estoqueResumo.map((item) => [
            item.produto,
            item.compras,
            item.usadoEmServicos,
            item.perdas,
            item.saldo,
            item.status,
          ])}
        />
      </Card>

      <div style={styles.grid2}>
        <Card titulo="Adicionar compra de estoque">
          <div style={styles.formGrid}>
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
              opcoes={PRODUTOS_ESTOQUE_PROFISSIONAL}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={compraEstoqueForm.quantidade}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, quantidade: v })
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
              Adicionar compra
            </button>
          </div>
        </Card>

        <Card titulo="Lançar perda / placa errada">
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
              opcoes={PRODUTOS_ESTOQUE_PROFISSIONAL}
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
              Lançar perda
            </button>
          </div>
        </Card>
      </div>

      <div style={styles.grid2}>
        <Card titulo="Histórico de compras">
          <Tabela
            colunas={["Data", "Produto", "Quantidade", "Observação", "Ações"]}
            dados={estoqueCompras.map((item) => [
              item.data,
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.observacao,
              <button
                style={styles.excluir}
                onClick={() => removerMovimentoEstoque("compra", item.id)}
              >
                Excluir
              </button>,
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
              item.motivo,
              <button
                style={styles.excluir}
                onClick={() => removerMovimentoEstoque("perda", item.id)}
              >
                Excluir
              </button>,
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