import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import TabelaEntradas from "../components/TabelaEntradas.jsx";

import styles from "../styles/styles.js";

export default function Entradas({
  entradaForm,
  setEntradaForm,
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
}) {
  const total = entradas.reduce(
    (soma, entrada) => soma + entrada.valor,
    0
  );

  const media =
    entradas.length > 0
      ? total / entradas.length
      : 0;

  const recebidas = entradas.filter(
    (entrada) => entrada.diaPago
  ).length;

  return (
    <>
      <div style={styles.resumoFiltro}>
        <span>
          <strong>Entradas:</strong>{" "}
          {entradas.length}
        </span>

        <span>
          <strong>Total:</strong>{" "}
          {moeda.format(total)}
        </span>

        <span>
          <strong>Média:</strong>{" "}
          {moeda.format(media)}
        </span>

        <span>
          <strong>Recebidas:</strong>{" "}
          {recebidas}
        </span>
      </div>

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

          <Select
            label="Cliente"
            valor={entradaForm.cliente}
            mudar={(v) =>
              setEntradaForm({
                ...entradaForm,
                cliente: v,
              })
            }
            opcoes={[
              "",
              ...clientes.map((c) => c.nome),
            ]}
            placeholder="Cliente"
          />

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
            opcoes={[
              "Pago",
              "Pendente",
              "Atrasado",
            ]}
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

          <button
            style={styles.botao}
            onClick={salvarEntrada}
          >
            {editando.tipo === "entrada"
              ? "Salvar edição"
              : "Adicionar"}
          </button>

          {editando.tipo === "entrada" && (
            <button
              style={styles.botaoCinza}
              onClick={cancelarEdicao}
            >
              Cancelar
            </button>
          )}
        </div>

        <TabelaEntradas
          entradas={entradas}
          moeda={moeda}
          destinoDinheiro={destinoDinheiro}
          editar={editar}
          remover={remover}
        />
      </Card>
    </>
  );
}