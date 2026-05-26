import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { login } from "../services/auth";
import { auth, db } from "../services/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [modoConvite, setModoConvite] = useState(false);
const [codigoConvite, setCodigoConvite] = useState("");
  const [carregando, setCarregando] = useState(false);

  function gerarEmpresaId(nome) {
    return String(nome || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function entrar(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      await login(email, senha);
      window.location.href = "/";
    } catch (erro) {
      alert("Erro ao entrar. Verifique e-mail e senha.");
      console.error(erro);
    } finally {
      setCarregando(false);
    }
  }
async function solicitarAcesso(e) {
  e.preventDefault();

  setCarregando(true);

  try {
    const emailNormalizado = email
      .toLowerCase()
      .trim();

    const codigo = codigoConvite
      .trim()
      .toUpperCase();

    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha
      );

    const empresaId = codigo
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/[0-9]+$/, "");

    const dadosAcesso = {
      email: emailNormalizado,
      uid: credencial.user.uid,
      empresaId,
      nivel: "socio",
      status: "pendente",
      bloqueado: false,
      criadoEm: new Date().toISOString(),
      aprovadoEm: "",
      aprovadoPor: "",
      codigoConvite: codigo,
    };

    await setDoc(
      doc(db, "acessos", emailNormalizado),
      dadosAcesso
    );

    await setDoc(
      doc(
        db,
        "empresas",
        empresaId,
        "acessos",
        emailNormalizado
      ),
      dadosAcesso
    );

    await signOut(auth);

    alert(
      "Solicitação enviada. Aguarde aprovação."
    );

    setModoConvite(false);

    setEmail("");
    setSenha("");
    setCodigoConvite("");
  } catch (erro) {
    console.error(erro);

    alert(
      "Erro ao solicitar acesso."
    );
  } finally {
    setCarregando(false);
  }
}
  async function criarConta(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      const emailNormalizado = email.toLowerCase().trim();
      const empresaId = gerarEmpresaId(nomeEmpresa);
      const codigoConvite =
  empresaId.toUpperCase() +
  Math.floor(Math.random() * 999);

      if (!empresaId) {
        alert("Digite o nome da empresa.");
        setCarregando(false);
        return;
      }

      const credencial = await createUserWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha
      );

      const dadosAcesso = {
        email: emailNormalizado,
        uid: credencial.user.uid,
        empresaId,
        nivel: "admin",
        status: "aprovado",
        bloqueado: false,
        criadoEm: new Date().toISOString(),
        aprovadoEm: new Date().toISOString(),
        aprovadoPor: "cadastro-automatico",
      };

      await setDoc(doc(db, "acessos", emailNormalizado), dadosAcesso);

      await setDoc(
        doc(db, "empresas", empresaId, "acessos", emailNormalizado),
        dadosAcesso
      );

      await setDoc(
        doc(db, "empresas", empresaId, "sistema", "dados"),
        {
          entradas: [],
          saidas: [],
          contas: [],
          clientes: [],
          estoqueCompras: [],
          estoquePerdas: [],
          historicoRelacoes: [],
          historicoFechamentos: [],
          metaMensal: 80000,
          inicioPeriodoSalvo: "",

          logo: "",
          nome: nomeEmpresa.trim(),
          codigoConvite,
          ie: "",
          cnpj: "",
          email: emailNormalizado,
          whatsapp: "",
          cep: "",
          logradouro: "",
          numero: "",
          bairro: "",
          cidade: "",
          pix: "",
        },
        { merge: true }
      );

      await signOut(auth);

      alert("Empresa criada com sucesso. Agora faça login.");

      setModoCadastro(false);
      setEmail("");
      setSenha("");
      setNomeEmpresa("");
    } catch (erro) {
      alert("Erro ao criar empresa. Verifique os dados ou tente outro e-mail.");
      console.error(erro);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={
  modoCadastro
    ? criarConta
    : modoConvite
    ? solicitarAcesso
    : entrar
}
        style={{
          background: "#101935",
          padding: 30,
          borderRadius: 20,
          width: 360,
          display: "flex",
          flexDirection: "column",
          gap: 15,
          border: "1px solid #243056",
        }}
      >
        <h1 style={{ color: "#fff", margin: 0 }}>
          {modoCadastro ? "Criar empresa" : "Login"}
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: 14,
            margin: 0,
          }}
        >
          {modoCadastro
            ? "Crie uma nova empresa com banco de dados separado."
            : "Entre com seu e-mail e senha."}
        </p>

        {modoCadastro && (
          <input
            type="text"
            placeholder="Nome da empresa"
            value={nomeEmpresa}
            required
            onChange={(e) => setNomeEmpresa(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #243056",
              background: "#0b1220",
              color: "#fff",
            }}
          />
        )}
        {modoConvite && (
  <input
    type="text"
    placeholder="Código convite"
    value={codigoConvite}
    required
    onChange={(e) =>
      setCodigoConvite(e.target.value)
    }
    style={{
      padding: 12,
      borderRadius: 10,
      border: "1px solid #243056",
      background: "#0b1220",
      color: "#fff",
    }}
  />
)}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #243056",
            background: "#0b1220",
            color: "#fff",
          }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          required
          minLength={6}
          onChange={(e) => setSenha(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #243056",
            background: "#0b1220",
            color: "#fff",
          }}
        />

        <button
          type="submit"
          disabled={carregando}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: carregando ? "#475569" : "#5b5cff",
            color: "#fff",
            fontWeight: "bold",
            cursor: carregando ? "not-allowed" : "pointer",
          }}
        >
          {carregando
            ? "Aguarde..."
            : modoCadastro
            ? "Criar empresa"
            : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => setModoCadastro(!modoCadastro)}
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "transparent",
            color: "#cbd5e1",
            cursor: "pointer",
          }}
        >
          {modoCadastro
  ? "Já tenho conta"
  : modoConvite
  ? "Já tenho conta"
  : "Criar nova empresa"}
        </button>
        <button
  type="button"
  onClick={() => {
    setModoCadastro(false);
    setModoConvite(!modoConvite);
  }}
  style={{
    padding: 10,
    borderRadius: 10,
    border: "1px solid #334155",
    background: "transparent",
    color: "#cbd5e1",
    cursor: "pointer",
  }}
>
  {modoConvite
    ? "Cancelar convite"
    : "Entrar em empresa existente"}
</button>
      </form>
    </div>
  );
}