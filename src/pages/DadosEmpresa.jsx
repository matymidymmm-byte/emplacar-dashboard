import Card from "../components/Card.jsx";
import Campo from "../components/Campo.jsx";

import styles from "../styles/styles.js";

export default function DadosEmpresa({
  dadosEmpresa,
  setDadosEmpresa,
  salvarDadosEmpresa,
}) {
  function atualizar(campo, valor) {
    setDadosEmpresa((old) => ({
      ...old,
      [campo]: valor,
    }));
  }

  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>
            Dados da Empresa
          </h1>

          <p style={styles.subtitulo}>
            Informações utilizadas no sistema,
            relatórios e identidade da loja.
          </p>
        </div>
      </div>

      <Card titulo="Informações da empresa">
        <div style={styles.formGrid}>
          <Campo
            label="Nome da empresa"
            valor={dadosEmpresa.nome}
            mudar={(v) =>
              atualizar("nome", v)
            }
          />

          <Campo
            label="IE"
            valor={dadosEmpresa.ie}
            mudar={(v) =>
              atualizar("ie", v)
            }
          />

          <Campo
            label="CNPJ"
            valor={dadosEmpresa.cnpj}
            mudar={(v) =>
              atualizar("cnpj", v)
            }
          />

          <Campo
            label="E-mail"
            valor={dadosEmpresa.email}
            mudar={(v) =>
              atualizar("email", v)
            }
          />

          <Campo
            label="WhatsApp"
            valor={dadosEmpresa.whatsapp}
            mudar={(v) =>
              atualizar("whatsapp", v)
            }
          />

          <Campo
            label="Pix"
            valor={dadosEmpresa.pix}
            mudar={(v) =>
              atualizar("pix", v)
            }
          />

          <Campo
            label="CEP"
            valor={dadosEmpresa.cep}
            mudar={(v) =>
              atualizar("cep", v)
            }
          />

          <Campo
            label="Logradouro"
            valor={dadosEmpresa.logradouro}
            mudar={(v) =>
              atualizar("logradouro", v)
            }
          />

          <Campo
            label="Número"
            valor={dadosEmpresa.numero}
            mudar={(v) =>
              atualizar("numero", v)
            }
          />

          <Campo
            label="Bairro"
            valor={dadosEmpresa.bairro}
            mudar={(v) =>
              atualizar("bairro", v)
            }
          />

          <Campo
            label="Cidade"
            valor={dadosEmpresa.cidade}
            mudar={(v) =>
              atualizar("cidade", v)
            }
          />
          <Campo
  label="Logo da empresa"
  
  valor={dadosEmpresa.logo || ""}
  mudar={(v) =>
    atualizar("logo", v)
  }
/>
<div
  style={{
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    background: "#0b1220",
    border: "1px solid #243056",
  }}
>
  <p
    style={{
      color: "#94a3b8",
      marginBottom: 8,
      fontSize: 14,
    }}
  >
    Código convite da empresa
  </p>

  <div
    style={{
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    <div
      style={{
        background: "#050816",
        padding: "12px 16px",
        borderRadius: 10,
        color: "#fff",
        fontWeight: "bold",
        letterSpacing: 1,
      }}
    >
      {dadosEmpresa.codigoConvite ||
        "SEM CONVITE"}
    </div>

    <button
      onClick={() => {
        navigator.clipboard.writeText(
          dadosEmpresa.codigoConvite || ""
        );

        alert("Código copiado.");
      }}
      style={{
        ...styles.botao,
      }}
    >
      Copiar convite
    </button>
  </div>
</div>
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