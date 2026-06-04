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
  dadosEmpresa = {},
  setDadosEmpresa = () => {},
  nivelAcesso = "socio",
  ehSuperadmin = false,
  ehAdmin = false,
}) {
  const [acessos, setAcessos] = useState([]);
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState("socio");
  const [status, setStatus] = useState("aprovado");
  const [editandoEmail, setEditandoEmail] = useState("");
  const [copiandoConvite, setCopiandoConvite] = useState(false);
  const [gerandoConvite, setGerandoConvite] = useState(false);

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

  function gerarCodigoConviteNovo() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let codigo = "NXR-";

    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }

    return codigo;
  }

  async function salvarCodigoConvite(codigo) {
    await setDoc(
      doc(db, "empresas", empresaId),
      {
        empresaId,
        nome: dadosEmpresa?.nome || "",
        codigoConvite: codigo,
        atualizadoEm: new Date().toISOString(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, "empresas", empresaId, "sistema", "dados"),
      {
        codigoConvite: codigo,
      },
      { merge: true }
    );

    setDadosEmpresa((old) => ({
      ...old,
      codigoConvite: codigo,
    }));
  }

  async function gerarConvite() {
    if (!podeGerenciar) return;

    try {
      setGerandoConvite(true);

      const novoCodigo = gerarCodigoConviteNovo();

      await salvarCodigoConvite(novoCodigo);

      await navigator.clipboard.writeText(novoCodigo);

      await registrarAuditoria({
        tipo: "CONVITE",
        descricao: `Novo código convite gerado e copiado: ${novoCodigo}`,
        risco: "MÉDIO",
      });

      alert(`Convite gerado e copiado: ${novoCodigo}`);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao gerar convite.");
    } finally {
      setGerandoConvite(false);
    }
  }

  async function copiarConvite() {
    if (!dadosEmpresa?.codigoConvite) {
      alert("Nenhum convite gerado.");
      return;
    }

    await navigator.clipboard.writeText(dadosEmpresa.codigoConvite);

    setCopiandoConvite(true);

    setTimeout(() => {
      setCopiandoConvite(false);
    }, 1800);
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
    if (ehItemAdmin(item)) return ehSuperadmin;
    return true;
  }

  function podeExcluirImediato(item) {
    if (!podeGerenciar) return false;
    if (ehItemSuperadmin(item)) return false;
    if (ehItemAdmin(item)) return ehSuperadmin;
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

    await registrarAuditoria({
      tipo: acessoExistente ? "EDIÇÃO" : "CRIAÇÃO",
      descricao: acessoExistente
        ? `Acesso editado: ${emailLimpo} | nível: ${nivel} | status: ${status}`
        : `Novo acesso criado: ${emailLimpo} | nível: ${nivel} | status: ${status}`,
      risco: "MÉDIO",
    });

    limparFormulario();
  }

  async function bloquearAcesso(item) {
    const emailItem = item.email || item.id;

    if (ehItemSuperadmin(item)) {
      alert("Superadmin não pode ser bloqueado pela tela.");
      return;
    }

    if (!podeBloquearImediato(item)) return;

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

    await registrarAuditoria({
      tipo: "SEGURANÇA",
      descricao: `Usuário bloqueado: ${emailItem}`,
      risco: "ALTO",
    });
  }

  async function desbloquearAcesso(item) {
    const emailItem = item.email || item.id;

    if (!podeGerenciar) return;

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

    await registrarAuditoria({
      tipo: "SEGURANÇA",
      descricao: `Usuário desbloqueado: ${emailItem}`,
      risco: "MÉDIO",
    });
  }

  async function excluirAcesso(item) {
    const emailExcluir = item.email || item.id;

    if (ehItemSuperadmin(item)) {
      alert("Superadmin não pode ser removido pela tela.");
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

      <Card titulo="Convite da empresa">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              Envie este código para sócios ou lojistas solicitarem acesso à
              empresa correta.
            </div>

            <div
              style={{
                background: "#050816",
                padding: "14px 18px",
                borderRadius: 12,
                color: "#fff",
                fontWeight: "bold",
                letterSpacing: 1.5,
                border: "1px solid #243056",
                width: "fit-content",
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              {dadosEmpresa?.codigoConvite || "SEM CONVITE"}
            </div>
          </div>

          <button
            style={styles.botao}
            onClick={copiarConvite}
            disabled={!dadosEmpresa?.codigoConvite}
          >
            {copiandoConvite ? "Copiado" : "Copiar"}
          </button>

          <button
            style={styles.botaoCinza || styles.botao}
            onClick={gerarConvite}
            disabled={gerandoConvite}
          >
            {gerandoConvite ? "Gerando..." : "Gerar novo"}
          </button>
        </div>
      </Card>

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
          colunas={[
            "Usuário",
            "Nível",
            "Status",
            "Governança",
            "Bloqueio",
            "Ações",
          ]}
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

            <span>-</span>,

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
              <button
                style={styles.botao}
                onClick={() => desbloquearAcesso(item)}
              >
                Desbloquear
              </button>
            ) : (
              <button
                style={styles.botaoCinza}
                onClick={() => bloquearAcesso(item)}
              >
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