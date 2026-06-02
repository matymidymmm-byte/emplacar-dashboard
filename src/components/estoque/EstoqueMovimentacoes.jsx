import Card from "../Card.jsx";
import Campo from "../Campo.jsx";
import Select from "../Select.jsx";
import Tabela from "../Tabela.jsx";

import styles from "../../styles/styles.js";

export default function EstoqueMovimentacoes({
  editandoCompraId,
  editandoPerdaId,

  compraEstoqueForm,
  setCompraEstoqueForm,
  perdaEstoqueForm,
  setPerdaEstoqueForm,

  fornecedoresDisponiveis,
  produtosDisponiveisEstoque,

  ehRibbon,
  salvarCompraEstoque,
  salvarPerdaEstoque,
  cancelarEdicaoEstoque,

  estoqueCompras,
  estoquePerdas,
  movimentacoesReais,

  normalizarProdutoEstoque,
  moeda,

  admin,
  editarCompra,
  editarPerda,
  removerMovimentoEstoque,
}) {
  return (
    <>
      <div style={styles.grid2}>
        <Card
          titulo={
            editandoCompraId
              ? "Editando compra de estoque"
              : "Adicionar compra de estoque"
          }
        >
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={compraEstoqueForm.data || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, data: v })
              }
            />

            <Select
              label="Fornecedor"
              valor={compraEstoqueForm.fornecedor || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, fornecedor: v })
              }
              opcoes={fornecedoresDisponiveis}
            />

            <Select
              label="Produto físico"
              valor={compraEstoqueForm.produto || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, produto: v })
              }
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label={
                ehRibbon(compraEstoqueForm.produto)
                  ? "Quantidade de rolos"
                  : "Quantidade"
              }
              tipo="number"
              valor={compraEstoqueForm.quantidade || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, quantidade: v })
              }
            />

            {ehRibbon(compraEstoqueForm.produto) && (
              <>
                <Campo
                  label="Largura do ribbon (mm)"
                  tipo="number"
                  valor={compraEstoqueForm.larguraRibbon || ""}
                  mudar={(v) =>
                    setCompraEstoqueForm({
                      ...compraEstoqueForm,
                      larguraRibbon: v,
                    })
                  }
                />

                <Campo
                  label="Metragem do rolo / lote (m)"
                  tipo="number"
                  valor={compraEstoqueForm.metragemRibbon || ""}
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
              valor={compraEstoqueForm.custoTotal || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, custoTotal: v })
              }
            />

            <Campo
              label="Observação"
              valor={compraEstoqueForm.observacao || ""}
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

        <Card
          titulo={
            editandoPerdaId
              ? "Editando perda de estoque"
              : "Lançar perda / placa errada"
          }
        >
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={perdaEstoqueForm.data || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, data: v })
              }
            />

            <Select
              label="Produto físico"
              valor={perdaEstoqueForm.produto || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, produto: v })
              }
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={perdaEstoqueForm.quantidade || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, quantidade: v })
              }
            />

            <Campo
              label="Motivo"
              valor={perdaEstoqueForm.motivo || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, motivo: v })
              }
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
              "Fornecedor",
              "Produto",
              "Qtd",
              "Largura",
              "Metragem",
              "Custo total",
              "Usuário",
              "Observação",
              "Ações",
            ]}
            dados={estoqueCompras.map((item) => [
              item.data,
              item.fornecedor || "-",
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.larguraRibbon ? `${item.larguraRibbon} mm` : "-",
              item.metragemRibbon ? `${item.metragemRibbon} m` : "-",
              moeda.format(item.custoTotal || 0),
              item.atualizadoPor || item.criadoPor || "-",
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
            colunas={[
              "Data",
              "Produto",
              "Quantidade",
              "Motivo",
              "Usuário",
              "Ações",
            ]}
            dados={estoquePerdas.map((item) => [
              item.data,
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.motivo || "-",
              item.atualizadoPor || item.criadoPor || "-",
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

      <Card titulo="Livro de movimentações do estoque">
        <Tabela
          colunas={[
            "Data",
            "Tipo",
            "Origem",
            "Produto",
            "Quantidade",
            "Valor",
            "Fornecedor",
            "Usuário",
            "Observação",
          ]}
          dados={movimentacoesReais.map((item) => [
            item.data || "-",
            item.tipo || "-",
            item.origem || "-",
            item.produto || "-",
            item.quantidade || 0,
            item.valor ? moeda.format(item.valor) : "-",
            item.fornecedor || "-",
            item.usuario || "-",
            item.observacao || "-",
          ])}
        />
      </Card>
    </>
  );
}