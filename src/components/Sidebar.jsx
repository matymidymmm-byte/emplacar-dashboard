import { useState } from "react";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  ReceiptText,
  Users,
  AlertTriangle,
  Boxes,
  CalendarDays,
  LineChart,
  FileDown,
  FileUp,
  FileText,
  ShieldCheck,
  DatabaseBackup,
  UserCog,
  Building2,
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import {
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import styles from "../styles/styles.js";
import { db, auth } from "../services/firebase.js";

export default function Sidebar({
  empresaId,
  aba,
  setAba,
  acesso,
  dadosEmpresa,
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

  movimentacoesCaixaBanco,
setMovimentacoesCaixaBanco,

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
  trocarEmpresaSuperadmin,

  nivelAcesso = "socio",
  ehSuperadmin = false,
  ehAdmin = false,

  podeGerenciarAcessos = false,
  podeConfigurarSistema = false,
  podeGerenciarBackups = false,
  podeLimparSistema = false,
}) {
  const [mostrarFerramentas, setMostrarFerramentas] = useState(false);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);
  const [importandoBackup, setImportandoBackup] = useState(false);

  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

  const docSistema = doc(db, "empresas", empresaId, "sistema", "dados");

  const nivel = String(nivelAcesso || acesso?.nivel || "socio").toLowerCase();

  const menusBase = [
    "Dashboard",
    "Entradas",
    "Saídas",
    "Movimentações Internas",
    "Contas a Pagar",
    "Clientes",
    "Pendências de Clientes",
    "Controle de Estoque",
    "Relatório Diário",
    "Histórico Financeiro",
    "Importar Entradas",
    "Importar Saídas",
    "Importar Contas",
  ];

  const menusAdministrativos = [];

  if (ehSuperadmin || ehAdmin) {
    menusAdministrativos.push("Histórico de Alterações");
  }

  if (podeGerenciarBackups) {
    menusAdministrativos.push("Backups");
  }

  if (podeGerenciarAcessos) {
    menusAdministrativos.push("Gerenciar Acessos");
  }

  menusAdministrativos.push("Dados da Empresa");

  const menus = [...menusBase, ...menusAdministrativos];

  const iconesMenu = {
    Dashboard: LayoutDashboard,
    Entradas: ArrowDownCircle,
    Saídas: ArrowUpCircle,
    "Movimentações Internas": ArrowLeftRight,
    "Contas a Pagar": ReceiptText,
    Clientes: Users,
    "Pendências de Clientes": AlertTriangle,
    "Controle de Estoque": Boxes,
    "Relatório Diário": CalendarDays,
    "Histórico Financeiro": LineChart,
    "Importar Entradas": FileDown,
    "Importar Saídas": FileUp,
    "Importar Contas": FileText,
    "Histórico de Alterações": ShieldCheck,
    Backups: DatabaseBackup,
    "Gerenciar Acessos": UserCog,
    "Dados da Empresa": Building2,
  };

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

  function copiarInformacao(texto, tipo) {
    navigator.clipboard.writeText(texto || "");

    setBotaoCopiado(tipo);

    setTimeout(() => setBotaoCopiado(""), 2000);
  }

  async function sair() {
    await signOut(auth);
  }

  async function trocarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      alert("Preencha todos os campos.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      alert("A nova senha e a confirmação não conferem.");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    try {
      const credencial = EmailAuthProvider.credential(usuario.email, senhaAtual);

      await reauthenticateWithCredential(auth.currentUser, credencial);

      await updatePassword(auth.currentUser, novaSenha);

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");

      alert("Senha alterada com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Erro ao trocar senha. Confira a senha atual.");
    }
  }

  function exportarBackup() {
    if (!podeGerenciarBackups) return;

    const agora = new Date();

    const nomeArquivo = `backup-nexora-${agora
      .toISOString()
      .slice(0, 10)}.json`;

    const dados = {
      versao: "3.1",
      exportadoEm: agora.toISOString(),

      entradas,
      saidas,
      contas,
      clientes,
      movimentacoesCaixaBanco,
      estoqueCompras,
      estoquePerdas,
      historicoRelacoes,
      historicoFechamentos,
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = nomeArquivo;

    a.click();

    URL.revokeObjectURL(url);

    alert("Backup exportado.");
  }

  async function importarBackup(event) {
    if (!podeGerenciarBackups) return;

    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const confirmar = confirm(
      "Importar backup irá substituir os dados atuais."
    );

    if (!confirmar) return;

    setImportandoBackup(true);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dados = JSON.parse(e.target.result);

        const novoSistema = {
          entradas: dados.entradas || [],
          saidas: dados.saidas || [],
          contas: dados.contas || [],
          clientes: dados.clientes || [],
          movimentacoesCaixaBanco: dados.movimentacoesCaixaBanco || [],
          estoqueCompras: dados.estoqueCompras || [],
          estoquePerdas: dados.estoquePerdas || [],
          historicoRelacoes: dados.historicoRelacoes || [],
          historicoFechamentos: dados.historicoFechamentos || [],
        };

        await setDoc(docSistema, novoSistema, { merge: true });

        setEntradas(novoSistema.entradas);
        setSaidas(novoSistema.saidas);
        setContas(novoSistema.contas);
        setClientes(novoSistema.clientes);
        setMovimentacoesCaixaBanco(novoSistema.movimentacoesCaixaBanco);
        setEstoqueCompras(novoSistema.estoqueCompras);
        setEstoquePerdas(novoSistema.estoquePerdas);
        setHistoricoRelacoes(novoSistema.historicoRelacoes);
        setHistoricoFechamentos(novoSistema.historicoFechamentos);

        alert("Backup restaurado.");
      } catch {
        alert("Arquivo inválido.");
      } finally {
        setImportandoBackup(false);
      }
    };

    reader.readAsText(arquivo);
  }

  async function limparSistema() {
    if (!podeLimparSistema) return;

    if (!confirmandoLimpeza) {
      setConfirmandoLimpeza(true);

      setTimeout(() => setConfirmandoLimpeza(false), 5000);

      return;
    }

    const confirmar = prompt('Digite "CONFIRMAR"');

    if (confirmar !== "CONFIRMAR") {
      alert("Limpeza cancelada.");
      setConfirmandoLimpeza(false);
      return;
    }

    const sistemaVazio = {
      entradas: [],
      saidas: [],
      contas: [],
      clientes: [],
      movimentacoesCaixaBanco: [],
      estoqueCompras: [],
      estoquePerdas: [],
      historicoRelacoes: [],
      historicoFechamentos: [],
    };

    await setDoc(docSistema, sistemaVazio, { merge: true });

    setEntradas([]);
    setSaidas([]);
    setContas([]);
    setClientes([]);
    setMovimentacoesCaixaBanco([]);
    setEstoqueCompras([]);
    setEstoquePerdas([]);
    setHistoricoRelacoes([]);
    setHistoricoFechamentos([]);

    alert("Sistema limpo.");

    setConfirmandoLimpeza(false);
  }

  return (
    <aside
      style={{
        ...styles.sidebar,
        position: mobile ? "fixed" : "relative",
        left: mobile && !menuMobile ? "-100%" : 0,
        top: 0,
        height: "100vh",
        zIndex: 9999,
        transition: "all 0.28s ease",
        boxShadow: mobile ? "0 0 40px rgba(0,0,0,0.55)" : "none",
      }}
    >
      <div
        style={{
          ...styles.logoBox,
          cursor: "pointer",
          flexDirection: mobile ? "column" : styles.logoBox.flexDirection,
          alignItems: "center",
          justifyContent: "center",
          gap: mobile ? 8 : styles.logoBox.gap,
          paddingTop: mobile ? 82 : styles.logoBox.paddingTop,
          paddingLeft: mobile ? 0 : styles.logoBox.paddingLeft,
          textAlign: "center",
        }}
        onClick={() => setMostrarPerfil(!mostrarPerfil)}
      >
        <img
          src={dadosEmpresa?.logo || "/logo-nexora.png"}
          alt={dadosEmpresa?.nome || "Logo da Empresa"}
          style={{
            ...styles.logoImagem,
            width: mobile ? 76 : styles.logoImagem.width,
            height: mobile ? 76 : styles.logoImagem.height,
            objectFit: "contain",
          }}
        />

        <div>
          <h2 style={styles.logo}>{dadosEmpresa?.nome || "Nexora"}</h2>

          <p style={styles.logoSubtitulo}>{nivel.toUpperCase()}</p>
        </div>
      </div>

      {mostrarPerfil && (
        <div
          style={{
            background: "#020617",
            border: "1px solid #334155",
            borderRadius: 16,
            padding: 12,
            marginBottom: 14,
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <strong>Conta logada</strong>

          <div style={{ fontSize: 13, color: "#cbd5e1" }}>
            {usuario?.email}
          </div>

          <div style={{ fontSize: 13, color: "#94a3b8" }}>
            Nível: {nivel.toUpperCase()}
          </div>

          <input
            type="password"
            placeholder="Senha atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#fff",
            }}
          />

          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#fff",
            }}
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarNovaSenha}
            onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#fff",
            }}
          />

          <button style={botaoFerramenta} onClick={trocarSenha}>
            Trocar senha
          </button>

          {acesso?.nivel === "superadmin" && (
            <button style={botaoFerramenta} onClick={trocarEmpresaSuperadmin}>
              Trocar empresa
            </button>
          )}
        </div>
      )}

      <div style={styles.menuLista}>
        {menus.map((item) => {
          const Icone = iconesMenu[item];

          return (
            <button
              key={item}
              onClick={() => {
                setAba(item);
                setTextoImportacao("");
                setResultadoImportacao("");

                if (mobile) {
                  setMenuMobile(false);
                }
              }}
              style={aba === item ? styles.menuAtivo : styles.menu}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {Icone ? <Icone size={19} strokeWidth={2.2} /> : null}

                <span>{item}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div style={styles.menuRodape}>
        <button
          style={
            botaoCopiado === "pix"
              ? styles.botaoCopiadoMenu
              : styles.botaoCopiarMenu
          }
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
                  style={botaoFerramenta}
                  onClick={() => copiarInformacao(dadosEmpresaTexto, "dados")}
                >
                  Copiar dados
                </button>
              </>
            )}

            {podeGerenciarBackups && (
              <>
                <button style={botaoFerramenta} onClick={exportarBackup}>
                  Exportar backup
                </button>

                <label
                  style={{
                    ...botaoFerramenta,
                    opacity: importandoBackup ? 0.6 : 1,
                  }}
                >
                  {importandoBackup ? "Importando..." : "Importar backup"}

                  <input
                    type="file"
                    accept=".json"
                    onChange={importarBackup}
                    style={{ display: "none" }}
                  />
                </label>
              </>
            )}

            {podeLimparSistema && (
              <button
                style={{
                  ...botaoFerramenta,
                  background: confirmandoLimpeza ? "#b91c1c" : "#ef4444",
                }}
                onClick={limparSistema}
              >
                {confirmandoLimpeza ? "Clique novamente" : "Limpar sistema"}
              </button>
            )}
          </div>
        )}

        <button
          style={{
            ...styles.menuSecundario,
            background: "#dc2626",
          }}
          onClick={sair}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}