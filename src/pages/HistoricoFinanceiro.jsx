import Card from "../components/Card.jsx";
import styles from "../styles/styles.js";

export default function HistoricoFinanceiro({
  historicoFechamentos,
  moeda,
  setHistoricoFechamentos,
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

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>
            Histórico Financeiro
          </h1>

          <p style={styles.dashboardSubtitulo}>
            Histórico dos fechamentos financeiros salvos
          </p>
        </div>
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