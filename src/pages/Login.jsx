import { useState } from "react";
import { login } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function entrar(e) {
    e.preventDefault();

    try {
      await login(email, senha);
      alert("Login realizado!");
      window.location.href = "/";
    } catch (erro) {
      alert("Erro ao entrar");
      console.error(erro);
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
        onSubmit={entrar}
        style={{
          background: "#101935",
          padding: 30,
          borderRadius: 20,
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 15,
          border: "1px solid #243056",
        }}
      >
        <h1 style={{ color: "#fff" }}>Login</h1>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
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
          style={{
            padding: 12,
            borderRadius: 10,
            border: "none",
            background: "#5b5cff",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}