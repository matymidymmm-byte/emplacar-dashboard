import { useEffect, useState } from "react";
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

export default function Acessos() {
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
        .sort((a, b) => String(a.email || a.id).localeCompare(String(b.email || b.id)));

      setAcessos(lista);
    });

    return () => cancelar();
  }, []);

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

    await setDoc(
      doc(db, "acessos", emailLimpo),
      {
        email: emailLimpo,
        nivel,
        status,
        atualizadoEm: new Date().toISOString(),
      },
      { merge: true }
    );

    limparFormulario();
  }

  async function aprovarAcesso(item) {
    await setDoc(
      doc(db, "acessos", item.id || item.email),
      {
        ...item,
        status: "aprovado",
        aprovadoEm: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  async function bloquearAcesso(item) {
    await setDoc(
      doc(db, "acessos", item.id || item.email),
      {
        ...item,
        status: "pendente",
        bloqueadoEm: new Date().toISOString(),
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

    await deleteDoc(doc(db, "acessos", emailExcluir));
  }

  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Gerenciar Acessos</h1>

          <p style={styles.subtitulo}>
            Aprove usuários, bloqueie acessos e defina o nível de permissão.
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
          colunas={["E-mail", "Nível", "Status", "Aprovação", "Ações"]}
          dados={acessos.map((item) => [
            item.email || item.id,
            item.nivel || "socio",
            item.status || "pendente",
            item.status === "aprovado" ? (
              <button style={styles.botaoCinza} onClick={() => bloquearAcesso(item)}>
                Bloquear
              </button>
            ) : (
              <button style={styles.botao} onClick={() => aprovarAcesso(item)}>
                Aprovar
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