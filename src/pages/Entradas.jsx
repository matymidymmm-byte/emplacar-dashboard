import { useEffect, useRef, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import TabelaEntradas from "../components/TabelaEntradas.jsx";

import styles from "../styles/styles.js";

export default function Entradas({
  entradaForm,
  setEntradaForm,
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

  const [modoVisualizacao, setModoVisualizacao] = useState("periodo");

  const entradasVisiveis = entradas.filter((entrada) => {
    if (!entrada.data) return false;

    if (modoVisualizacao === "todos") {
      return true;
    }

    return entrada.data >= inicioMes && entrada.data <= fimMes;
  });

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

  function salvarComRetorno() {
    salvarEntrada();

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

  const total = entradasVisiveis.reduce(
    (soma, entrada) => soma + Number(entrada.valor || 0),
    0
  );

  const media =
    entradasVisiveis.length > 0 ? total / entradasVisiveis.length : 0;

  const recebidas = entradasVisiveis.filter((entrada) => entrada.diaPago).length;

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Entradas:</strong> {entradasVisiveis.length}
        </span>

        <span>
          <strong>Total:</strong> {moeda.format(total)}
        </span>

        <span>
          <strong>Média:</strong> {moeda.format(media)}
        </span>

        <span>
          <strong>Recebidas:</strong> {recebidas}
        </span>
      </div>

      <div style={styles.acoes}>
        <button
          style={
            modoVisualizacao === "periodo" ? styles.botao : styles.botaoCinza
          }
          onClick={() => setModoVisualizacao("periodo")}
        >
          Período atual
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
            editando.tipo === "entrada" ? "Editando entrada" : "Lançar entrada"
          }
        >
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={entradaForm.data}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  data: v,
                })
              }
            />

            <Campo
              label="Tipo"
              valor={entradaForm.tipo}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  tipo: v,
                })
              }
            />

            <label style={styles.label}>
  Cliente

  <input
    list="lista-clientes"
    value={entradaForm.cliente}
    onChange={(e) =>
      setEntradaForm({
        ...entradaForm,
        cliente: e.target.value,
      })
    }
    placeholder="Digite ou selecione um cliente"
    style={styles.input}
  />

  <datalist id="lista-clientes">
    {clientes.map((cliente) => (
      <option key={cliente.id} value={cliente.nome} />
    ))}
  </datalist>
</label>

            <Campo
              label="Produto"
              valor={entradaForm.produto}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  produto: v,
                })
              }
            />

            <Campo
              label="Placa"
              valor={entradaForm.placa}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  placa: v.toUpperCase(),
                })
              }
            />

            <Campo
              label="Renavan"
              valor={entradaForm.renavan}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  renavan: v,
                })
              }
            />

            <Select
              label="Forma de pagamento"
              valor={entradaForm.formaPagamento}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  formaPagamento: v,
                })
              }
              opcoes={formasPagamento}
            />

            <Campo
              label="Valor"
              tipo="number"
              valor={entradaForm.valor}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  valor: v,
                })
              }
            />

            <Select
              label="Status"
              valor={entradaForm.status}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  status: v,
                })
              }
              opcoes={["Pago", "Pendente", "Atrasado"]}
            />

            <Campo
              label="Processo"
              valor={entradaForm.processo}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  processo: v,
                })
              }
            />

            <Campo
              label="Dia pago"
              tipo="date"
              valor={entradaForm.diaPago || ""}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  diaPago: v,
                })
              }
            />

            <Select
              label="Categoria"
              valor={entradaForm.categoriaPlaca}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  categoriaPlaca: v,
                })
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
              valor={entradaForm.celular || ""}
              mudar={(v) =>
                setEntradaForm({
                  ...entradaForm,
                  celular: v,
                })
              }
            />

            <label style={styles.label}>
              Observação
              <textarea
                value={entradaForm.observacao || ""}
                onChange={(e) =>
                  setEntradaForm({
                    ...entradaForm,
                    observacao: e.target.value,
                  })
                }
                placeholder="Ex: cliente pediu urgência, detalhe do pagamento, informação interna..."
                style={{
                  ...styles.textarea,
                  minHeight: 74,
                  resize: "vertical",
                }}
              />
            </label>

            <button style={styles.botao} onClick={salvarComRetorno}>
              {editando.tipo === "entrada" ? "Salvar edição" : "Adicionar"}
            </button>

            {editando.tipo === "entrada" && (
              <button style={styles.botaoCinza} onClick={cancelarComRetorno}>
                Cancelar
              </button>
            )}
          </div>

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
      </div>
    </>
  );
}