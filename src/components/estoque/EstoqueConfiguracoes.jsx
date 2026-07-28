  import Card from "../Card.jsx";
  import Campo from "../Campo.jsx";
  import Select from "../Select.jsx";
  import Tabela from "../Tabela.jsx";

  import styles from "../../styles/styles.js";

  export default function EstoqueConfiguracoes({
    novoProdutoEstoque,
    setNovoProdutoEstoque,
    adicionarProdutoPersonalizado,
    produtosEstoquePersonalizados = [],
  removerProdutoPersonalizado,

  servicosSimulacaoEstoque = [],
  removerServicoSimulacao,

    novoFornecedor,
    setNovoFornecedor,
    adicionarFornecedor,

    novoServicoSimulacao,
    setNovoServicoSimulacao,
    adicionarServicoSimulacao,

    modoRibbonPadrao,
    setModoRibbonPadrao,

    parametroForm,
    setParametroForm,
    produtoParametroSelecionado,
    carregarParametroProduto,
    salvarParametroProduto,

    produtosDisponiveisEstoque,

    consumoForm,
    setConsumoForm,
    tiposSimulacaoDisponiveis,
    ehRibbon,
    adicionarRegraConsumo,

    admin,
    restaurarRegrasPadraoConsumo,
    regrasConsumoEmpresa,
    removerRegraConsumo,
    itensRelatorioWhatsApp = [],
alternarItemRelatorioWhatsApp = () => {},
    

    parametrosDoProduto,
  }) {
    return (
      <>
        <Card titulo="Configuração SaaS do estoque">
          <div style={styles.formGrid}>
            <Campo
              label="Novo produto configurável da empresa"
              valor={novoProdutoEstoque}
              mudar={setNovoProdutoEstoque}
            />

            <button
              style={styles.botaoSecundario || styles.botao}
              onClick={adicionarProdutoPersonalizado}
            >
              Adicionar produto
            </button>

            <Campo
              label="Novo fornecedor"
              valor={novoFornecedor}
              mudar={setNovoFornecedor}
            />

            <button
              style={styles.botaoSecundario || styles.botao}
              onClick={adicionarFornecedor}
            >
              Adicionar fornecedor
            </button>

            <Campo
              label="Novo serviço para consumo"
              valor={novoServicoSimulacao}
              mudar={setNovoServicoSimulacao}
            />

            <button
              style={styles.botaoSecundario || styles.botao}
              onClick={adicionarServicoSimulacao}
            >
              Adicionar serviço
            </button>
          </div>

          <p style={{ color: "#94a3b8", marginTop: 12 }}>
            Produto físico controla saldo. Serviço controla o que será consumido.
            Suporte só baixa quando for vendido como suporte.
          </p>
        </Card>

        <Card titulo="Modo de passagem do ribbon">
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              style={{
                ...styles.botao,
                opacity: modoRibbonPadrao === "1X" ? 1 : 0.6,
              }}
              onClick={() => setModoRibbonPadrao("1X")}
            >
              Ribbon padrão 1X
            </button>

            <button
              style={{
                ...styles.botao,
                opacity: modoRibbonPadrao === "2X" ? 1 : 0.6,
              }}
              onClick={() => setModoRibbonPadrao("2X")}
            >
              Ribbon padrão 2X
            </button>

            <strong style={{ color: "#fff" }}>
              Modo atual: {modoRibbonPadrao}
            </strong>
          </div>
        </Card>

        <Card titulo="Parâmetros do produto físico">
          <div style={styles.formGrid}>
            <Select
              label="Produto"
              valor={parametroForm.produto || produtoParametroSelecionado}
              mudar={(v) => carregarParametroProduto(v)}
              opcoes={produtosDisponiveisEstoque}
            />

            

            <Campo
              label="Unidade exibida"
              valor={parametroForm.unidade}
              mudar={(v) =>
                setParametroForm({ ...parametroForm, unidade: v })
              }
            />

            <Campo
              label="Estoque mínimo"
              tipo="number"
              valor={parametroForm.estoqueMinimo}
              mudar={(v) =>
                setParametroForm({ ...parametroForm, estoqueMinimo: v })
              }
            />

            <Campo
              label="Observação"
              valor={parametroForm.observacao}
              mudar={(v) =>
                setParametroForm({ ...parametroForm, observacao: v })
              }
            />

            <button style={styles.botao} onClick={salvarParametroProduto}>
              Salvar parâmetro
            </button>
          </div>

          <p style={{ color: "#94a3b8", marginTop: 12 }}>
            Para produtos físicos, configure apenas o estoque mínimo. O sistema calcula automaticamente:
  • Crítico = estoque mínimo
  • Baixo = até 2x o estoque mínimo
  • OK = acima de 2x o estoque mínimo
          </p>
        </Card>

        <Card titulo="Consumo por serviço">
          <div style={styles.formGrid}>
            <Select
              label="Serviço vendido"
              valor={consumoForm.servico}
              mudar={(v) => setConsumoForm({ ...consumoForm, servico: v })}
              opcoes={tiposSimulacaoDisponiveis}
            />

            <Select
              label="Insumo consumido"
              valor={consumoForm.insumo}
              mudar={(v) =>
                setConsumoForm({
                  ...consumoForm,
                  insumo: v,
                  aplicarMultiplicadorRibbon: ehRibbon(v)
                    ? consumoForm.aplicarMultiplicadorRibbon
                    : false,
                })
              }
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade base consumida"
              tipo="number"
              valor={consumoForm.quantidade}
              mudar={(v) =>
                setConsumoForm({ ...consumoForm, quantidade: v })
              }
            />

            {ehRibbon(consumoForm.insumo) && (
              <button
                style={{
                  ...(styles.botaoSecundario || styles.botao),
                  opacity: consumoForm.aplicarMultiplicadorRibbon ? 1 : 0.6,
                }}
                onClick={() =>
                  setConsumoForm({
                    ...consumoForm,
                    aplicarMultiplicadorRibbon:
                      !consumoForm.aplicarMultiplicadorRibbon,
                  })
                }
              >
                {consumoForm.aplicarMultiplicadorRibbon
                  ? "Usar multiplicador 1X/2X: SIM"
                  : "Usar multiplicador 1X/2X: NÃO"}
              </button>
            )}

            <button style={styles.botao} onClick={adicionarRegraConsumo}>
              Adicionar regra de consumo
            </button>

            {admin && (
              <button
                style={styles.botaoCinza || styles.botao}
                onClick={restaurarRegrasPadraoConsumo}
              >
                Restaurar regras padrão
              </button>
            )}
          </div>

          <p style={{ color: "#94a3b8", marginTop: 12 }}>
            Exemplo: PAR VEICULAR PADRÃO consome VEICULAR PADRÃO = 2 e RIBBON
            PRETO = 0,40m. Se a loja estiver em 2X, o ribbon dobra.
          </p>
        </Card>

        <Card titulo="Regras de consumo cadastradas">
          <Tabela
            colunas={[
              "Serviço",
              "Insumo",
              "Qtd base",
              "Usa 1X/2X",
              "Ações",
            ]}
            dados={regrasConsumoEmpresa.map((regra) => [
              regra.servico,
              regra.insumo,
              regra.quantidade,
              regra.aplicarMultiplicadorRibbon ? "Sim" : "Não",
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {admin && (
                  <button
                    style={styles.excluir}
                    onClick={() => removerRegraConsumo(regra.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>,
            ])}
          />
        </Card>
  <Card titulo="Produtos e serviços personalizados">
    <Tabela
      colunas={["Tipo", "Nome", "Ações"]}
      dados={[
        ...produtosEstoquePersonalizados.map((produto) => [
          "Produto",
          produto,
          admin && (
            <button
              style={styles.excluir}
              onClick={() => removerProdutoPersonalizado(produto)}
            >
              Excluir
            </button>
          ),
        ]),

        ...servicosSimulacaoEstoque.map((servico) => [
          "Serviço",
          servico,
          admin && (
            <button
              style={styles.excluir}
              onClick={() => removerServicoSimulacao(servico)}
            >
              Excluir
            </button>
          ),
        ]),
      ]}
    />
  </Card>
  <Card titulo="Itens exibidos no Relatório Diário">
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 10,
    }}
  >
    {produtosDisponiveisEstoque.map((produto) => {
      const marcado = itensRelatorioWhatsApp.includes(produto);

      return (
        <label
          key={produto}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: 10,
            cursor: "pointer",
            background: marcado
              ? "rgba(37, 99, 235, 0.16)"
              : "rgba(15, 23, 42, 0.75)",
            border: marcado
              ? "1px solid rgba(59, 130, 246, 0.8)"
              : "1px solid rgba(148, 163, 184, 0.2)",
            color: "#fff",
          }}
        >
          <input
            type="checkbox"
            checked={marcado}
            onChange={() => alternarItemRelatorioWhatsApp(produto)}
          />

          <span>{produto}</span>
        </label>
      );
    })}
  </div>

  <p style={{ color: "#94a3b8", marginTop: 12 }}>
    Marque somente os produtos que devem aparecer no relatório copiado para o
    WhatsApp.
  </p>
</Card>
        <Card titulo="Parâmetros cadastrados">
          <Tabela
            colunas={[
              "Produto",
              "Controle automático",
              "Unidade",
              "Capacidade",
              "Mínimo",
            ]}
            dados={produtosDisponiveisEstoque.map((produto) => {
              const p = parametrosDoProduto(produto);

              return [
                produto,
                p.tipoControle,
                p.unidade,
                "Automática",
                p.estoqueMinimo || "-",
              ];
            })}
          />
        </Card>
      </>
    );
  }