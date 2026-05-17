import { useState } from "react";
import styles from "../styles/styles.js";

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
  saidas,
  contas,
  clientes,
  estoqueCompras,
  estoquePerdas,
}) {
  const [mostrarFerramentas, setMostrarFerramentas] = useState(false);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);

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

  const menus = [
    "Dashboard",
    "Entradas",
    "Saídas",
    "Contas a Pagar",
    "Clientes",
    "Pendências de Clientes",
    "Controle de Estoque",
    "Importar Entradas",
    "Importar Saídas",
    "Importar Contas",
  ];

  function copiarInformacao(texto, tipo) {
    navigator.clipboard.writeText(texto);
    setBotaoCopiado(tipo);
    setTimeout(() => setBotaoCopiado(""), 2000);
  }

  function exportarBackup() {
    const dados = {
      entradas,
      saidas,
      contas,
      clientes,
      estoqueCompras,
      estoquePerdas,
      exportadoEm: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "backup-emplacar.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  function importarBackup(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result);

        if (dados.entradas) localStorage.setItem("emplacar_entradas", JSON.stringify(dados.entradas));
        if (dados.saidas) localStorage.setItem("emplacar_saidas", JSON.stringify(dados.saidas));
        if (dados.contas) localStorage.setItem("emplacar_contas", JSON.stringify(dados.contas));
        if (dados.clientes) localStorage.setItem("emplacar_clientes", JSON.stringify(dados.clientes));
        if (dados.estoqueCompras) localStorage.setItem("emplacar_estoque_compras", JSON.stringify(dados.estoqueCompras));
        if (dados.estoquePerdas) localStorage.setItem("emplacar_estoque_perdas", JSON.stringify(dados.estoquePerdas));

        alert("Backup importado com sucesso.");
        window.location.reload();
      } catch {
        alert("Arquivo inválido.");
      }
    };

    reader.readAsText(arquivo);
  }

  function limparSistema() {
    if (!confirmandoLimpeza) {
      setConfirmandoLimpeza(true);
      setTimeout(() => setConfirmandoLimpeza(false), 5000);
      return;
    }

    const confirmar = prompt('Digite "APAGAR" para confirmar');
    if (confirmar !== "APAGAR") {
      alert("Limpeza cancelada.");
      setConfirmandoLimpeza(false);
      return;
    }

    localStorage.clear();
    window.location.reload();
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoBox}>
        <img src="/logo-emplacar.png" alt="Logo Emplacar" style={styles.logoImagem} />

        <div>
          <h2 style={styles.logo}>Emplacar</h2>
          <p style={styles.logoSubtitulo}>Financeiro</p>
        </div>
      </div>

      <div style={styles.menuLista}>
        {menus.map((item) => (
          <button
            key={item}
            onClick={() => {
              setAba(item);
              setTextoImportacao("");
              setResultadoImportacao("");
            }}
            style={aba === item ? styles.menuAtivo : styles.menu}
          >
            {item}
          </button>
        ))}
      </div>

      <div style={styles.menuRodape}>
        <button
          style={botaoCopiado === "pix" ? styles.botaoCopiadoMenu : styles.botaoCopiarMenu}
          onClick={() => copiarInformacao(chavePix, "pix")}
        >
          {botaoCopiado === "pix" ? "Pix copiado" : "Copiar Pix"}
        </button>

        <button
          style={styles.menuSecundario}
          onClick={() => setMostrarFerramentas(!mostrarFerramentas)}
        >
          {mostrarFerramentas ? "Fechar ferramentas" : "Ferramentas"}
        </button>

        {mostrarFerramentas && (
          <div style={painelFerramentas}>
            <button
              style={botaoFerramenta}
              onClick={() => setMostrarDadosEmpresa(!mostrarDadosEmpresa)}
            >
              {mostrarDadosEmpresa ? "Ocultar dados da loja" : "Dados da loja"}
            </button>

            {mostrarDadosEmpresa && (
              <>
                <pre style={styles.dadosEmpresaTexto}>{dadosEmpresaTexto}</pre>

                <button
                  style={botaoCopiado === "dados" ? styles.botaoCopiadoMenu : botaoFerramenta}
                  onClick={() => copiarInformacao(dadosEmpresaTexto, "dados")}
                >
                  {botaoCopiado === "dados" ? "Dados copiados" : "Copiar dados da loja"}
                </button>
              </>
            )}

            <button style={botaoFerramenta} onClick={exportarBackup}>
              Exportar backup
            </button>

            <label style={botaoFerramenta}>
              Importar backup
              <input
                type="file"
                accept=".json"
                onChange={importarBackup}
                style={{ display: "none" }}
              />
            </label>

            <button
              style={{
                ...botaoFerramenta,
                background: confirmandoLimpeza ? "#b91c1c" : "#ef4444",
              }}
              onClick={limparSistema}
            >
              {confirmandoLimpeza ? "Clique de novo" : "Limpar sistema"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}