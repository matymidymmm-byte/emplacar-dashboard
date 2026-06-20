import { useEffect, useRef, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

import styles from "../styles/styles.js";

export default function Saidas({
  saidaForm,
  setSaidaForm,
  formasPagamento,
  salvarSaida,
  editando,
  cancelarEdicao,
  saidas,
  moeda,
  destinoDinheiro,
  editar,
  remover,
  inicioMes,
  fimMes,
}) {
  const formRef = useRef(null);
  const scrollAnteriorRef = useRef(0);
  const [modoVisualizacao, setModoVisualizacao] = useState("periodo");
  const [dadosFiltrados, setDadosFiltrados] = useState([]);

  const categoriasSaida = [
    "Placas / Matéria-prima",
    "Aluguel",
    "Energia",
    "Água",
    "Internet",
    "Marketing",
    "Taxas",
    "Vale colaborador",
    "Manutenção",
    "Pró-labore",
    "Combustível",
    "Sistema / Software",
    "Material de escritório",
    "Conta paga",
    "Outros",
  ];

  useEffect(() => {
    if (editando.tipo === "saida") {
      scrollAnteriorRef.current = window.scrollY;

      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    }
  }, [editando]);

  function salvarComRetorno() {
    salvarSaida();

    setTimeout(() => {
      window.scrollTo({
        top: scrollAnteriorRef.current,
        behavior: "smooth",
      });
    }, 220);
  }

  function cancelarComRetorno() {
    cancelarEdicao();

    setTimeout(() => {
      window.scrollTo({
        top: scrollAnteriorRef.current,
        behavior: "smooth",
      });
    }, 220);
  }

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function dataUltimos30Dias() {
    const data = new Date();
    data.setDate(data.getDate() - 30);
    return data.toISOString().slice(0, 10);
  }

  function temObservacao(item) {
    return String(item?.observacao || "").trim().length > 0;
  }

  function BotaoObservacao({ saida }) {
    const possuiObservacao = temObservacao(saida);

    return (
      <button
        title={
          possuiObservacao
            ? `Observação: ${saida.observacao}`
            : "Sem observação"
        }
        onClick={() => {
          if (possuiObservacao) {
            alert(saida.observacao);
          }
        }}
        style={{
          position: "relative",
          background: possuiObservacao ? "#1d4ed8" : "#243041",
          border: possuiObservacao ? "1px solid #60a5fa" : "none",
          color: "#fff",
          borderRadius: 10,
          padding: "5px 8px",
          cursor: possuiObservacao ? "pointer" : "default",
          fontSize: 16,
          opacity: possuiObservacao ? 1 : 0.45,
          boxShadow: possuiObservacao
            ? "0 0 0 2px rgba(96,165,250,0.18)"
            : "none",
        }}
      >
        💬

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

  const saidasVisiveis = saidas.filter((saida) => {
    if (!saida.data) return false;

    if (modoVisualizacao === "todos") return true;

    if (modoVisualizacao === "ultimos30") {
      return saida.data >= dataUltimos30Dias();
    }

    return saida.data >= inicioMes && saida.data <= fimMes;
  });

  const saidasOrdenadas = [...saidasVisiveis].sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;

    return new Date(b.data) - new Date(a.data);
  });

  const dadosParaResumo =
    dadosFiltrados.length > 0 ? dadosFiltrados : saidasOrdenadas;

  const totalFiltrado = dadosParaResumo.reduce((soma, linha) => {
    if (!Array.isArray(linha)) {
      return soma + Number(linha.valor || 0);
    }

    const valorTexto = String(linha?.[5] || "")
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    return soma + (Number(valorTexto) || 0);
  }, 0);

  const mediaFiltrada =
    dadosParaResumo.length > 0 ? totalFiltrado / dadosParaResumo.length : 0;

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Visualização:</strong>{" "}
          {modoVisualizacao === "periodo"
            ? `Período atual: ${dataBR(inicioMes)} até ${dataBR(fimMes)}`
            : modoVisualizacao === "ultimos30"
            ? "Últimos 30 dias"
            : "Todas as saídas"}
        </span>

        <span>
          <strong>Saídas:</strong> {dadosParaResumo.length}
        </span>

        <span>
          <strong>Total:</strong> {moeda.format(totalFiltrado)}
        </span>

        <span>
          <strong>Média:</strong> {moeda.format(mediaFiltrada)}
        </span>
      </div>

      <div style={styles.acoes}>
        <button
          style={
            modoVisualizacao === "periodo"
              ? styles.botao
              : styles.botaoCinza
          }
          onClick={() => setModoVisualizacao("periodo")}
        >
          Período atual
        </button>

        <button
          style={
            modoVisualizacao === "ultimos30"
              ? styles.botao
              : styles.botaoCinza
          }
          onClick={() => setModoVisualizacao("ultimos30")}
        >
          Últimos 30 dias
        </button>

        <button
          style={
            modoVisualizacao === "todos" ? styles.botao : styles.botaoCinza
          }
          onClick={() => setModoVisualizacao("todos")}
        >
          Ver tudo
        </button>
      </div>

      <div ref={formRef}>
        <Card
          titulo={
            editando.tipo === "saida" ? "Editando saída" : "Lançar saída"
          }
        >
          <div style={styles.formGrid}>
            <Campo
              label="Dia saída"
              tipo="date"
              valor={saidaForm.data}
              mudar={(v) =>
                setSaidaForm({
                  ...saidaForm,
                  data: v,
                })
              }
            />

            <Select
              label="Forma de pagamento saída"
              valor={saidaForm.formaPagamento}
              mudar={(v) =>
                setSaidaForm({
                  ...saidaForm,
                  formaPagamento: v,
                })
              }
              opcoes={formasPagamento}
            />

            <Select
              label="Centro de custo"
              valor={saidaForm.categoria || "Outros"}
              mudar={(v) =>
                setSaidaForm({
                  ...saidaForm,
                  categoria: v,
                })
              }
              opcoes={categoriasSaida}
            />

            <Select
  label="Tipo financeiro"
  valor={saidaForm.tipoSaida || "Operacional"}
  mudar={(v) =>
    setSaidaForm({
      ...saidaForm,
      tipoSaida: v,
    })
  }
  opcoes={[
    "Operacional",
    "Distribuição de Lucro",
    "Aporte de Capital",
    "Vale / Adiantamento",
    "Patrimonial",
    "Outros Não Operacionais",
  ]}
/>

            <Campo
              label="Conta"
              valor={saidaForm.conta}
              mudar={(v) =>
                setSaidaForm({
                  ...saidaForm,
                  conta: v,
                })
              }
            />

            <Campo
              label="Valor saída"
              tipo="number"
              valor={saidaForm.valor}
              mudar={(v) =>
                setSaidaForm({
                  ...saidaForm,
                  valor: v,
                })
              }
            />

            <label style={styles.label}>
              Observação
              <textarea
                value={saidaForm.observacao || ""}
                onChange={(e) =>
                  setSaidaForm({
                    ...saidaForm,
                    observacao: e.target.value,
                  })
                }
                placeholder="Ex: compra no mercado, itens comprados, motivo da saída..."
                style={{
                  ...styles.textarea,
                  minHeight: 74,
                  resize: "vertical",
                }}
              />
            </label>

            <button style={styles.botao} onClick={salvarComRetorno}>
              {editando.tipo === "saida" ? "Salvar edição" : "Adicionar"}
            </button>

            {editando.tipo === "saida" && (
              <button style={styles.botaoCinza} onClick={cancelarComRetorno}>
                Cancelar
              </button>
            )}
          </div>

          <Tabela
            aoFiltrar={setDadosFiltrados}
            colunas={[
              "Dia saída",
              "Pagamento",
              "Centro de custo",
              "Tipo saída",
              "Conta",
              "Valor",
              "Destino",
              "Obs",
              "Ações",
            ]}
            dados={saidasOrdenadas.map((saida) => [
              dataBR(saida.data),
              saida.formaPagamento,
              saida.categoria || "Outros",
              saida.tipoSaida,
              saida.conta,
              moeda.format(Number(saida.valor || 0)),
              destinoDinheiro(saida.formaPagamento),
              <BotaoObservacao saida={saida} />,
              <Acoes
                editar={() => editar("saida", saida)}
                excluir={() => remover("saida", saida.id)}
              />,
            ])}
          />
        </Card>
      </div>
    </>
  );
}