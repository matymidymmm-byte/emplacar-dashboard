import { useMemo } from "react";

import Card from "../components/Card.jsx";
import GraficoLinha from "../components/GraficoLinha.jsx";
import GraficoBarras from "../components/GraficoBarras.jsx";
import styles from "../styles/styles.js";

export default function HistoricoFinanceiro({
  historicoFechamentos,
  moeda,
  setHistoricoFechamentos,
  setAba,
}) {
  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function excluirFechamento(id) {
    const confirmar = window.confirm(
      "Deseja excluir este fechamento financeiro?"
    );

    if (!confirmar) return;

    setHistoricoFechamentos((old) =>
      old.filter((item) => item.id !== id)
    );
  }

  const dadosGraficos = useMemo(() => {
    return [...historicoFechamentos]
      .reverse()
      .map((item) => ({
        data: (() => {
  const data = new Date(item.inicio + "T00:00:00");

  return data.toLocaleDateString("pt-BR", {
    month: "short",
  });
})(),

        faturamento: Number(item.faturamento || 0),

        recebido: Number(item.recebido || 0),

        lucro: Number(item.lucro || 0),

        saidas: Number(item.saidas || 0),

        banco: Number(item.recebidoBanco || 0),

        caixa: Number(item.recebidoCaixa || 0),

        aberto: Number(item.faturadoEmAberto || 0),

        meta: Number(item.metaMensal || 0),
    
      }));
  }, [historicoFechamentos]);

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>
            Histórico Financeiro
          </h1>

          <p style={styles.dashboardSubtitulo}>
            Evolução financeira dos fechamentos mensais
          </p>
        </div>

        <button
          style={styles.botaoDashboard}
          onClick={() => setAba("Dashboard")}
        >
          Voltar ao Dashboard
        </button>
      </div>

      <div style={styles.dashboardGrid}>
        <Card titulo="Evolução financeira">
          <GraficoLinha
            dados={dadosGraficos}
            moeda={moeda}
            linhas={[
              {
                dataKey: "faturamento",
                name: "Faturamento",
                stroke: "#38bdf8",
              },
              {
                dataKey: "recebido",
                name: "Recebido",
                stroke: "#22c55e",
              },
              {
                dataKey: "lucro",
                name: "Lucro",
                stroke: "#f59e0b",
              },
            ]}
          />
        </Card>
<Card titulo="Faturamento total por mês">
  <GraficoBarras
    dados={dadosGraficos.map((x) => ({
      data: x.data,
      valor: x.faturamento,
    }))}
    moeda={moeda}
    xKey="data"
    dataKey="valor"
    nome="Faturamento"
  />
</Card>


        <Card titulo="Banco x Caixa">
          <GraficoBarras
            dados={dadosGraficos.map((x) => ({
              data: x.data,
              valor: x.banco + x.caixa,
              banco: x.banco,
              caixa: x.caixa,
            }))}
            moeda={moeda}
            xKey="data"
            dataKey="valor"
            nome="Total"
          />
        </Card>

        <Card titulo="Meta x Realizado">
          <GraficoLinha
            dados={dadosGraficos}
            moeda={moeda}
            linhas={[
              {
                dataKey: "meta",
                name: "Meta",
                stroke: "#ef4444",
              },
              {
                dataKey: "faturamento",
                name: "Realizado",
                stroke: "#22c55e",
              },
            ]}
          />
        </Card>

        <Card titulo="Entradas x Saídas">
          <GraficoLinha
            dados={dadosGraficos}
            moeda={moeda}
            linhas={[
              {
                dataKey: "recebido",
                name: "Entradas",
                stroke: "#38bdf8",
              },
              {
                dataKey: "saidas",
                name: "Saídas",
                stroke: "#ef4444",
              },
            ]}
          />
        </Card>

        <Card titulo="Valores em aberto">
          <GraficoBarras
            dados={dadosGraficos.map((x) => ({
              data: x.data,
              valor: x.aberto,
            }))}
            moeda={moeda}
            xKey="data"
            dataKey="valor"
            nome="Em aberto"
          />
        </Card>
      </div>

      <Card titulo="Fechamentos financeiros">
        {historicoFechamentos?.length === 0 ? (
          <p style={styles.vazio}>
            Nenhum fechamento salvo ainda.
          </p>
        ) : (
          <div style={styles.dashboardGridNova}>
            {historicoFechamentos.map((fechamento) => (
              <div
                key={fechamento.id}
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 18,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div>
                  <strong
                    style={{
                      color: "#f8fafc",
                      fontSize: 18,
                    }}
                  >
                    {dataBR(fechamento.inicio)} até{" "}
                    {dataBR(fechamento.fim)}
                  </strong>

                  <p
                    style={{
                      color: "#94a3b8",
                      marginTop: 6,
                      marginBottom: 0,
                      fontSize: 13,
                    }}
                  >
                    Fechado em{" "}
                    {dataBR(fechamento.dataFechamento)}
                  </p>
                </div>

                <div style={styles.kpisModernos}>
                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Faturamento
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.faturamento || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Recebido
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.recebido || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Lucro
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.lucro || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Saídas
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.saidas || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Banco
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.recebidoBanco || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Caixa físico
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.recebidoCaixa || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Em aberto
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.faturadoEmAberto || 0
                      )}
                    </strong>
                  </div>

                  <div style={styles.kpi}>
                    <p style={styles.kpiTitulo}>
                      Meta do período
                    </p>

                    <strong style={styles.kpiValor}>
                      {moeda.format(
                        fechamento.metaMensal || 0
                      )}
                    </strong>
                  </div>
                </div>

                <button
                  style={{
                    ...styles.botaoDashboard,
                    background: "#dc2626",
                    width: "100%",
                  }}
                  onClick={() =>
                    excluirFechamento(fechamento.id)
                  }
                >
                  Excluir fechamento
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}