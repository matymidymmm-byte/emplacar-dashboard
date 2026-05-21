import { useMemo, useState } from "react";
import styles from "../styles/styles.js";

export default function TabelaEntradas({
  entradas,
  setEntradas,
  moeda,
  editar,
  remover,
  formasPagamento = [],
}) {
  const [detalhesAbertos, setDetalhesAbertos] = useState({});
  const [copiados, setCopiados] = useState({});
  const [selecionados, setSelecionados] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [diaPagoMassa, setDiaPagoMassa] = useState("");
  const [formaPagamentoMassa, setFormaPagamentoMassa] = useState("Pix");

  const colunas = [
    { key: "data", label: "Data" },
    { key: "cliente", label: "Cliente" },
    { key: "produto", label: "Produto" },
    { key: "placa", label: "Placa" },
    { key: "formaPagamento", label: "Pagamento" },
    { key: "valor", label: "Valor" },
    { key: "status", label: "Status" },
    { key: "diaPago", label: "Pago dia" },
  ];

  function formatarData(data) {
    if (!data) return "-";
    if (data.includes("-")) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    return data;
  }

  function texto(valor) {
    return String(valor || "").toLowerCase().trim();
  }

  function mudarFiltro(campo, valor) {
    setFiltros((old) => ({
      ...old,
      [campo]: valor,
    }));
  }

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((entrada) => {
      return colunas.every((coluna) => {
        const filtro = texto(filtros[coluna.key]);
        if (!filtro) return true;

        let valor = entrada[coluna.key];

        if (coluna.key === "valor") {
          valor = moeda.format(Number(entrada.valor || 0));
        }

        if (coluna.key === "data" || coluna.key === "diaPago") {
          valor = formatarData(valor);
        }

        return texto(valor).includes(filtro);
      });
    });
  }, [entradas, filtros, moeda]);

  const totalFiltrado = entradasFiltradas.reduce(
    (soma, item) => soma + Number(item.valor || 0),
    0
  );

  const mediaFiltrada =
    entradasFiltradas.length > 0 ? totalFiltrado / entradasFiltradas.length : 0;

  function alternarSelecionado(id) {
    setSelecionados((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  }

  function selecionarTodosFiltrados() {
    const ids = entradasFiltradas.map((x) => x.id);
    setSelecionados(ids);
  }

  function limparSelecao() {
    setSelecionados([]);
  }

  function selecionarPendentesFiltrados() {
    const ids = entradasFiltradas
      .filter(
        (x) =>
          x.status !== "Pago" ||
          x.formaPagamento === "Nota / Faturado" ||
          !x.diaPago
      )
      .map((x) => x.id);

    setSelecionados(ids);
  }

  function baixarSelecionados() {
    if (!setEntradas) {
      alert("Função setEntradas não foi passada para a tabela.");
      return;
    }

    if (selecionados.length === 0) {
      alert("Selecione pelo menos um serviço.");
      return;
    }

    if (!diaPagoMassa) {
      alert("Informe o dia pago.");
      return;
    }

    const confirmar = window.confirm(
      `Marcar ${selecionados.length} serviço(s) como pago(s)?`
    );

    if (!confirmar) return;

    setEntradas((old) =>
      old.map((entrada) =>
        selecionados.includes(entrada.id)
          ? {
              ...entrada,
              status: "Pago",
              formaPagamento: formaPagamentoMassa,
              diaPago: diaPagoMassa,
            }
          : entrada
      )
    );

    setSelecionados([]);
  }

  function copiarTexto(textoCopiar, chave) {
    navigator.clipboard.writeText(textoCopiar || "");

    setCopiados((old) => ({
      ...old,
      [chave]: true,
    }));

    setTimeout(() => {
      setCopiados((old) => ({
        ...old,
        [chave]: false,
      }));
    }, 1500);
  }

  function copiarTudo(item) {
    const textoCopiar = `PLACA: ${item.placa || ""}
RENAVAN: ${item.renavan || ""}
PROCESSO: ${item.processo || ""}`;

    copiarTexto(textoCopiar, `tudo-${item.id}`);
  }

  function BotaoCopiar({ item, campo, label }) {
    const chave = `${campo}-${item.id}`;
    const valor = item[campo] || "";

    return (
      <button
        style={copiados[chave] ? styles.copiado : styles.copiar}
        onClick={() => copiarTexto(valor, chave)}
      >
        {copiados[chave] ? "Copiado" : `Copiar ${label}`}
      </button>
    );
  }

  const grupos = entradasFiltradas.reduce((acc, entrada) => {
    const data = entrada.data || "Sem data";

    if (!acc[data]) acc[data] = [];

    acc[data].push(entrada);

    return acc;
  }, {});

  const datasOrdenadas = Object.keys(grupos).sort((a, b) =>
    b.localeCompare(a)
  );

  function totalDoDia(lista) {
    return lista.reduce((soma, item) => soma + Number(item.valor || 0), 0);
  }

  return (
    <div style={styles.tabelaContainer}>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Filtrados:</strong> {entradasFiltradas.length}
        </span>

        <span>
          <strong>Total filtrado:</strong> {moeda.format(totalFiltrado)}
        </span>

        <span>
          <strong>Média filtrada:</strong> {moeda.format(mediaFiltrada)}
        </span>

        <span>
          <strong>Selecionados:</strong> {selecionados.length}
        </span>
      </div>

      <div
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 10,
          alignItems: "end",
        }}
      >
        <button style={styles.botaoCinza} onClick={selecionarTodosFiltrados}>
          Selecionar filtrados
        </button>

        <button style={styles.botaoCinza} onClick={selecionarPendentesFiltrados}>
          Selecionar pendentes
        </button>

        <button style={styles.botaoCinza} onClick={limparSelecao}>
          Limpar seleção
        </button>

        <label style={styles.label}>
          Forma pagamento
          <select
            value={formaPagamentoMassa}
            onChange={(e) => setFormaPagamentoMassa(e.target.value)}
            style={styles.input}
          >
            {(formasPagamento.length > 0
              ? formasPagamento
              : ["Pix", "Débito", "Crédito", "Depósito", "Cheque", "Dinheiro"]
            ).map((forma) => (
              <option key={forma} value={forma}>
                {forma}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          Pago dia
          <input
            type="date"
            value={diaPagoMassa}
            onChange={(e) => setDiaPagoMassa(e.target.value)}
            style={styles.input}
          />
        </label>

        <button style={styles.botao} onClick={baixarSelecionados}>
          Baixar selecionados
        </button>
      </div>

      <div
        style={{
          ...styles.tabelaBox,
          overflowX: "auto",
          maxWidth: "100%",
        }}
      >
        <table
          style={{
            ...styles.tabelaCompacta,
            minWidth: 1180,
          }}
        >
          <thead>
            <tr>
              <th style={styles.th}>✓</th>

              {colunas.map((coluna) => (
                <th key={coluna.key} style={styles.th}>
                  {coluna.label}
                </th>
              ))}

              <th style={styles.th}>⋮</th>
            </tr>

            <tr>
              <th style={styles.thFiltro}></th>

              {colunas.map((coluna) => (
                <th key={`filtro-${coluna.key}`} style={styles.thFiltro}>
                  <input
                    value={filtros[coluna.key] || ""}
                    onChange={(e) => mudarFiltro(coluna.key, e.target.value)}
                    placeholder="Filtrar..."
                    style={styles.filtroInput}
                  />
                </th>
              ))}

              <th style={styles.thFiltro}></th>
            </tr>
          </thead>

          <tbody>
            {datasOrdenadas.map((data) => {
              const itensDoDia = grupos[data];
              const total = totalDoDia(itensDoDia);

              return (
                <>
                  <tr key={`grupo-${data}`}>
                    <td colSpan={colunas.length + 2} style={styles.linhaData}>
                      {formatarData(data)} · {itensDoDia.length} serviços ·
                      Total do dia: {moeda.format(total)}
                    </td>
                  </tr>

                  {itensDoDia.map((x) => (
                    <>
                      <tr key={x.id}>
                        <td style={styles.td}>
                          <input
                            type="checkbox"
                            checked={selecionados.includes(x.id)}
                            onChange={() => alternarSelecionado(x.id)}
                            style={{
                              width: 18,
                              height: 18,
                              cursor: "pointer",
                            }}
                          />
                        </td>

                        <td style={styles.td}>{formatarData(x.data)}</td>

                        <td style={styles.td}>{x.cliente}</td>

                        <td
                          style={{
                            ...styles.td,
                            fontWeight: 700,
                            color: "#c4b5fd",
                          }}
                        >
                          {x.produto || x.servico || "-"}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            color: "#5ecbff",
                            fontWeight: 700,
                          }}
                        >
                          {x.placa}
                        </td>

                        <td style={styles.td}>{x.formaPagamento || "-"}</td>

                        <td
                          style={{
                            ...styles.td,
                            fontWeight: 700,
                          }}
                        >
                          {moeda.format(Number(x.valor || 0))}
                        </td>

                        <td style={styles.td}>{x.status}</td>

                        <td style={styles.td}>{formatarData(x.diaPago)}</td>

                        <td style={styles.td}>
                          <button
                            style={{
                              background: "#243041",
                              border: "none",
                              color: "#fff",
                              borderRadius: 10,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 18,
                            }}
                            onClick={() =>
                              setDetalhesAbertos({
                                ...detalhesAbertos,
                                [x.id]: !detalhesAbertos[x.id],
                              })
                            }
                          >
                            ⋮
                          </button>
                        </td>
                      </tr>

                      {detalhesAbertos[x.id] && (
                        <tr>
                          <td
                            colSpan={colunas.length + 2}
                            style={{
                              background: "#101c33",
                              padding: 18,
                              borderBottom: "1px solid #1f2d4a",
                            }}
                          >
                            <div style={styles.detalheGrid}>
                              <div style={styles.detalheItem}>
                                <span style={styles.detalheLabel}>Tipo</span>
                                {x.tipo || "-"}
                              </div>

                              <div style={styles.detalheItem}>
                                <span style={styles.detalheLabel}>
                                  Pagamento
                                </span>
                                {x.formaPagamento || "-"}
                              </div>

                              <div style={styles.detalheItem}>
                                <span style={styles.detalheLabel}>Placa</span>
                                {x.placa || "-"}
                                <BotaoCopiar item={x} campo="placa" label="placa" />
                              </div>

                              <div style={styles.detalheItem}>
                                <span style={styles.detalheLabel}>Renavan</span>
                                {x.renavan || "-"}
                                <BotaoCopiar
                                  item={x}
                                  campo="renavan"
                                  label="renavan"
                                />
                              </div>

                              <div style={styles.detalheItem}>
                                <span style={styles.detalheLabel}>Processo</span>
                                {x.processo || "-"}
                                <BotaoCopiar
                                  item={x}
                                  campo="processo"
                                  label="processo"
                                />
                              </div>

                              <div style={styles.detalheItem}>
                                <span style={styles.detalheLabel}>Pago dia</span>
                                {formatarData(x.diaPago)}
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 18,
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                style={
                                  copiados[`tudo-${x.id}`]
                                    ? styles.copiado
                                    : styles.botaoPequeno
                                }
                                onClick={() => copiarTudo(x)}
                              >
                                {copiados[`tudo-${x.id}`]
                                  ? "Dados copiados"
                                  : "Copiar placa, Renavan e processo"}
                              </button>

                              <button
                                style={styles.editar}
                                onClick={() => editar("entrada", x)}
                              >
                                Editar
                              </button>

                              <button
                                style={styles.excluir}
                                onClick={() => remover("entrada", x.id)}
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}