import Card from "../Card.jsx";
import Select from "../Select.jsx";
import Tabela from "../Tabela.jsx";
import Kpi from "../Kpi.jsx";

import styles from "../../styles/styles.js";

export default function EstoqueInteligencia({
  filtroDashboard,
  setFiltroDashboard,

  comprasMesQuantidade,
  comprasMesValor,
  consumoMesQuantidade,
  perdasMesQuantidade,
  valorPerdasGeral,
  totalCompras,
  totalUsado,
  totalPerdas,

  paretoConsumo,
  perdasPorProduto,
  tabelaGerencialEstoque,

  moeda,
  ehRibbon,
  textoStatus,

  simulacao,
  setSimulacao,
  clientes,

  tiposSimulacaoDisponiveis,
  calcularConsumoSimulacao,
  estoqueResumo,
  precoClientePorServico,
  clienteSelecionado,

  auditoriaEstoque,
}) {
  return (
    <>
      <Card titulo="Dashboard gerencial de estoque">
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button
            style={{
              ...styles.botao,
              opacity: filtroDashboard === "MÊS" ? 1 : 0.6,
            }}
            onClick={() => setFiltroDashboard("MÊS")}
          >
            Ver mês atual
          </button>

          <button
            style={{
              ...styles.botao,
              opacity: filtroDashboard === "GERAL" ? 1 : 0.6,
            }}
            onClick={() => setFiltroDashboard("GERAL")}
          >
            Ver geral
          </button>
        </div>

        <div style={styles.kpis}>
          <Kpi
            titulo="Compras do período"
            valor={`${comprasMesQuantidade.toFixed(0)} un/m`}
          />

          <Kpi
            titulo="Valor comprado"
            valor={moeda.format(comprasMesValor)}
          />

          <Kpi
            titulo="Consumo do período"
            valor={`${consumoMesQuantidade.toFixed(0)} un/m`}
          />

          <Kpi
            titulo="Perdas do período"
            valor={`${perdasMesQuantidade.toFixed(0)} un/m`}
          />

          <Kpi
            titulo="Valor perdas geral"
            valor={moeda.format(valorPerdasGeral)}
          />

          <Kpi
            titulo="Total comprado"
            valor={`${totalCompras.toFixed(0)} un/m`}
          />

          <Kpi
            titulo="Total usado"
            valor={`${totalUsado.toFixed(0)} un/m`}
          />

          <Kpi
            titulo="Total perdas"
            valor={`${totalPerdas.toFixed(0)} un/m`}
          />
        </div>
      </Card>

      <div style={styles.grid2}>
        <Card titulo="Pareto de consumo">
          <Tabela
            colunas={[
              "Produto",
              "Qtd consumida",
              "% do consumo",
              "% acumulado",
            ]}
            dados={paretoConsumo.map((item) => [
              item.produto,
              item.quantidade,
              `${item.percentual.toFixed(1)}%`,
              `${item.acumulado.toFixed(1)}%`,
            ])}
          />
        </Card>

        <Card titulo="Top perdas por produto">
          <Tabela
            colunas={["Produto", "Qtd perdida", "Valor estimado"]}
            dados={perdasPorProduto.map((item) => [
              item.produto,
              item.quantidade,
              moeda.format(item.valor || 0),
            ])}
          />
        </Card>
      </div>

      <Card titulo="Tabela gerencial de estoque">
        <Tabela
          colunas={[
            "Produto",
            "Físico",
            "Reservado",
            "Disponível",
            "Mínimo",
            "Custo médio",
            "Valor atual",
            "Consumo médio/dia",
            "Dias restantes",
            "Status",
          ]}
          dados={tabelaGerencialEstoque.map((item) => [
            item.produto,
            item.saldoFisico.toFixed(ehRibbon(item.produto) ? 2 : 0),
            item.reservado,
            item.saldoDisponivel.toFixed(ehRibbon(item.produto) ? 2 : 0),
            item.estoqueMinimo,
            moeda.format(item.custoMedio || 0),
            moeda.format(item.valorAtual || 0),
            item.mediaConsumoDiario.toFixed(2),
            item.diasTexto,
            textoStatus(item.status),
          ])}
        />
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
            "Produto referência",
            "Consumo referência",
            "Saldo físico",
            "Reservado",
            "Disponível",
            "Qtd possível",
            "Preço",
            "Custo projetado",
            "Lucro projetado",
            "Faturamento projetado",
          ]}
          dados={tiposSimulacaoDisponiveis.map((tipoServico) => {
            const regra = calcularConsumoSimulacao(tipoServico);
            const itemEstoque = estoqueResumo.find(
              (item) => item.produto === regra.item
            );

            const saldoFisico = itemEstoque?.saldoFisico || 0;
            const reservado = itemEstoque?.reservado || 0;
            const saldoDisponivel = itemEstoque?.saldoDisponivel || 0;

            const consumo = regra.consumo || 1;

            const qtdPossivel = Math.max(
              Math.floor(saldoDisponivel / consumo),
              0
            );

            const preco = precoClientePorServico(
              clienteSelecionado,
              tipoServico
            );

            const custoProjetado =
              qtdPossivel * consumo * (itemEstoque?.custoMedio || 0);

            const faturamentoProjetado = qtdPossivel * preco;
            const lucroProjetado = faturamentoProjetado - custoProjetado;

            return [
              tipoServico,
              regra.item,
              consumo,
              saldoFisico.toFixed(ehRibbon(regra.item) ? 2 : 0),
              reservado,
              saldoDisponivel.toFixed(ehRibbon(regra.item) ? 2 : 0),
              qtdPossivel,
              moeda.format(preco),
              moeda.format(custoProjetado),
              moeda.format(lucroProjetado),
              moeda.format(faturamentoProjetado),
            ];
          })}
        />
      </Card>

      <Card titulo="Auditoria do estoque">
        <Tabela
          colunas={[
            "Data",
            "Tipo",
            "Origem",
            "Produto",
            "Quantidade",
            "Usuário",
            "Observação",
          ]}
          dados={auditoriaEstoque.map((item) => [
            item.data || "-",
            item.tipo || "-",
            item.origem || "-",
            item.produto || "-",
            item.quantidade || 0,
            item.usuario || "-",
            item.observacao || "-",
          ])}
        />
      </Card>
    </>
  );
}