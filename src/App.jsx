import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db, auth } from "./services/firebase.js";

import styles from "./styles/styles.js";

import Sidebar from "./components/Sidebar.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Entradas from "./pages/Entradas.jsx";
import Saidas from "./pages/Saidas.jsx";
import Contas from "./pages/Contas.jsx";
import Clientes from "./pages/Clientes.jsx";
import Pendencias from "./pages/Pendencias.jsx";
import Estoque from "./pages/Estoque.jsx";
import Importacao from "./pages/Importacao.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCarregandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

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

return <Sistema />;
}

function Sistema() {
  const hoje = new Date().toISOString().slice(0, 10);
  const docSistema = doc(db, "sistema", "emplacar");

  function carregar(nome, padrao) {
    try {
      const salvo = localStorage.getItem(nome);
      return salvo ? JSON.parse(salvo) : padrao;
    } catch {
      return padrao;
    }
  }

  const [nuvemCarregada, setNuvemCarregada] = useState(false);

  const [aba, setAba] = useState("Dashboard");
  const [inicioMes, setInicioMes] = useState(hoje.slice(0, 8) + "01");
  const [fimMes, setFimMes] = useState(hoje);

  const [textoImportacao, setTextoImportacao] = useState("");
  const [resultadoImportacao, setResultadoImportacao] = useState("");
  const [clientePendenciaSelecionado, setClientePendenciaSelecionado] = useState(null);
  const [mostrarDadosEmpresa, setMostrarDadosEmpresa] = useState(false);
  const [botaoCopiado, setBotaoCopiado] = useState("");

  const [entradas, setEntradas] = useState(() => carregar("emplacar_entradas", []));
  const [saidas, setSaidas] = useState(() => carregar("emplacar_saidas", []));
  const [contas, setContas] = useState(() => carregar("emplacar_contas", []));
  const [clientes, setClientes] = useState(() => carregar("emplacar_clientes", []));
  const [estoqueCompras, setEstoqueCompras] = useState(() =>
    carregar("emplacar_estoque_compras", [])
  );
  const [estoquePerdas, setEstoquePerdas] = useState(() =>
    carregar("emplacar_estoque_perdas", [])
  );
  const [historicoRelacoes, setHistoricoRelacoes] = useState(() =>
    carregar("emplacar_historico_relacoes", [])
  );

  useEffect(() => {
    const cancelar = onSnapshot(docSistema, async (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data();

        setEntradas(dados.entradas || []);
        setSaidas(dados.saidas || []);
        setContas(dados.contas || []);
        setClientes(dados.clientes || []);
        setEstoqueCompras(dados.estoqueCompras || []);
        setEstoquePerdas(dados.estoquePerdas || []);
        setHistoricoRelacoes(dados.historicoRelacoes || []);
      } else {
        await setDoc(docSistema, {
          entradas,
          saidas,
          contas,
          clientes,
          estoqueCompras,
          estoquePerdas,
          historicoRelacoes,
        });
      }

      setNuvemCarregada(true);
    });

    return () => cancelar();
  }, []);

  async function salvarNaNuvem(campo, valor) {
    if (!nuvemCarregada) return;

    await setDoc(
      docSistema,
      {
        [campo]: valor,
      },
      { merge: true }
    );
  }

  useEffect(() => {
    localStorage.setItem("emplacar_entradas", JSON.stringify(entradas));
    salvarNaNuvem("entradas", entradas);
  }, [entradas]);

  useEffect(() => {
    localStorage.setItem("emplacar_saidas", JSON.stringify(saidas));
    salvarNaNuvem("saidas", saidas);
  }, [saidas]);

  useEffect(() => {
    localStorage.setItem("emplacar_contas", JSON.stringify(contas));
    salvarNaNuvem("contas", contas);
  }, [contas]);

  useEffect(() => {
    localStorage.setItem("emplacar_clientes", JSON.stringify(clientes));
    salvarNaNuvem("clientes", clientes);
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem("emplacar_estoque_compras", JSON.stringify(estoqueCompras));
    salvarNaNuvem("estoqueCompras", estoqueCompras);
  }, [estoqueCompras]);

  useEffect(() => {
    localStorage.setItem("emplacar_estoque_perdas", JSON.stringify(estoquePerdas));
    salvarNaNuvem("estoquePerdas", estoquePerdas);
  }, [estoquePerdas]);

  useEffect(() => {
    localStorage.setItem("emplacar_historico_relacoes", JSON.stringify(historicoRelacoes));
    salvarNaNuvem("historicoRelacoes", historicoRelacoes);
  }, [historicoRelacoes]);

  const chavePix = "63.488.249/0001-08";

  const dadosEmpresaTexto = `IE: 91184662-49
CNPJ: 63.488.249/0001-08
E-MAIL: emplacarmcr@gmail.com
WhatsApp: 45 20311407
CEP: 85960-140
LOGRADOURO: RUA RIO DE JANEIRO
N°: 1766
BAIRRO: CENTRO
CIDADE: MARECHAL CÂNDIDO RONDON`;

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
    relacaoPagaId: "",
  };

  const saidaVazia = {
    data: hoje,
    formaPagamento: "Pix",
    tipoSaida: "",
    conta: "",
    valor: "",
    status: "Pago",
  };

  const contaVazia = {
    conta: "",
    vencimento: hoje,
    valor: "",
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
  const [compraEstoqueForm, setCompraEstoqueForm] = useState(compraEstoqueVazia);
  const [perdaEstoqueForm, setPerdaEstoqueForm] = useState(perdaEstoqueVazia);

  const [editando, setEditando] = useState({
    tipo: null,
    id: null,
  });

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

  function destinoDinheiro(forma) {
    if (forma === "Nota / Faturado") return "Faturado";
    if (["Cheque", "Dinheiro"].includes(forma)) return "Caixa";
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
    const nova = {
      ...entradaForm,
      valor: numero(entradaForm.valor),
      diaPago: entradaForm.diaPago || "",
      relacaoPagaId: entradaForm.relacaoPagaId || "",
      id: editando.tipo === "entrada" ? editando.id : Date.now(),
    };

    if (editando.tipo === "entrada") {
      setEntradas((old) => old.map((x) => (x.id === editando.id ? nova : x)));
    } else {
      setEntradas((old) => [nova, ...old]);
    }

    cancelarEdicao();
  }

  function salvarSaida() {
    const nova = {
      ...saidaForm,
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
      id: editando.tipo === "conta" ? editando.id : Date.now(),
    };

    if (editando.tipo === "conta") {
      setContas((old) => old.map((x) => (x.id === editando.id ? nova : x)));
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

  function salvarRelacaoPaga(pendencia, diaPago) {
    if (!pendencia || !diaPago) return;

    const idRelacao = Date.now();
    const idsEntradas = pendencia.itens.map((item) => item.id);

    const novaRelacao = {
      id: idRelacao,
      cliente: pendencia.cliente,
      diaPago,
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
        formaPagamento: item.formaPagamento,
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
              diaPago,
              relacaoPagaId: idRelacao,
            }
          : entrada
      )
    );

    setClientePendenciaSelecionado(null);
  }

  function excluirRelacaoHistorico(idRelacao) {
    setHistoricoRelacoes((old) =>
      old.filter((relacao) => relacao.id !== idRelacao)
    );
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

    if (tipo === "saida") setSaidaForm(item);
    if (tipo === "conta") setContaForm(item);
    if (tipo === "cliente") setClienteForm(item);
  }

  function remover(tipo, id) {
    if (tipo === "entrada") setEntradas((old) => old.filter((x) => x.id !== id));
    if (tipo === "saida") setSaidas((old) => old.filter((x) => x.id !== id));
    if (tipo === "conta") setContas((old) => old.filter((x) => x.id !== id));
    if (tipo === "cliente") setClientes((old) => old.filter((x) => x.id !== id));
  }

  function alternarConta(id) {
    setContas((old) =>
      old.map((x) =>
        x.id === id
          ? { ...x, status: x.status === "Pago" ? "Pendente" : "Pago" }
          : x
      )
    );
  }

  const dadosPeriodo = useMemo(() => {
    return {
      entradas: entradas.filter((x) => dentroDoPeriodo(x.data)),
      saidas: saidas.filter((x) => dentroDoPeriodo(x.data)),
      contas: contas.filter((x) => dentroDoPeriodo(x.vencimento)),
    };
  }, [entradas, saidas, contas, inicioMes, fimMes]);

  const indicadores = useMemo(() => {
    const entradaBruta = dadosPeriodo.entradas.reduce((s, x) => s + x.valor, 0);

    const notasPendentes = dadosPeriodo.entradas
      .filter((x) => x.formaPagamento === "Nota / Faturado" && !x.diaPago)
      .reduce((s, x) => s + x.valor, 0);

    const recebidoBanco = dadosPeriodo.entradas
      .filter((x) => destinoDinheiro(x.formaPagamento) === "Banco" && x.status === "Pago")
      .reduce((s, x) => s + x.valor, 0);

    const recebidoCaixa = dadosPeriodo.entradas
      .filter((x) => destinoDinheiro(x.formaPagamento) === "Caixa" && x.status === "Pago")
      .reduce((s, x) => s + x.valor, 0);

    const recebidoFaturado = dadosPeriodo.entradas
      .filter((x) => x.formaPagamento === "Nota / Faturado" && x.diaPago)
      .reduce((s, x) => s + x.valor, 0);

    const saidasTotal = dadosPeriodo.saidas.reduce((s, x) => s + x.valor, 0);

    const contasPagas = dadosPeriodo.contas
      .filter((x) => statusConta(x) === "Pago")
      .reduce((s, x) => s + x.valor, 0);

    const contasAPagarEmAberto = dadosPeriodo.contas
      .filter((x) => statusConta(x) !== "Pago")
      .reduce((s, x) => s + x.valor, 0);

    const saidasBanco = dadosPeriodo.saidas
      .filter((x) => destinoDinheiro(x.formaPagamento) === "Banco")
      .reduce((s, x) => s + x.valor, 0);

    const saidasCaixa = dadosPeriodo.saidas
      .filter((x) => destinoDinheiro(x.formaPagamento) === "Caixa")
      .reduce((s, x) => s + x.valor, 0);

    const pagos = saidasTotal + contasPagas;
    const recebidoTotal = recebidoBanco + recebidoCaixa + recebidoFaturado;
    const entradaLiquida = recebidoTotal - pagos;
    const tenhoNoBanco = recebidoBanco + recebidoFaturado - saidasBanco - contasPagas;
    const tenhoNoCaixa = recebidoCaixa - saidasCaixa;

    const dias =
      new Set([
        ...dadosPeriodo.entradas.map((x) => x.data),
        ...dadosPeriodo.saidas.map((x) => x.data),
        ...dadosPeriodo.contas.map((x) => x.vencimento),
      ]).size || 1;

    return {
      entradaBruta,
      entradaLiquida,
      saidasTotal,
      contasEmAberto: contasAPagarEmAberto,
      contasAPagarEmAberto,
      contasAReceberEmAberto: notasPendentes,
      pagos,
      mediaPorDia: entradaBruta / dias,
      recebidoBanco,
      recebidoCaixa,
      recebidoFaturado,
      recebidoTotal,
      totalFaturado: notasPendentes + recebidoFaturado,
      faturadoEmAberto: notasPendentes,
      notasPendentes,
      tenhoNoBanco,
      tenhoNoCaixa,
    };
  }, [dadosPeriodo]);

  const vendasPorDia = useMemo(() => {
    const mapa = {};

    dadosPeriodo.entradas.forEach((entrada) => {
      mapa[entrada.data] = (mapa[entrada.data] || 0) + entrada.valor;
    });

    return Object.entries(mapa)
      .map(([data, valor]) => ({
        data,
        valor,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [dadosPeriodo]);

  const servicosPorDia = useMemo(() => {
    const mapa = {};

    dadosPeriodo.entradas.forEach((entrada) => {
      mapa[entrada.data] = (mapa[entrada.data] || 0) + 1;
    });

    return Object.entries(mapa)
      .map(([data, quantidade]) => ({
        data,
        quantidade,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [dadosPeriodo]);

  const contasPorNome = useMemo(() => {
    const mapa = {};

    dadosPeriodo.contas.forEach((conta) => {
      const nome = conta.conta || "Sem descrição";
      mapa[nome] = (mapa[nome] || 0) + conta.valor;
    });

    return Object.entries(mapa)
      .map(([conta, valor]) => ({
        conta,
        valor,
      }))
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
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [dadosPeriodo]);

  const rankingClientes = useMemo(() => {
    const mapa = {};

    dadosPeriodo.entradas.forEach((entrada) => {
      const nome = entrada.cliente || "Sem cliente";
      mapa[nome] = (mapa[nome] || 0) + entrada.valor;
    });

    return Object.entries(mapa)
      .map(([cliente, valor]) => ({
        cliente,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [dadosPeriodo]);

  const propsGlobais = {
    hoje,
    aba,
    setAba,
    salvarEntrada,
    salvarSaida,
    salvarConta,
    salvarCliente,
    salvarRelacaoPaga,
    excluirRelacaoHistorico,
    editar,
    remover,
    cancelarEdicao,
    alternarConta,
    inicioMes,
    setInicioMes,
    fimMes,
    setFimMes,
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
    numero,
    texto,
    normalizar,
    destinoDinheiro,
    statusConta,
    entradaEmAberto,
  };

  return (
    <div style={styles.app}>
      <Sidebar {...propsGlobais} />

      <main style={styles.main}>
        {aba === "Dashboard" && <Dashboard {...propsGlobais} />}
        {aba === "Entradas" && <Entradas {...propsGlobais} />}
        {aba === "Saídas" && <Saidas {...propsGlobais} />}
        {aba === "Contas a Pagar" && <Contas {...propsGlobais} />}
        {aba === "Clientes" && <Clientes {...propsGlobais} />}
        {aba === "Pendências de Clientes" && <Pendencias {...propsGlobais} />}
        {aba === "Controle de Estoque" && <Estoque {...propsGlobais} />}
        {aba.startsWith("Importar") && <Importacao {...propsGlobais} />}
      </main>
    </div>
  );
}