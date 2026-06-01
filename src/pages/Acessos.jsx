import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../services/firebase.js";
import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

const PRAZO_GOVERNANCA_MS = 72 * 60 * 60 * 1000;

export default function Acessos({
  usuariosOnline = [],
  empresaId,
  usuario,
  nivelAcesso = "socio",
  ehSuperadmin = false,
  ehAdmin = false,
}) {
  const [acessos, setAcessos] = useState([]);
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState("socio");
  const [status, setStatus] = useState("aprovado");
  const [editandoEmail, setEditandoEmail] = useState("");

  const podeGerenciar = ehSuperadmin || ehAdmin;
  const usuarioEmail = usuario?.email || "Usuário não identificado";

  useEffect(() => {
    const cancelar = onSnapshot(collection(db, "acessos"), (snapshot) => {
      const lista = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .sort((a, b) =>
          String(a.email || a.id).localeCompare(String(b.email || b.id))
        );

      setAcessos(lista);
    });

    return () => cancelar();
  }, []);

  const acessosFiltrados = useMemo(() => {
    if (ehSuperadmin) return acessos;

    return acessos.filter(
      (item) =>
        String(item.empresaId || "") === String(empresaId || "") ||
        !item.empresaId
    );
  }, [acessos, empresaId, ehSuperadmin]);

  const acessosComSessao = useMemo(() => {
    return acessosFiltrados.map((item) => {
      const emailItem = String(item.email || item.id || "").toLowerCase();

      const sessao = usuariosOnline.find(
        (usuarioOnline) =>
          String(usuarioOnline.email || usuarioOnline.id || "").toLowerCase() ===
          emailItem
      );

      return {
        ...item,
        online: sessao?.online || false,
        ultimoLogin: sessao?.ultimoLogin || "",
        ultimoLogout: sessao?.ultimoLogout || "",
      };
    });
  }, [acessosFiltrados, usuariosOnline]);

  function dataBR(dataISO) {
    if (!dataISO) return "-";

    try {
      return new Date(dataISO).toLocaleString("pt-BR");
    } catch {
      return dataISO;
    }
  }

  function criarExecucaoGovernanca() {
    const agora = new Date();
    const executarEm = new Date(agora.getTime() + PRAZO_GOVERNANCA_MS);

    return {
      solicitadoPor: usuarioEmail,
      solicitadoEm: agora.toISOString(),
      executarEm: executarEm.toISOString(),
      status: "pendente",
    };
  }

  function pendenciaVencida(pendencia) {
    if (!pendencia?.executarEm) return false;
    return new Date() >= new Date(pendencia.executarEm);
  }

  async function registrarAuditoria({ tipo, descricao, risco = "MÉDIO" }) {
    await setDoc(
      doc(collection(db, "empresas", empresaId, "historicoAlteracoes")),
      {
        tipo,
        modulo: "Acessos",
        descricao,
        usuario: usuarioEmail,
        nivelUsuario: nivelAcesso,
        dataHora: new Date().toISOString(),
        risco,
      }
    );
  }

  function nivelDoItem(item) {
    return String(item?.nivel || "socio").toLowerCase();
  }

  function ehItemSuperadmin(item) {
    return nivelDoItem(item) === "superadmin";
  }

  function ehItemAdmin(item) {
    return nivelDoItem(item) === "admin";
  }

  function podeEditarItem(item) {
    if (!podeGerenciar) return false;
    if (ehItemSuperadmin(item)) return false;
    return true;
  }

  function podeBloquearImediato(item) {
    if (!podeGerenciar) return false;
    if (ehItemSuperadmin(item)) return false;

    if (ehItemAdmin(item)) {
      return ehSuperadmin;
    }

    return true;
  }

  function podeExcluirImediato(item) {
    if (!podeGerenciar) return false;
    if (ehItemSuperadmin(item)) return false;

    if (ehItemAdmin(item)) {
      return ehSuperadmin;
    }

    return true;
  }

  function podeSolicitarGovernancaAdmin(item) {
    if (!ehAdmin) return false;
    if (ehSuperadmin) return false;
    if (!ehItemAdmin(item)) return false;
    if (ehItemSuperadmin(item)) return false;

    return true;
  }

  function limparFormulario() {
    setEmail("");
    setNivel("socio");
    setStatus("aprovado");
    setEditandoEmail("");
  }

  async function salvarAcesso() {
    if (!podeGerenciar) return;

    const emailLimpo = String(email || "").trim().toLowerCase();

    if (!emailLimpo) {
      alert("Digite um e-mail.");
      return;
    }

    if (nivel === "superadmin") {
      alert("Superadmin só pode ser criado diretamente pelo Firebase.");
      return;
    }

    const acessoExistente = acessos.find(
      (item) => String(item.email || item.id).toLowerCase() === emailLimpo
    );

    if (acessoExistente && ehItemSuperadmin(acessoExistente)) {
      alert("Superadmin não pode ser editado por esta tela.");
      return;
    }

    const dadosAcesso = {
      email: emailLimpo,
      empresaId,
      nivel,
      status,
      bloqueado: acessoExistente?.bloqueado || false,
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, "acessos", emailLimpo), dadosAcesso, { merge: true });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailLimpo),
      dadosAcesso,
      { merge: true }
    );

    if (acessoExistente) {
      const alteracoes = [];

      if (acessoExistente.nivel !== nivel) {
        alteracoes.push(`Nível: ${acessoExistente.nivel} → ${nivel}`);
      }

      if (acessoExistente.status !== status) {
        alteracoes.push(`Status: ${acessoExistente.status} → ${status}`);
      }

      await registrarAuditoria({
        tipo: "EDIÇÃO",
        descricao:
          alteracoes.length > 0
            ? `Acesso editado: ${emailLimpo} | ${alteracoes.join(" | ")}`
            : `Acesso editado: ${emailLimpo} | sem alteração de nível/status`,
        risco: "MÉDIO",
      });
    } else {
      await registrarAuditoria({
        tipo: "CRIAÇÃO",
        descricao: `Novo acesso criado: ${emailLimpo} | nível: ${nivel} | status: ${status}`,
        risco: "MÉDIO",
      });
    }

    limparFormulario();
  }

  async function bloquearAcesso(item) {
    const emailItem = item.email || item.id;

    if (ehItemSuperadmin(item)) {
      alert("Superadmin não pode ser bloqueado pela tela.");
      return;
    }

    if (ehItemAdmin(item) && !ehSuperadmin) {
      await solicitarBloqueioAdmin(item);
      return;
    }

    if (!podeBloquearImediato(item)) return;

    await registrarAuditoria({
      tipo: "SEGURANÇA",
      descricao: `Usuário bloqueado: ${emailItem}`,
      risco: "ALTO",
    });

    const dadosAtualizados = {
      ...item,
      bloqueado: true,
      bloqueadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, "acessos", emailItem), dadosAtualizados, {
      merge: true,
    });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailItem),
      dadosAtualizados,
      { merge: true }
    );
  }

  async function desbloquearAcesso(item) {
    const emailItem = item.email || item.id;

    if (!podeGerenciar) return;

    await registrarAuditoria({
      tipo: "SEGURANÇA",
      descricao: `Usuário desbloqueado: ${emailItem}`,
      risco: "MÉDIO",
    });

    const dadosAtualizados = {
      ...item,
      bloqueado: false,
      desbloqueadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, "acessos", emailItem), dadosAtualizados, {
      merge: true,
    });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailItem),
      dadosAtualizados,
      { merge: true }
    );
  }

  async function solicitarBloqueioAdmin(item) {
    const emailItem = item.email || item.id;

    const pendencia = criarExecucaoGovernanca();

    const dadosAtualizados = {
      ...item,
      solicitacaoBloqueioAdmin: pendencia,
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, "acessos", emailItem), dadosAtualizados, {
      merge: true,
    });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailItem),
      dadosAtualizados,
      { merge: true }
    );

    await registrarAuditoria({
      tipo: "GOVERNANÇA",
      descricao: `Solicitação de bloqueio de Admin: ${emailItem}. Execução liberada em ${dataBR(
        pendencia.executarEm
      )}.`,
      risco: "ALTO",
    });

    alert("Solicitação de bloqueio criada. Prazo de 72 horas iniciado.");
  }

  async function solicitarExclusaoAdmin(item) {
    const emailItem = item.email || item.id;

    const pendencia = criarExecucaoGovernanca();

    const dadosAtualizados = {
      ...item,
      solicitacaoExclusaoAdmin: pendencia,
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, "acessos", emailItem), dadosAtualizados, {
      merge: true,
    });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailItem),
      dadosAtualizados,
      { merge: true }
    );

    await registrarAuditoria({
      tipo: "GOVERNANÇA",
      descricao: `Solicitação de exclusão de Admin: ${emailItem}. Execução liberada em ${dataBR(
        pendencia.executarEm
      )}.`,
      risco: "ALTO",
    });

    alert("Solicitação de exclusão criada. Prazo de 72 horas iniciado.");
  }

  async function cancelarPendenciaAdmin(item, tipoPendencia) {
    const emailItem = item.email || item.id;

    const dadosAtualizados = {
      ...item,
      atualizadoEm: new Date().toISOString(),
    };

    if (tipoPendencia === "bloqueio") {
      dadosAtualizados.solicitacaoBloqueioAdmin = null;
    }

    if (tipoPendencia === "exclusao") {
      dadosAtualizados.solicitacaoExclusaoAdmin = null;
    }

    await setDoc(doc(db, "acessos", emailItem), dadosAtualizados, {
      merge: true,
    });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailItem),
      dadosAtualizados,
      { merge: true }
    );

    await registrarAuditoria({
      tipo: "GOVERNANÇA",
      descricao: `Pendência de ${tipoPendencia} de Admin cancelada: ${emailItem}`,
      risco: "MÉDIO",
    });

    alert("Pendência cancelada.");
  }

  async function executarBloqueioAdmin(item) {
    const emailItem = item.email || item.id;

    if (!pendenciaVencida(item.solicitacaoBloqueioAdmin)) {
      alert("Ainda não completou o prazo de 72 horas.");
      return;
    }

    const dadosAtualizados = {
      ...item,
      bloqueado: true,
      bloqueadoEm: new Date().toISOString(),
      solicitacaoBloqueioAdmin: null,
      atualizadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, "acessos", emailItem), dadosAtualizados, {
      merge: true,
    });

    await setDoc(
      doc(db, "empresas", empresaId, "acessos", emailItem),
      dadosAtualizados,
      { merge: true }
    );

    await registrarAuditoria({
      tipo: "GOVERNANÇA",
      descricao: `Bloqueio de Admin executado após 72h: ${emailItem}`,
      risco: "ALTO",
    });

    alert("Bloqueio executado.");
  }

  async function executarExclusaoAdmin(item) {
    const emailItem = item.email || item.id;

    if (!pendenciaVencida(item.solicitacaoExclusaoAdmin)) {
      alert("Ainda não completou o prazo de 72 horas.");
      return;
    }

    await registrarAuditoria({
      tipo: "GOVERNANÇA",
      descricao: `Exclusão de Admin executada após 72h: ${emailItem}`,
      risco: "ALTO",
    });

    await deleteDoc(doc(db, "empresas", empresaId, "acessos", emailItem));
    await deleteDoc(doc(db, "acessos", emailItem));

    alert("Admin excluído.");
  }

  function editarAcesso(item) {
    if (!podeEditarItem(item)) {
      alert("Este acesso não pode ser editado por esta tela.");
      return;
    }

    setEditandoEmail(item.email || item.id);
    setEmail(item.email || item.id);
    setNivel(item.nivel || "socio");
    setStatus(item.status || "pendente");
  }

  async function excluirAcesso(item) {
    const emailExcluir = item.email || item.id;

    if (ehItemSuperadmin(item)) {
      alert("Superadmin não pode ser removido pela tela.");
      return;
    }

    if (ehItemAdmin(item) && !ehSuperadmin) {
      await solicitarExclusaoAdmin(item);
      return;
    }

    if (!podeExcluirImediato(item)) return;

    const confirmar = confirm("Deseja remover este acesso?");

    if (!confirmar) return;

    await registrarAuditoria({
      tipo: "EXCLUSÃO",
      descricao: `Acesso removido: ${emailExcluir} | nível: ${
        item.nivel || "socio"
      } | status: ${item.status || "pendente"}`,
      risco: "ALTO",
    });

    await deleteDoc(doc(db, "empresas", empresaId, "acessos", emailExcluir));
    await deleteDoc(doc(db, "acessos", emailExcluir));
  }

  if (!podeGerenciar) {
    return (
      <Card titulo="Acesso restrito">
        <p style={{ color: "#94a3b8" }}>
          Esta tela é exclusiva para Administradores e Superadmins.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Gerenciar Acessos</h1>

          <p style={styles.subtitulo}>
            Aprove usuários, bloqueie acessos, veja sessões e defina permissões.
          </p>
        </div>
      </div>

      <Card titulo={editandoEmail ? "Editando acesso" : "Novo acesso"}>
        <div style={styles.formGrid}>
          <Campo label="E-mail" valor={email} mudar={(v) => setEmail(v)} />

          <Select
            label="Nível"
            valor={nivel}
            mudar={(v) => setNivel(v)}
            opcoes={["admin", "lojista", "socio"]}
          />

          <Select
            label="Status"
            valor={status}
            mudar={(v) => setStatus(v)}
            opcoes={["aprovado", "pendente"]}
          />

          <button style={styles.botao} onClick={salvarAcesso}>
            {editandoEmail ? "Salvar edição" : "Adicionar acesso"}
          </button>

          {editandoEmail && (
            <button style={styles.botaoCinza} onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </Card>

      <Card titulo="Acessos cadastrados">
        <Tabela
          colunas={["Usuário", "Nível", "Status", "Governança", "Bloqueio", "Ações"]}
          dados={acessosComSessao.map((item) => [
            <>
              <div style={{ fontWeight: 700 }}>{item.email || item.id}</div>

              <div
                style={{
                  marginTop: 6,
                  color: item.online ? "#22c55e" : "#ef4444",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {item.online ? "🟢 Online" : "🔴 Offline"}
              </div>

              <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 11 }}>
                Último login: {item.ultimoLogin || "-"}
              </div>

              <div style={{ marginTop: 2, color: "#94a3b8", fontSize: 11 }}>
                Último logout: {item.ultimoLogout || "-"}
              </div>
            </>,

            ehItemSuperadmin(item) ? "superadmin" : item.nivel || "socio",

            item.bloqueado ? "Bloqueado" : item.status || "pendente",

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {item.solicitacaoBloqueioAdmin && (
                <div style={{ color: "#f97316", fontSize: 12, fontWeight: 700 }}>
                  Bloqueio pendente até{" "}
                  {dataBR(item.solicitacaoBloqueioAdmin.executarEm)}
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button
                      style={styles.botaoCinza}
                      onClick={() => cancelarPendenciaAdmin(item, "bloqueio")}
                    >
                      Cancelar
                    </button>

                    {pendenciaVencida(item.solicitacaoBloqueioAdmin) && (
                      <button
                        style={styles.excluir}
                        onClick={() => executarBloqueioAdmin(item)}
                      >
                        Executar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {item.solicitacaoExclusaoAdmin && (
                <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                  Exclusão pendente até{" "}
                  {dataBR(item.solicitacaoExclusaoAdmin.executarEm)}
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button
                      style={styles.botaoCinza}
                      onClick={() => cancelarPendenciaAdmin(item, "exclusao")}
                    >
                      Cancelar
                    </button>

                    {pendenciaVencida(item.solicitacaoExclusaoAdmin) && (
                      <button
                        style={styles.excluir}
                        onClick={() => executarExclusaoAdmin(item)}
                      >
                        Executar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!item.solicitacaoBloqueioAdmin &&
                !item.solicitacaoExclusaoAdmin && <span>-</span>}
            </div>,

            ehItemSuperadmin(item) ? (
              <div
                style={{
                  color: "#22c55e",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                SUPERADMIN
              </div>
            ) : item.bloqueado ? (
              <button style={styles.botao} onClick={() => desbloquearAcesso(item)}>
                Desbloquear
              </button>
            ) : (
              <button style={styles.botaoCinza} onClick={() => bloquearAcesso(item)}>
                {ehItemAdmin(item) && !ehSuperadmin
                  ? "Solicitar bloqueio"
                  : "Bloquear"}
              </button>
            ),

            <Acoes
              editar={() => editarAcesso(item)}
              excluir={() => excluirAcesso(item)}
            />,
          ])}
        />
      </Card>
    </>
  );
}