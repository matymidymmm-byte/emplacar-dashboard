import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
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
    "✓",
    "Data",
    "Cliente",
    "Produto",
    "Placa",
    "Pagamento",
    "Valor",
    "Status",
    "Pago dia",
    "Ações",
  ];

  function formatarData(data) {
    if (!data) return "-";

    if (String(data).includes("-")) {
      const [ano, mes, dia] = String(data).split("-");
      return `${dia}/${mes}/${ano}`;
    }

    return data;
  }

  function texto(valor) {
    return String(valor || "").toLowerCase().trim();
  }

  function temObservacao(item) {
    return String(item?.observacao || "").trim().length > 0;
  }

  function mudarFiltro(campo, valor) {
    setFiltros((old) => ({
      ...old,
      [campo]: valor,
    }));
  }

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((x) => {
      return (
        texto(formatarData(x.data)).includes(texto(filtros.data)) &&
        texto(x.cliente).includes(texto(filtros.cliente)) &&
        texto(x.produto || x.servico).includes(texto(filtros.produto)) &&
        texto(x.placa).includes(texto(filtros.placa)) &&
        texto(x.formaPagamento).includes(texto(filtros.formaPagamento)) &&
        texto(moeda.format(Number(x.valor || 0))).includes(texto(filtros.valor)) &&
        texto(x.status).includes(texto(filtros.status)) &&
        texto(formatarData(x.diaPago)).includes(texto(filtros.diaPago))
      );
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
    setSelecionados(entradasFiltradas.map((x) => x.id));
  }

  function selecionarPendentesFiltrados() {
    setSelecionados(
      entradasFiltradas
        .filter(
          (x) =>
            x.status !== "Pago" ||
            x.formaPagamento === "Nota / Faturado" ||
            !x.diaPago
        )
        .map((x) => x.id)
    );
  }

  function limparSelecao() {
    setSelecionados([]);
  }

  function exportarEntradasFiltradas() {
    if (entradasFiltradas.length === 0) {
      alert("Nenhuma entrada filtrada para exportar.");
      return;
    }

    const dadosExportar = entradasFiltradas.map((item) => ({
      DATA: formatarData(item.data),
      TIPO: item.tipo || "",
      CLIENTE: item.cliente || "",
      PRODUTO: item.produto || item.servico || "",
      PLACA: item.placa || "",
      RENAVAN: item.renavan || "",
      "FORMA DE PAGAMENTO": item.formaPagamento || "",
      VALOR: Number(item.valor || 0),
      STATUS: item.status || "",
      PROCESSO: item.processo || "",
      "DIA PAGO": formatarData(item.diaPago),
      CATEGORIA: item.categoriaPlaca || "",
      CELULAR: item.celular || "",
      OBSERVAÇÃO: item.observacao || "",
    }));

    const planilha = XLSX.utils.json_to_sheet(dadosExportar);
    const arquivo = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(arquivo, planilha, "Entradas");
    XLSX.writeFile(arquivo, "entradas-filtradas.xlsx");
  }

  function baixarSelecionados() {
    if (selecionados.length === 0) {
      alert("Selecione pelo menos um serviço.");
      return;
    }

    if (!diaPagoMassa) {
      alert("Informe o dia pago.");
      return;
    }

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
    copiarTexto(
      `PLACA: ${item.placa || ""}
RENAVAN: ${item.renavan || ""}
PROCESSO: ${item.processo || ""}
CATEGORIA: ${item.categoriaPlaca || ""}
CELULAR: ${item.celular || ""}
OBSERVAÇÃO: ${item.observacao || ""}`,
      `tudo-${item.id}`
    );
  }

  function BotaoCopiar({ item, campo, label }) {
    const chave = `${campo}-${item.id}`;

    return (
      <button
        style={copiados[chave] ? styles.copiado : styles.copiar}
        onClick={() => copiarTexto(item[campo], chave)}
      >
        {copiados[chave] ? "Copiado" : `Copiar ${label}`}
      </button>
    );
  }

  function BotaoDetalhes({ item }) {
    const possuiObservacao = temObservacao(item);

    return (
      <button
        title={
          possuiObservacao
            ? `Tem observação: ${item.observacao}`
            : "Ver detalhes"
        }
        style={{
          position: "relative",
          background: possuiObservacao ? "#1d4ed8" : "#243041",
          border: possuiObservacao ? "1px solid #60a5fa" : "none",
          color: "#fff",
          borderRadius: 10,
          padding: "5px 8px",
          cursor: "pointer",
          fontSize: 16,
          boxShadow: possuiObservacao
            ? "0 0 0 2px rgba(96,165,250,0.18)"
            : "none",
        }}
        onClick={() =>
          setDetalhesAbertos({
            ...detalhesAbertos,
            [item.id]: !detalhesAbertos[item.id],
          })
        }
      >
        {possuiObservacao ? "💬" : "⋮"}

        {possuiObservacao && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 9,
              height: 9,
              background: "#facc15",
              borderRadius: "50%",
              border: "1px solid #0f172a",
            }}
          />
        )}
      </button>
    );
  }

  const grupos = entradasFiltradas.reduce((acc, entrada) => {
    const data = entrada.data || "Sem data";

    if (!acc[data]) acc[data] = [];

    acc[data].push(entrada);

    return acc;
  }, {});

  const datasOrdenadas = Object.keys(grupos).sort((a, b) => b.localeCompare(a));

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
          <strong>Total:</strong> {moeda.format(totalFiltrado)}
        </span>

        <span>
          <strong>Média:</strong> {moeda.format(mediaFiltrada)}
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

        <button style={styles.botaoCinza} onClick={exportarEntradasFiltradas}>
          Exportar Excel filtrado
        </button>
      </div>

      <div style={styles.tabelaBox}>
        <table
          style={{
            ...styles.tabela,
            minWidth: 980,
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: 42 }} />
            <col style={{ width: 95 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 135 }} />
            <col style={{ width: 105 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 95 }} />
            <col style={{ width: 70 }} />
          </colgroup>

          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th key={coluna} style={styles.th}>
                  {coluna}
                </th>
              ))}
            </tr>

            <tr>
              <th style={styles.thFiltro}></th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.data || ""}
                  onChange={(e) => mudarFiltro("data", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.cliente || ""}
                  onChange={(e) => mudarFiltro("cliente", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.produto || ""}
                  onChange={(e) => mudarFiltro("produto", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.placa || ""}
                  onChange={(e) => mudarFiltro("placa", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.formaPagamento || ""}
                  onChange={(e) =>
                    mudarFiltro("formaPagamento", e.target.value)
                  }
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.valor || ""}
                  onChange={(e) => mudarFiltro("valor", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.status || ""}
                  onChange={(e) => mudarFiltro("status", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}>
                <input
                  style={styles.filtroInput}
                  placeholder="Filtrar"
                  value={filtros.diaPago || ""}
                  onChange={(e) => mudarFiltro("diaPago", e.target.value)}
                />
              </th>

              <th style={styles.thFiltro}></th>
            </tr>
          </thead>

          <tbody>
            {datasOrdenadas.map((data) => {
              const itensDoDia = grupos[data];
              const total = totalDoDia(itensDoDia);

              return (
                <React.Fragment key={`grupo-${data}`}>
                  <tr>
                    <td colSpan={10} style={styles.linhaData}>
                      {formatarData(data)} · {itensDoDia.length} serviços ·
                      Total do dia: {moeda.format(total)}
                    </td>
                  </tr>

                  {itensDoDia.map((x) => {
                    const possuiObservacao = temObservacao(x);

                    return (
                      <React.Fragment key={x.id}>
                        <tr
                          title={
                            possuiObservacao
                              ? `Observação: ${x.observacao}`
                              : ""
                          }
                          style={{
                            boxShadow: possuiObservacao
                              ? "inset 3px 0 0 #facc15"
                              : "none",
                          }}
                        >
                          <td style={styles.td}>
                            <input
                              type="checkbox"
                              checked={selecionados.includes(x.id)}
                              onChange={() => alternarSelecionado(x.id)}
                            />
                          </td>

                          <td style={styles.td}>{formatarData(x.data)}</td>

                          <td style={styles.td}>{x.cliente}</td>

                          <td
                            style={{
                              ...styles.td,
                              color: "#c4b5fd",
                              fontWeight: 700,
                            }}
                          >
                            {x.produto || x.servico}
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
                            <BotaoDetalhes item={x} />
                          </td>
                        </tr>

                        {detalhesAbertos[x.id] && (
                          <tr>
                            <td
                              colSpan={10}
                              style={{
                                background: "#101c33",
                                padding: 18,
                              }}
                            >
                              <div
                                style={{
                                  ...styles.detalheGrid,
                                  gridTemplateColumns:
                                    "repeat(auto-fit,minmax(140px,1fr))",
                                  gap: 12,
                                }}
                              >
                                <div style={styles.detalheItem}>
                                  <span style={styles.detalheLabel}>Tipo</span>
                                  {x.tipo || "-"}
                                </div>

                                <div style={styles.detalheItem}>
                                  <span style={styles.detalheLabel}>Placa</span>
                                  {x.placa || "-"}
                                  <BotaoCopiar
                                    item={x}
                                    campo="placa"
                                    label="placa"
                                  />
                                </div>

                                <div style={styles.detalheItem}>
                                  <span style={styles.detalheLabel}>
                                    Renavan
                                  </span>
                                  {x.renavan || "-"}
                                  <BotaoCopiar
                                    item={x}
                                    campo="renavan"
                                    label="renavan"
                                  />
                                </div>

                                <div style={styles.detalheItem}>
                                  <span style={styles.detalheLabel}>
                                    Processo
                                  </span>
                                  {x.processo || "-"}
                                  <BotaoCopiar
                                    item={x}
                                    campo="processo"
                                    label="processo"
                                  />
                                </div>

                                <div style={styles.detalheItem}>
                                  <span style={styles.detalheLabel}>
                                    Categoria
                                  </span>
                                  {x.categoriaPlaca || "-"}
                                </div>

                                <div
                                  style={{
                                    ...styles.detalheItem,
                                    minWidth: 140,
                                  }}
                                >
                                  <span style={styles.detalheLabel}>
                                    Celular
                                  </span>
                                  {x.celular || "-"}
                                  {x.celular && (
                                    <BotaoCopiar
                                      item={x}
                                      campo="celular"
                                      label="celular"
                                    />
                                  )}
                                </div>

                                <div
                                  style={{
                                    ...styles.detalheItem,
                                    gridColumn: "1 / -1",
                                    border: possuiObservacao
                                      ? "1px solid #facc15"
                                      : "1px solid #334155",
                                    background: possuiObservacao
                                      ? "rgba(250,204,21,0.08)"
                                      : styles.detalheItem?.background,
                                  }}
                                >
                                  <span style={styles.detalheLabel}>
                                    Observação
                                  </span>
                                  <div
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {x.observacao || "-"}
                                  </div>

                                  {x.observacao && (
                                    <BotaoCopiar
                                      item={x}
                                      campo="observacao"
                                      label="observação"
                                    />
                                  )}
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
                                    : "Copiar tudo"}
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
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}