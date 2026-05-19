import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db } from "../services/firebase.js";
import styles from "../styles/styles.js";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Acoes from "../components/Acoes.jsx";

export default function Acessos({ moeda }) {
  const [acessos, setAcessos] = useState([]);
  const [email, setEmail] = useState("");
  const [nivel, setNivel] = useState("socio");
  const [editandoEmail, setEditandoEmail] = useState("");

  const docAcessos = doc(db, "sistema", "acessos");

  useEffect(() => {
    const cancelar = onSnapshot(docAcessos, async (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data();

        setAcessos(Array.isArray(dados.usuarios) ? dados.usuarios : []);
      } else {
        await setDoc(docAcessos, {
          usuarios: [
            {
              email: "matymidy.mmm@gmail.com",
              nivel: "admin",
            },
            {
              email: "emplacarmcr@gmail.com",
              nivel: "lojista",
            },
          ],
        });
      }
    });

    return () => cancelar();
  }, []);

  function limparFormulario() {
    setEmail("");
    setNivel("socio");
    setEditandoEmail("");
  }

  async function salvarAcesso() {
    const emailLimpo = String(email || "").trim().toLowerCase();

    if (!emailLimpo) {
      alert("Digite um e-mail.");
      return;
    }

    const novoAcesso = {
      email: emailLimpo,
      nivel,
    };

    let novaLista = [];

    if (editandoEmail) {
      novaLista = acessos.map((item) =>
        item.email === editandoEmail ? novoAcesso : item
      );
    } else {
      const jaExiste = acessos.some((item) => item.email === emailLimpo);

      if (jaExiste) {
        alert("Esse e-mail já está cadastrado.");
        return;
      }

      novaLista = [novoAcesso, ...acessos];
    }

    await setDoc(docAcessos, {
      usuarios: novaLista,
    });

    limparFormulario();
  }

  function editarAcesso(item) {
    setEditandoEmail(item.email);
    setEmail(item.email);
    setNivel(item.nivel);
  }

  async function excluirAcesso(emailExcluir) {
    if (emailExcluir === "matymidy.mmm@gmail.com") {
      alert("O administrador principal não pode ser removido.");
      return;
    }

    const confirmar = confirm("Deseja remover este acesso?");

    if (!confirmar) return;

    const novaLista = acessos.filter((item) => item.email !== emailExcluir);

    await setDoc(docAcessos, {
      usuarios: novaLista,
    });
  }

  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Gerenciar Acessos</h1>

          <p style={styles.subtitulo}>
            Controle quem pode acessar e o nível de permissão.
          </p>
        </div>
      </div>

      <Card titulo={editandoEmail ? "Editando acesso" : "Novo acesso"}>
        <div style={styles.formGrid}>
          <Campo
            label="E-mail"
            valor={email}
            mudar={(v) => setEmail(v)}
          />

          <Select
            label="Nível"
            valor={nivel}
            mudar={(v) => setNivel(v)}
            opcoes={["admin", "lojista", "socio"]}
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
          colunas={["E-mail", "Nível", "Ações"]}
          dados={acessos.map((item) => [
            item.email,
            item.nivel,
            <Acoes
              editar={() => editarAcesso(item)}
              excluir={() => excluirAcesso(item.email)}
            />,
          ])}
        />
      </Card>
    </>
  );
}