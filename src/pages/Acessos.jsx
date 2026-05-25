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

export default function Acessos({ usuariosOnline = [] }) {
  const [acessos, setAcessos] = useState([]);
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState("socio");
  const [status, setStatus] = useState("aprovado");
  const [editandoEmail, setEditandoEmail] = useState("");

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

  const acessosComSessao = useMemo(() => {
    return acessos.map((item) => {
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
  }, [acessos, usuariosOnline]);

  async function registrarAuditoria({ tipo, descricao, risco = "MÉDIO" }) {
    await setDoc(
      doc(collection(db, "empresas", "emplacar-mcr", "historicoAlteracoes")),
      {
        tipo,
        modulo: "Acessos",
        descricao,
        usuario: "Administrador",
        dataHora: new Date().toISOString(),
        risco,
      }
    );
  }

  function limparFormulario() {
    setEmail("");
    setNivel("socio");
    setStatus("aprovado");
    setEditandoEmail("");
  }

  async function salvarAcesso() {
    const emailLimpo = String(email || "").trim().toLowerCase();

    if (!emailLimpo) {
      alert("Digite um e-mail.");
      return;
    }

    const acessoExistente = acessos.find(
      (item) => String(item.email || item.id).toLowerCase() === emailLimpo
    );

    await setDoc(
      doc(db, "acessos", emailLimpo),
      {
        email: emailLimpo,
        nivel,
        status,
        bloqueado: acessoExistente?.bloqueado || false,
        atualizadoEm: new Date().toISOString(),
      },
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

    if (emailItem === "matymidy.mmm@gmail.com") {
      alert("O administrador principal não pode ser bloqueado.");
      return;
    }

    await registrarAuditoria({
      tipo: "SEGURANÇA",
      descricao: `Usuário bloqueado: ${emailItem}`,
      risco: "ALTO",
    });

    await setDoc(
      doc(db, "acessos", emailItem),
      {
        ...item,
        bloqueado: true,
        bloqueadoEm: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  async function desbloquearAcesso(item) {
    const emailItem = item.email || item.id;

    await registrarAuditoria({
      tipo: "SEGURANÇA",
      descricao: `Usuário desbloqueado: ${emailItem}`,
      risco: "MÉDIO",
    });

    await setDoc(
      doc(db, "acessos", emailItem),
      {
        ...item,
        bloqueado: false,
        desbloqueadoEm: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  function editarAcesso(item) {
    setEditandoEmail(item.email || item.id);
    setEmail(item.email || item.id);
    setNivel(item.nivel || "socio");
    setStatus(item.status || "pendente");
  }

  async function excluirAcesso(item) {
    const emailExcluir = item.email || item.id;

    if (emailExcluir === "matymidy.mmm@gmail.com") {
      alert("O administrador principal não pode ser removido.");
      return;
    }

    const confirmar = confirm("Deseja remover este acesso?");

    if (!confirmar) return;

    await registrarAuditoria({
      tipo: "EXCLUSÃO",
      descricao: `Acesso removido: ${emailExcluir} | nível: ${
        item.nivel || "socio"
      } | status: ${item.status || "pendente"}`,
      risco: "ALTO",
    });

    await deleteDoc(doc(db, "acessos", emailExcluir));
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

        <Tabela
          colunas={["Usuário", "Nível", "Status", "Bloqueio", "Ações"]}
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

            item.nivel || "socio",

            item.bloqueado ? "Bloqueado" : item.status || "pendente",

            (item.email || item.id) === "matymidy.mmm@gmail.com" ? (
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
                Bloquear
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