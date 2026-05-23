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

  const saidasVisiveis = saidas.filter((saida) => {
    if (!saida.data) return false;

    if (modoVisualizacao === "todos") return true;

    if (modoVisualizacao === "ultimos30") {
      return saida.data >= dataUltimos30Dias();
    }

    return saida.data >= inicioMes && saida.data <= fimMes;
  });

  const total = saidasVisiveis.reduce(
    (soma, saida) => soma + Number(saida.valor || 0),
    0
  );

  const media =
    saidasVisiveis.length > 0 ? total / saidasVisiveis.length : 0;

  const saidasOrdenadas = [...saidasVisiveis].sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;

    return new Date(b.data) - new Date(a.data);
  });
  const dadosParaResumo =
  dadosFiltrados.length > 0 ? dadosFiltrados : saidasOrdenadas;

const totalFiltrado = dadosParaResumo.reduce((soma, linha) => {
  if (!Array.isArray(linha)) return soma;

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
            modoVisualizacao === "todos"
              ? styles.botao
              : styles.botaoCinza
          }
          onClick={() => setModoVisualizacao("todos")}
        >
          Ver tudo
        </button>
      </div>

      <div ref={formRef}>
        <Card
          titulo={
            editando.tipo === "saida"
              ? "Editando saída"
              : "Lançar saída"
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

            <Campo
              label="Tipo saída"
              valor={saidaForm.tipoSaida}
              mudar={(v) =>
                setSaidaForm({
                  ...saidaForm,
                  tipoSaida: v,
                })
              }
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