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
  const [modoCadastro, setModoCadastro] = useState(false);
  const [carregando, setCarregando] = useState(false);

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

  async function criarConta(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      const emailNormalizado = email.toLowerCase().trim();

      const credencial = await createUserWithEmailAndPassword(
        auth,
        emailNormalizado,
        senha
      );

      await setDoc(doc(db, "acessos", emailNormalizado), {
        email: emailNormalizado,
        uid: credencial.user.uid,
        nivel: "socio",
        status: "pendente",
        criadoEm: new Date().toISOString(),
        aprovadoEm: "",
        aprovadoPor: "",
      });

      await signOut(auth);

      alert(
        "Conta criada com sucesso. Aguarde o administrador aprovar seu acesso."
      );

      setModoCadastro(false);
      setEmail("");
      setSenha("");
    } catch (erro) {
      alert("Erro ao criar conta. Verifique os dados ou tente outro e-mail.");
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
        onSubmit={modoCadastro ? criarConta : entrar}
        style={{
          background: "#101935",
          padding: 30,
          borderRadius: 20,
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 15,
          border: "1px solid #243056",
        }}
      >
        <h1 style={{ color: "#fff", margin: 0 }}>
          {modoCadastro ? "Criar conta" : "Login"}
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: 14,
            margin: 0,
          }}
        >
          {modoCadastro
            ? "Crie sua conta e aguarde aprovação do administrador."
            : "Entre com seu e-mail e senha."}
        </p>

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
            ? "Criar conta"
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
            : "Criar nova conta"}
        </button>
      </form>
    </div>
  );
}