import { useMemo, useState } from "react";

import EstoqueRapido from "../components/estoque/EstoqueRapido.jsx";
import EstoqueMovimentacoes from "../components/estoque/EstoqueMovimentacoes.jsx";
import EstoqueConfiguracoes from "../components/estoque/EstoqueConfiguracoes.jsx";
import EstoqueInteligencia from "../components/estoque/EstoqueInteligencia.jsx";

import Card from "../components/Card.jsx";



import EstoqueLotes from "../components/estoque/EstoqueLotes.jsx";


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
  "RIBBON AMARELO",
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
  "PLACA AVULSA",
  "SUPORTE TRIÂNGULO MOTO",
  "SUPORTE RESINA MOTO",
  "SUPORTE RESINA CARRO",
];

const REGRAS_CONSUMO_PADRAO = [
  {
    id: "padrao-par-veicular",
    servico: "PAR VEICULAR PADRÃO",
    insumo: "VEICULAR PADRÃO",
    quantidade: 2,
    aplicarMultiplicadorRibbon: false,
    
  },
  {
  id: "padrao-par-mini",
  servico: "PAR VEICULAR MINI",
  insumo: "VEICULAR MINI",
  quantidade: 2,
  aplicarMultiplicadorRibbon: false,
},
{
  id: "padrao-placa-teste-personalizada",
  servico: "PLACA TESTE / PERSONALIZADA",
  insumo: "PLACA TESTE / PERSONALIZADA",
  quantidade: 1,
  aplicarMultiplicadorRibbon: false,
},
{
  id: "padrao-par-mini-ribbon",
  servico: "PAR VEICULAR MINI",
  insumo: "RIBBON PRETO",
  quantidade: 0.4,
  aplicarMultiplicadorRibbon: true,
},
{
  id: "padrao-par-mini-mini",
  servico: "PAR VEICULAR MINI-MINI",
  insumo: "VEICULAR MINI-MINI",
  quantidade: 2,
  aplicarMultiplicadorRibbon: false,
},
{
  id: "padrao-par-mini-mini-ribbon",
  servico: "PAR VEICULAR MINI-MINI",
  insumo: "RIBBON PRETO",
  quantidade: 0.4,
  aplicarMultiplicadorRibbon: true,
},
  {
    id: "padrao-par-veicular-ribbon",
    servico: "PAR VEICULAR PADRÃO",
    insumo: "RIBBON PRETO",
    quantidade: 0.4,
    aplicarMultiplicadorRibbon: true,
  },
  {
    id: "padrao-moto",
    servico: "MOTO PADRÃO",
    insumo: "MOTO PADRÃO",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-moto-ribbon",
    servico: "MOTO PADRÃO",
    insumo: "RIBBON PRETO",
    quantidade: 0.2,
    aplicarMultiplicadorRibbon: true,
  },
  {
    id: "padrao-reboque",
    servico: "REBOQUE PADRÃO",
    insumo: "VEICULAR PADRÃO",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-reboque-ribbon",
    servico: "REBOQUE PADRÃO",
    insumo: "RIBBON PRETO",
    quantidade: 0.2,
    aplicarMultiplicadorRibbon: true,
  },
  {
    id: "padrao-avulsa",
    servico: "PLACA AVULSA",
    insumo: "VEICULAR PADRÃO",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-avulsa-ribbon",
    servico: "PLACA AVULSA",
    insumo: "RIBBON PRETO",
    quantidade: 0.2,
    aplicarMultiplicadorRibbon: true,
  },
  {
    id: "padrao-par-preta",
    servico: "PAR VEICULAR PRETA",
    insumo: "VEICULAR PRETA",
    quantidade: 2,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-par-preta-ribbon",
    servico: "PAR VEICULAR PRETA",
    insumo: "RIBBON BRANCO",
    quantidade: 0.4,
    aplicarMultiplicadorRibbon: true,
  },
  {
    id: "padrao-moto-preta",
    servico: "MOTO PRETA",
    insumo: "MOTO PRETA",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-moto-preta-ribbon",
    servico: "MOTO PRETA",
    insumo: "RIBBON BRANCO",
    quantidade: 0.2,
    aplicarMultiplicadorRibbon: true,
  },
  {
    id: "padrao-suporte-triangulo",
    servico: "SUPORTE TRIÂNGULO MOTO",
    insumo: "SUPORTE TRIÂNGULO MOTO",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-suporte-resina-moto",
    servico: "SUPORTE RESINA MOTO",
    insumo: "SUPORTE RESINA MOTO",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
  {
    id: "padrao-suporte-resina-carro",
    servico: "SUPORTE RESINA CARRO",
    insumo: "SUPORTE RESINA CARRO",
    quantidade: 1,
    aplicarMultiplicadorRibbon: false,
  },
];

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
  const [abaEstoque, setAbaEstoque] = useState("RAPIDA");
  const [novoProdutoEstoque, setNovoProdutoEstoque] = useState("");
  const [novoServicoSimulacao, setNovoServicoSimulacao] = useState("");
  const [novoFornecedor, setNovoFornecedor] = useState("");
  const [editandoCompraId, setEditandoCompraId] = useState(null);
  const [editandoPerdaId, setEditandoPerdaId] = useState(null);
  const [filtroDashboard, setFiltroDashboard] = useState("MÊS");

  const [simulacao, setSimulacao] = useState({ cliente: "" });
  const [produtoParametroSelecionado, setProdutoParametroSelecionado] =
    useState("");

  const [parametroForm, setParametroForm] = useState({
  produto: "",
  unidade: "un",

  estoqueMinimo: "",

  observacao: "",
});

  const [consumoForm, setConsumoForm] = useState({
    servico: "",
    insumo: "",
    quantidade: "",
    aplicarMultiplicadorRibbon: false,
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
  if (typeof valor === "number") return valor;

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
  const ribbonsComprados = estoqueCompras
    .filter((item) => ehRibbon(item.produto))
    .map((item) => item.produtoChave || chaveRibbonEstoque(item));

  return listaUnica([
    ...PRODUTOS_INICIAIS_ESTOQUE,
    ...produtosEstoqueConfigurados,
    ...produtosEstoquePersonalizados,
    ...ribbonsComprados,
  ]);
}, [
  produtosEstoqueConfigurados,
  produtosEstoquePersonalizados,
  estoqueCompras,
]);
  

  const tiposSimulacaoDisponiveis = useMemo(() => {
    return listaUnica([
      ...SERVICOS_INICIAIS_SIMULACAO,
      ...servicosSimulacaoEstoque,
    ]);
  }, [servicosSimulacaoEstoque]);

  const fornecedoresDisponiveis = useMemo(() => {
    return listaUnica(fornecedoresEstoque);
  }, [fornecedoresEstoque]);

  const regrasConsumoEmpresa = useMemo(() => {
    const salvas = minimosEstoqueConfigurados?.__regrasConsumoServicos;

    if (Array.isArray(salvas) && salvas.length > 0) {
      return salvas;
    }

    return REGRAS_CONSUMO_PADRAO;
  }, [minimosEstoqueConfigurados]);

  function ehRibbon(produto) {
    return norm(produto).includes("RIBBON");
  }
  function chaveRibbonEstoque(itemOuProduto) {
  const produto =
  typeof itemOuProduto === "string"
    ? norm(itemOuProduto)
    : norm(itemOuProduto?.produto);

  if (!ehRibbon(produto)) return produto;

  const largura =
    typeof itemOuProduto === "string"
      ? ""
      : String(itemOuProduto?.larguraRibbon || "").trim();

  if (!largura) return `${produto} | SEM LARGURA`;

  return `${produto} | ${largura} mm`;
}
function categoriaParaRibbon(categoriaPlaca, produtoServico = "") {
  const texto = norm(`${produtoServico} ${categoriaPlaca}`);

  if (
    texto.includes("COMERCIAL") ||
    texto.includes("ALUGUEL") ||
    texto.includes("LOCADORA") ||
    texto.includes("RENTAL")
  ) {
    return "RIBBON VERMELHO";
  }

  if (
    texto.includes("OFICIAL") ||
    texto.includes("GOVERNO") ||
    texto.includes("PREFEITURA") ||
    texto.includes("ESTADO") ||
    texto.includes("MUNICIPAL") ||
    texto.includes("FEDERAL")
  ) {
    return "RIBBON AZUL";
  }

  if (
    texto.includes("ESPECIAL") ||
    texto.includes("PCD") ||
    texto.includes("DEFICIENTE")
  ) {
    return "RIBBON VERDE";
  }

  if (
    texto.includes("COLECIONADOR") ||
    texto.includes("COLECAO") ||
    texto.includes("COLEÇÃO") ||
    texto.includes("PRETA") ||
    texto.includes("BLACK")
  ) {
    return "RIBBON BRANCO";
  }

  if (
    texto.includes("DIPLOMATICO") ||
    texto.includes("DIPLOMÁTICO") ||
    texto.includes("CONSULAR")
  ) {
    return "RIBBON AMARELO";
  }

  return "RIBBON PRETO";
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

  function parametrosDoProduto(produto) {
    const chave = normalizarProdutoEstoque(produto);
    const bruto = minimosEstoqueConfigurados?.[chave];

    if (typeof bruto === "object" && bruto !== null) {
      return {
        tipoControle:
          bruto.tipoControle || (ehRibbon(chave) ? "METRAGEM" : "QUANTIDADE"),
        unidade: bruto.unidade || (ehRibbon(chave) ? "m" : "un"),
        capacidadeTotal: 0,
        estoqueMinimo: n(bruto.estoqueMinimo),
        alertaBaixo: ehRibbon(chave) ? n(bruto.alertaBaixo) : 0,
alertaCritico: ehRibbon(chave) ? n(bruto.alertaCritico) : 0,
        observacao: bruto.observacao || "",
      };
    }

    return {
      tipoControle: ehRibbon(chave) ? "METRAGEM" : "QUANTIDADE",
      unidade: ehRibbon(chave) ? "m" : "un",
      capacidadeTotal: 0,
      estoqueMinimo: n(bruto),
      alertaBaixo: 0,
      alertaCritico: 0,
      observacao: "",
    };
  }

  function minimoDoProduto(produto) {
    return parametrosDoProduto(produto).estoqueMinimo;
  }

  function quantidadeCompraParaEstoque(item) {
    const produto = normalizarProdutoEstoque(item.produto);

    if (ehRibbon(produto)) {
      const rolos = n(item.quantidade) || 1;
      const metragem = n(item.metragemRibbon);

      if (metragem > 0) return rolos * metragem;

      return n(item.quantidade);
    }

    return n(item.quantidade);
  }

  function calcularPercentualEstoque(item) {
    const parametros = parametrosDoProduto(item.produto);

    if (
      parametros.tipoControle === "PERCENTUAL" ||
      parametros.tipoControle === "METRAGEM"
    ) {
      const base = item.compras > 0 ? item.compras : 0;

      if (base <= 0) return 0;

      return Math.max(Math.min((item.saldoDisponivel / base) * 100, 100), 0);
    }

    if (parametros.estoqueMinimo > 0) {
      return Math.max(
        Math.min((item.saldoDisponivel / parametros.estoqueMinimo) * 100, 100),
        0
      );
    }

    if (item.compras > 0) {
      return Math.max(
        Math.min((item.saldoDisponivel / item.compras) * 100, 100),
        0
      );
    }

    return item.saldoDisponivel > 0 ? 100 : 0;
  }

 function statusProduto(item) {
  const parametros = parametrosDoProduto(item.produto);
  const percentual = calcularPercentualEstoque(item);

  if (
  parametros.tipoControle === "PERCENTUAL" ||
  parametros.tipoControle === "METRAGEM"
) {
  if (percentual <= 10) {
    return "CRÍTICO";
  }

  if (percentual <= 25) {
    return "BAIXO";
  }

  return "OK";
}

  const minimo = parametros.estoqueMinimo || 0;

  if (item.saldoDisponivel <= 0) {
    return "CRÍTICO";
  }

  if (minimo > 0) {
    if (item.saldoDisponivel <= minimo) {
      return "CRÍTICO";
    }

    if (item.saldoDisponivel <= minimo * 2) {
      return "BAIXO";
    }
  }

  return "OK";
}

  function textoStatus(status) {
    if (status === "CRÍTICO") return "🔴 Crítico";
    if (status === "BAIXO") return "🟡 Baixo";
    return "🟢 OK";
  }

 

  function servicoCombina(servicoEntrada, servicoRegra) {
  const entrada = norm(servicoEntrada);
  const regra = norm(servicoRegra);

  if (!entrada || !regra) return false;

  return entrada.includes(regra) || regra.includes(entrada);
}

function identificarServicoEstoque(produtoServico) {
  const p = norm(produtoServico);

  const ehColecao =
    p.includes("COLECAO") ||
    p.includes("COLEÇÃO");

  const ehPreta =
    p.includes("PRETA") ||
    p.includes("PLACA PRETA") ||
    ehColecao;

const ehMiniMini =
  p.includes("MINI MINI") ||
  p.includes("MINI-MINI") ||
  p.includes("MINIMINI") ||
  p.includes("MINI COMPACTA") ||
  p.includes("MINI-COMPACTA") ||
  p.includes("COMPACTA");

const ehMini =
  (
    p.includes("MINI") ||
    p.includes("PLACA MINI") ||
    p.includes("PAR MINI")
  ) &&
  !ehMiniMini;
  const ehMoto =
    p.includes("MOTO") ||
    p.includes("MOTOCICLETA") ||
    p.includes("MOTONETA") ||
    p.includes("CICLOMOTOR");

  const ehReboque =
    p.includes("REBOQUE") ||
    p.includes("CARRETINHA") ||
    p.includes("CARRETA") ||
    p.includes("DOLLY") ||
    p.includes("SEMI REBOQUE") ||
    p.includes("SEMI-REBOQUE");

  const ehAvulsa =
    p.includes("AVULSA") ||
    p.includes("DIANTEIRA") ||
    p.includes("TRASEIRA") ||
    p.includes("SEGUNDA VIA") ||
    p.includes("2 VIA") ||
    p.includes("1 PLACA") ||
    p.includes("UMA PLACA");

  const ehParVeicular =
    p.includes("PAR") ||
    p.includes("CARRO") ||
    p.includes("CAMINHAO") ||
    p.includes("CAMINHONETE") ||
    p.includes("UTILITARIO") ||
    p.includes("UTILITÁRIO") ||
    p.includes("AUTOMOVEL") ||
    p.includes("AUTOMÓVEL") ||
    p.includes("VEICULAR") ||
    p.includes("MERCOSUL") ||
    p.includes("PLACAS") ||
    p.includes("PLACA CARRO");

  if (p.includes("SUPORTE TRIANGULO") || p.includes("SUPORTE TRIÂNGULO")) {
    return "SUPORTE TRIÂNGULO MOTO";
  }

  if (p.includes("SUPORTE RESINA") && ehMoto) {
    return "SUPORTE RESINA MOTO";
  }

  if (p.includes("SUPORTE RESINA")) {
    return "SUPORTE RESINA CARRO";
  }

  if (ehMoto) {
    if (ehPreta) return "MOTO PRETA";
    if (ehMini) return "MOTO MINI";
    return "MOTO PADRÃO";
  }

  if (ehReboque) {
    if (ehPreta) return "REBOQUE PRETA";
    if (ehMini) return "REBOQUE MINI";
    return "REBOQUE PADRÃO";
  }

  if (ehAvulsa) {
    if (ehPreta) return "PAR VEICULAR PRETA";
    return "PLACA AVULSA";
  }

 if (ehParVeicular) {
  

  if (ehPreta) return "PAR VEICULAR PRETA";
  if (ehMiniMini) return "PAR VEICULAR MINI-MINI";
  if (ehMini) return "PAR VEICULAR MINI";
  return "PAR VEICULAR PADRÃO";
}

  return produtoServico;
}
function regrasDoServico(produtoServico) {
  const servicoInteligente = identificarServicoEstoque(produtoServico);
  const servicoNormalizado = norm(servicoInteligente);

  const regrasExatas = regrasConsumoEmpresa.filter(
    (regra) => norm(regra.servico) === servicoNormalizado
  );

  if (regrasExatas.length > 0) return regrasExatas;

  const regras = regrasConsumoEmpresa.filter((regra) =>
    servicoCombina(servicoInteligente, regra.servico)
  );

  if (regras.length > 0) return regras;

  const p = norm(servicoInteligente);

  if (p.includes("SUPORTE TRIANGULO")) {
    return [
      {
        id: criarId(),
        servico: produtoServico,
        insumo: "SUPORTE TRIÂNGULO MOTO",
        quantidade: 1,
        aplicarMultiplicadorRibbon: false,
      },
    ];
  }

  if (p.includes("SUPORTE RESINA") && p.includes("MOTO")) {
    return [
      {
        id: criarId(),
        servico: produtoServico,
        insumo: "SUPORTE RESINA MOTO",
        quantidade: 1,
        aplicarMultiplicadorRibbon: false,
      },
    ];
  }

  if (p.includes("SUPORTE RESINA")) {
    return [
      {
        id: criarId(),
        servico: produtoServico,
        insumo: "SUPORTE RESINA CARRO",
        quantidade: 1,
        aplicarMultiplicadorRibbon: false,
      },
    ];
  }

  return [];
}

  function calcularConsumoSimulacao(tipo) {
    const regras = regrasDoServico(tipo);
    const primeira = regras[0];

    if (!primeira) return { item: "-", consumo: 0 };

    const multiplicador =
      primeira.aplicarMultiplicadorRibbon && ehRibbon(primeira.insumo)
        ? modoRibbonPadrao === "2X"
          ? 2
          : 1
        : 1;

    return {
      item: normalizarProdutoEstoque(primeira.insumo),
      consumo: n(primeira.quantidade) * multiplicador,
    };
  }

  function precoClientePorServico(cliente, tipoServico) {
  if (!cliente) return 0;

  const servico = identificarServicoEstoque(tipoServico);
  const precosServicos = cliente.precosServicos || {};

  const precoDinamico =
    precosServicos[servico] ||
    precosServicos[norm(servico)] ||
    precosServicos[tipoServico] ||
    precosServicos[norm(tipoServico)];

  if (precoDinamico) {
    return lerPreco(precoDinamico);
  }

  const tipo = norm(tipoServico);

  if (tipo.includes("SUPORTE TRIANGULO"))
    return lerPreco(cliente.precoSuporteTriangulo);

  if (tipo.includes("SUPORTE RESINA MOTO"))
    return lerPreco(cliente.precoSuporteResinaMoto);

  if (tipo.includes("SUPORTE RESINA CARRO"))
    return lerPreco(cliente.precoSuporteResinaCarro);

  if (tipo.includes("PLACA AVULSA"))
    return lerPreco(cliente.precoReboque);

  if (tipo.includes("MOTO"))
    return lerPreco(cliente.precoMoto);

  if (tipo.includes("REBOQUE"))
    return lerPreco(cliente.precoReboque);

  if (tipo.includes("PRETA"))
    return lerPreco(cliente.precoPlacaPreta);

  if (tipo.includes("MINI"))
    return lerPreco(cliente.precoMini);

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
      origem: "Serviço",
      produto: nome,
      quantidade: 0,
      motivo: "Serviço criado para consumo/simulação",
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

  function carregarParametroProduto(produto) {
    const chave = normalizarProdutoEstoque(produto);
    const parametros = parametrosDoProduto(chave);

    setProdutoParametroSelecionado(chave);
    setParametroForm({
      produto: chave,
      tipoControle: ehRibbon(chave) ? "METRAGEM" : "QUANTIDADE",
      unidade: parametros.unidade,
      
      estoqueMinimo: String(parametros.estoqueMinimo || ""),
      
      observacao: parametros.observacao || "",
    });
  }

  function salvarParametroProduto() {
    const produto = normalizarProdutoEstoque(
      parametroForm.produto || produtoParametroSelecionado
    );

    if (!produto) return;

    const novoParametro = {
      tipoControle: ehRibbon(produto) ? "METRAGEM" : "QUANTIDADE",
      unidade: parametroForm.unidade || "un",
      capacidadeTotal: 0,
      estoqueMinimo: n(parametroForm.estoqueMinimo),
      
      observacao: parametroForm.observacao || "",
    };

    setMinimosEstoqueConfigurados((old) => ({
      ...old,
      [produto]: novoParametro,
    }));

    registrarMovimentacaoEstoque({
      tipo: "CONFIGURAÇÃO",
      origem: "Parâmetro de estoque",
      produto,
      quantidade: 0,
      depois: novoParametro,
      motivo: "Parâmetros do produto atualizados",
    });

    alert("Parâmetro salvo.");
  }

  function adicionarRegraConsumo() {
    if (!consumoForm.servico || !consumoForm.insumo || !consumoForm.quantidade) {
      alert("Preencha serviço, insumo e quantidade.");
      return;
    }

    const novaRegra = {
      id: criarId(),
      servico: consumoForm.servico,
      insumo: normalizarProdutoEstoque(consumoForm.insumo),
      quantidade: n(consumoForm.quantidade),
      aplicarMultiplicadorRibbon:
        ehRibbon(consumoForm.insumo) && consumoForm.aplicarMultiplicadorRibbon,
    };

    setMinimosEstoqueConfigurados((old) => ({
      ...old,
      __regrasConsumoServicos: [
        ...(Array.isArray(old?.__regrasConsumoServicos)
          ? old.__regrasConsumoServicos
          : REGRAS_CONSUMO_PADRAO),
        novaRegra,
      ],
    }));

    registrarMovimentacaoEstoque({
      tipo: "CONFIGURAÇÃO",
      origem: "Consumo por serviço",
      produto: novaRegra.insumo,
      quantidade: novaRegra.quantidade,
      depois: novaRegra,
      motivo: `Regra criada para ${novaRegra.servico}`,
    });

    setConsumoForm({
      servico: "",
      insumo: "",
      quantidade: "",
      aplicarMultiplicadorRibbon: false,
    });
  }

  function removerRegraConsumo(id) {
    if (!admin) {
      alert("Apenas administrador pode remover regras de consumo.");
      return;
    }

    setMinimosEstoqueConfigurados((old) => ({
      ...old,
      __regrasConsumoServicos: regrasConsumoEmpresa.filter(
        (regra) => regra.id !== id
      ),
    }));

    registrarMovimentacaoEstoque({
      tipo: "EXCLUSÃO",
      origem: "Consumo por serviço",
      produto: "-",
      quantidade: 0,
      motivo: "Regra de consumo removida",
    });
  }

  function restaurarRegrasPadraoConsumo() {
    if (!admin) {
      alert("Apenas administrador pode restaurar regras.");
      return;
    }

    if (
      !confirm(
        "Restaurar as regras padrão de consumo? Isso troca a lista atual pelas regras base."
      )
    ) {
      return;
    }

    setMinimosEstoqueConfigurados((old) => ({
      ...old,
      __regrasConsumoServicos: REGRAS_CONSUMO_PADRAO,
    }));

    registrarMovimentacaoEstoque({
      tipo: "CONFIGURAÇÃO",
      origem: "Consumo por serviço",
      produto: "-",
      quantidade: 0,
      motivo: "Regras padrão restauradas",
    });
  }

  function salvarCompraEstoque() {
    if (!compraEstoqueForm.produto || !compraEstoqueForm.quantidade) return;

    const produtoNormalizado = normalizarProdutoEstoque(compraEstoqueForm.produto);

    const item = {
      id: editandoCompraId || criarId(),
      ...compraEstoqueForm,
      produto: produtoNormalizado,
produtoBase: produtoNormalizado,
produtoChave: chaveRibbonEstoque({
  produto: produtoNormalizado,
  larguraRibbon: compraEstoqueForm.larguraRibbon,
}),
      quantidade: n(compraEstoqueForm.quantidade),
      fornecedor: compraEstoqueForm.fornecedor || "",
      larguraRibbon: compraEstoqueForm.larguraRibbon || "",
      metragemRibbon: compraEstoqueForm.metragemRibbon || "",
      usoRibbon: compraEstoqueForm.usoRibbon || "Carro e moto",
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
        quantidade: quantidadeCompraParaEstoque(item),
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
        quantidade: quantidadeCompraParaEstoque(item),
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
      usoRibbon: item.usoRibbon || "Carro e moto",
      custoTotal: String(item.custoTotal ?? ""),
      observacao: item.observacao || "",
      criadoPor: item.criadoPor || "",
      criadoEm: item.criadoEm || "",
    });

    setAbaEstoque("MOVIMENTACOES");
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

    setAbaEstoque("MOVIMENTACOES");
  }

  function cancelarEdicaoEstoque() {
    setEditandoCompraId(null);
    setEditandoPerdaId(null);

    setCompraEstoqueForm({
      ...compraEstoqueForm,
      quantidade: "",
      larguraRibbon: "",
      metragemRibbon: "",
      usoRibbon: "Carro e moto",
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
        quantidade: item ? quantidadeCompraParaEstoque(item) : 0,
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
  return entradas.flatMap((entrada) => {
    const regrasDoBlank = regrasDoServico(entrada.produto).filter(
      (regra) => !ehRibbon(regra.insumo)
    );

   const regrasRibbon = regrasDoBlank
  .filter((regra) => {
    const insumo = norm(regra.insumo);

    return (
      insumo.includes("VEICULAR") ||
      insumo.includes("MOTO") ||
      insumo.includes("PLACA")
    );
  })
  .map((regra) => {
    const quantidadeBlank = n(regra.quantidade);
    const quantidadeRibbonBase = quantidadeBlank >= 2 ? 0.4 : 0.2;

    const servicoIdentificado = identificarServicoEstoque(entrada.produto);
    const textoServico = norm(servicoIdentificado);

    const usoNecessario = textoServico.includes("MOTO")
      ? "MOTO"
      : "CARRO";

    return {
      id: `${regra.id}-ribbon-categoria`,
      servico: regra.servico,
      insumo: categoriaParaRibbon(
        entrada.categoriaPlaca,
        entrada.produto
      ),
      quantidade: quantidadeRibbonBase,
      aplicarMultiplicadorRibbon: true,
      usoRibbonNecessario: usoNecessario,
    };
  });

    const regras = [...regrasDoBlank, ...regrasRibbon];

    return regras.map((regra) => {
      const insumo = normalizarProdutoEstoque(regra.insumo);

      const multiplicador =
        regra.aplicarMultiplicadorRibbon && ehRibbon(insumo)
          ? modoRibbonPadrao === "2X"
            ? 2
            : 1
          : 1;

      return {
  id: `${entrada.id || `${entrada.data}-${entrada.cliente}-${entrada.placa}`}-${regra.id}`,
  data: entrada.data,
  cliente: entrada.cliente,
  produtoServico: entrada.produto,
  categoriaPlaca: entrada.categoriaPlaca || "",
  placa: entrada.placa,
  itemEstoque: insumo,
  usoRibbonNecessario: regra.usoRibbonNecessario || null,
        quantidade: n(regra.quantidade) * multiplicador,
        origem: "Venda / serviço",
        tipoUso: ehRibbon(insumo) ? "RIBBON" : "INSUMO FÍSICO",
        regraServico: regra.servico,
        multiplicadorRibbon: multiplicador,
      };
    });
  });
}, [entradas, regrasConsumoEmpresa, modoRibbonPadrao]);

  const estoqueResumo = useMemo(() => {
    const resumoBase = produtosDisponiveisEstoque.map((produto) => {
      const comprasDoProduto = estoqueCompras.filter((item) => {
  if (!ehRibbon(produto)) {
    return normalizarProdutoEstoque(item.produto) === produto;
  }

  return (item.produtoChave || chaveRibbonEstoque(item)) === produto;
});

      const compras = comprasDoProduto.reduce(
        (soma, item) => soma + quantidadeCompraParaEstoque(item),
        0
      );

      const custoTotal = comprasDoProduto.reduce(
        (soma, item) => soma + n(item.custoTotal),
        0
      );

      const custoMedio = compras > 0 ? custoTotal / compras : 0;

     const usadoEmServicos = usosEstoqueServicos.reduce((soma, uso) => {
  if (!ehRibbon(produto)) {
    if (uso.itemEstoque !== produto) return soma;
    return soma + n(uso.quantidade);
  }

  const compraCompativel = comprasDoProduto.some((compra) => {
    const usoCompra = norm(compra.usoRibbon || "Carro e moto");
    const usoNecessario = norm(uso.usoRibbonNecessario || "");

    if (uso.itemEstoque !== normalizarProdutoEstoque(compra.produto)) {
      return false;
    }

    if (!usoNecessario) return false;

    if (usoNecessario.includes("CARRO")) {
      return usoCompra.includes("CARRO");
    }

    if (usoNecessario.includes("MOTO")) {
      return usoCompra.includes("MOTO");
    }

    return false;
  });

  if (!compraCompativel) return soma;

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

      const parametros = parametrosDoProduto(produto);

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
        parametros,
        unidade: parametros.unidade || (ehRibbon(produto) ? "m" : "un"),
      };
    });

    return resumoBase.map((item) => ({
      ...item,
      percentual: calcularPercentualEstoque(item),
      status: statusProduto(item),
    }));
  }, [
    produtosDisponiveisEstoque,
    estoqueCompras,
    estoquePerdas,
    reservasEstoque,
    usosEstoqueServicos,
    minimosEstoqueConfigurados,
  ]);

  const lotesEstoque = useMemo(() => {
    return estoqueCompras
      .map((compra, index) => {
        const produto = ehRibbon(compra.produto)
  ? compra.produtoChave || chaveRibbonEstoque(compra)
  : normalizarProdutoEstoque(compra.produto);
        const qtdEntrada = quantidadeCompraParaEstoque(compra);

        const parametros = parametrosDoProduto(produto);

        const consumoTotalProduto =
          usosEstoqueServicos
            .filter((uso) => {
  if (!ehRibbon(produto)) return uso.itemEstoque === produto;

  const usoCompra = norm(compra.usoRibbon || "Carro e moto");
  const usoNecessario = norm(uso.usoRibbonNecessario || "");

  if (uso.itemEstoque !== normalizarProdutoEstoque(compra.produto)) {
    return false;
  }

  if (!usoNecessario) return false;

  if (usoNecessario.includes("CARRO")) return usoCompra.includes("CARRO");
  if (usoNecessario.includes("MOTO")) return usoCompra.includes("MOTO");

  return false;
})
            .reduce((soma, uso) => soma + n(uso.quantidade), 0) +
          estoquePerdas
            .filter(
              (perda) => normalizarProdutoEstoque(perda.produto) === produto
            )
            .reduce((soma, perda) => soma + n(perda.quantidade), 0);

        const comprasOrdenadas = estoqueCompras
          .filter((item) => normalizarProdutoEstoque(item.produto) === produto)
          .sort((a, b) =>
            String(a.data || "").localeCompare(String(b.data || ""))
          );

        let consumoRestante = consumoTotalProduto;
        let saldoLote = qtdEntrada;

        for (const item of comprasOrdenadas) {
          const qtdLote = quantidadeCompraParaEstoque(item);

          if (item.id === compra.id) {
            saldoLote = Math.max(qtdLote - consumoRestante, 0);
            break;
          }

          consumoRestante = Math.max(consumoRestante - qtdLote, 0);
        }

        const percentual =
          qtdEntrada > 0
            ? Math.max(Math.min((saldoLote / qtdEntrada) * 100, 100), 0)
            : 0;

        let status = "OK";

        if (
          parametros.tipoControle === "PERCENTUAL" ||
          parametros.tipoControle === "METRAGEM"
        ) {
          if (
            parametros.alertaCritico > 0 &&
            percentual <= parametros.alertaCritico
          ) {
            status = "CRÍTICO";
          } else if (
            parametros.alertaBaixo > 0 &&
            percentual <= parametros.alertaBaixo
          ) {
            status = "BAIXO";
          }
        } else {
          if (saldoLote <= 0) status = "CRÍTICO";
          else if (
            parametros.estoqueMinimo > 0 &&
            saldoLote <= parametros.estoqueMinimo
          ) {
            status = "BAIXO";
          }
        }

        return {
          id: compra.id,
          lote: compra.lote || `Lote ${index + 1}`,
          data: compra.data || "-",
          fornecedor: compra.fornecedor || "-",
          produto,
          entrada: qtdEntrada,
          saldo: saldoLote,
          percentual,
          status,
          unidade: parametros.unidade || (ehRibbon(produto) ? "m" : "un"),
          custoTotal: n(compra.custoTotal),
          observacao: compra.observacao || "-",
        };
      })
      .sort((a, b) => String(a.produto).localeCompare(String(b.produto)));
  }, [
    estoqueCompras,
    estoqueResumo,
    usosEstoqueServicos,
    estoquePerdas,
    minimosEstoqueConfigurados,
  ]);

  const livroMovimentacoes = useMemo(() => {
    const compras = estoqueCompras.map((item) => ({
      id: `compra-${item.id}`,
      data: item.data,
      tipo: "ENTRADA",
      origem: "Compra",
      produto: normalizarProdutoEstoque(item.produto),
      quantidade: quantidadeCompraParaEstoque(item),
      valor: n(item.custoTotal),
      fornecedor: item.fornecedor || "-",
      usuario: item.atualizadoPor || item.criadoPor || "-",
      observacao: item.observacao || "-",
    }));

    const vendas = usosEstoqueServicos.map((item) => ({
      id: `venda-${item.id}`,
      data: item.data,
      tipo: "SAÍDA",
      origem: item.tipoUso || "Venda / serviço",
      produto: item.itemEstoque,
      quantidade: n(item.quantidade),
      valor: 0,
      fornecedor: "-",
      usuario: "-",
      observacao: `${item.cliente || "-"} | ${item.placa || "-"} | ${
        item.regraServico || "-"
      }`,
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
    !String(item.id || "").startsWith("auditoria-") &&
    (
      item.tipo === "ENTRADA" ||
      item.tipo === "SAÍDA" ||
      item.tipo === "PERDA"
    )
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

  const itensCriticos = estoqueResumo.filter(
    (item) => item.status === "CRÍTICO"
  ).length;

  const itensBaixos = estoqueResumo.filter(
    (item) => item.status === "BAIXO"
  ).length;

  const comprasMesQuantidade = comprasPeriodo.reduce(
    (soma, item) => soma + n(item.quantidade),
    0
  );

  const comprasMesValor = comprasPeriodo.reduce(
    (soma, item) => soma + n(item.valor),
    0
  );
  console.log("FILTRO:", filtroDashboard);
console.log("COMPRAS PERÍODO:", comprasPeriodo);
console.log("VALOR TOTAL:", comprasMesValor);

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

  const agrupadosRapidos = estoqueResumo
  .filter((item) => {
    const nome = norm(item.produto);

    if (ehRibbon(item.produto)) {
      return (
        nome.includes("|") &&
        (
          item.compras > 0 ||
          item.usadoEmServicos > 0 ||
          item.saldoDisponivel !== 0
        )
      );
    }

    return (
      item.compras > 0 ||
      item.usadoEmServicos > 0 ||
      item.saldoDisponivel !== 0
    );
  })
  .sort((a, b) => {
    const peso = { CRÍTICO: 0, BAIXO: 1, OK: 2 };

    if (peso[a.status] !== peso[b.status]) {
      return peso[a.status] - peso[b.status];
    }

    return String(a.produto).localeCompare(String(b.produto));
  });

  

  
function removerProdutoPersonalizado(produto) {
  if (!admin) {
    alert("Apenas administrador pode excluir produto personalizado.");
    return;
  }

  if (!confirm(`Excluir o produto personalizado "${produto}"?`)) return;

  setProdutosEstoquePersonalizados((old) =>
    old.filter((item) => norm(item) !== norm(produto))
  );

  setMinimosEstoqueConfigurados((old) => {
    const novo = { ...old };
    delete novo[produto];
    return novo;
  });

  registrarMovimentacaoEstoque({
    tipo: "EXCLUSÃO",
    origem: "Produto personalizado",
    produto,
    quantidade: 0,
    motivo: "Produto personalizado excluído",
  });
}

function removerServicoSimulacao(servico) {
  if (!admin) {
    alert("Apenas administrador pode excluir serviço personalizado.");
    return;
  }

  if (!confirm(`Excluir o serviço personalizado "${servico}"?`)) return;

  setServicosSimulacaoEstoque((old) =>
    old.filter((item) => norm(item) !== norm(servico))
  );

  setMinimosEstoqueConfigurados((old) => ({
    ...old,
    __regrasConsumoServicos: regrasConsumoEmpresa.filter(
      (regra) => norm(regra.servico) !== norm(servico)
    ),
  }));

  registrarMovimentacaoEstoque({
    tipo: "EXCLUSÃO",
    origem: "Serviço personalizado",
    produto: servico,
    quantidade: 0,
    motivo: "Serviço personalizado excluído",
  });
}
  function BotoesAbas() {
    const abas = [
      ["RAPIDA", "📦 Visão Rápida"],
      ["MOVIMENTACOES", "🔁 Movimentações"],
      ["LOTES", "🏷️ Lotes"],
      ["CONFIGURACOES", "⚙️ Configurações"],
      ["INTELIGENCIA", "📊 Inteligência"],
    ];

    return (
      <Card titulo="Estoque">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {abas.map(([id, titulo]) => (
            <button
              key={id}
              style={{
                ...(styles.botaoSecundario || styles.botao),
                opacity: abaEstoque === id ? 1 : 0.55,
                border:
                  abaEstoque === id
                    ? "1px solid rgba(59, 130, 246, 0.9)"
                    : "1px solid rgba(148, 163, 184, 0.2)",
              }}
              onClick={() => setAbaEstoque(id)}
            >
              {titulo}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <BotoesAbas />

      {abaEstoque === "RAPIDA" && (
  <EstoqueRapido
    saldoFisicoTotal={saldoFisicoTotal}
    saldoDisponivelTotal={saldoDisponivelTotal}
    totalReservado={totalReservado}
    valorTotalEstoque={valorTotalEstoque}
    itensCriticos={itensCriticos}
    itensBaixos={itensBaixos}
    moeda={moeda}
    agrupadosRapidos={agrupadosRapidos}
    produtosCriticos={produtosCriticos}
    ehRibbon={ehRibbon}
    lotesEstoque={lotesEstoque}
    textoStatus={textoStatus}
  />
)}
      {abaEstoque === "MOVIMENTACOES" && (
  <EstoqueMovimentacoes
    editandoCompraId={editandoCompraId}
    editandoPerdaId={editandoPerdaId}
    compraEstoqueForm={compraEstoqueForm}
    setCompraEstoqueForm={setCompraEstoqueForm}
    perdaEstoqueForm={perdaEstoqueForm}
    setPerdaEstoqueForm={setPerdaEstoqueForm}
    fornecedoresDisponiveis={fornecedoresDisponiveis}
    produtosDisponiveisEstoque={produtosDisponiveisEstoque}
    ehRibbon={ehRibbon}
    salvarCompraEstoque={salvarCompraEstoque}
    salvarPerdaEstoque={salvarPerdaEstoque}
    cancelarEdicaoEstoque={cancelarEdicaoEstoque}
    estoqueCompras={estoqueCompras}
    estoquePerdas={estoquePerdas}
    movimentacoesReais={movimentacoesReais}
    normalizarProdutoEstoque={normalizarProdutoEstoque}
    moeda={moeda}
    admin={admin}
    editarCompra={editarCompra}
    editarPerda={editarPerda}
    removerMovimentoEstoque={removerMovimentoEstoque}
  />
)}
      {abaEstoque === "LOTES" && (
  <EstoqueLotes
    lotesEstoque={lotesEstoque}
    usosEstoqueServicos={usosEstoqueServicos}
    ehRibbon={ehRibbon}
    textoStatus={textoStatus}
    moeda={moeda}
  />
)}

      {abaEstoque === "CONFIGURACOES" && (
  <EstoqueConfiguracoes
    novoProdutoEstoque={novoProdutoEstoque}
    setNovoProdutoEstoque={setNovoProdutoEstoque}
    adicionarProdutoPersonalizado={adicionarProdutoPersonalizado}
    produtosEstoquePersonalizados={produtosEstoquePersonalizados}
  removerProdutoPersonalizado={removerProdutoPersonalizado}

  servicosSimulacaoEstoque={servicosSimulacaoEstoque}
  removerServicoSimulacao={removerServicoSimulacao}

    novoFornecedor={novoFornecedor}
    setNovoFornecedor={setNovoFornecedor}
    adicionarFornecedor={adicionarFornecedor}

    novoServicoSimulacao={novoServicoSimulacao}
    setNovoServicoSimulacao={setNovoServicoSimulacao}
    adicionarServicoSimulacao={adicionarServicoSimulacao}

    modoRibbonPadrao={modoRibbonPadrao}
    setModoRibbonPadrao={setModoRibbonPadrao}

    parametroForm={parametroForm}
    setParametroForm={setParametroForm}
    produtoParametroSelecionado={produtoParametroSelecionado}
    carregarParametroProduto={carregarParametroProduto}
    salvarParametroProduto={salvarParametroProduto}

    produtosDisponiveisEstoque={produtosDisponiveisEstoque}

    consumoForm={consumoForm}
    setConsumoForm={setConsumoForm}
    tiposSimulacaoDisponiveis={tiposSimulacaoDisponiveis}
    ehRibbon={ehRibbon}
    adicionarRegraConsumo={adicionarRegraConsumo}

    admin={admin}
    restaurarRegrasPadraoConsumo={restaurarRegrasPadraoConsumo}
    regrasConsumoEmpresa={regrasConsumoEmpresa}
    removerRegraConsumo={removerRegraConsumo}

    parametrosDoProduto={parametrosDoProduto}
  />
)}

      {abaEstoque === "INTELIGENCIA" && (
  <EstoqueInteligencia
    filtroDashboard={filtroDashboard}
    setFiltroDashboard={setFiltroDashboard}

    comprasMesQuantidade={comprasMesQuantidade}
    comprasMesValor={comprasMesValor}
    consumoMesQuantidade={consumoMesQuantidade}
    perdasMesQuantidade={perdasMesQuantidade}
    valorPerdasGeral={valorPerdasGeral}
    totalCompras={totalCompras}
    totalUsado={totalUsado}
    totalPerdas={totalPerdas}

    paretoConsumo={paretoConsumo}
    perdasPorProduto={perdasPorProduto}
    tabelaGerencialEstoque={tabelaGerencialEstoque}

    moeda={moeda}
    ehRibbon={ehRibbon}
    textoStatus={textoStatus}

    simulacao={simulacao}
    setSimulacao={setSimulacao}
    clientes={clientes}

    tiposSimulacaoDisponiveis={tiposSimulacaoDisponiveis}
    calcularConsumoSimulacao={calcularConsumoSimulacao}
    estoqueResumo={estoqueResumo}
    precoClientePorServico={precoClientePorServico}
    clienteSelecionado={clienteSelecionado}

    auditoriaEstoque={auditoriaEstoque}
  />
)}
    </>
  );
}