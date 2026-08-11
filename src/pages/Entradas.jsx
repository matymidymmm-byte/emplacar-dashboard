import { useEffect, useMemo, useRef, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import TabelaEntradas from "../components/TabelaEntradas.jsx";

import styles from "../styles/styles.js";

function FormularioEntrada({
  entradaForm,
  clientes,
  formasPagamento,
  salvarEntrada,
  editando,
  cancelarEdicao,
  formRef,
  scrollAnteriorRef,
}) {
  const [formLocal, setFormLocal] = useState(entradaForm);

  // Sincroniza somente quando o App manda um novo formulário,
  // por exemplo ao clicar em Editar ou Cancelar.
  useEffect(() => {
    setFormLocal(entradaForm);
  }, [entradaForm]);

  function alterarCampo(campo, valor) {
    setFormLocal((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function salvarComRetorno() {
    // IMPORTANTE:
    // envia o formulário local diretamente para salvarEntrada.
    salvarEntrada(formLocal);

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

  return (
    <div ref={formRef}>
      <Card
        titulo={
          editando.tipo === "entrada"
            ? "Editando entrada"
            : "Lançar entrada"
        }
      >
        <div style={styles.formGrid}>
          <Campo
            label="Data"
            tipo="date"
            valor={formLocal.data || ""}
            mudar={(v) => alterarCampo("data", v)}
          />

          <Campo
            label="Tipo"
            valor={formLocal.tipo || ""}
            mudar={(v) => alterarCampo("tipo", v)}
          />

          <label style={styles.label}>
            Cliente

            <input
              list="lista-clientes"
              value={formLocal.cliente || ""}
              onChange={(e) =>
                alterarCampo("cliente", e.target.value)
              }
              placeholder="Digite ou selecione um cliente"
              style={styles.input}
            />

            <datalist id="lista-clientes">
              {clientes.map((cliente) => (
                <option
                  key={cliente.id}
                  value={cliente.nome}
                />
              ))}
            </datalist>
          </label>

          <Campo
            label="Produto"
            valor={formLocal.produto || ""}
            mudar={(v) => alterarCampo("produto", v)}
          />

          <Campo
            label="Placa"
            valor={formLocal.placa || ""}
            mudar={(v) =>
              alterarCampo(
                "placa",
                String(v || "").toUpperCase()
              )
            }
          />

          <Campo
            label="Renavan"
            valor={formLocal.renavan || ""}
            mudar={(v) => alterarCampo("renavan", v)}
          />

          <Select
            label="Forma de pagamento"
            valor={formLocal.formaPagamento || ""}
            mudar={(v) =>
              alterarCampo("formaPagamento", v)
            }
            opcoes={formasPagamento}
          />

          <Campo
            label="Valor"
            tipo="number"
            valor={formLocal.valor}
            mudar={(v) => alterarCampo("valor", v)}
          />

          <Select
            label="Status"
            valor={formLocal.status || ""}
            mudar={(v) => alterarCampo("status", v)}
            opcoes={["Pago", "Pendente", "Atrasado"]}
          />

          <Campo
            label="Processo"
            valor={formLocal.processo || ""}
            mudar={(v) => alterarCampo("processo", v)}
          />

          <Campo
            label="Dia pago"
            tipo="date"
            valor={formLocal.diaPago || ""}
            mudar={(v) => alterarCampo("diaPago", v)}
          />

          <Select
            label="Categoria"
            valor={formLocal.categoriaPlaca || ""}
            mudar={(v) =>
              alterarCampo("categoriaPlaca", v)
            }
            opcoes={[
              "PARTICULAR",
              "ALUGUEL",
              "OFICIAL",
              "COLEÇÃO",
              "ESPECIAL",
              "DIPLOMÁTICO",
            ]}
          />

          <Campo
            label="Celular"
            valor={formLocal.celular || ""}
            mudar={(v) => alterarCampo("celular", v)}
          />

          <label style={styles.label}>
            Observação

            <textarea
              value={formLocal.observacao || ""}
              onChange={(e) =>
                alterarCampo(
                  "observacao",
                  e.target.value
                )
              }
              placeholder="Ex: cliente pediu urgência, detalhe do pagamento, informação interna..."
              style={{
                ...styles.textarea,
                minHeight: 74,
                resize: "vertical",
              }}
            />
          </label>

          <button
            style={styles.botao}
            onClick={salvarComRetorno}
          >
            {editando.tipo === "entrada"
              ? "Salvar edição"
              : "Adicionar"}
          </button>

          {editando.tipo === "entrada" && (
            <button
              style={styles.botaoCinza}
              onClick={cancelarComRetorno}
            >
              Cancelar
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function Entradas({
  entradaForm,
  setEntradas,

  clientes,
  formasPagamento,

  salvarEntrada,
  editando,
  cancelarEdicao,

  entradas,
  moeda,

  destinoDinheiro,

  editar,
  remover,
  inicioMes,
  fimMes,
}) {
  const formRef = useRef(null);
  const scrollAnteriorRef = useRef(0);

  const [modoVisualizacao, setModoVisualizacao] =
    useState("periodo");

  const entradasVisiveis = useMemo(() => {
    return entradas.filter((entrada) => {
      if (!entrada.data) return false;

      if (modoVisualizacao === "todos") {
        return true;
      }

      return (
        entrada.data >= inicioMes &&
        entrada.data <= fimMes
      );
    });
  }, [
    entradas,
    modoVisualizacao,
    inicioMes,
    fimMes,
  ]);

  useEffect(() => {
    if (editando.tipo === "entrada") {
      scrollAnteriorRef.current = window.scrollY;

      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    }
  }, [editando]);

  const resumo = useMemo(() => {
    const total = entradasVisiveis.reduce(
      (soma, entrada) =>
        soma + Number(entrada.valor || 0),
      0
    );

    const media =
      entradasVisiveis.length > 0
        ? total / entradasVisiveis.length
        : 0;

    const recebidas = entradasVisiveis.filter(
      (entrada) => entrada.diaPago
    ).length;

    return {
      total,
      media,
      recebidas,
    };
  }, [entradasVisiveis]);

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Entradas:</strong>{" "}
          {entradasVisiveis.length}
        </span>

        <span>
          <strong>Total:</strong>{" "}
          {moeda.format(resumo.total)}
        </span>

        <span>
          <strong>Média:</strong>{" "}
          {moeda.format(resumo.media)}
        </span>

        <span>
          <strong>Recebidas:</strong>{" "}
          {resumo.recebidas}
        </span>
      </div>

      <div style={styles.acoes}>
        <button
          style={
            modoVisualizacao === "periodo"
              ? styles.botao
              : styles.botaoCinza
          }
          onClick={() =>
            setModoVisualizacao("periodo")
          }
        >
          Período atual
        </button>

        <button
          style={
            modoVisualizacao === "todos"
              ? styles.botao
              : styles.botaoCinza
          }
          onClick={() =>
            setModoVisualizacao("todos")
          }
        >
          Ver tudo
        </button>
      </div>

      <FormularioEntrada
        entradaForm={entradaForm}
        clientes={clientes}
        formasPagamento={formasPagamento}
        salvarEntrada={salvarEntrada}
        editando={editando}
        cancelarEdicao={cancelarEdicao}
        formRef={formRef}
        scrollAnteriorRef={scrollAnteriorRef}
      />

      <Card titulo="Entradas cadastradas">
        <TabelaEntradas
          entradas={entradasVisiveis}
          setEntradas={setEntradas}
          moeda={moeda}
          destinoDinheiro={destinoDinheiro}
          editar={editar}
          remover={remover}
          formasPagamento={formasPagamento}
        />
      </Card>
    </>
  );
}