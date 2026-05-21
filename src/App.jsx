import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { auth, db } from "./services/firebase.js";
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
import RelatorioDiario from "./pages/RelatorioDiario.jsx";
import Login from "./pages/Login.jsx";
import Acessos from "./pages/Acessos.jsx";
import Atualizacoes from "./pages/Atualizacoes.jsx";

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

  return <Sistema usuario={usuario} />;
}

function Sistema({ usuario }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const docSistema = doc(db, "sistema", "emplacar");

  const nuvemCarregadaRef = useRef(false);
  const podeSalvarRef = useRef(false);

  const [nuvemCarregada, setNuvemCarregada] = useState(false);
  const [menuMobile, setMenuMobile] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth <= 900);

  const [aba, setAba] = useState("Dashboard");
  const [inicioMes, setInicioMes] = useState(hoje.slice(0, 8) + "01");
  const [fimMes, setFimMes] = useState(hoje);
  const [metaMensal, setMetaMensal] = useState(80000);

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

        setEntradas(Array.isArray(dados.entradas) ? dados.entradas : []);
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
      } else {
        await setDoc(docSistema, {
          entradas: [],
          saidas: [],
          contas: [],
          clientes: [],
          estoqueCompras: [],
          estoquePerdas: [],
          historicoRelacoes: [],
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

  useEffect(() => {
    salvarNaNuvem("entradas", entradas);
  }, [entradas]);

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

    const entradasRecebidasPeriodo = entradas.filter((x) => {
      const dataRecebimento = dataRecebimentoEntrada(x);

      return (
        dataRecebimento &&
        dentroDoPeriodo(dataRecebimento) &&
        x.status === "Pago"
      );
    });

    const vendasRecebidasPeriodo =
  dadosPeriodo.entradasRecebidas.filter(ehVendaReal);

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

    const pagos = saidasTotal + contasPagas;
    const entradaLiquida = caixaRecebidoTotal - pagos;

    const tenhoNoBanco = recebidoBanco - saidasBanco - contasPagas;
    const tenhoNoCaixa = recebidoCaixa - saidasCaixa;

    const dias =
      new Set([
        ...entradasCompetencia.map((x) => x.data),
        ...dadosPeriodo.saidas.map((x) => x.data),
        ...dadosPeriodo.contas.map((x) => x.vencimento),
      ]).size || 1;

    return {
      entradaBruta,
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

  const propsGlobais = {
    hoje,
    usuario,
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
      </main>
    </div>
  );
}