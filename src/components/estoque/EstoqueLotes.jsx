import Card from "../Card.jsx";
import Tabela from "../Tabela.jsx";

export default function EstoqueLotes({
  lotesEstoque,
  usosEstoqueServicos,
  ehRibbon,
  textoStatus,
  moeda,
}) {
  return (
    <>
      <Card titulo="Lotes de estoque">
        <Tabela
          colunas={[
            "Produto",
            "Lote",
            "Data",
            "Fornecedor",
            "Entrada",
            "Saldo",
            "%",
            "Status",
            "Custo total",
            "Observação",
          ]}
          dados={lotesEstoque.map((lote) => [
            lote.produto,
            lote.lote,
            lote.data,
            lote.fornecedor,
            `${lote.entrada.toFixed(ehRibbon(lote.produto) ? 2 : 0)} ${lote.unidade}`,
            `${lote.saldo.toFixed(ehRibbon(lote.produto) ? 2 : 0)} ${lote.unidade}`,
            `${lote.percentual.toFixed(0)}%`,
            textoStatus(lote.status),
            moeda.format(lote.custoTotal || 0),
            lote.observacao,
          ])}
        />
      </Card>

      <Card titulo="Baixa automática pelas vendas antigas e atuais">
        <Tabela
          colunas={[
            "Data",
            "Cliente",
            "Serviço vendido",
            "Placa",
            "Regra aplicada",
            "Tipo",
            "Produto físico baixado",
            "Quantidade",
            "Multiplicador",
          ]}
          dados={usosEstoqueServicos.map((item) => [
            item.data,
            item.cliente,
            item.produtoServico,
            item.placa,
            item.regraServico,
            item.tipoUso,
            item.itemEstoque,
            item.quantidade,
            item.multiplicadorRibbon ? `${item.multiplicadorRibbon}X` : "-",
          ])}
        />
      </Card>
    </>
  );
}