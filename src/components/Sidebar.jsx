import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

import styles from "../styles/styles.js";
import { db, auth } from "../services/firebase.js";

export default function Sidebar({
  aba,
  setAba,
  setTextoImportacao,
  setResultadoImportacao,

  chavePix,
  dadosEmpresaTexto,

  botaoCopiado,
  setBotaoCopiado,

  mostrarDadosEmpresa,
  setMostrarDadosEmpresa,

  entradas,
  setEntradas,

  saidas,
  setSaidas,

  contas,
  setContas,

  clientes,
  setClientes,

  estoqueCompras,
  setEstoqueCompras,

  estoquePerdas,
  setEstoquePerdas,

  historicoRelacoes,
  setHistoricoRelacoes,

  historicoFechamentos,
  setHistoricoFechamentos,

  mobile,
  menuMobile,
  setMenuMobile,

  usuario,
}) {
  const [mostrarFerramentas, setMostrarFerramentas] =
    useState(false);

  const [confirmandoLimpeza, setConfirmandoLimpeza] =
    useState(false);

  const [importandoBackup, setImportandoBackup] =
    useState(false);

  const docSistema =
    doc(db, "sistema", "emplacar");

  const email =
    usuario?.email?.toLowerCase() || "";

  let nivel = "socio";

  if (
    email ===
    "matymidy.mmm@gmail.com"
  ) {
    nivel = "admin";
  }

  if (
    email ===
    "emplacarmcr@gmail.com"
  ) {
    nivel = "lojista";
  }

  const admin =
    nivel === "admin";

  const menusBase = [
    "Dashboard",
    "Entradas",
    "Saídas",
    "Contas a Pagar",
    "Clientes",
    "Pendências de Clientes",
    "Controle de Estoque",
    "Relatório Diário",
    "Histórico Financeiro",
    "Atualizações",
    "Histórico de Alterações",
    "Importar Entradas",
    "Importar Saídas",
    "Importar Contas",
    "Backups",
  ];


  const menus =
    admin
      ? [
          ...menusBase,
          "Gerenciar Acessos",
        ]
      : menusBase;

  const botaoFerramenta = {
    width: "100%",
    padding: "12px 14px",
    border: 0,
    borderRadius: 12,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    display: "block",
    boxSizing: "border-box",
  };

  const painelFerramentas = {
    background: "#020617",
    border: "1px solid #334155",
    borderRadius: 16,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  function copiarInformacao(
    texto,
    tipo
  ) {
    navigator.clipboard.writeText(
      texto
    );

    setBotaoCopiado(tipo);

    setTimeout(
      () => setBotaoCopiado(""),
      2000
    );
  }

  async function sair() {
    await signOut(auth);
  }

  function exportarBackup() {
    if (!admin) return;

    const agora = new Date();

    const nomeArquivo =
      `backup-emplacar-${agora
        .toISOString()
        .slice(0, 10)}.json`;

    const dados = {
      versao: "3.0",

      exportadoEm:
        agora.toISOString(),

      entradas,
      saidas,
      contas,
      clientes,
      estoqueCompras,
      estoquePerdas,
      historicoRelacoes,
      historicoFechamentos,
    };

    const blob = new Blob(
      [JSON.stringify(dados, null, 2)],
      {
        type:
          "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = nomeArquivo;

    a.click();

    URL.revokeObjectURL(url);

    alert(
      "Backup exportado."
    );
  }

  async function importarBackup(
    event
  ) {
    if (!admin) return;

    const arquivo =
      event.target.files?.[0];

    if (!arquivo) return;

    const confirmar = confirm(
      "Importar backup irá substituir os dados atuais."
    );

    if (!confirmar) return;

    setImportandoBackup(true);

    const reader =
      new FileReader();

    reader.onload = async (
      e
    ) => {
      try {
        const dados = JSON.parse(
          e.target.result
        );

        const novoSistema = {
          entradas:
            dados.entradas || [],
          saidas:
            dados.saidas || [],
          contas:
            dados.contas || [],
          clientes:
            dados.clientes || [],
          estoqueCompras:
            dados.estoqueCompras ||
            [],
          estoquePerdas:
            dados.estoquePerdas ||
            [],
          historicoRelacoes:
            dados.historicoRelacoes ||
            [],
          historicoFechamentos:
            dados.historicoFechamentos ||
            [],
        };

        await setDoc(
          docSistema,
          novoSistema
        );

        setEntradas(
          novoSistema.entradas
        );

        setSaidas(
          novoSistema.saidas
        );

        setContas(
          novoSistema.contas
        );

        setClientes(
          novoSistema.clientes
        );

        setEstoqueCompras(
          novoSistema.estoqueCompras
        );

        setEstoquePerdas(
          novoSistema.estoquePerdas
        );

        setHistoricoRelacoes(
          novoSistema.historicoRelacoes
        );

        setHistoricoFechamentos(
          novoSistema.historicoFechamentos
        );

        alert(
          "Backup restaurado."
        );
      } catch {
        alert(
          "Arquivo inválido."
        );
      } finally {
        setImportandoBackup(false);
      }
    };

    reader.readAsText(arquivo);
  }

  async function limparSistema() {
    if (!admin) return;

    if (!confirmandoLimpeza) {
      setConfirmandoLimpeza(
        true
      );

      setTimeout(
        () =>
          setConfirmandoLimpeza(
            false
          ),
        5000
      );

      return;
    }

    const confirmar = prompt(
      'Digite "CONFIRMAR"'
    );

    if (
      confirmar !== "CONFIRMAR"
    ) {
      alert(
        "Limpeza cancelada."
      );

      setConfirmandoLimpeza(
        false
      );

      return;
    }

    const sistemaVazio = {
      entradas: [],
      saidas: [],
      contas: [],
      clientes: [],
      estoqueCompras: [],
      estoquePerdas: [],
      historicoRelacoes: [],
      historicoFechamentos: [],
    };

    await setDoc(
      docSistema,
      sistemaVazio
    );

    setEntradas([]);
    setSaidas([]);
    setContas([]);
    setClientes([]);
    setEstoqueCompras([]);
    setEstoquePerdas([]);
    setHistoricoRelacoes([]);
    setHistoricoFechamentos([]);

    alert("Sistema limpo.");

    setConfirmandoLimpeza(
      false
    );
  }

  return (
    <aside
      style={{
        ...styles.sidebar,

        position: mobile
          ? "fixed"
          : "relative",

        left:
          mobile &&
          !menuMobile
            ? "-100%"
            : 0,

        top: 0,

        height: "100vh",

        zIndex: 9999,

        transition:
          "all 0.28s ease",

        boxShadow: mobile
          ? "0 0 40px rgba(0,0,0,0.55)"
          : "none",
      }}
    >
      <div style={styles.logoBox}>
        <img
          src="/logo-emplacar.png"
          alt="Logo Emplacar"
          style={
            styles.logoImagem
          }
        />

        <div>
          <h2 style={styles.logo}>
            Emplacar
          </h2>

          <p
            style={
              styles.logoSubtitulo
            }
          >
            {nivel.toUpperCase()}
          </p>
        </div>
      </div>

      <div style={styles.menuLista}>
        {menus.map((item) => (
          <button
            key={item}
            onClick={() => {
              setAba(item);

              setTextoImportacao(
                ""
              );

              setResultadoImportacao(
                ""
              );

              if (mobile) {
                setMenuMobile(
                  false
                );
              }
            }}
            style={
              aba === item
                ? styles.menuAtivo
                : styles.menu
            }
          >
            {item}
          </button>
        ))}
      </div>

      <div style={styles.menuRodape}>
        <button
          style={
            botaoCopiado ===
            "pix"
              ? styles.botaoCopiadoMenu
              : styles.botaoCopiarMenu
          }
          onClick={() =>
            copiarInformacao(
              chavePix,
              "pix"
            )
          }
        >
          {botaoCopiado ===
          "pix"
            ? "Pix copiado"
            : "Copiar Pix"}
        </button>

        <button
          style={
            styles.menuSecundario
          }
          onClick={() =>
            setMostrarFerramentas(
              !mostrarFerramentas
            )
          }
        >
          {mostrarFerramentas
            ? "Fechar ferramentas"
            : "Ferramentas"}
        </button>

        {mostrarFerramentas && (
          <div
            style={
              painelFerramentas
            }
          >
            <button
              style={
                botaoFerramenta
              }
              onClick={() =>
                setMostrarDadosEmpresa(
                  !mostrarDadosEmpresa
                )
              }
            >
              {mostrarDadosEmpresa
                ? "Ocultar dados da loja"
                : "Dados da loja"}
            </button>

            {mostrarDadosEmpresa && (
              <>
                <pre
                  style={
                    styles.dadosEmpresaTexto
                  }
                >
                  {
                    dadosEmpresaTexto
                  }
                </pre>

                <button
                  style={
                    botaoFerramenta
                  }
                  onClick={() =>
                    copiarInformacao(
                      dadosEmpresaTexto,
                      "dados"
                    )
                  }
                >
                  Copiar dados
                </button>
              </>
            )}

            {admin && (
              <>
                <button
                  style={
                    botaoFerramenta
                  }
                  onClick={
                    exportarBackup
                  }
                >
                  Exportar backup
                </button>

                <label
                  style={{
                    ...botaoFerramenta,

                    opacity:
                      importandoBackup
                        ? 0.6
                        : 1,
                  }}
                >
                  {importandoBackup
                    ? "Importando..."
                    : "Importar backup"}

                  <input
                    type="file"
                    accept=".json"
                    onChange={
                      importarBackup
                    }
                    style={{
                      display:
                        "none",
                    }}
                  />
                </label>

                <button
                  style={{
                    ...botaoFerramenta,

                    background:
                      confirmandoLimpeza
                        ? "#b91c1c"
                        : "#ef4444",
                  }}
                  onClick={
                    limparSistema
                  }
                >
                  {confirmandoLimpeza
                    ? "Clique novamente"
                    : "Limpar sistema"}
                </button>
              </>
            )}
          </div>
        )}

        <button
          style={{
            ...styles.menuSecundario,
            background:
              "#dc2626",
          }}
          onClick={sair}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}