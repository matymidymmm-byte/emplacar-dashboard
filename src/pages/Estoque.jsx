import { useMemo } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Kpi from "../components/Kpi.jsx";

import styles from "../styles/styles.js";

export default function Estoque({
  entradas,
  produtosEstoque,
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
  function calcularUsoEstoque(produto) {
    const p = normalizar(produto);

    if (p.includes("SUPORTE")) return { item: "Suporte", quantidade: 1 };
    if (p.includes("MOTO")) return { item: "Placa Moto", quantidade: 1 };
    if (p.includes("REBOQUE")) return { item: "Placa Carro", quantidade: 1 };
    if (p.includes("PAR")) return { item: "Placa Carro", quantidade: 2 };
    if (p.includes("AVULSA") || p.includes("DIANTEIRA")) {
      return { item: "Placa Carro", quantidade: 1 };
    }
    if (p.includes("CARRO")) return { item: "Placa Carro", quantidade: 1 };

    return null;
  }

  function salvarCompraEstoque() {
    if (!compraEstoqueForm.produto || !compraEstoqueForm.quantidade) return;

    setEstoqueCompras((old) => [
      {
        id: Date.now(),
        ...compraEstoqueForm,
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
    return produtosEstoque.map((produto) => {
      const compras = estoqueCompras
        .filter((item) => item.produto === produto)
        .reduce((soma, item) => soma + item.quantidade, 0);

      const usadoEmServicos = entradas.reduce((soma, entrada) => {
        const uso = calcularUsoEstoque(entrada.produto);

        if (!uso || uso.item !== produto) return soma;

        return soma + uso.quantidade;
      }, 0);

      const perdas = estoquePerdas
        .filter((item) => item.produto === produto)
        .reduce((soma, item) => soma + item.quantidade, 0);

      return {
        produto,
        compras,
        usadoEmServicos,
        perdas,
        saldo: compras - usadoEmServicos - perdas,
      };
    });
  }, [produtosEstoque, estoqueCompras, estoquePerdas, entradas]);

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

  return (
    <>
      <div style={styles.kpis}>
        {estoqueResumo.map((item) => (
          <Kpi
            key={item.produto}
            titulo={item.produto}
            valor={`${item.saldo} un.`}
          />
        ))}
      </div>

      <div style={styles.grid2}>
        <Card titulo="Adicionar compra de estoque">
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={compraEstoqueForm.data}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  data: v,
                })
              }
            />

            <Select
              label="Produto"
              valor={compraEstoqueForm.produto}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  produto: v,
                })
              }
              opcoes={produtosEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={compraEstoqueForm.quantidade}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  quantidade: v,
                })
              }
            />

            <Campo
              label="Observação"
              valor={compraEstoqueForm.observacao}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  observacao: v,
                })
              }
            />

            <button style={styles.botao} onClick={salvarCompraEstoque}>
              Adicionar compra
            </button>
          </div>
        </Card>

        <Card titulo="Lançar placa errada / perda">
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={perdaEstoqueForm.data}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  data: v,
                })
              }
            />

            <Select
              label="Produto"
              valor={perdaEstoqueForm.produto}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  produto: v,
                })
              }
              opcoes={produtosEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={perdaEstoqueForm.quantidade}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  quantidade: v,
                })
              }
            />

            <Campo
              label="Motivo"
              valor={perdaEstoqueForm.motivo}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  motivo: v,
                })
              }
            />

            <button style={styles.botao} onClick={salvarPerdaEstoque}>
              Lançar perda
            </button>
          </div>
        </Card>
      </div>

      <Card titulo="Resumo do estoque">
        <Tabela
          colunas={["Produto", "Compras", "Usado em serviços", "Perdas/erros", "Saldo atual"]}
          dados={estoqueResumo.map((item) => [
            item.produto,
            item.compras,
            item.usadoEmServicos,
            item.perdas,
            item.saldo,
          ])}
        />
      </Card>

      <div style={styles.grid2}>
        <Card titulo="Histórico de compras">
          <Tabela
            colunas={["Data", "Produto", "Quantidade", "Observação", "Ações"]}
            dados={estoqueCompras.map((item) => [
              item.data,
              item.produto,
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
              item.produto,
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

      <Card titulo="Baixa automática pelos serviços vendidos">
        <Tabela
          colunas={["Data", "Cliente", "Serviço", "Placa", "Item baixado", "Quantidade"]}
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