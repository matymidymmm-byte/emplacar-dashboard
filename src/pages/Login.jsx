import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { login } from "../services/auth";
import { auth, db } from "../services/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [codigoConvite, setCodigoConvite] = useState("");

  const [modoCadastro, setModoCadastro] = useState(false);
  const [modoConvite, setModoConvite] = useState(false);
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

  function normalizarCodigo(codigo) {
    return String(codigo || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function gerarCodigoConvite() {
  const caracteres =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let codigo = "NXR-";

  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  }

  return codigo;
}

async function buscarEmpresaPorCodigoConvite(codigoDigitado) {
  const codigo = normalizarCodigo(codigoDigitado);

  if (!codigo) return null;

  const consultaRaiz = query(
    collection(db, "empresas"),
    where("codigoConvite", "==", codigo)
  );

  const resultadoRaiz = await getDocs(consultaRaiz);

  if (!resultadoRaiz.empty) {
    const empresaDoc = resultadoRaiz.docs[0];

    return {
      empresaId: empresaDoc.id,
      ...empresaDoc.data(),
    };
  }

  const empresasSnap = await getDocs(collection(db, "empresas"));

  for (const empresaDoc of empresasSnap.docs) {
    const sistemaRef = doc(
      db,
      "empresas",
      empresaDoc.id,
      "sistema",
      "dados"
    );

    const sistemaSnap = await getDoc(sistemaRef);

    if (!sistemaSnap.exists()) continue;

    const dadosSistema = sistemaSnap.data();

    if (normalizarCodigo(dadosSistema.codigoConvite) === codigo) {
      await setDoc(
        doc(db, "empresas", empresaDoc.id),
        {
          empresaId: empresaDoc.id,
          nome: dadosSistema.nome || empresaDoc.data()?.nome || "",
          codigoConvite: codigo,
          atualizadoEm: new Date().toISOString(),
        },
        { merge: true }
      );

      return {
        empresaId: empresaDoc.id,
        nome: dadosSistema.nome || empresaDoc.data()?.nome || "",
        codigoConvite: codigo,
      };
    }
  }

  return null;
}

  async function entrar(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      await login(email, senha);
      window.location.href = "/";
    } catch (erro) {
      console.error(erro);
      alert("Erro ao entrar. Verifique e-mail e senha.");
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarAcesso(e) {
    e.preventDefault();
    setCarregando(true);

    try {
      const emailNormalizado = email.toLowerCase().trim();
      const codigo = normalizarCodigo(codigoConvite);

      const empresaEncontrada =
        await buscarEmpresaPorCodigoConvite(codigo);

      if (!empresaEncontrada?.empresaId) {
        alert(
          "Código convite não encontrado. Confira o código com o administrador."
        );
        setCarregando(false);
        return;
      }

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          emailNormalizado,
          senha
        );

      const dadosAcesso = {
        email: emailNormalizado,
        uid: credencial.user.uid,
        empresaId: empresaEncontrada.empresaId,
        nomeEmpresa: empresaEncontrada.nome || "",
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
          empresaEncontrada.empresaId,
          "acessos",
          emailNormalizado
        ),
        dadosAcesso
      );

      await signOut(auth);

      alert("Solicitação enviada. Aguarde aprovação.");

      setModoConvite(false);
      setEmail("");
      setSenha("");
      setCodigoConvite("");
    } catch (erro) {
      console.error(erro);

      if (erro?.code === "auth/email-already-in-use") {
        alert("Este e-mail já possui conta. Faça login normalmente.");
      } else {
        alert("Erro ao solicitar acesso.");
      }
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

      if (!empresaId) {
        alert("Digite o nome da empresa.");
        setCarregando(false);
        return;
      }

      const codigoConviteGerado =
        gerarCodigoConvite(empresaId);

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          emailNormalizado,
          senha
        );

      const dadosAcesso = {
        email: emailNormalizado,
        uid: credencial.user.uid,
        empresaId,
        nomeEmpresa: nomeEmpresa.trim(),
        nivel: "admin",
        status: "aprovado",
        bloqueado: false,
        criadoEm: new Date().toISOString(),
        aprovadoEm: new Date().toISOString(),
        aprovadoPor: "cadastro-automatico",
        codigoConvite: codigoConviteGerado,
      };

      await setDoc(
        doc(db, "empresas", empresaId),
        {
          empresaId,
          nome: nomeEmpresa.trim(),
          codigoConvite: codigoConviteGerado,
          criadoEm: new Date().toISOString(),
          criadoPor: emailNormalizado,
          ativo: true,
        },
        { merge: true }
      );

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

      await setDoc(
        doc(db, "empresas", empresaId, "sistema", "dados"),
        {
          entradas: [],
          saidas: [],
          contas: [],
          clientes: [],
          estoqueCompras: [],
          estoquePerdas: [],
          produtosEstoquePersonalizados: [],
          historicoRelacoes: [],
          historicoFechamentos: [],

          metaMensal: 0,
          modoRibbonPadrao: "2X",
          inicioPeriodoSalvo: "",

          logo: "",
          nome: nomeEmpresa.trim(),
          codigoConvite: codigoConviteGerado,
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

      alert(
        `Empresa criada com sucesso. Código convite: ${codigoConviteGerado}`
      );

      setModoCadastro(false);
      setEmail("");
      setSenha("");
      setNomeEmpresa("");
    } catch (erro) {
      console.error(erro);

      if (erro?.code === "auth/email-already-in-use") {
        alert("Este e-mail já possui conta. Faça login normalmente.");
      } else {
        alert("Erro ao criar empresa. Verifique os dados.");
      }
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
          {modoCadastro
            ? "Criar empresa"
            : modoConvite
            ? "Solicitar acesso"
            : "Login"}
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
            : modoConvite
            ? "Digite o código convite enviado pelo administrador."
            : "Entre com seu e-mail e senha."}
        </p>

        {modoCadastro && (
          <input
            type="text"
            placeholder="Nome da empresa"
            value={nomeEmpresa}
            required
            onChange={(e) => setNomeEmpresa(e.target.value)}
            style={inputStyle}
          />
        )}

        {modoConvite && (
          <input
            type="text"
            placeholder="Código convite"
            value={codigoConvite}
            required
            onChange={(e) => setCodigoConvite(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          required
          minLength={6}
          onChange={(e) => setSenha(e.target.value)}
          style={inputStyle}
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
            : modoConvite
            ? "Solicitar acesso"
            : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setModoCadastro(!modoCadastro);
            setModoConvite(false);
          }}
          style={secondaryButtonStyle}
        >
          {modoCadastro ? "Já tenho conta" : "Criar nova empresa"}
        </button>

        <button
          type="button"
          onClick={() => {
            setModoConvite(!modoConvite);
            setModoCadastro(false);
          }}
          style={secondaryButtonStyle}
        >
          {modoConvite
            ? "Cancelar convite"
            : "Entrar em empresa existente"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  borderRadius: 10,
  border: "1px solid #243056",
  background: "#0b1220",
  color: "#fff",
};

const secondaryButtonStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "transparent",
  color: "#cbd5e1",
  cursor: "pointer",
};