import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
addDoc,
getDoc,
} from "firebase/firestore";
import DadosEmpresa from "./pages/DadosEmpresa.jsx";

import { auth, db } from "./services/firebase.js";
import styles from "./styles/styles.js";

import Sidebar from "./components/Sidebar.jsx";
import HistoricoFinanceiro from "./pages/HistoricoFinanceiro.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Entradas from "./pages/Entradas.jsx";
import Saidas from "./pages/Saidas.jsx";
import Contas from "./pages/Contas.jsx";
import Clientes from "./pages/Clientes.jsx";
import Pendencias from "./pages/Pendencias.jsx";
import Estoque from "./pages/Estoque.jsx";
import Importacao from "./pages/Importacao.jsx";
import RelatorioDiario from "./pages/RelatorioDiario.jsx";
import Login from "./pages/Login.jsx";
import Acessos from "./pages/Acessos.jsx";
import Atualizacoes from "./pages/Atualizacoes.jsx";
import HistoricoAlteracoes from "./pages/HistoricoAlteracoes.jsx";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [acesso, setAcesso] = useState(null);
const [carregandoAcesso, setCarregandoAcesso] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    
      setCarregandoAuth(false);
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
  if (!usuario?.email) {
    setCarregandoAcesso(false);
    return;
  }

  const email = usuario.email.toLowerCase();

  let cancelarAcessoEmpresa = null;

  const cancelarAcessoGlobal = onSnapshot(
    doc(db, "acessos", email),
    (snapshotGlobal) => {
      if (!snapshotGlobal.exists()) {
        setAcesso(null);
        setCarregandoAcesso(false);
        return;
      }

      const acessoGlobal = snapshotGlobal.data();
      const empresaIdUsuario = acessoGlobal?.empresaId;

      if (!empresaIdUsuario) {
        setAcesso(acessoGlobal);
        setCarregandoAcesso(false);
        return;
      }

      if (cancelarAcessoEmpresa) {
        cancelarAcessoEmpresa();
      }

      cancelarAcessoEmpresa = onSnapshot(
        doc(
          db,
          "empresas",
          empresaIdUsuario,
          "acessos",
          email
        ),
        (snapshotEmpresa) => {
          const acessoEmpresa = snapshotEmpresa.exists()
            ? snapshotEmpresa.data()
            : acessoGlobal;

          const acessoFinal = {
            ...acessoGlobal,
            ...acessoEmpresa,
            empresaId: empresaIdUsuario,
          };

          setAcesso(acessoFinal);

          if (acessoFinal?.bloqueado === true) {
            auth.signOut();
          }

          setCarregandoAcesso(false);
        }
      );
    }
  );

  return () => {
    cancelarAcessoGlobal();

    if (cancelarAcessoEmpresa) {
      cancelarAcessoEmpresa();
    }
  };
}, [usuario]);

  if (carregandoAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050816",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }
  
















if (carregandoAcesso) {
  return <div style={{ minHeight: "100vh", background: "#050816", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>Carregando acesso...</div>;
}

if (
  !acesso ||
  acesso.status !== "aprovado" ||
  acesso.bloqueado === true
) {
  return <div style={{ minHeight: "100vh", background: "#050816", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, textAlign: "center" }}><h1>
  {acesso?.bloqueado
    ? "Conta bloqueada"
    : "Conta pendente"}
</h1>

<p>
  {acesso?.bloqueado
    ? "Seu acesso foi bloqueado pelo administrador."
    : "Aguarde aprovação do administrador."}
</p>

<button
  onClick={async () => {
    await auth.signOut();
  }}
  style={{
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#5b5cff",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Sair
</button></div>;
}

return (
  <Sistema
    usuario={usuario}
    acesso={acesso}
  />
);
}

function Sistema({ usuario, acesso }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const empresaId =
  acesso?.empresaId;
  if (!empresaId) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        textAlign: "center",
      }}
    >
      <h1>
        Usuário sem empresa vinculada
      </h1>

      <p>
        Entre em contato com o administrador.
      </p>
    </div>
  );
}

const docSistema = doc(
  db,
  "empresas",
  empresaId,
  "sistema",
  "dados"
);
  const docBackup = (id) =>
  doc(
    db,
    "empresas",
    empresaId,
    "backupsAutomaticos",
    id
  );

  const nuvemCarregadaRef = useRef(false);
  const podeSalvarRef = useRef(false);

  const [nuvemCarregada, setNuvemCarregada] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth <= 900);

  const [aba, setAba] = useState("Dashboard");
  const [diaInicioMesFinanceiro, setDiaInicioMesFinanceiro] = useState(1);

  

  function calcularInicioMesFinanceiro() {
  if (historicoFechamentos.length > 0) {
    const ultimoFechamento = [...historicoFechamentos].sort(
      (a, b) =>
        String(b.fim || b.dataFechamento || "").localeCompare(
          String(a.fim || a.dataFechamento || "")
        )
    )[0];

    const dataFinal =
      ultimoFechamento?.fim ||
      ultimoFechamento?.dataFechamento;

    if (dataFinal) {
      const data = new Date(dataFinal + "T00:00:00");
      data.setDate(data.getDate() + 1);
      return data.toISOString().slice(0, 10);
    }
  }

  const hojeData = new Date();
  const ano = hojeData.getFullYear();
  const mes = hojeData.getMonth();
  const diaAtual = hojeData.getDate();

  const inicio =
    diaAtual >= diaInicioMesFinanceiro
      ? new Date(ano, mes, diaInicioMesFinanceiro)
      : new Date(ano, mes - 1, diaInicioMesFinanceiro);

  return inicio.toISOString().slice(0, 10);
}

const [inicioMes, setInicioMes] = useState(hoje);
function calcularFimMesFinanceiro() {
  const inicio = new Date(calcularInicioMesFinanceiro() + "T00:00:00");

  const fim = new Date(
    inicio.getFullYear(),
    inicio.getMonth() + 1,
    inicio.getDate() - 1
  );

  return fim.toISOString().slice(0, 10);
}

const [fimMes, setFimMes] = useState(hoje);

