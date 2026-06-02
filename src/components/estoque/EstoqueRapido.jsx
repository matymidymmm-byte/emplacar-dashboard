import Card from "../Card.jsx";
import Tabela from "../Tabela.jsx";
import Kpi from "../Kpi.jsx";
import CardEstoque from "./CardEstoque.jsx";

import styles from "../../styles/styles.js";

export default function EstoqueRapido({
  saldoFisicoTotal,
  saldoDisponivelTotal,
  totalReservado,
  valorTotalEstoque,
  itensCriticos,
  itensBaixos,
  moeda,
  agrupadosRapidos,
  produtosCriticos,
  ehRibbon,
  lotesEstoque,
  textoStatus,
}) {
  function nomeNormalizado(valor) {
    return String(valor || "").toUpperCase();
  }

  function ehSuporte(produto) {
    return nomeNormalizado(produto).includes("SUPORTE");
  }

  function ehBlank(produto) {
    const nome = nomeNormalizado(produto);

    return (
      nome.includes("VEICULAR") ||
      nome.includes("MOTO") ||
      nome.includes("PLACA")
    );
  }

  function grupoDosItens(titulo, itens) {
    if (itens.length === 0) return null;

    return (
      <Card titulo={`${titulo} (${itens.length})`}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          {itens.map((item) => (
            <CardEstoque
              key={item.produto}
              item={item}
              ehRibbon={ehRibbon}
              lotesEstoque={lotesEstoque}
            />
          ))}
        </div>
      </Card>
    );
  }

  const blanks = agrupadosRapidos.filter(
    (item) => ehBlank(item.produto) && !ehRibbon(item.produto) && !ehSuporte(item.produto)
  );

  const ribbons = agrupadosRapidos.filter((item) => ehRibbon(item.produto));

  const suportes = agrupadosRapidos.filter((item) => ehSuporte(item.produto));

  const outros = agrupadosRapidos.filter(
    (item) =>
      !ehBlank(item.produto) &&
      !ehRibbon(item.produto) &&
      !ehSuporte(item.produto)
  );

  return (
    <>
      <div style={styles.kpis}>
        <Kpi titulo="Saldo físico" valor={`${saldoFisicoTotal.toFixed(0)} un/m`} />
        <Kpi titulo="Disponível" valor={`${saldoDisponivelTotal.toFixed(0)} un/m`} />
        <Kpi titulo="Reservado" valor={`${totalReservado.toFixed(0)} un/m`} />
        <Kpi titulo="Valor em estoque" valor={moeda.format(valorTotalEstoque)} />
        <Kpi titulo="Itens críticos" valor={itensCriticos} />
        <Kpi titulo="Estoque baixo" valor={itensBaixos} />
      </div>

      {agrupadosRapidos.length === 0 ? (
        <Card titulo="Visão rápida do estoque">
          <p style={{ color: "#94a3b8" }}>Nenhum estoque lançado ainda.</p>
        </Card>
      ) : (
        <>
          {grupoDosItens("Blanks", blanks)}
          {grupoDosItens("Ribbons", ribbons)}
          {grupoDosItens("Suportes", suportes)}
          {grupoDosItens("Outros", outros)}
        </>
      )}

      <Card titulo="Itens em atenção">
        <Tabela
          colunas={["Produto", "Disponível", "Mínimo", "Controle", "Status"]}
          dados={produtosCriticos.map((item) => [
            item.produto,
            `${item.saldoDisponivel.toFixed(ehRibbon(item.produto) ? 2 : 0)} ${item.unidade}`,
            item.estoqueMinimo,
            item.parametros.tipoControle,
            textoStatus(item.status),
          ])}
        />
      </Card>
    </>
  );
}