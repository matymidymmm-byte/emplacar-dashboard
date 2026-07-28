import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  History,
  PackagePlus,
  Pencil,
  Scale,
  Trash2,
  TriangleAlert,
} from "lucide-react";

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
  ajusteEstoqueForm,
  setAjusteEstoqueForm,
  metragemPadraoDoRibbon,

  ajustesEstoque = [],
  salvarAjusteEstoque,

  fornecedoresDisponiveis,
  produtosDisponiveisEstoque,

  ehRibbon,
  salvarCompraEstoque,
  salvarPerdaEstoque,
  cancelarEdicaoEstoque,

  estoqueCompras = [],
  estoquePerdas = [],
  movimentacoesReais = [],

  normalizarProdutoEstoque,
  moeda,

  admin,
  editarCompra,
  editarPerda,
  removerMovimentoEstoque,
}) {
  const [mostrarHistoricoCompras, setMostrarHistoricoCompras] =
    useState(false);

  const [mostrarHistoricoPerdas, setMostrarHistoricoPerdas] =
    useState(false);

  const [mostrarHistoricoAjustes, setMostrarHistoricoAjustes] =
    useState(false);

  const [mostrarLivroMovimentacoes, setMostrarLivroMovimentacoes] =
    useState(false);

  const opcoesUsoRibbon = [
    "Somente carro",
    "Somente moto",
    "Carro e moto",
  ];

  const opcoesMotivoAjuste = [
    "Inventário",
    "Transferência",
    "Doação",
    "Erro de lançamento",
    "Outro",
  ];

  const secaoStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  };

  const topoCardStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  };

  const tituloInternoStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 800,
    fontSize: 16,
    color: "#f8fafc",
  };

  const descricaoStyle = {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.4,
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "rgba(99, 102, 241, 0.16)",
    border: "1px solid rgba(129, 140, 248, 0.35)",
    color: "#c7d2fe",
    fontSize: 12,
    fontWeight: 800,
  };

  const botaoAbrirStyle = {
    ...(styles.botaoSecundario || styles.botao),
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 132,
  };

  function CabecalhoConsulta({
    icone: Icone,
    titulo,
    descricao,
    quantidade,
    aberto,
    alternar,
  }) {
    return (
      <div style={topoCardStyle}>
        <div>
          <div style={tituloInternoStyle}>
            <Icone size={18} strokeWidth={2.2} />
            <span>{titulo}</span>
            <span style={badgeStyle}>{quantidade}</span>
          </div>

          <p style={descricaoStyle}>{descricao}</p>
        </div>

        <button style={botaoAbrirStyle} onClick={alternar}>
          {aberto ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          {aberto ? "Fechar" : "Abrir"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={secaoStyle}>
        <Card titulo="Entrada de estoque">
          <div style={topoCardStyle}>
            <div>
              <div style={tituloInternoStyle}>
                <PackagePlus size={19} strokeWidth={2.2} />

                <span>
                  {editandoCompraId
                    ? "Editar compra lançada"
                    : "Adicionar nova compra"}
                </span>
              </div>

              <p style={descricaoStyle}>
                Registre produtos físicos, ribbons, custos e fornecedores.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={compraEstoqueForm.data || ""}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  data: v,
                })
              }
            />

            <Select
              label="Fornecedor"
              valor={compraEstoqueForm.fornecedor || ""}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  fornecedor: v,
                })
              }
              opcoes={fornecedoresDisponiveis}
            />

            <Select
              label="Produto físico"
              valor={compraEstoqueForm.produto || ""}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  produto: v,
                })
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
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  quantidade: v,
                })
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

                <Select
                  label="Uso do ribbon"
                  valor={compraEstoqueForm.usoRibbon || "Carro e moto"}
                  mudar={(v) =>
                    setCompraEstoqueForm({
                      ...compraEstoqueForm,
                      usoRibbon: v,
                    })
                  }
                  opcoes={opcoesUsoRibbon}
                />
              </>
            )}

            <Campo
              label="Custo total da compra"
              tipo="text"
              valor={compraEstoqueForm.custoTotal || ""}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  custoTotal: v,
                })
              }
            />

            <Campo
              label="Observação"
              valor={compraEstoqueForm.observacao || ""}
              mudar={(v) =>
                setCompraEstoqueForm({
                  ...compraEstoqueForm,
                  observacao: v,
                })
              }
            />

            <button
              style={styles.botao}
              onClick={salvarCompraEstoque}
            >
              {editandoCompraId ? "Salvar edição" : "Adicionar compra"}
            </button>

            {editandoCompraId && (
              <button
                style={styles.botaoCinza}
                onClick={cancelarEdicaoEstoque}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </Card>

        <Card titulo="Baixa por perda">
          <div style={topoCardStyle}>
            <div>
              <div style={tituloInternoStyle}>
                <TriangleAlert size={19} strokeWidth={2.2} />

                <span>
                  {editandoPerdaId
                    ? "Editar perda lançada"
                    : "Lançar perda ou placa errada"}
                </span>
              </div>

              <p style={descricaoStyle}>
                Dê baixa em itens danificados, errados ou inutilizados.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={perdaEstoqueForm.data || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  data: v,
                })
              }
            />

            <Select
              label="Produto físico"
              valor={perdaEstoqueForm.produto || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  produto: v,
                })
              }
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={perdaEstoqueForm.quantidade || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  quantidade: v,
                })
              }
            />

            <Campo
              label="Motivo"
              valor={perdaEstoqueForm.motivo || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({
                  ...perdaEstoqueForm,
                  motivo: v,
                })
              }
            />

            <button
              style={styles.botao}
              onClick={salvarPerdaEstoque}
            >
              {editandoPerdaId ? "Salvar edição" : "Lançar perda"}
            </button>

            {editandoPerdaId && (
              <button
                style={styles.botaoCinza}
                onClick={cancelarEdicaoEstoque}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </Card>

        <Card titulo="Conferência física">
          <div style={topoCardStyle}>
            <div>
              <div style={tituloInternoStyle}>
                <Scale size={19} strokeWidth={2.2} />
                <span>Ajuste manual de estoque</span>
              </div>

              <p style={descricaoStyle}>
                Informe a quantidade real encontrada para corrigir diferenças
                de inventário.
              </p>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Select
  label="Produto"
  valor={ajusteEstoqueForm.produto || ""}
  mudar={(v) => {
    const produtoEhRibbon = ehRibbon(v);

    const metragemEncontrada = produtoEhRibbon
      ? metragemPadraoDoRibbon(v)
      : 0;

    setAjusteEstoqueForm({
      ...ajusteEstoqueForm,
      produto: v,
      quantidadeFisica: "",
      metragemRolo: produtoEhRibbon
        ? String(metragemEncontrada || "")
        : "",
      rolosFechados: "",
      metrosRoloEmUso: "",
    });
  }}
  opcoes={produtosDisponiveisEstoque.filter((produto) => {
    if (!ehRibbon(produto)) return true;

    return produto.includes("|");
  })}
/>

            {ehRibbon(ajusteEstoqueForm.produto) ? (
  <>
    <Campo
      label="Metragem do rolo (m)"
      tipo="number"
      valor={ajusteEstoqueForm.metragemRolo || ""}
      mudar={(v) =>
        setAjusteEstoqueForm({
          ...ajusteEstoqueForm,
          metragemRolo: v,
        })
      }
    />

    <Campo
      label="Rolos fechados"
      tipo="number"
      valor={ajusteEstoqueForm.rolosFechados || ""}
      mudar={(v) =>
        setAjusteEstoqueForm({
          ...ajusteEstoqueForm,
          rolosFechados: v,
        })
      }
    />

    <Campo
      label="Metragem do rolo em uso"
      tipo="number"
      valor={ajusteEstoqueForm.metrosRoloEmUso || ""}
      mudar={(v) =>
        setAjusteEstoqueForm({
          ...ajusteEstoqueForm,
          metrosRoloEmUso: v,
        })
      }
    />

    <Campo
      label="Total físico calculado"
      valor={`${
        (Number(ajusteEstoqueForm.rolosFechados || 0) *
          Number(ajusteEstoqueForm.metragemRolo || 0)) +
        Number(ajusteEstoqueForm.metrosRoloEmUso || 0)
      } m`}
      somenteLeitura
    />
  </>
) : (
  <Campo
    label="Quantidade física encontrada"
    tipo="number"
    valor={ajusteEstoqueForm.quantidadeFisica || ""}
    mudar={(v) =>
      setAjusteEstoqueForm({
        ...ajusteEstoqueForm,
        quantidadeFisica: v,
      })
    }
  />
)}

            <Select
              label="Motivo"
              valor={ajusteEstoqueForm.motivo || "Inventário"}
              mudar={(v) =>
                setAjusteEstoqueForm({
                  ...ajusteEstoqueForm,
                  motivo: v,
                })
              }
              opcoes={opcoesMotivoAjuste}
            />

            <Campo
              label="Observação"
              valor={ajusteEstoqueForm.observacao || ""}
              mudar={(v) =>
                setAjusteEstoqueForm({
                  ...ajusteEstoqueForm,
                  observacao: v,
                })
              }
            />

            <button
              style={styles.botao}
              onClick={salvarAjusteEstoque}
            >
              Ajustar estoque
            </button>
          </div>
        </Card>
      </div>
            <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 16,
        }}
      >
        <Card titulo="Consultas de estoque">
          <CabecalhoConsulta
            icone={History}
            titulo="Histórico de compras"
            descricao="Consulte entradas, fornecedores, custos e edições realizadas."
            quantidade={estoqueCompras.length}
            aberto={mostrarHistoricoCompras}
            alternar={() =>
              setMostrarHistoricoCompras(
                (valorAtual) => !valorAtual
              )
            }
          />

          {mostrarHistoricoCompras && (
            <Tabela
              colunas={[
                "Data",
                "Fornecedor",
                "Produto",
                "Qtd",
                "Largura",
                "Metragem",
                "Uso ribbon",
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
                item.larguraRibbon
                  ? `${item.larguraRibbon} mm`
                  : "-",
                item.metragemRibbon
                  ? `${item.metragemRibbon} m`
                  : "-",
                ehRibbon(item.produto)
                  ? item.usoRibbon || "Carro e moto"
                  : "-",
                moeda.format(item.custoTotal || 0),
                item.atualizadoPor || item.criadoPor || "-",
                item.observacao || "-",

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {admin && (
                    <button
                      style={styles.detalhes}
                      onClick={() => editarCompra(item)}
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  )}

                  {admin && (
                    <button
                      style={styles.excluir}
                      onClick={() =>
                        removerMovimentoEstoque(
                          "compra",
                          item.id
                        )
                      }
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  )}
                </div>,
              ])}
            />
          )}
        </Card>

        <Card titulo="Consultas de perdas">
          <CabecalhoConsulta
            icone={TriangleAlert}
            titulo="Histórico de perdas e placas erradas"
            descricao="Consulte as baixas manuais e os responsáveis pelos lançamentos."
            quantidade={estoquePerdas.length}
            aberto={mostrarHistoricoPerdas}
            alternar={() =>
              setMostrarHistoricoPerdas(
                (valorAtual) => !valorAtual
              )
            }
          />

          {mostrarHistoricoPerdas && (
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

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {admin && (
                    <button
                      style={styles.detalhes}
                      onClick={() => editarPerda(item)}
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  )}

                  {admin && (
                    <button
                      style={styles.excluir}
                      onClick={() =>
                        removerMovimentoEstoque(
                          "perda",
                          item.id
                        )
                      }
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  )}
                </div>,
              ])}
            />
          )}
        </Card>

        <Card titulo="Consultas de inventário">
          <CabecalhoConsulta
            icone={ClipboardList}
            titulo="Histórico de ajustes de estoque"
            descricao="Acompanhe saldo teórico, saldo físico, diferença e motivo do ajuste."
            quantidade={ajustesEstoque.length}
            aberto={mostrarHistoricoAjustes}
            alternar={() =>
              setMostrarHistoricoAjustes(
                (valorAtual) => !valorAtual
              )
            }
          />

          {mostrarHistoricoAjustes && (
            <Tabela
              colunas={[
                "Data",
                "Produto",
                "Saldo teórico",
                "Saldo físico",
                "Diferença",
                "Motivo",
                "Usuário",
                "Observação",
                "Ações",
              ]}
              dados={ajustesEstoque.map((item) => [
                item.data || "-",
                normalizarProdutoEstoque(item.produto),
                item.saldoTeorico ?? 0,
                item.quantidadeFisica ?? 0,
                item.diferenca > 0
                  ? `+${item.diferenca}`
                  : item.diferenca ?? 0,
                item.motivo || "-",
                item.usuario || "-",
                item.observacao || "-",

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {admin && (
                    <button
                      style={styles.excluir}
                      onClick={() =>
                        removerMovimentoEstoque(
                          "ajuste",
                          item.id
                        )
                      }
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  )}
                </div>,
              ])}
            />
          )}
        </Card>

        <Card titulo="Livro de movimentações">
          <CabecalhoConsulta
            icone={BookOpen}
            titulo="Livro de movimentações do estoque"
            descricao="Veja todas as entradas, saídas, perdas e ajustes em ordem cronológica."
            quantidade={movimentacoesReais.length}
            aberto={mostrarLivroMovimentacoes}
            alternar={() =>
              setMostrarLivroMovimentacoes(
                (valorAtual) => !valorAtual
              )
            }
          />

          {mostrarLivroMovimentacoes && (
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
                item.valor
                  ? moeda.format(item.valor)
                  : "-",
                item.fornecedor || "-",
                item.usuario || "-",
                item.observacao || "-",
              ])}
            />
          )}
        </Card>
      </div>
    </>
  );
}