const [metaMensal, setMetaMensal] = useState(80000);
const [inicioPeriodoSalvo, setInicioPeriodoSalvo] = useState("");

  const [textoImportacao, setTextoImportacao] = useState("");
  const [resultadoImportacao, setResultadoImportacao] = useState("");
  const [clientePendenciaSelecionado, setClientePendenciaSelecionado] =
    useState(null);
  const [mostrarDadosEmpresa, setMostrarDadosEmpresa] = useState(false);
  const [botaoCopiado, setBotaoCopiado] = useState("");

  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [contas, setContas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [estoqueCompras, setEstoqueCompras] = useState([]);
  const [estoquePerdas, setEstoquePerdas] = useState([]);
  const [historicoRelacoes, setHistoricoRelacoes] = useState([]);
  const [historicoFechamentos, setHistoricoFechamentos] = useState([]);
  const [historicoAlteracoes, setHistoricoAlteracoes] = useState([]);
  const loginRegistradoRef = useRef(false);
  const [backupsAutomaticos, setBackupsAutomaticos] = useState([]);
  const [usuariosOnline, setUsuariosOnline] = useState([]);
  const [dadosEmpresa, setDadosEmpresa] = useState({
  logo: "",
  nome: "",
  ie: "",
  cnpj: "",
  email: "",
  whatsapp: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  pix: "",
});

  useEffect(() => {
    function ajustarTela() {
      setMobile(window.innerWidth <= 900);
    }

    window.addEventListener("resize", ajustarTela);

    return () => window.removeEventListener("resize", ajustarTela);
  }, []);

  useEffect(() => {
    const cancelar = onSnapshot(docSistema, async (snapshot) => {
      podeSalvarRef.current = false;

      if (snapshot.exists()) {
        const dados = snapshot.data();
        if (!Array.isArray(dados.historicoFechamentos)) {
  await setDoc(
    docSistema,
    { historicoFechamentos: [] },
    { merge: true }
  );
}

        setEntradas(Array.isArray(dados.entradas) ? dados.entradas : []);
        setDiaInicioMesFinanceiro(
  Number(dados.diaInicioMesFinanceiro || 1)
);
setMetaMensal(
  Number(dados.metaMensal || 80000)
);

setInicioPeriodoSalvo(
  dados.inicioPeriodoSalvo || ""
);
        setSaidas(Array.isArray(dados.saidas) ? dados.saidas : []);
        setContas(Array.isArray(dados.contas) ? dados.contas : []);
        setClientes(Array.isArray(dados.clientes) ? dados.clientes : []);
        setEstoqueCompras(
          Array.isArray(dados.estoqueCompras) ? dados.estoqueCompras : []
        );
        setEstoquePerdas(
          Array.isArray(dados.estoquePerdas) ? dados.estoquePerdas : []
        );
        setHistoricoRelacoes(
          Array.isArray(dados.historicoRelacoes) ? dados.historicoRelacoes : []
        );
        setHistoricoFechamentos(
  Array.isArray(dados.historicoFechamentos)
    ? dados.historicoFechamentos
    : []
);

setDadosEmpresa({
  logo: dados.logo || "",
  nome: dados.nome || "",
  ie: dados.ie || "",
  cnpj: dados.cnpj || "",
  email: dados.email || "",
  whatsapp: dados.whatsapp || "",
  cep: dados.cep || "",
  logradouro: dados.logradouro || "",
  numero: dados.numero || "",
  bairro: dados.bairro || "",
  cidade: dados.cidade || "",
  pix: dados.pix || "",
});
      } else {
        await setDoc(docSistema, {
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
        });
      }

      nuvemCarregadaRef.current = true;
      setNuvemCarregada(true);

      setTimeout(() => {
        podeSalvarRef.current = true;
      }, 700);
    });

    return () => cancelar();
  }, []);
  useEffect(() => {
  const cancelar = onSnapshot(
    collection(
      db,
      "empresas",
      empresaId,
      "backupsAutomaticos"
    ),
    (snapshot) => {
      const lista = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .sort((a, b) =>
          String(b.criadoEm || b.id).localeCompare(
            String(a.criadoEm || a.id)
          )
        );

      setBackupsAutomaticos(lista);
    }
  );

  return () => cancelar();
}, [empresaId]);

useEffect(() => {
  const cancelar = onSnapshot(
    collection(
      db,
      "empresas",
      empresaId,
      "historicoAlteracoes"
    ),
    (snapshot) => {
      const lista = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .sort(
          (a, b) =>
            new Date(b.dataHora) -
            new Date(a.dataHora)
        );

      setHistoricoAlteracoes(lista);
    }
  );

  return () => cancelar();
}, [empresaId]);
useEffect(() => {
  const cancelar = onSnapshot(
    collection(
  db,
  "empresas",
  empresaId,
  "usuariosOnline"
),
    (snapshot) => {
      const lista = snapshot.docs.map(
        (docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })
      );

      setUsuariosOnline(lista);
    }
  );

  return () => cancelar();
}, []);

  async function salvarNaNuvem(campo, valor) {
    if (!nuvemCarregadaRef.current) return;
    if (!podeSalvarRef.current) return;

    await setDoc(
      docSistema,
      {
        [campo]: valor,
      },
      { merge: true }
    );
  }
  async function salvarDadosEmpresa() {
  try {
    await setDoc(
  doc(
    db,
    "empresas",
    empresaId,
    "sistema",
    "dados"
  ),
      {
        ...dadosEmpresa,
      },
      { merge: true }
    );

    alert(
      "Dados da empresa salvos."
    );
  } catch (erro) {
    console.error(erro);

    alert(
      "Erro ao salvar dados da empresa."
    );
  }
}
async function criarBackupManual() {
  try {
    const agora = new Date();

    const idBackup =
      `manual-${agora.toISOString()}`;

    const backup = {
      criadoEm: agora.toISOString(),
      tipo: "manual",

      entradas,
      saidas,
      contas,
      clientes,

      estoqueCompras,
      estoquePerdas,

      historicoRelacoes,
      historicoFechamentos,
      historicoAlteracoes,

      metaMensal,
      inicioMes,
      fimMes,
    };

    await setDoc(
      docBackup(idBackup),
      backup
    );

    alert("Backup criado com sucesso.");
  } catch (erro) {
    console.error(erro);
    alert("Erro ao criar backup.");
  }
}
async function migrarBancoAntigo() {
  try {
    const snapshotAntigo = await getDoc(
      doc(db, "sistema", "emplacar")
    );

    if (!snapshotAntigo.exists()) {
      alert("Banco antigo não encontrado.");
      return;
    }

    const dadosAntigos = snapshotAntigo.data();

    await setDoc(
      doc(
        db,
        "empresas",
        empresaId,
        "sistema",
        "dados"
      ),
      dadosAntigos,
      { merge: true }
    );

    alert("Migração concluída com sucesso.");
  } catch (erro) {
    console.error(erro);

    alert("Erro ao migrar banco.");
  }
}
  async function restaurarBackup(
  backup
) {
  if (!backup) return;

  const confirmar = prompt(
    'Digite RESTAURAR para continuar'
  );

  if (
    confirmar !== "RESTAURAR"
  ) {
    alert(
      "Restauração cancelada."
    );
    return;
  }

  try {
    const backupSegurancaId =
      `ANTES-RESTAURAR-${Date.now()}`;

    await setDoc(
      docBackup(
        backupSegurancaId
      ),
      {
        criadoEm:
          new Date().toISOString(),
        tipo:
          "backup-seguranca-restauracao",

        entradas,
        saidas,
        contas,
        clientes,

        estoqueCompras,
        estoquePerdas,

        historicoRelacoes,
        historicoFechamentos,
        historicoAlteracoes,

        metaMensal,
        inicioMes,
        fimMes,
      }
    );

    await setDoc(
      docSistema,
      {
        entradas:
          backup.entradas || [],
        saidas:
          backup.saidas || [],
        contas:
          backup.contas || [],
        clientes:
          backup.clientes || [],

        estoqueCompras:
          backup.estoqueCompras ||
          [],

        estoquePerdas:
          backup.estoquePerdas ||
          [],

        historicoRelacoes:
          backup.historicoRelacoes ||
          [],

        historicoFechamentos:
          backup.historicoFechamentos ||
          [],

        historicoAlteracoes:
          backup.historicoAlteracoes ||
          [],

        metaMensal:
          backup.metaMensal ||
          80000,

        inicioPeriodoSalvo:
          backup.inicioPeriodoSalvo ||
          "",
      },
      { merge: true }
    );

    registrarAlteracao({
      tipo: "Restauração",
      modulo: "Backups",
      descricao: `${usuario?.email || "Usuário"} restaurou backup`,
      valorNovo:
        backup?.criadoEm || "",
    });

    alert(
      "Backup restaurado com sucesso."
    );
  } catch (erro) {
    console.error(erro);

    alert(
      "Erro ao restaurar backup."
    );
  }
}

  useEffect(() => {
    salvarNaNuvem("entradas", entradas);
  }, [entradas]);
 
