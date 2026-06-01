import { useMemo, useState } from "react";

import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";
import Select from "../components/Select.jsx";
import Tabela from "../components/Tabela.jsx";
import Kpi from "../components/Kpi.jsx";

import styles from "../styles/styles.js";

const PRODUTOS_INICIAIS_ESTOQUE = [
  "VEICULAR PADRÃO",
  "VEICULAR PRETA",
  "VEICULAR MINI",
  "VEICULAR MINI-MINI",
  "MOTO PADRÃO",
  "MOTO PRETA",
  "MOTO MINI",
  "PLACA TESTE / PERSONALIZADA",
  "SUPORTE TRIÂNGULO MOTO",
  "SUPORTE RESINA MOTO",
  "SUPORTE RESINA CARRO",
  "RIBBON PRETO",
  "RIBBON VERMELHO",
  "RIBBON BRANCO",
  "RIBBON AZUL",
  "RIBBON VERDE",
];

const SERVICOS_INICIAIS_SIMULACAO = [
  "PAR VEICULAR PADRÃO",
  "PAR VEICULAR PRETA",
  "PAR VEICULAR MINI",
  "PAR VEICULAR MINI-MINI",
  "MOTO PADRÃO",
  "MOTO PRETA",
  "MOTO MINI",
  "REBOQUE PADRÃO",
  "REBOQUE PRETA",
  "REBOQUE MINI",
  "RIBBON CARRO",
  "RIBBON MOTO",
];

const MINIMOS_PADRAO_ESTOQUE = {
  "VEICULAR PADRÃO": 10,
  "VEICULAR PRETA": 5,
  "VEICULAR MINI": 5,
  "VEICULAR MINI-MINI": 5,
  "MOTO PADRÃO": 10,
  "MOTO PRETA": 5,
  "MOTO MINI": 5,
  "PLACA TESTE / PERSONALIZADA": 2,
  "SUPORTE TRIÂNGULO MOTO": 10,
  "SUPORTE RESINA MOTO": 10,
  "SUPORTE RESINA CARRO": 10,
  "RIBBON PRETO": 10,
  "RIBBON VERMELHO": 5,
  "RIBBON BRANCO": 5,
  "RIBBON AZUL": 5,
  "RIBBON VERDE": 5,
};

function listaUnica(lista = []) {
  return [...new Set(lista.filter(Boolean))];
}

function criarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function dataInicioMesAtual() {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export default function Estoque({
  entradas = [],
  clientes = [],

  modoRibbonPadrao = "1X",
  setModoRibbonPadrao = () => {},

  compraEstoqueForm = {},
  setCompraEstoqueForm = () => {},
  perdaEstoqueForm = {},
  setPerdaEstoqueForm = () => {},

  estoqueCompras = [],
  setEstoqueCompras = () => {},
  estoquePerdas = [],
  setEstoquePerdas = () => {},

  produtosEstoquePersonalizados = [],
  setProdutosEstoquePersonalizados = () => {},

  produtosEstoqueConfigurados = [],
  servicosSimulacaoEstoque = [],
  setServicosSimulacaoEstoque = () => {},

  minimosEstoqueConfigurados = {},
  setMinimosEstoqueConfigurados = () => {},

  reservasEstoque = [],

  fornecedoresEstoque = [],
  setFornecedoresEstoque = () => {},

  movimentacoesEstoque = [],
  setMovimentacoesEstoque = () => {},

  admin,
  usuarioAtual,

  numero,
  normalizar,
}) {
  const [novoProdutoEstoque, setNovoProdutoEstoque] = useState("");
  const [novoServicoSimulacao, setNovoServicoSimulacao] = useState("");
  const [novoFornecedor, setNovoFornecedor] = useState("");
  const [editandoCompraId, setEditandoCompraId] = useState(null);
  const [editandoPerdaId, setEditandoPerdaId] = useState(null);
  const [filtroDashboard, setFiltroDashboard] = useState("MÊS");

  const [simulacao, setSimulacao] = useState({
    cliente: "",
  });

  const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const agora = () => new Date().toISOString();

  const usuarioAuditoria =
    usuarioAtual?.email ||
    usuarioAtual?.nome ||
    usuarioAtual?.displayName ||
    "Usuário não identificado";

  function n(valor) {
    if (typeof numero === "function") return numero(valor);

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

  function norm(valor) {
    if (typeof normalizar === "function") return normalizar(valor || "");

    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }

  function dentroPeriodoDashboard(data) {
    if (!data) return false;

    if (filtroDashboard === "GERAL") return true;

    const inicio = dataInicioMesAtual();
    const fim = dataHoje();

    return data >= inicio && data <= fim;
  }

  const produtosDisponiveisEstoque = useMemo(() => {
    return listaUnica([
      ...PRODUTOS_INICIAIS_ESTOQUE,
      ...produtosEstoqueConfigurados,
      ...produtosEstoquePersonalizados,
    ]);
  }, [produtosEstoqueConfigurados, produtosEstoquePersonalizados]);

  const tiposSimulacaoDisponiveis = useMemo(() => {
    return listaUnica([
      ...SERVICOS_INICIAIS_SIMULACAO,
      ...servicosSimulacaoEstoque,
    ]);
  }, [servicosSimulacaoEstoque]);

  const fornecedoresDisponiveis = useMemo(() => {
    return listaUnica(fornecedoresEstoque);
  }, [fornecedoresEstoque]);

  function ehRibbon(produto) {
    return norm(produto).includes("RIBBON");
  }

  function normalizarProdutoEstoque(produto) {
    const p = norm(produto || "");

    if (p === "PLACA CARRO") return "VEICULAR PADRÃO";
    if (p === "PLACA MOTO") return "MOTO PADRÃO";
    if (p === "SUPORTE") return "SUPORTE TRIÂNGULO MOTO";

    const encontrado = produtosDisponiveisEstoque.find(
      (item) => norm(item) === p
    );

    return encontrado || produto;
  }

  function lerPreco(valor) {
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

  function minimoDoProduto(produto) {
    const chave = normalizarProdutoEstoque(produto);

    return n(
      minimosEstoqueConfigurados?.[chave] ??
        MINIMOS_PADRAO_ESTOQUE[chave] ??
        0
    );
  }

  function calcularUsoEstoque(produto) {
    const p = norm(produto || "");

    if (p.includes("SUPORTE TRIANGULO")) {
      return { item: "SUPORTE TRIÂNGULO MOTO", quantidade: 1 };
    }

    if (p.includes("SUPORTE RESINA") && p.includes("MOTO")) {
      return { item: "SUPORTE RESINA MOTO", quantidade: 1 };
    }

    if (p.includes("SUPORTE RESINA")) {
      return { item: "SUPORTE RESINA CARRO", quantidade: 1 };
    }

    if (p.includes("SUPORTE")) {
      return { item: "SUPORTE TRIÂNGULO MOTO", quantidade: 1 };
    }

    if (p.includes("TESTE") || p.includes("PERSONALIZADA")) {
      return { item: "PLACA TESTE / PERSONALIZADA", quantidade: 1 };
    }

    const ehMoto = p.includes("MOTO");
    const ehPreta =
      p.includes("PRETA") ||
      p.includes("BLACK") ||
      p.includes("COLECAO") ||
      p.includes("COLEÇÃO") ||
      p.includes("COLECIONADOR");

    const ehMiniMini =
      p.includes("MINI MINI") ||
      p.includes("MINI-MINI") ||
      p.includes("MINIMINI");

    const ehMini = p.includes("MINI") && !ehMiniMini;

    const ehReboque =
      p.includes("REBOQUE") ||
      p.includes("DOLLY") ||
      p.includes("CARRETINHA");

    const ehAvulsa =
      p.includes("AVULSA") ||
      p.includes("DIANTEIRA") ||
      p.includes("TRASEIRA");

    const quantidade = ehReboque || ehAvulsa ? 1 : 2;

    if (ehMoto) {
      if (ehPreta) return { item: "MOTO PRETA", quantidade: 1 };
      if (ehMini) return { item: "MOTO MINI", quantidade: 1 };
      return { item: "MOTO PADRÃO", quantidade: 1 };
    }

    if (ehPreta) return { item: "VEICULAR PRETA", quantidade };
    if (ehMiniMini) return { item: "VEICULAR MINI-MINI", quantidade };
    if (ehMini) return { item: "VEICULAR MINI", quantidade };

    return { item: "VEICULAR PADRÃO", quantidade };
  }

  function calcularConsumoSimulacao(tipo) {
    const t = norm(tipo || "");

    if (t.includes("RIBBON")) {
      const ehMoto = t.includes("MOTO");
      const passadas = modoRibbonPadrao === "2X" ? 2 : 1;
      const tamanhoPlacaMetro = ehMoto ? 0.2 : 0.4;

      return {
        item: "RIBBON PRETO",
        consumo: tamanhoPlacaMetro * passadas,
        unidade: "m",
      };
    }

    if (t.includes("MOTO PRETA")) return { item: "MOTO PRETA", consumo: 1 };
    if (t.includes("MOTO MINI")) return { item: "MOTO MINI", consumo: 1 };
    if (t.includes("MOTO")) return { item: "MOTO PADRÃO", consumo: 1 };

    if (t.includes("PRETA")) {
      return {
        item: "VEICULAR PRETA",
        consumo: t.includes("REBOQUE") ? 1 : 2,
      };
    }

    if (
      t.includes("MINI-MINI") ||
      t.includes("MINI MINI") ||
      t.includes("MINIMINI")
    ) {
      return {
        item: "VEICULAR MINI-MINI",
        consumo: t.includes("REBOQUE") ? 1 : 2,
      };
    }

    if (t.includes("MINI")) {
      return {
        item: "VEICULAR MINI",
        consumo: t.includes("REBOQUE") ? 1 : 2,
      };
    }

    return {
      item: "VEICULAR PADRÃO",
      consumo: t.includes("REBOQUE") ? 1 : 2,
    };
  }

  function precoClientePorServico(cliente, tipoServico) {
    if (!cliente) return 0;

    const tipo = norm(tipoServico);

    if (tipo.includes("RIBBON")) {
      if (tipo.includes("MOTO")) return lerPreco(cliente.precoMoto);
      return lerPreco(cliente.precoParVeicular);
    }

    if (tipo.includes("MOTO")) return lerPreco(cliente.precoMoto);
    if (tipo.includes("REBOQUE")) return lerPreco(cliente.precoReboque);
    if (tipo.includes("PRETA")) return lerPreco(cliente.precoPlacaPreta);
    if (tipo.includes("MINI")) return lerPreco(cliente.precoMini);

    return lerPreco(cliente.precoParVeicular);
  }

  function registrarMovimentacaoEstoque(movimento) {
    const item = {
      id: criarId(),
      dataHora: agora(),
      usuario: usuarioAuditoria,
      ...movimento,
    };

    setMovimentacoesEstoque((old) => [item, ...old]);

    return item;
  }

  function adicionarProdutoPersonalizado() {
    const nome = norm(novoProdutoEstoque);

    if (!nome) return;

    if (produtosDisponiveisEstoque.map(norm).includes(nome)) {
      alert("Produto já existe.");
      return;
    }

    setProdutosEstoquePersonalizados((old) => [...old, nome]);
    setNovoProdutoEstoque("");

    registrarMovimentacaoEstoque({
      tipo: "CONFIGURAÇÃO",
      origem: "Produto personalizado",
      produto: nome,
      quantidade: 0,
      motivo: "Produto criado no estoque",
    });
  }

  function adicionarServicoSimulacao() {
    const nome = norm(novoServicoSimulacao);

    if (!nome) return;

    if (tiposSimulacaoDisponiveis.map(norm).includes(nome)) {
      alert("Serviço já existe.");
      return;
    }

    setServicosSimulacaoEstoque((old) => [...old, nome]);
    setNovoServicoSimulacao("");

    registrarMovimentacaoEstoque({
      tipo: "CONFIGURAÇÃO",
      origem: "Serviço de simulação",
      produto: nome,
      quantidade: 0,
      motivo: "Serviço criado para simulação de estoque",
    });
  }

  function adicionarFornecedor() {
    const nome = novoFornecedor.trim();

    if (!nome) return;

    if (fornecedoresDisponiveis.map(norm).includes(norm(nome))) {
      alert("Fornecedor já existe.");
      return;
    }

    setFornecedoresEstoque((old) => [...old, nome]);
    setNovoFornecedor("");

    registrarMovimentacaoEstoque({
      tipo: "CONFIGURAÇÃO",
      origem: "Fornecedor",
      produto: "-",
      quantidade: 0,
      motivo: `Fornecedor criado: ${nome}`,
    });
  }

  function salvarCompraEstoque() {
    if (!compraEstoqueForm.produto || !compraEstoqueForm.quantidade) return;

    const item = {
      id: editandoCompraId || criarId(),
      ...compraEstoqueForm,
      produto: normalizarProdutoEstoque(compraEstoqueForm.produto),
      quantidade: n(compraEstoqueForm.quantidade),
      fornecedor: compraEstoqueForm.fornecedor || "",
      larguraRibbon: compraEstoqueForm.larguraRibbon || "",
      metragemRibbon: compraEstoqueForm.metragemRibbon || "",
      custoTotal: n(compraEstoqueForm.custoTotal),
      criadoPor: editandoCompraId ? compraEstoqueForm.criadoPor : usuarioAuditoria,
      criadoEm: editandoCompraId ? compraEstoqueForm.criadoEm : agora(),
      atualizadoPor: usuarioAuditoria,
      atualizadoEm: agora(),
    };

    const compraAnterior = estoqueCompras.find((x) => x.id === editandoCompraId);

    if (editandoCompraId) {
      setEstoqueCompras((old) =>
        old.map((x) => (x.id === editandoCompraId ? item : x))
      );

      registrarMovimentacaoEstoque({
        tipo: "EDIÇÃO",
        origem: "Compra de estoque",
        produto: item.produto,
        quantidade: item.quantidade,
        antes: compraAnterior || null,
        depois: item,
        motivo: "Compra editada",
      });
    } else {
      setEstoqueCompras((old) => [item, ...old]);

      registrarMovimentacaoEstoque({
        tipo: "ENTRADA",
        origem: "Compra de estoque",
        produto: item.produto,
        quantidade: item.quantidade,
        fornecedor: item.fornecedor || "-",
        custoTotal: item.custoTotal || 0,
        motivo: item.observacao || "Compra lançada",
      });
    }

    setEditandoCompraId(null);

    setCompraEstoqueForm({
      ...compraEstoqueForm,
      quantidade: "",
      fornecedor: compraEstoqueForm.fornecedor || "",
      larguraRibbon: "",
      metragemRibbon: "",
      custoTotal: "",
      observacao: "",
    });
  }

  function salvarPerdaEstoque() {
    if (!perdaEstoqueForm.produto || !perdaEstoqueForm.quantidade) return;

    const item = {
      id: editandoPerdaId || criarId(),
      ...perdaEstoqueForm,
      produto: normalizarProdutoEstoque(perdaEstoqueForm.produto),
      quantidade: n(perdaEstoqueForm.quantidade),
      criadoPor: editandoPerdaId ? perdaEstoqueForm.criadoPor : usuarioAuditoria,
      criadoEm: editandoPerdaId ? perdaEstoqueForm.criadoEm : agora(),
      atualizadoPor: usuarioAuditoria,
      atualizadoEm: agora(),
    };

    const perdaAnterior = estoquePerdas.find((x) => x.id === editandoPerdaId);

    if (editandoPerdaId) {
      setEstoquePerdas((old) =>
        old.map((x) => (x.id === editandoPerdaId ? item : x))
      );

      registrarMovimentacaoEstoque({
        tipo: "EDIÇÃO",
        origem: "Perda de estoque",
        produto: item.produto,
        quantidade: item.quantidade,
        antes: perdaAnterior || null,
        depois: item,
        motivo: "Perda editada",
      });
    } else {
      setEstoquePerdas((old) => [item, ...old]);

      registrarMovimentacaoEstoque({
        tipo: "PERDA",
        origem: "Perda / placa errada",
        produto: item.produto,
        quantidade: item.quantidade,
        motivo: item.motivo || "Perda lançada",
      });
    }

    setEditandoPerdaId(null);

    setPerdaEstoqueForm({
      ...perdaEstoqueForm,
      quantidade: "",
      motivo: "Placa errada",
    });
  }

  function editarCompra(item) {
    if (!admin) return;

    setEditandoCompraId(item.id);

    setCompraEstoqueForm({
      data: item.data || "",
      produto: item.produto || "",
      quantidade: String(item.quantidade ?? ""),
      fornecedor: item.fornecedor || "",
      larguraRibbon: item.larguraRibbon || "",
      metragemRibbon: item.metragemRibbon || "",
      custoTotal: String(item.custoTotal ?? ""),
      observacao: item.observacao || "",
      criadoPor: item.criadoPor || "",
      criadoEm: item.criadoEm || "",
    });
  }

  function editarPerda(item) {
    if (!admin) return;

    setEditandoPerdaId(item.id);

    setPerdaEstoqueForm({
      data: item.data || "",
      produto: item.produto || "",
      quantidade: String(item.quantidade ?? ""),
      motivo: item.motivo || "",
      criadoPor: item.criadoPor || "",
      criadoEm: item.criadoEm || "",
    });
  }

  function cancelarEdicaoEstoque() {
    setEditandoCompraId(null);
    setEditandoPerdaId(null);

    setCompraEstoqueForm({
      ...compraEstoqueForm,
      quantidade: "",
      larguraRibbon: "",
      metragemRibbon: "",
      custoTotal: "",
      observacao: "",
    });

    setPerdaEstoqueForm({
      ...perdaEstoqueForm,
      quantidade: "",
      motivo: "Placa errada",
    });
  }

  function removerMovimentoEstoque(tipo, id) {
    if (!admin) {
      alert("Apenas administrador pode excluir lançamentos de estoque.");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este lançamento de estoque?")) {
      return;
    }

    if (tipo === "compra") {
      const item = estoqueCompras.find((x) => x.id === id);

      setEstoqueCompras((old) => old.filter((compra) => compra.id !== id));

      registrarMovimentacaoEstoque({
        tipo: "EXCLUSÃO",
        origem: "Compra de estoque",
        produto: item?.produto || "-",
        quantidade: item?.quantidade || 0,
        antes: item || null,
        depois: null,
        motivo: "Compra excluída",
      });
    }

    if (tipo === "perda") {
      const item = estoquePerdas.find((x) => x.id === id);

      setEstoquePerdas((old) => old.filter((perda) => perda.id !== id));

      registrarMovimentacaoEstoque({
        tipo: "EXCLUSÃO",
        origem: "Perda de estoque",
        produto: item?.produto || "-",
        quantidade: item?.quantidade || 0,
        antes: item || null,
        depois: null,
        motivo: "Perda excluída",
      });
    }
  }

  const usosEstoqueServicos = useMemo(() => {
    return entradas
      .map((entrada) => {
        const uso = calcularUsoEstoque(entrada.produto);
        if (!uso) return null;

        return {
          id: entrada.id || `${entrada.data}-${entrada.cliente}-${entrada.placa}`,
          data: entrada.data,
          cliente: entrada.cliente,
          produtoServico: entrada.produto,
          placa: entrada.placa,
          itemEstoque: uso.item,
          quantidade: uso.quantidade,
          origem: "Venda / serviço",
        };
      })
      .filter(Boolean);
  }, [entradas]);

  const estoqueResumo = useMemo(() => {
    return produtosDisponiveisEstoque.map((produto) => {
      const comprasDoProduto = estoqueCompras.filter(
        (item) => normalizarProdutoEstoque(item.produto) === produto
      );

      const compras = comprasDoProduto.reduce(
        (soma, item) => soma + n(item.quantidade),
        0
      );

      const custoTotal = comprasDoProduto.reduce(
        (soma, item) => soma + n(item.custoTotal),
        0
      );

      const custoMedio = compras > 0 ? custoTotal / compras : 0;

      const usadoEmServicos = usosEstoqueServicos.reduce((soma, uso) => {
        if (uso.itemEstoque !== produto) return soma;
        return soma + n(uso.quantidade);
      }, 0);

      const perdas = estoquePerdas
        .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
        .reduce((soma, item) => soma + n(item.quantidade), 0);

      const reservado = reservasEstoque
        .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
        .reduce((soma, item) => soma + n(item.quantidade), 0);

      const saldoFisico = compras - usadoEmServicos - perdas;
      const saldoDisponivel = saldoFisico - reservado;
      const estoqueMinimo = minimoDoProduto(produto);
      const valorAtual = saldoFisico * custoMedio;

      const mediaConsumoDiario =
        usadoEmServicos > 0 ? usadoEmServicos / 30 : 0;

      const diasRestantes =
        mediaConsumoDiario > 0
          ? Math.floor(saldoDisponivel / mediaConsumoDiario)
          : saldoDisponivel > 0
          ? 999
          : 0;

      const status =
        saldoDisponivel <= 0
          ? "CRÍTICO"
          : saldoDisponivel <= estoqueMinimo
          ? "BAIXO"
          : "OK";

      return {
        produto,
        compras,
        custoTotal,
        custoMedio,
        usadoEmServicos,
        perdas,
        reservado,
        saldoFisico,
        saldoDisponivel,
        estoqueMinimo,
        valorAtual,
        mediaConsumoDiario,
        diasRestantes,
        status,
      };
    });
  }, [
    produtosDisponiveisEstoque,
    estoqueCompras,
    estoquePerdas,
    reservasEstoque,
    usosEstoqueServicos,
    minimosEstoqueConfigurados,
  ]);

  const livroMovimentacoes = useMemo(() => {
    const compras = estoqueCompras.map((item) => ({
      id: `compra-${item.id}`,
      data: item.data,
      tipo: "ENTRADA",
      origem: "Compra",
      produto: normalizarProdutoEstoque(item.produto),
      quantidade: n(item.quantidade),
      valor: n(item.custoTotal),
      fornecedor: item.fornecedor || "-",
      usuario: item.atualizadoPor || item.criadoPor || "-",
      observacao: item.observacao || "-",
    }));

    const vendas = usosEstoqueServicos.map((item) => ({
      id: `venda-${item.id}`,
      data: item.data,
      tipo: "SAÍDA",
      origem: "Venda / serviço",
      produto: item.itemEstoque,
      quantidade: n(item.quantidade),
      valor: 0,
      fornecedor: "-",
      usuario: "-",
      observacao: `${item.cliente || "-"} | ${item.placa || "-"}`,
    }));

    const perdas = estoquePerdas.map((item) => ({
      id: `perda-${item.id}`,
      data: item.data,
      tipo: "PERDA",
      origem: "Perda / placa errada",
      produto: normalizarProdutoEstoque(item.produto),
      quantidade: n(item.quantidade),
      valor: 0,
      fornecedor: "-",
      usuario: item.atualizadoPor || item.criadoPor || "-",
      observacao: item.motivo || "-",
    }));

    const auditoria = movimentacoesEstoque.map((item) => ({
      id: `auditoria-${item.id}`,
      data: item.dataHora ? String(item.dataHora).slice(0, 10) : "",
      tipo: item.tipo || "-",
      origem: item.origem || "-",
      produto: item.produto || "-",
      quantidade: n(item.quantidade),
      valor: n(item.custoTotal),
      fornecedor: item.fornecedor || "-",
      usuario: item.usuario || "-",
      observacao: item.motivo || "-",
    }));

    return [...auditoria, ...compras, ...vendas, ...perdas].sort((a, b) =>
      String(b.data || "").localeCompare(String(a.data || ""))
    );
  }, [estoqueCompras, usosEstoqueServicos, estoquePerdas, movimentacoesEstoque]);

  const movimentacoesReais = livroMovimentacoes.filter(
    (item) =>
      item.tipo === "ENTRADA" ||
      item.tipo === "SAÍDA" ||
      item.tipo === "PERDA"
  );

  const auditoriaEstoque = livroMovimentacoes.filter(
    (item) =>
      item.tipo === "CONFIGURAÇÃO" ||
      item.tipo === "EDIÇÃO" ||
      item.tipo === "EXCLUSÃO"
  );

  const movimentacoesPeriodo = movimentacoesReais.filter((item) =>
    dentroPeriodoDashboard(item.data)
  );

  const comprasPeriodo = movimentacoesPeriodo.filter(
    (item) => item.tipo === "ENTRADA"
  );

  const consumoPeriodo = movimentacoesPeriodo.filter(
    (item) => item.tipo === "SAÍDA"
  );

  const perdasPeriodo = movimentacoesPeriodo.filter(
    (item) => item.tipo === "PERDA"
  );

  const totalCompras = estoqueResumo.reduce((soma, item) => soma + item.compras, 0);
  const totalUsado = estoqueResumo.reduce(
    (soma, item) => soma + item.usadoEmServicos,
    0
  );
  const totalPerdas = estoqueResumo.reduce((soma, item) => soma + item.perdas, 0);
  const saldoFisicoTotal = estoqueResumo.reduce(
    (soma, item) => soma + item.saldoFisico,
    0
  );
  const saldoDisponivelTotal = estoqueResumo.reduce(
    (soma, item) => soma + item.saldoDisponivel,
    0
  );
  const totalReservado = estoqueResumo.reduce(
    (soma, item) => soma + item.reservado,
    0
  );
  const valorTotalEstoque = estoqueResumo.reduce(
    (soma, item) => soma + item.valorAtual,
    0
  );
  const valorPerdasGeral = estoqueResumo.reduce(
    (soma, item) => soma + item.perdas * item.custoMedio,
    0
  );
  const itensCriticos = estoqueResumo.filter((item) => item.status === "CRÍTICO").length;
  const itensBaixos = estoqueResumo.filter((item) => item.status === "BAIXO").length;

  const comprasMesQuantidade = comprasPeriodo.reduce(
    (soma, item) => soma + n(item.quantidade),
    0
  );
  const comprasMesValor = comprasPeriodo.reduce(
    (soma, item) => soma + n(item.valor),
    0
  );
  const consumoMesQuantidade = consumoPeriodo.reduce(
    (soma, item) => soma + n(item.quantidade),
    0
  );
  const perdasMesQuantidade = perdasPeriodo.reduce(
    (soma, item) => soma + n(item.quantidade),
    0
  );

  const consumoPorProduto = useMemo(() => {
    const mapa = {};

    consumoPeriodo.forEach((item) => {
      const produto = item.produto || "Sem produto";
      mapa[produto] = (mapa[produto] || 0) + n(item.quantidade);
    });

    return Object.entries(mapa)
      .map(([produto, quantidade]) => ({ produto, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [movimentacoesPeriodo]);

  const perdasPorProduto = useMemo(() => {
    const mapa = {};

    perdasPeriodo.forEach((item) => {
      const produto = item.produto || "Sem produto";
      mapa[produto] = (mapa[produto] || 0) + n(item.quantidade);
    });

    return Object.entries(mapa)
      .map(([produto, quantidade]) => {
        const resumo = estoqueResumo.find((x) => x.produto === produto);
        const custoMedio = resumo?.custoMedio || 0;

        return {
          produto,
          quantidade,
          valor: quantidade * custoMedio,
        };
      })
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [movimentacoesPeriodo, estoqueResumo]);

  const paretoConsumo = useMemo(() => {
    const total = consumoPorProduto.reduce(
      (soma, item) => soma + item.quantidade,
      0
    );

    let acumulado = 0;

    return consumoPorProduto.map((item) => {
      acumulado += item.quantidade;

      return {
        ...item,
        percentual: total > 0 ? (item.quantidade / total) * 100 : 0,
        acumulado: total > 0 ? (acumulado / total) * 100 : 0,
      };
    });
  }, [consumoPorProduto]);

  const produtosCriticos = estoqueResumo
    .filter((item) => item.status === "CRÍTICO" || item.status === "BAIXO")
    .sort((a, b) => a.saldoDisponivel - b.saldoDisponivel);

  const tabelaGerencialEstoque = estoqueResumo
    .map((item) => ({
      ...item,
      diasTexto:
        item.diasRestantes === 999
          ? "Sem consumo"
          : `${item.diasRestantes} dias`,
    }))
    .sort((a, b) => {
      const peso = { CRÍTICO: 0, BAIXO: 1, OK: 2 };
      return peso[a.status] - peso[b.status];
    });

  const clienteSelecionado = clientes.find(
    (c) =>
      norm(c.nome).includes(norm(simulacao.cliente)) ||
      norm(simulacao.cliente).includes(norm(c.nome))
  );

  return (
    <>
      <div style={styles.kpis}>
        <Kpi titulo="Saldo físico" valor={`${saldoFisicoTotal} un.`} />
        <Kpi titulo="Disponível" valor={`${saldoDisponivelTotal} un.`} />
        <Kpi titulo="Reservado" valor={`${totalReservado} un.`} />
        <Kpi titulo="Valor em estoque" valor={moeda.format(valorTotalEstoque)} />
        <Kpi titulo="Compras" valor={`${totalCompras} un.`} />
        <Kpi titulo="Usado em vendas" valor={`${totalUsado} un.`} />
        <Kpi titulo="Perdas / erros" valor={`${totalPerdas} un.`} />
        <Kpi titulo="Itens críticos" valor={itensCriticos} />
        <Kpi titulo="Estoque baixo" valor={itensBaixos} />
      </div>

      <Card titulo="Dashboard gerencial de estoque">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            style={{
              ...styles.botao,
              opacity: filtroDashboard === "MÊS" ? 1 : 0.6,
            }}
            onClick={() => setFiltroDashboard("MÊS")}
          >
            Ver mês atual
          </button>

          <button
            style={{
              ...styles.botao,
              opacity: filtroDashboard === "GERAL" ? 1 : 0.6,
            }}
            onClick={() => setFiltroDashboard("GERAL")}
          >
            Ver geral
          </button>
        </div>

        <div style={styles.kpis}>
          <Kpi titulo="Compras do período" valor={`${comprasMesQuantidade} un.`} />
          <Kpi titulo="Valor comprado" valor={moeda.format(comprasMesValor)} />
          <Kpi titulo="Consumo do período" valor={`${consumoMesQuantidade} un.`} />
          <Kpi titulo="Perdas do período" valor={`${perdasMesQuantidade} un.`} />
          <Kpi titulo="Valor perdas geral" valor={moeda.format(valorPerdasGeral)} />
        </div>
      </Card>

      <div style={styles.grid2}>
        <Card titulo="Pareto de consumo">
          <Tabela
            colunas={[
              "Produto",
              "Qtd consumida",
              "% do consumo",
              "% acumulado",
            ]}
            dados={paretoConsumo.map((item) => [
              item.produto,
              item.quantidade,
              `${item.percentual.toFixed(1)}%`,
              `${item.acumulado.toFixed(1)}%`,
            ])}
          />
        </Card>

        <Card titulo="Top perdas por produto">
          <Tabela
            colunas={["Produto", "Qtd perdida", "Valor estimado"]}
            dados={perdasPorProduto.map((item) => [
              item.produto,
              item.quantidade,
              moeda.format(item.valor || 0),
            ])}
          />
        </Card>
      </div>

      <Card titulo="Tabela gerencial de estoque">
        <Tabela
          colunas={[
            "Produto",
            "Físico",
            "Reservado",
            "Disponível",
            "Mínimo",
            "Custo médio",
            "Valor atual",
            "Consumo médio/dia",
            "Dias restantes",
            "Status",
          ]}
          dados={tabelaGerencialEstoque.map((item) => [
            item.produto,
            item.saldoFisico,
            item.reservado,
            item.saldoDisponivel,
            item.estoqueMinimo,
            moeda.format(item.custoMedio || 0),
            moeda.format(item.valorAtual || 0),
            item.mediaConsumoDiario.toFixed(2),
            item.diasTexto,
            item.status,
          ])}
        />
      </Card>

      <Card titulo="Produtos em atenção">
        <Tabela
          colunas={[
            "Produto",
            "Disponível",
            "Mínimo",
            "Faltam para mínimo",
            "Status",
          ]}
          dados={produtosCriticos.map((item) => [
            item.produto,
            item.saldoDisponivel,
            item.estoqueMinimo,
            Math.max(item.estoqueMinimo - item.saldoDisponivel, 0),
            item.status,
          ])}
        />
      </Card>

      <Card titulo="Configuração SaaS do estoque">
        <div style={styles.formGrid}>
          <Campo
            label="Novo produto configurável da empresa"
            valor={novoProdutoEstoque}
            mudar={setNovoProdutoEstoque}
          />

          <button
            style={styles.botaoSecundario || styles.botao}
            onClick={adicionarProdutoPersonalizado}
          >
            Adicionar produto
          </button>

          <Campo
            label="Novo fornecedor"
            valor={novoFornecedor}
            mudar={setNovoFornecedor}
          />

          <button
            style={styles.botaoSecundario || styles.botao}
            onClick={adicionarFornecedor}
          >
            Adicionar fornecedor
          </button>

          <Campo
            label="Novo serviço para simulação"
            valor={novoServicoSimulacao}
            mudar={setNovoServicoSimulacao}
          />

          <button
            style={styles.botaoSecundario || styles.botao}
            onClick={adicionarServicoSimulacao}
          >
            Adicionar serviço
          </button>
        </div>

        <p style={{ color: "#94a3b8", marginTop: 12 }}>
          Regra SaaS: produtos, fornecedores, serviços e mínimos devem ser
          configuráveis por empresa.
        </p>
      </Card>

      <Card titulo="Configuração industrial do ribbon">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{ ...styles.botao, opacity: modoRibbonPadrao === "1X" ? 1 : 0.6 }}
            onClick={() => setModoRibbonPadrao("1X")}
          >
            Ribbon padrão 1X
          </button>

          <button
            style={{ ...styles.botao, opacity: modoRibbonPadrao === "2X" ? 1 : 0.6 }}
            onClick={() => setModoRibbonPadrao("2X")}
          >
            Ribbon padrão 2X
          </button>

          <strong style={{ color: "#fff" }}>Modo atual: {modoRibbonPadrao}</strong>
        </div>
      </Card>

      <Card titulo="Projeção de faturamento pelo estoque disponível">
        <div style={styles.formGrid}>
          <Select
            label="Cliente"
            valor={simulacao.cliente}
            mudar={(v) => setSimulacao({ ...simulacao, cliente: v })}
            opcoes={clientes.map((cliente) => cliente.nome)}
          />
        </div>

        <Tabela
          colunas={[
            "Serviço",
            "Produto físico",
            "Consumo",
            "Saldo físico",
            "Reservado",
            "Disponível",
            "Qtd possível",
            "Preço",
            "Custo projetado",
            "Lucro projetado",
            "Faturamento projetado",
          ]}
          dados={tiposSimulacaoDisponiveis.map((tipoServico) => {
            const regra = calcularConsumoSimulacao(tipoServico);
            const itemEstoque = estoqueResumo.find(
              (item) => item.produto === regra.item
            );

            const saldoFisico = itemEstoque?.saldoFisico || 0;
            const reservado = itemEstoque?.reservado || 0;
            const saldoDisponivel = itemEstoque?.saldoDisponivel || 0;

            const qtdPossivel = Math.max(
              Math.floor(saldoDisponivel / regra.consumo),
              0
            );

            const preco = precoClientePorServico(clienteSelecionado, tipoServico);
            const custoProjetado =
              qtdPossivel * regra.consumo * (itemEstoque?.custoMedio || 0);
            const faturamentoProjetado = qtdPossivel * preco;
            const lucroProjetado = faturamentoProjetado - custoProjetado;

            return [
              tipoServico,
              regra.item,
              regra.consumo,
              saldoFisico,
              reservado,
              saldoDisponivel,
              qtdPossivel,
              moeda.format(preco),
              moeda.format(custoProjetado),
              moeda.format(lucroProjetado),
              moeda.format(faturamentoProjetado),
            ];
          })}
        />
      </Card>

      <Card titulo="Resumo profissional do estoque">
        <Tabela
          colunas={[
            "Produto físico",
            "Compras",
            "Custo total",
            "Custo médio",
            "Usado em serviços",
            "Perdas",
            "Reservado",
            "Físico",
            "Disponível",
            "Mínimo",
            "Status",
          ]}
          dados={estoqueResumo.map((item) => [
            item.produto,
            item.compras,
            moeda.format(item.custoTotal || 0),
            moeda.format(item.custoMedio || 0),
            item.usadoEmServicos,
            item.perdas,
            item.reservado,
            item.saldoFisico,
            item.saldoDisponivel,
            item.estoqueMinimo,
            item.status,
          ])}
        />
      </Card>

      <div style={styles.grid2}>
        <Card titulo={editandoCompraId ? "Editando compra de estoque" : "Adicionar compra de estoque"}>
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={compraEstoqueForm.data || ""}
              mudar={(v) => setCompraEstoqueForm({ ...compraEstoqueForm, data: v })}
            />

            <Select
              label="Fornecedor"
              valor={compraEstoqueForm.fornecedor || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, fornecedor: v })
              }
              opcoes={fornecedoresDisponiveis}
            />

            <Select
              label="Produto físico"
              valor={compraEstoqueForm.produto || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, produto: v })
              }
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={compraEstoqueForm.quantidade || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, quantidade: v })
              }
            />

            {ehRibbon(compraEstoqueForm.produto) && (
              <>
                <Campo
                  label="Largura do ribbon (mm)"
                  tipo="number"
                  valor={compraEstoqueForm.larguraRibbon || ""}
                  mudar={(v) =>
                    setCompraEstoqueForm({
                      ...compraEstoqueForm,
                      larguraRibbon: v,
                    })
                  }
                />

                <Campo
                  label="Metragem do rolo (m)"
                  tipo="number"
                  valor={compraEstoqueForm.metragemRibbon || ""}
                  mudar={(v) =>
                    setCompraEstoqueForm({
                      ...compraEstoqueForm,
                      metragemRibbon: v,
                    })
                  }
                />
              </>
            )}

            <Campo
              label="Custo total da compra"
              tipo="number"
              valor={compraEstoqueForm.custoTotal || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, custoTotal: v })
              }
            />

            <Campo
              label="Observação"
              valor={compraEstoqueForm.observacao || ""}
              mudar={(v) =>
                setCompraEstoqueForm({ ...compraEstoqueForm, observacao: v })
              }
            />

            <button style={styles.botao} onClick={salvarCompraEstoque}>
              {editandoCompraId ? "Salvar edição" : "Adicionar compra"}
            </button>

            {editandoCompraId && (
              <button style={styles.botaoCinza} onClick={cancelarEdicaoEstoque}>
                Cancelar edição
              </button>
            )}
          </div>
        </Card>

        <Card titulo={editandoPerdaId ? "Editando perda de estoque" : "Lançar perda / placa errada"}>
          <div style={styles.formGrid}>
            <Campo
              label="Data"
              tipo="date"
              valor={perdaEstoqueForm.data || ""}
              mudar={(v) => setPerdaEstoqueForm({ ...perdaEstoqueForm, data: v })}
            />

            <Select
              label="Produto físico"
              valor={perdaEstoqueForm.produto || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, produto: v })
              }
              opcoes={produtosDisponiveisEstoque}
            />

            <Campo
              label="Quantidade"
              tipo="number"
              valor={perdaEstoqueForm.quantidade || ""}
              mudar={(v) =>
                setPerdaEstoqueForm({ ...perdaEstoqueForm, quantidade: v })
              }
            />

            <Campo
              label="Motivo"
              valor={perdaEstoqueForm.motivo || ""}
              mudar={(v) => setPerdaEstoqueForm({ ...perdaEstoqueForm, motivo: v })}
            />

            <button style={styles.botao} onClick={salvarPerdaEstoque}>
              {editandoPerdaId ? "Salvar edição" : "Lançar perda"}
            </button>

            {editandoPerdaId && (
              <button style={styles.botaoCinza} onClick={cancelarEdicaoEstoque}>
                Cancelar edição
              </button>
            )}
          </div>
        </Card>
      </div>

      <div style={styles.grid2}>
        <Card titulo="Histórico de compras">
          <Tabela
            colunas={[
              "Data",
              "Fornecedor",
              "Produto",
              "Qtd",
              "Largura",
              "Metragem",
              "Custo total",
              "Custo médio",
              "Usuário",
              "Observação",
              "Ações",
            ]}
            dados={estoqueCompras.map((item) => [
              item.data,
              item.fornecedor || "-",
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.larguraRibbon ? `${item.larguraRibbon} mm` : "-",
              item.metragemRibbon ? `${item.metragemRibbon} m` : "-",
              moeda.format(item.custoTotal || 0),
              moeda.format(
                (item.custoTotal || 0) /
                  ((item.quantidade || 1) === 0 ? 1 : item.quantidade || 1)
              ),
              item.atualizadoPor || item.criadoPor || "-",
              item.observacao || "-",
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {admin && (
                  <button style={styles.detalhes} onClick={() => editarCompra(item)}>
                    Editar
                  </button>
                )}

                {admin && (
                  <button
                    style={styles.excluir}
                    onClick={() => removerMovimentoEstoque("compra", item.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>,
            ])}
          />
        </Card>

        <Card titulo="Histórico de perdas / placas erradas">
          <Tabela
            colunas={["Data", "Produto", "Quantidade", "Motivo", "Usuário", "Ações"]}
            dados={estoquePerdas.map((item) => [
              item.data,
              normalizarProdutoEstoque(item.produto),
              item.quantidade,
              item.motivo || "-",
              item.atualizadoPor || item.criadoPor || "-",
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {admin && (
                  <button style={styles.detalhes} onClick={() => editarPerda(item)}>
                    Editar
                  </button>
                )}

                {admin && (
                  <button
                    style={styles.excluir}
                    onClick={() => removerMovimentoEstoque("perda", item.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>,
            ])}
          />
        </Card>
      </div>

      <Card titulo="Livro de movimentações do estoque">
        <Tabela
          colunas={[
            "Data",
            "Tipo",
            "Origem",
            "Produto",
            "Quantidade",
            "Valor",
            "Fornecedor",
            "Usuário",
            "Observação",
          ]}
          dados={movimentacoesReais.map((item) => [
            item.data || "-",
            item.tipo || "-",
            item.origem || "-",
            item.produto || "-",
            item.quantidade || 0,
            item.valor ? moeda.format(item.valor) : "-",
            item.fornecedor || "-",
            item.usuario || "-",
            item.observacao || "-",
          ])}
        />
      </Card>

      <Card titulo="Auditoria do estoque">
        <Tabela
          colunas={[
            "Data",
            "Tipo",
            "Origem",
            "Produto",
            "Quantidade",
            "Usuário",
            "Observação",
          ]}
          dados={auditoriaEstoque.map((item) => [
            item.data || "-",
            item.tipo || "-",
            item.origem || "-",
            item.produto || "-",
            item.quantidade || 0,
            item.usuario || "-",
            item.observacao || "-",
          ])}
        />
      </Card>

      <Card titulo="Baixa automática pelas vendas antigas e atuais">
        <Tabela
          colunas={[
            "Data",
            "Cliente",
            "Serviço vendido",
            "Placa",
            "Produto físico baixado",
            "Quantidade",
          ]}
          dados={usosEstoqueServicos.map((item) => [
            item.data,
            item.cliente,
            item.produtoServico,
            item.placa,
            item.itemEstoque,
            item.quantidade,
          ])}
        />
      </Card>
    </>
  );
}