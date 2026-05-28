import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";

import styles from "../styles/styles.js";

export default function DadosEmpresa({
  dadosEmpresa,
  setDadosEmpresa,
  salvarDadosEmpresa,
  admin,
}) {
  function atualizar(campo, valor) {
    setDadosEmpresa((old) => ({
      ...old,
      [campo]: valor,
    }));
  }

  function gerarCodigoConvite() {
    const base = String(dadosEmpresa.nome || "EMPRESA")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 12);

    const numero = Math.floor(100 + Math.random() * 900);

    atualizar("codigoConvite", `${base}${numero}`);
  }

  function copiarConvite() {
    if (!dadosEmpresa.codigoConvite) {
      alert("Nenhum código convite gerado.");
      return;
    }

    navigator.clipboard.writeText(dadosEmpresa.codigoConvite);
    alert("Código convite copiado.");
  }

  const temCodigoConvite = Boolean(dadosEmpresa.codigoConvite);

  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Dados da Empresa</h1>

          <p style={styles.subtitulo}>
            Informações utilizadas no sistema, relatórios e identidade da loja.
          </p>
        </div>
      </div>

      <Card titulo="Informações da empresa">
        <div style={styles.formGrid}>
          <Campo
            label="Nome da empresa"
            valor={dadosEmpresa.nome}
            mudar={(v) => atualizar("nome", v)}
          />

          <Campo
            label="IE"
            valor={dadosEmpresa.ie}
            mudar={(v) => atualizar("ie", v)}
          />

          <Campo
            label="CNPJ"
            valor={dadosEmpresa.cnpj}
            mudar={(v) => atualizar("cnpj", v)}
          />

          <Campo
            label="E-mail"
            valor={dadosEmpresa.email}
            mudar={(v) => atualizar("email", v)}
          />

          <Campo
            label="WhatsApp"
            valor={dadosEmpresa.whatsapp}
            mudar={(v) => atualizar("whatsapp", v)}
          />

          <Campo
            label="Pix"
            valor={dadosEmpresa.pix}
            mudar={(v) => atualizar("pix", v)}
          />

          <Campo
            label="CEP"
            valor={dadosEmpresa.cep}
            mudar={(v) => atualizar("cep", v)}
          />

          <Campo
            label="Logradouro"
            valor={dadosEmpresa.logradouro}
            mudar={(v) => atualizar("logradouro", v)}
          />

          <Campo
            label="Número"
            valor={dadosEmpresa.numero}
            mudar={(v) => atualizar("numero", v)}
          />

          <Campo
            label="Bairro"
            valor={dadosEmpresa.bairro}
            mudar={(v) => atualizar("bairro", v)}
          />

          <Campo
            label="Cidade"
            valor={dadosEmpresa.cidade}
            mudar={(v) => atualizar("cidade", v)}
          />

          <Campo
            label="Logo da empresa"
            valor={dadosEmpresa.logo || ""}
            mudar={(v) => atualizar("logo", v)}
          />
        </div>
      </Card>

      <Card titulo="Convite da empresa">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <p
            style={{
              color: "#94a3b8",
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            Este código é usado para sócios e lojistas solicitarem acesso à
            empresa correta.
          </p>

          <div
  style={{
    background: "#050816",
    padding: "14px 18px",
    borderRadius: 12,
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
    border: "1px solid #243056",
    width: "fit-content",
    maxWidth: "100%",
    wordBreak: "break-word",
  }}
>
  {admin
    ? temCodigoConvite
      ? dadosEmpresa.codigoConvite
      : "SEM CONVITE"
    : "••••••••"}
</div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
           {admin && temCodigoConvite && (
  <button onClick={copiarConvite} style={styles.botao}>
    Copiar convite
  </button>
)}
            {admin && !temCodigoConvite && (
              <button onClick={gerarCodigoConvite} style={styles.botao}>
                Gerar convite
              </button>
            )}
          </div>

          {!temCodigoConvite && (
            <p
              style={{
                color: "#fbbf24",
                margin: 0,
                fontSize: 13,
              }}
            >
              Nenhum código foi gerado ainda. Apenas administradores podem gerar
              o convite.
            </p>
          )}
        </div>
      </Card>

      <button
        onClick={salvarDadosEmpresa}
        style={{
          ...styles.botao,
          marginTop: 20,
        }}
      >
        Salvar Dados da Empresa
      </button>
    </>
  );
}