useEffect(() => {
  setInicioMes(calcularInicioMesFinanceiro());
  setFimMes(hoje);
}, [historicoFechamentos, hoje]);
  useEffect(() => {
    salvarNaNuvem("saidas", saidas);
  }, [saidas]);

  useEffect(() => {
    salvarNaNuvem("contas", contas);
  }, [contas]);

  useEffect(() => {
    salvarNaNuvem("clientes", clientes);
  }, [clientes]);

  useEffect(() => {
    salvarNaNuvem("estoqueCompras", estoqueCompras);
  }, [estoqueCompras]);

  useEffect(() => {
    salvarNaNuvem("estoquePerdas", estoquePerdas);
  }, [estoquePerdas]);

  useEffect(() => {
    salvarNaNuvem("historicoRelacoes", historicoRelacoes);
  }, [historicoRelacoes]);
  useEffect(() => {
  salvarNaNuvem(
    "historicoFechamentos",
    historicoFechamentos
  );
}, [historicoFechamentos]);

useEffect(() => {
  salvarNaNuvem(
    "metaMensal",
    metaMensal
  );
}, [metaMensal]);

  useEffect(() => {
  if (!nuvemCarregada) return;

  async function gerarBackupAutomatico() {
    const agora = new Date();

    const dataBackup =
      agora.toISOString().slice(0, 10);

    const hora = agora.getHours();

    const backupJaFeitoHoje =
      localStorage.getItem(
        "backupAutomaticoDia"
      );

    if (
      backupJaFeitoHoje === dataBackup
    ) {
      return;
    }

    if (hora < 23) {
  return;
}

    const backup = {
      criadoEm:
        agora.toISOString(),

      entradas,
      saidas,
      contas,
      clientes,

      estoqueCompras,
      estoquePerdas,

      historicoRelacoes,
      historicoFechamentos,
      historicoAlteracoes,

      metaMensal,
      inicioMes,
      fimMes,
    };

    await setDoc(
      docBackup(dataBackup),
      backup
    );

    localStorage.setItem(
      "backupAutomaticoDia",
      dataBackup
    );

    console.log(
      "✅ Backup automático criado"
    );
  }

  gerarBackupAutomatico();
}, [
  nuvemCarregada,

  entradas,
  saidas,
  contas,
  clientes,

  estoqueCompras,
  estoquePerdas,

  historicoRelacoes,
  historicoFechamentos,
  historicoAlteracoes,

  metaMensal,
  inicioMes,
  fimMes,
]);



  const chavePix =
  dadosEmpresa.pix || "";

 const dadosEmpresaTexto = `IE: ${dadosEmpresa.ie || ""}
CNPJ: ${dadosEmpresa.cnpj || ""}
E-MAIL: ${dadosEmpresa.email || ""}
WhatsApp: ${dadosEmpresa.whatsapp || ""}
CEP: ${dadosEmpresa.cep || ""}
LOGRADOURO: ${dadosEmpresa.logradouro || ""}
N°: ${dadosEmpresa.numero || ""}
BAIRRO: ${dadosEmpresa.bairro || ""}
CIDADE: ${dadosEmpresa.cidade || ""}`;

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const formasPagamento = [
    "Pix",
    "Débito",
    "Crédito",
    "Depósito",
    "Cheque",
    "Dinheiro",
    "Nota / Faturado",
  ];

  const produtosEstoque = ["Placa Carro", "Placa Moto", "Suporte"];

  const entradaVazia = {
    data: hoje,
    tipo: "",
    cliente: "",
    produto: "",
    placa: "",
    renavan: "",
    formaPagamento: "Pix",
    valor: "",
    status: "Pago",
    processo: "",
    diaPago: "",
    celular: "",
    relacaoPagaId: "",
  };

  const saidaVazia = {
    data: hoje,
    formaPagamento: "Pix",
    categoria: "Outros",
    tipoSaida: "",
    conta: "",
    valor: "",
    status: "Pago",
  };

  const contaVazia = {
    conta: "",
    vencimento: hoje,
    valor: "",
    formaPagamento: "Pix",
dataPagamento: "",
saidaGeradaId: "",
    status: "Pendente",
  };

  const clienteVazio = {
    nome: "",
    telefone: "",
    email: "",
    observacao: "",
  };

  const compraEstoqueVazia = {
    data: hoje,
    produto: "Placa Carro",
    quantidade: "",
    observacao: "",
  };

  const perdaEstoqueVazia = {
    data: hoje,
    produto: "Placa Carro",
    quantidade: "",
    motivo: "Placa errada",
  };

  const [entradaForm, setEntradaForm] = useState(entradaVazia);
  const [saidaForm, setSaidaForm] = useState(saidaVazia);
  const [contaForm, setContaForm] = useState(contaVazia);
  const [clienteForm, setClienteForm] = useState(clienteVazio);
  const [compraEstoqueForm, setCompraEstoqueForm] =
    useState(compraEstoqueVazia);
  const [perdaEstoqueForm, setPerdaEstoqueForm] = useState(perdaEstoqueVazia);

  const [editando, setEditando] = useState({
    tipo: null,
    id: null,
  });
  function compararAlteracoes(antigo, novo, campos) {
  if (!antigo || !novo) return [];

  return campos
    .filter((campo) => String(antigo[campo] ?? "") !== String(novo[campo] ?? ""))
    .map((campo) => ({
      campo,
      valorAntigo: antigo[campo] ?? "",
      valorNovo: novo[campo] ?? "",
    }));
}
function calcularRiscoAlteracao({ tipo = "", modulo = "", detalhes = [] }) {
  const tipoNormalizado = normalizar(tipo);
  const moduloNormalizado = normalizar(modulo);

  const camposCriticos = [
    "valor",
    "status",
    "formaPagamento",
    "diaPago",
    "dataPagamento",
    "saidaGeradaId",
  ];

  if (
    tipoNormalizado.includes("EXCLUSAO") ||
    tipoNormalizado.includes("RESTAURACAO") ||
    tipoNormalizado.includes("LIMPAR")
  ) {
    return "ALTO";
  }

  if (
    moduloNormalizado.includes("ENTRADAS") ||
    moduloNormalizado.includes("SAIDAS") ||
    moduloNormalizado.includes("CONTAS") ||
    moduloNormalizado.includes("PENDENCIAS")
  ) {
    const mexeuCampoCritico = detalhes.some((item) =>
      camposCriticos.includes(item.campo)
    );

    if (mexeuCampoCritico) return "ALTO";

    return "MÉDIO";
  }

  return "NORMAL";
}

