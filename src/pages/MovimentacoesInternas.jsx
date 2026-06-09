import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  CalendarDays,
  FileText,
  Trash2,
} from "lucide-react";

import styles from "../styles/styles.js";
import Card from "../components/Card.jsx";
import Tabela from "../components/Tabela.jsx";

export default function MovimentacoesInternas({
  hoje,
  moeda,
  numero,
  movimentacoesCaixaBanco = [],
  setMovimentacoesCaixaBanco,
  registrarAlteracao,
  podeOperarSistema = true,
}) {
  const [form, setForm] = useState({
    data: hoje,
    origem: "Caixa",
    destino: "Banco",
    valor: "",
    observacao: "",
  });

  function limparForm() {
    setForm({
      data: hoje,
      origem: "Caixa",
      destino: "Banco",
      valor: "",
      observacao: "",
    });
  }

  function salvarMovimentacao() {
    if (!podeOperarSistema) return;

    const valorNumerico = numero(form.valor);

    if (!form.data) {
      alert("Informe a data.");
      return;
    }

    if (!form.origem || !form.destino) {
      alert("Informe origem e destino.");
      return;
    }

    if (form.origem === form.destino) {
      alert("Origem e destino não podem ser iguais.");
      return;
    }

    if (valorNumerico <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    const nova = {
      id: Date.now(),
      data: form.data,
      tipo: "TRANSFERENCIA_INTERNA",
      origem: form.origem,
      destino: form.destino,
      valor: valorNumerico,
      observacao: form.observacao || "",
      criadoEm: new Date().toISOString(),
    };

    setMovimentacoesCaixaBanco((old) => [nova, ...old]);

    registrarAlteracao?.({
      tipo: "Transferência interna",
      modulo: "Movimentações Internas",
      descricao: `Transferência interna de ${form.origem} para ${form.destino}`,
      valorNovo: nova,
      itemId: nova.id,
    });

    limparForm();
  }

  function removerMovimentacao(id) {
    const item = movimentacoesCaixaBanco.find(
      (x) => String(x.id) === String(id)
    );

    if (!item) return;

    const confirmar = window.confirm(
      "Deseja remover esta movimentação interna?"
    );

    if (!confirmar) return;

    setMovimentacoesCaixaBanco((old) =>
      old.filter((x) => String(x.id) !== String(id))
    );

    registrarAlteracao?.({
      tipo: "Exclusão",
      modulo: "Movimentações Internas",
      descricao: `Removeu transferência interna de ${item.origem} para ${item.destino}`,
      valorAntigo: item,
      valorNovo: "Movimentação removida",
      itemId: id,
    });
  }

  const resumo = useMemo(() => {
    return movimentacoesCaixaBanco.reduce(
      (acc, item) => {
        const valor = Number(item.valor || 0);

        if (item.origem === "Caixa" && item.destino === "Banco") {
          acc.depositos += valor;
        }

        if (item.origem === "Banco" && item.destino === "Caixa") {
          acc.saques += valor;
        }

        acc.total += valor;

        return acc;
      },
      {
        depositos: 0,
        saques: 0,
        total: 0,
      }
    );
  }, [movimentacoesCaixaBanco]);

  function dataBR(data) {
    if (!data || !data.includes("-")) return data || "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return (
    <>
      <div style={styles.dashboardTopo}>
        <div>
          <h1 style={styles.dashboardTitulo}>Movimentações Internas</h1>

          <p style={styles.dashboardSubtitulo}>
            Controle de transferências entre caixa físico e banco
          </p>
        </div>
      </div>

      <div style={styles.kpisModernos}>
        <Card titulo="Depósitos Caixa → Banco">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Building2 size={28} color="#38bdf8" />

            <h2 style={{ color: "#fff", margin: 0 }}>
              {moeda.format(resumo.depositos)}
            </h2>
          </div>
        </Card>

        <Card titulo="Saques Banco → Caixa">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Banknote size={28} color="#22c55e" />

            <h2 style={{ color: "#fff", margin: 0 }}>
              {moeda.format(resumo.saques)}
            </h2>
          </div>
        </Card>

        <Card titulo="Total Movimentado">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ArrowLeftRight size={28} color="#a78bfa" />

            <h2 style={{ color: "#fff", margin: 0 }}>
              {moeda.format(resumo.total)}
            </h2>
          </div>
        </Card>
      </div>

      <Card titulo="Nova movimentação interna">
        <div style={styles.formGrid}>
          <label style={styles.label}>
            <CalendarDays size={16} />
            Data
            <input
              type="date"
              value={form.data}
              onChange={(e) =>
                setForm((old) => ({ ...old, data: e.target.value }))
              }
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Origem
            <select
              value={form.origem}
              onChange={(e) =>
                setForm((old) => ({ ...old, origem: e.target.value }))
              }
              style={styles.input}
            >
              <option>Caixa</option>
              <option>Banco</option>
            </select>
          </label>

          <label style={styles.label}>
            Destino
            <select
              value={form.destino}
              onChange={(e) =>
                setForm((old) => ({ ...old, destino: e.target.value }))
              }
              style={styles.input}
            >
              <option>Banco</option>
              <option>Caixa</option>
            </select>
          </label>

          <label style={styles.label}>
            Valor
            <input
              type="text"
              value={form.valor}
              onChange={(e) =>
                setForm((old) => ({ ...old, valor: e.target.value }))
              }
              placeholder="Ex: 500,00"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <FileText size={16} />
            Observação
            <input
              type="text"
              value={form.observacao}
              onChange={(e) =>
                setForm((old) => ({ ...old, observacao: e.target.value }))
              }
              placeholder="Ex: Depósito no banco"
              style={styles.input}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={salvarMovimentacao}
          style={{
            ...styles.botao,
            marginTop: 16,
          }}
        >
          Salvar movimentação
        </button>

        <p
          style={{
            color: "#94a3b8",
            fontSize: 13,
            marginTop: 14,
            lineHeight: 1.5,
          }}
        >
          Esta operação altera apenas Banco e Caixa Físico. Não altera
          faturamento, lucro, meta, entradas ou saídas.
        </p>
      </Card>

      <Card titulo="Histórico de movimentações internas">
        {movimentacoesCaixaBanco.length === 0 ? (
          <p style={styles.vazio}>Nenhuma movimentação interna registrada.</p>
        ) : (
          <Tabela
            colunas={[
              "Data",
              "Origem",
              "Destino",
              "Valor",
              "Observação",
              "Ação",
            ]}
            dados={movimentacoesCaixaBanco.map((item) => [
              dataBR(item.data),
              item.origem || "-",
              item.destino || "-",
              moeda.format(Number(item.valor || 0)),
              item.observacao || "-",
              <button
                key={item.id}
                type="button"
                onClick={() => removerMovimentacao(item.id)}
                style={{
                  border: 0,
                  borderRadius: 10,
                  background: "#dc2626",
                  color: "#fff",
                  padding: "8px 10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 700,
                }}
              >
                <Trash2 size={15} />
                Remover
              </button>,
            ])}
          />
        )}
      </Card>
    </>
  );
}