function registrarAlteracao({
  tipo = "",
  modulo = "",
  descricao = "",
  valorAntigo = "",
  valorNovo = "",
  itemId = "",
  detalhes = [],
}) {
  if (usuario?.email === "matymidy.mmm@gmail.com") {
    return;
  }

  const risco = calcularRiscoAlteracao({
    tipo,
    modulo,
    detalhes,
  });

  const novoRegistro = {
    id: Date.now(),
    usuario: usuario?.email || "Usuário não identificado",
    tipo,
    modulo,
    descricao,
    valorAntigo:
      typeof valorAntigo === "object"
        ? JSON.stringify(valorAntigo)
        : String(valorAntigo || ""),
    valorNovo:
      typeof valorNovo === "object"
        ? JSON.stringify(valorNovo)
        : String(valorNovo || ""),
    itemId,
    detalhes: Array.isArray(detalhes) ? detalhes : [],
    risco,
    dataHora: new Date().toISOString(),
  };

  addDoc(
    collection(db, "empresas", empresaId, "historicoAlteracoes"),
    novoRegistro
  );
}
useEffect(() => {
  if (!usuario?.email) {
    loginRegistradoRef.current = false;
    return;
  }

  if (loginRegistradoRef.current) {
    return;
  }

  loginRegistradoRef.current = true;

  registrarAlteracao({
    tipo: "Login",
    modulo: "Autenticação",
    descricao: `${usuario.email} entrou no sistema`,
    itemId: usuario.uid,
  });
}, [usuario]);
  function numero(valor) {
    return (
      Number(
        String(valor || "")
          .replace("R$", "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      ) || 0
    );
  }

  function texto(valor) {
    return String(valor || "").trim();
  }

  function normalizar(valor) {
    return texto(valor)
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function textoMovimento(item) {
    return normalizar(
      [
        item?.tipo,
        item?.produto,
        item?.processo,
        item?.cliente,
        item?.conta,
        item?.tipoSaida,
        item?.categoria,
        item?.observacao,
      ].join(" ")
    );
  }

  function ehInjecaoCaixa(item) {
    const t = textoMovimento(item);

    return (
      t.includes("INJECAO CAIXA") ||
      t.includes("APORTE CAIXA") ||
      t.includes("REFORCO CAIXA") ||
      t.includes("SOBRA CAIXA")
    );
  }

  function ehInjecaoLoja(item) {
    const t = textoMovimento(item);

    return (
      t.includes("INJECAO LOJA") ||
      t.includes("CAPITAL LOJA") ||
      t.includes("APORTE LOJA") ||
      t.includes("DINHEIRO LOJA") ||
      t.includes("CAIXA LOJA")
    );
  }

  function ehInjecaoSocios(item) {
    const t = textoMovimento(item);

    return (
      t.includes("INJECAO SOCIOS") ||
      t.includes("INJECAO SOCIO") ||
      t.includes("INJECAO SÓCIOS") ||
      t.includes("INJECAO SÓCIO") ||
      t.includes("APORTE SOCIOS") ||
      t.includes("APORTE SOCIO") ||
      t.includes("APORTE SÓCIOS") ||
      t.includes("APORTE SÓCIO") ||
      t.includes("CAPITAL SOCIOS") ||
      t.includes("CAPITAL SOCIO") ||
      t.includes("CAPITAL SÓCIOS") ||
      t.includes("CAPITAL SÓCIO") ||
      t.includes("SOCIOS") ||
      t.includes("SÓCIOS")
    );
  }

  function ehInjecaoCapital(item) {
    const t = textoMovimento(item);

    return (
      ehInjecaoCaixa(item) ||
      ehInjecaoLoja(item) ||
      ehInjecaoSocios(item) ||
      t.includes("INJECAO") ||
      t.includes("APORTE") ||
      t.includes("CAPITAL")
    );
  }

  function ehRecuperacaoVale(item) {
    const t = textoMovimento(item);

    return (
      t.includes("DESCONTO VALE") ||
      t.includes("VALE DESCONTADO") ||
      t.includes("RECUPERACAO VALE") ||
      t.includes("DEVOLUCAO VALE")
    );
  }

  function ehValeColaborador(item) {
    const t = textoMovimento(item);

    return (
      t.includes("VALE") &&
      !t.includes("DESCONTO VALE") &&
      !t.includes("VALE DESCONTADO") &&
      !t.includes("RECUPERACAO VALE") &&
      !t.includes("DEVOLUCAO VALE")
    );
  }

  function ehVendaReal(item) {
    return !ehInjecaoCapital(item) && !ehRecuperacaoVale(item);
  }

  function dataRecebimentoEntrada(entrada) {
    if (entrada?.diaPago) return entrada.diaPago;

    if (
      entrada?.status === "Pago" &&
      entrada?.formaPagamento !== "Nota / Faturado"
    ) {
      return entrada.data;
    }

    return "";
  }

  function destinoDinheiro(forma) {
  const f = normalizar(forma);

  if (f.includes("NOTA") || f.includes("FATURADO")) return "Faturado";

  if (
    f.includes("DINHEIRO") ||
    f.includes("CHEQUE") ||
    f.includes("CAIXA")
  ) {
    return "Caixa";
  }

  return "Banco";
}

  function statusConta(conta) {
    if (conta.status === "Pago") return "Pago";
    if (conta.vencimento < hoje) return "Atrasado";
    return "Pendente";
  }

  function entradaEmAberto(entrada) {
    return (
      entrada.status !== "Pago" ||
      (entrada.formaPagamento === "Nota / Faturado" && !entrada.diaPago)
    );
  }

  function dentroDoPeriodo(data) {
    if (!data) return false;
    return data >= inicioMes && data <= fimMes;
  }

  function cancelarEdicao() {
    setEditando({ tipo: null, id: null });
    setEntradaForm(entradaVazia);
    setSaidaForm(saidaVazia);
    setContaForm(contaVazia);
    setClienteForm(clienteVazio);
  }

  function salvarEntrada() {
  const antiga =
    editando.tipo === "entrada"
      ? entradas.find((x) => x.id === editando.id)
      : null;

  const nova = {
    ...entradaForm,
    valor: numero(entradaForm.valor),
    diaPago: entradaForm.diaPago || "",
    celular: entradaForm.celular || "",
    relacaoPagaId: entradaForm.relacaoPagaId || "",
    id: editando.tipo === "entrada" ? editando.id : Date.now(),
  };

  if (editando.tipo === "entrada") {
    const detalhes = compararAlteracoes(antiga, nova, [
      "data",
      "tipo",
      "cliente",
      "produto",
      "placa",
      "renavan",
      "formaPagamento",
      "valor",
      "status",
      "processo",
      "diaPago",
      "celular",
    ]);

    setEntradas((old) => old.map((x) => (x.id === editando.id ? nova : x)));

    if (detalhes.length > 0) {
      registrarAlteracao({
        tipo: "Alteração",
        modulo: "Entradas",
        descricao: `${usuario?.email || "Usuário"} alterou entrada ${nova.placa || nova.cliente || nova.tipo || nova.id}`,
        itemId: nova.id,
        detalhes,
      });
    }
  } else {
    setEntradas((old) => [nova, ...old]);

    registrarAlteracao({
      tipo: "Adição",
      modulo: "Entradas",
      descricao: `${usuario?.email || "Usuário"} adicionou entrada ${nova.placa || nova.cliente || nova.tipo || nova.id}`,
      valorNovo: nova,
      itemId: nova.id,
    });
  }

  cancelarEdicao();
}

  function salvarSaida() {
    const nova = {
      ...saidaForm,
      categoria: saidaForm.categoria || "Outros",
      valor: numero(saidaForm.valor),
      id: editando.tipo === "saida" ? editando.id : Date.now(),
    };

    if (editando.tipo === "saida") {
      setSaidas((old) => old.map((x) => (x.id === editando.id ? nova : x)));
    } else {
      setSaidas((old) => [nova, ...old]);
    }

    cancelarEdicao();
  }

  function salvarConta() {
  const nova = {
    ...contaForm,
    valor: numero(contaForm.valor),
    formaPagamento: contaForm.formaPagamento || "Pix",
    dataPagamento: contaForm.dataPagamento || "",
    saidaGeradaId: contaForm.saidaGeradaId || "",
    id: editando.tipo === "conta" ? editando.id : Date.now(),
  };

  if (editando.tipo === "conta") {
    setContas((old) =>
      old.map((x) => (x.id === editando.id ? nova : x))
    );
  } else {
    setContas((old) => [nova, ...old]);
  }

  cancelarEdicao();
}

  function salvarCliente() {
    const novo = {
      ...clienteForm,
      id: editando.tipo === "cliente" ? editando.id : Date.now(),
    };

    if (editando.tipo === "cliente") {
      setClientes((old) => old.map((x) => (x.id === editando.id ? novo : x)));
    } else {
      setClientes((old) => [novo, ...old]);
    }

    cancelarEdicao();
  }

  function salvarRelacaoPaga(pendencia, diaPago, formaPagamento = "Pix") {
  if (!pendencia || !diaPago) return;

  const idRelacao = Date.now();
  const idsEntradas = pendencia.itens.map((item) => item.id);

  const novaRelacao = {
    id: idRelacao,
    cliente: pendencia.cliente,
    diaPago,
    formaPagamento,
    dataSalvamento: hoje,
    quantidade: pendencia.quantidade,
    total: pendencia.total,
    itens: pendencia.itens.map((item) => ({
      idEntrada: item.id,
      data: item.data,
      tipo: item.tipo,
      cliente: item.cliente,
      produto: item.produto,
      placa: item.placa,
      renavan: item.renavan,
      processo: item.processo,
      formaPagamentoAnterior: item.formaPagamento,
      formaPagamento,
      valor: item.valor,
      statusAnterior: item.status,
    })),
  };

  setHistoricoRelacoes((old) => [novaRelacao, ...old]);

  setEntradas((old) =>
    old.map((entrada) =>
      idsEntradas.includes(entrada.id)
        ? {
            ...entrada,
            status: "Pago",
            formaPagamento,
            diaPago,
            relacaoPagaId: idRelacao,
          }
        : entrada
    )
  );

  registrarAlteracao({
    tipo: "Pagamento",
    modulo: "Pendências",
    descricao: `${usuario?.email || "Usuário"} marcou relação de ${pendencia.cliente} como paga via ${formaPagamento}`,
    valorNovo: `${pendencia.quantidade} serviços - ${formaPagamento} - ${diaPago}`,
    itemId: idRelacao,
  });

  setClientePendenciaSelecionado(null);
}

  function desfazerUltimaRelacaoPaga(idRelacao) {
  const relacao = historicoRelacoes.find(
    (x) => String(x.id) === String(idRelacao)
  );

  if (!relacao) {
    alert("Relação não encontrada.");
    return;
  }

  setEntradas((old) =>
    old.map((entrada) => {
      const itemOriginal = relacao.itens.find(
        (x) => String(x.idEntrada) === String(entrada.id)
      );

      if (!itemOriginal) return entrada;

      return {
        ...entrada,
        status: itemOriginal.statusAnterior || "Pago",
        formaPagamento:
          itemOriginal.formaPagamentoAnterior || "Nota / Faturado",
        diaPago: "",
        relacaoPagaId: "",
      };
    })
  );

  setHistoricoRelacoes((old) =>
    old.filter((x) => String(x.id) !== String(idRelacao))
  );

  registrarAlteracao({
    tipo: "Desfazer pagamento",
    modulo: "Pendências",
    descricao: `${usuario?.email || "Usuário"} desfez pagamento da relação ${relacao.cliente}`,
    valorNovo: relacao.cliente,
    itemId: idRelacao,
  });

  alert("Pagamento desfeito com sucesso.");
}

  function editar(tipo, item) {
    setEditando({ tipo, id: item.id });

    if (tipo === "entrada") {
      setEntradaForm({
        ...entradaVazia,
        ...item,
        valor: String(item.valor ?? ""),
        diaPago: item.diaPago || "",
        relacaoPagaId: item.relacaoPagaId || "",
      });
    }

    if (tipo === "saida") {
      setSaidaForm({
        ...saidaVazia,
        ...item,
        valor: String(item.valor ?? ""),
        categoria: item.categoria || "Outros",
      });
    }

    if (tipo === "conta") setContaForm(item);
    if (tipo === "cliente") setClienteForm(item);
  }

 function remover(tipo, id) {
  let itemRemovido = null;

  if (tipo === "entrada") {
    itemRemovido = entradas.find(
      (x) => x.id === id
    );

    setEntradas((old) =>
      old.filter((x) => x.id !== id)
    );
  }

  if (tipo === "saida") {
    itemRemovido = saidas.find(
      (x) => x.id === id
    );

    setSaidas((old) =>
      old.filter((x) => x.id !== id)
    );
  }

  if (tipo === "conta") {
    itemRemovido = contas.find(
      (x) => x.id === id
    );

    setContas((old) =>
      old.filter((x) => x.id !== id)
    );
  }

  if (tipo === "cliente") {
    itemRemovido = clientes.find(
      (x) => x.id === id
    );

    setClientes((old) =>
      old.filter((x) => x.id !== id)
    );
  }

  registrarAlteracao({
    tipo: "Exclusão",
    modulo: tipo,
    descricao: `${
  usuario?.email || "Usuário"
} removeu ${
  itemRemovido?.placa ||
  itemRemovido?.cliente ||
  itemRemovido?.conta ||
  itemRemovido?.tipoSaida ||
  itemRemovido?.produto ||
  itemRemovido?.tipo ||
  itemRemovido?.nome ||
  JSON.stringify(itemRemovido).slice(0, 60)
}`,
    valorAntigo: itemRemovido || {},
    valorNovo: "Item removido",
    itemId: id,
  });
}

  function alternarConta(id) {
  const conta = contas.find((x) => String(x.id) === String(id));

  if (!conta) return;

  const novoStatus =
    conta.status === "Pago" ? "Pendente" : "Pago";

  let saidaGeradaId = conta.saidaGeradaId || "";

  if (novoStatus === "Pago" && !saidaGeradaId) {
    const novaSaidaId = Date.now();

    const novaSaida = {
      id: novaSaidaId,
      data: hoje,
      formaPagamento: conta.formaPagamento || "Pix",
      categoria: "Conta paga",
      tipoSaida: "Conta a pagar",
      conta: conta.conta,
      valor: Number(conta.valor || 0),
      status: "Pago",
      origemContaId: conta.id,
      vencimentoConta: conta.vencimento,
    };

    setSaidas((old) => [novaSaida, ...old]);

    saidaGeradaId = novaSaidaId;
  }

  if (novoStatus === "Pendente" && saidaGeradaId) {
    setSaidas((old) =>
      old.filter((x) => String(x.id) !== String(saidaGeradaId))
    );

    saidaGeradaId = "";
  }

  setContas((old) =>
    old.map((x) =>
      String(x.id) === String(id)
        ? {
            ...x,
            status: novoStatus,
            dataPagamento: novoStatus === "Pago" ? hoje : "",
            saidaGeradaId,
          }
        : x
    )
  );
}

 const dadosPeriodo = useMemo(() => {
  const entradasCompetencia = entradas.filter((x) =>
    dentroDoPeriodo(x.data)
  );

  const entradasRecebidas = entradas.filter((x) => {
    const dataRecebimento = dataRecebimentoEntrada(x);

    return (
      dataRecebimento &&
      dentroDoPeriodo(dataRecebimento) &&
      x.status === "Pago"
    );
  });

  return {
    entradas: entradasCompetencia,
    entradasRecebidas,
    saidas: saidas.filter((x) => dentroDoPeriodo(x.data)),
    contas: contas.filter((x) => dentroDoPeriodo(x.vencimento)),
  };
}, [entradas, saidas, contas, inicioMes, fimMes]);

 const indicadores = useMemo(() => {
  const entradasCompetencia = entradas.filter(
    (x) => dentroDoPeriodo(x.data) && ehVendaReal(x)
  );

  const vendasRecebidasPeriodo =
    dadosPeriodo.entradasRecebidas.filter(ehVendaReal);

  const entradasVistaTotal = entradasCompetencia
  .filter((x) => {
    if (x.status !== "Pago") return false;

    if (
      destinoDinheiro(x.formaPagamento) ===
      "Faturado"
    )
      return false;

    return true;
  })
  .reduce(
    (soma, x) =>
      soma + Number(x.valor || 0),
    0
  );
    

  const injecaoCaixaPeriodo =
    dadosPeriodo.entradasRecebidas.filter(ehInjecaoCaixa);

  const injecaoLojaPeriodo =
    dadosPeriodo.entradasRecebidas.filter(ehInjecaoLoja);

  const injecaoSociosPeriodo =
    dadosPeriodo.entradasRecebidas.filter(ehInjecaoSocios);

  const injecoesPeriodo =
    dadosPeriodo.entradasRecebidas.filter(ehInjecaoCapital);

  const recuperacaoValesPeriodo =
    dadosPeriodo.entradasRecebidas.filter(ehRecuperacaoVale);

  const recebimentosAntigos = vendasRecebidasPeriodo.filter((x) => {
    const dataRecebimento = dataRecebimentoEntrada(x);
    return x.data < inicioMes && dataRecebimento >= inicioMes;
  });

  const entradaBruta = entradasCompetencia.reduce((s, x) => s + x.valor, 0);

  const caixaRecebidoVendas = vendasRecebidasPeriodo.reduce(
    (s, x) => s + x.valor,
    0
  );

  const injecaoCaixaTotal = injecaoCaixaPeriodo.reduce(
    (s, x) => s + x.valor,
    0
  );

  const injecaoLojaTotal = injecaoLojaPeriodo.reduce(
    (s, x) => s + x.valor,
    0
  );

  const injecaoSociosTotal = injecaoSociosPeriodo.reduce(
    (s, x) => s + x.valor,
    0
  );

  const injecaoCapitalTotal = injecoesPeriodo.reduce(
    (s, x) => s + x.valor,
    0
  );

  const recuperacaoValeTotal = recuperacaoValesPeriodo.reduce(
    (s, x) => s + x.valor,
    0
  );

  const recebidoBanco = dadosPeriodo.entradasRecebidas
    .filter((x) => {
      if (ehInjecaoCaixa(x)) return false;
      if (destinoDinheiro(x.formaPagamento) === "Caixa") return false;
      return true;
    })
    .reduce((s, x) => s + x.valor, 0);

  const recebidoCaixa = dadosPeriodo.entradasRecebidas
    .filter((x) => {
      if (ehInjecaoCaixa(x)) return true;
      return destinoDinheiro(x.formaPagamento) === "Caixa";
    })
    .reduce((s, x) => s + x.valor, 0);

  const notasPendentes = entradas
    .filter(
      (x) =>
        dentroDoPeriodo(x.data) &&
        ehVendaReal(x) &&
        x.formaPagamento === "Nota / Faturado" &&
        !x.diaPago
    )
    .reduce((s, x) => s + x.valor, 0);

  const saidasTotal = dadosPeriodo.saidas.reduce((s, x) => s + x.valor, 0);

  const valesColaboradores = dadosPeriodo.saidas
    .filter(ehValeColaborador)
    .reduce((s, x) => s + x.valor, 0);

  const contasPagas = dadosPeriodo.contas
    .filter((x) => statusConta(x) === "Pago")
    .reduce((s, x) => s + x.valor, 0);

  const saidasBanco = dadosPeriodo.saidas
    .filter((x) => destinoDinheiro(x.formaPagamento) === "Banco")
    .reduce((s, x) => s + x.valor, 0);

  const saidasCaixa = dadosPeriodo.saidas
    .filter((x) => destinoDinheiro(x.formaPagamento) === "Caixa")
    .reduce((s, x) => s + x.valor, 0);

  const caixaRecebidoTotal =
    caixaRecebidoVendas + injecaoCapitalTotal + recuperacaoValeTotal;

  const pagos = saidasTotal;
const entradaLiquida = caixaRecebidoTotal - saidasTotal;

  const tenhoNoBanco = recebidoBanco - saidasBanco;
  const tenhoNoCaixa = recebidoCaixa - saidasCaixa;

  const dias =
    new Set([
      ...entradasCompetencia.map((x) => x.data),
      ...dadosPeriodo.saidas.map((x) => x.data),
      ...dadosPeriodo.contas.map((x) => x.vencimento),
    ]).size || 1;

  return {
    entradaBruta,
    entradasVistaTotal,
    faturamentoCompetencia: entradaBruta,
    caixaRecebidoVendas,
    caixaRecebidoTotal,
    entradaLiquida,
    saidasTotal,
    contasPagas,
    pagos,
    faturadoEmAberto: notasPendentes,
    notasPendentes,
    recebidoBanco,
    recebidoCaixa,
    recebidoFaturado: caixaRecebidoVendas,
    recebidoTotal: caixaRecebidoTotal,
    recebimentosAntigos: recebimentosAntigos.reduce((s, x) => s + x.valor, 0),
    injecaoCaixaTotal,
    injecaoLojaTotal,
    injecaoSociosTotal,
    injecaoCapitalTotal,
    aporteTotal: injecaoCapitalTotal,
    recuperacaoValeTotal,
    valesColaboradores,
    mediaPorDia: entradaBruta / dias,
    tenhoNoBanco,
    tenhoNoCaixa,
  };
}, [entradas, dadosPeriodo, inicioMes, fimMes]);
  const vendasPorDia = useMemo(() => {
    const mapa = {};

    dadosPeriodo.entradas.filter(ehVendaReal).forEach((entrada) => {
      mapa[entrada.data] = (mapa[entrada.data] || 0) + entrada.valor;
    });

    return Object.entries(mapa)
      .map(([data, valor]) => ({ data, valor }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [dadosPeriodo]);

  const servicosPorDia = useMemo(() => {
    const mapa = {};

    dadosPeriodo.entradas.filter(ehVendaReal).forEach((entrada) => {
      mapa[entrada.data] = (mapa[entrada.data] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [dadosPeriodo]);

  const contasPorNome = useMemo(() => {
    const mapa = {};

    dadosPeriodo.contas.forEach((conta) => {
      const nome = conta.conta || "Sem descrição";
      mapa[nome] = (mapa[nome] || 0) + conta.valor;
    });

    return Object.entries(mapa)
      .map(([conta, valor]) => ({ conta, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [dadosPeriodo]);

  const statusContasPizza = useMemo(() => {
    const mapa = {
      Pago: 0,
      Pendente: 0,
      Atrasado: 0,
    };

    dadosPeriodo.contas.forEach((conta) => {
      const status = statusConta(conta);
      mapa[status] = (mapa[status] || 0) + conta.valor;
    });

    return Object.entries(mapa)
      .filter(([, valor]) => valor > 0)
      .map(([name, value]) => ({ name, value }));
  }, [dadosPeriodo]);

  const rankingClientes = useMemo(() => {
    const mapa = {};

    dadosPeriodo.entradas.filter(ehVendaReal).forEach((entrada) => {
      const nome = entrada.cliente || "Sem cliente";
      mapa[nome] = (mapa[nome] || 0) + entrada.valor;
    });

    return Object.entries(mapa)
      .map(([cliente, valor]) => ({ cliente, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [dadosPeriodo]);
function fecharMesFinanceiro() {
  const fechamento = {
    id: Date.now(),

    inicio: inicioMes,
    fim: hoje,

    dataFechamento: hoje,

    faturamento:
      indicadores.faturamentoCompetencia || 0,

    recebido:
      indicadores.caixaRecebidoTotal || 0,

    recebidoBanco:
      indicadores.tenhoNoBanco || 0,

    recebidoCaixa:
      indicadores.tenhoNoCaixa || 0,

    faturadoEmAberto:
      indicadores.faturadoEmAberto || 0,

    saidas:
      indicadores.saidasTotal || 0,

    lucro:
      indicadores.entradaLiquida || 0,

    quantidadeEntradas:
      dadosPeriodo.entradas.length || 0,

    quantidadeSaidas:
      dadosPeriodo.saidas.length || 0,

    metaMensal,

    diaInicioMesFinanceiro,
  };

  setHistoricoFechamentos((old) => [
    fechamento,
    ...old,
  ]);

 

  registrarAlteracao({
    tipo: "Fechamento",
    modulo: "Histórico Financeiro",
    descricao: `${usuario?.email || "Usuário"} fechou o período financeiro de ${inicioMes} até ${hoje}`,
    valorAntigo: inicioMes,
    valorNovo: hoje,
    itemId: fechamento.id,
  });
}

 
  const propsGlobais = {
    empresaId,
    dadosEmpresa,
    
setDadosEmpresa,
salvarDadosEmpresa,
    hoje,
    acesso,
    usuario,
    admin:
  acesso?.nivel === "admin",
    fecharMesFinanceiro,
    diaInicioMesFinanceiro,
setDiaInicioMesFinanceiro,
    aba,
    setAba,
    salvarEntrada,
    salvarSaida,
    salvarConta,
    salvarCliente,
    salvarRelacaoPaga,
    desfazerUltimaRelacaoPaga,
    editar,
    remover,
    cancelarEdicao,
    alternarConta,
    inicioMes,
    setInicioMes,
    fimMes,
    setFimMes,
    metaMensal,
    setMetaMensal,
    moeda,
    formasPagamento,
    produtosEstoque,
    entradas,
    setEntradas,
    saidas,
    setSaidas,
    contas,
    setContas,
    clientes,
    setClientes,
    estoqueCompras,
    setEstoqueCompras,
    estoquePerdas,
    setEstoquePerdas,
    entradaForm,
    setEntradaForm,
    saidaForm,
    setSaidaForm,
    contaForm,
    setContaForm,
    clienteForm,
    setClienteForm,
    compraEstoqueForm,
    setCompraEstoqueForm,
    perdaEstoqueForm,
    setPerdaEstoqueForm,
    editando,
    setEditando,
    resultadoImportacao,
    setResultadoImportacao,
    textoImportacao,
    setTextoImportacao,
    clientePendenciaSelecionado,
    setClientePendenciaSelecionado,
    chavePix,
    dadosEmpresaTexto,
    botaoCopiado,
    setBotaoCopiado,
    mostrarDadosEmpresa,
    setMostrarDadosEmpresa,
    indicadores,
    dadosPeriodo,
    vendasPorDia,
    servicosPorDia,
    contasPorNome,
    statusContasPizza,
    rankingClientes,
    historicoRelacoes,
    setHistoricoRelacoes,
    historicoFechamentos,
setHistoricoFechamentos,
historicoAlteracoes,
setHistoricoAlteracoes,
registrarAlteracao,
    numero,
    texto,
    normalizar,
    destinoDinheiro,
    statusConta,
    entradaEmAberto,
    textoMovimento,
    ehInjecaoCaixa,
    ehInjecaoLoja,
    ehInjecaoSocios,
    ehInjecaoCapital,
    ehRecuperacaoVale,
    ehValeColaborador,
    ehVendaReal,
    dataRecebimentoEntrada,
    usuariosOnline,
setUsuariosOnline,
    nuvemCarregada,
  };

  return (
    <div style={styles.app}>
      {mobile && (
        <button
          onClick={() => setMenuMobile(!menuMobile)}
          style={{
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 10000,
            width: 48,
            height: 48,
            borderRadius: 14,
            border: 0,
            background: "linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)",
            color: "#fff",
            fontSize: 22,
            fontWeight: "bold",
            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
          }}
        >
          ☰
        </button>
      )}

      {mobile && menuMobile && (
        <div
          onClick={() => setMenuMobile(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9998,
          }}
        />
      )}

      <Sidebar
        {...propsGlobais}
        mobile={mobile}
        menuMobile={menuMobile}
        setMenuMobile={setMenuMobile}
        usuario={usuario}
      />

      <main
        style={{
          ...styles.main,
          paddingTop: mobile ? 76 : styles.main.padding,
        }}
      >
        {aba === "Dashboard" && <Dashboard {...propsGlobais} />}
        
        {aba === "Histórico Financeiro" && (
  <HistoricoFinanceiro {...propsGlobais} />
)}
        {aba === "Entradas" && <Entradas {...propsGlobais} />}
        {aba === "Saídas" && <Saidas {...propsGlobais} />}
        {aba === "Contas a Pagar" && <Contas {...propsGlobais} />}
        {aba === "Clientes" && <Clientes {...propsGlobais} />}
        {aba === "Pendências de Clientes" && <Pendencias {...propsGlobais} />}
        {aba === "Controle de Estoque" && <Estoque {...propsGlobais} />}
        {aba === "Relatório Diário" && <RelatorioDiario {...propsGlobais} />}
        {aba === "Gerenciar Acessos" && <Acessos {...propsGlobais} />}
        {aba.startsWith("Importar") && <Importacao {...propsGlobais} />}
        {aba === "Atualizações" && <Atualizacoes {...propsGlobais} />}
        {aba === "Dados da Empresa" && (
  <DadosEmpresa {...propsGlobais} />
)}
        {aba === "Backups" && (
  <div style={styles.card}>
    <h2 style={styles.titulo}>
      Backups automáticos
    </h2>
    <button
  onClick={criarBackupManual}
  style={{
    ...styles.botao,
    marginBottom: 20,
  }}
>
  Criar Backup Agora
</button>
<button
  onClick={migrarBancoAntigo}
  style={{
    ...styles.botao,
    marginBottom: 20,
    marginLeft: 10,
    background: "#16a34a",
  }}
>
  Migrar Banco Antigo
</button>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {backupsAutomaticos.map(
        (backup) => (
          <div
            key={backup.id}
            style={{
              background:
                "#0f172a",
              border:
                "1px solid #334155",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {backup.id}
            </div>

            <div>
              Entradas:{" "}
              {
                backup
                  ?.entradas
                  ?.length
              }
            </div>

            <div>
              Saídas:{" "}
              {
                backup
                  ?.saidas
                  ?.length
              }
            </div>

            <div>
              Contas:{" "}
              {
                backup
                  ?.contas
                  ?.length
              }
            </div>

            <button
              style={{
                ...styles.botao,
                marginTop: 12,
              }}
              onClick={() =>
                restaurarBackup(
                  backup
                )
              }
            >
              Restaurar backup
            </button>
          </div>
        )
      )}
    </div>
  </div>
)}
        {aba === "Histórico de Alterações" && (
  <HistoricoAlteracoes {...propsGlobais} />
)}

      </main>
    </div>
  );
}