import { useMemo, useState } from "react";
import { Building2, LogOut, Search, ShieldCheck } from "lucide-react";
import { auth } from "../services/firebase.js";

export default function PortalSuperadmin({
  empresas = [],
  usuario,
  entrarNaEmpresa,
}) {
  const [busca, setBusca] = useState("");

  const empresasFiltradas = useMemo(() => {
    const termo = String(busca || "").toLowerCase().trim();

    if (!termo) return empresas;

    return empresas.filter((empresa) => {
      const texto = [
        empresa.id,
        empresa.nome,
        empresa.cnpj,
        empresa.cidade,
        empresa.codigoConvite,
        empresa.email,
        empresa.whatsapp,
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, empresas]);

  async function sair() {
    await auth.signOut();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.22), transparent 35%), #020617",
        color: "#fff",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#93c5fd",
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              <ShieldCheck size={22} />
              Portal Superadmin
            </div>

            <h1 style={{ margin: 0, fontSize: 32 }}>NEXORA Admin</h1>

            <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>
              Escolha qual empresa deseja acessar.
            </p>

            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
              Logado como: {usuario?.email}
            </p>
          </div>

          <button
            onClick={sair}
            style={{
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(15,23,42,0.8)",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
            }}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        <div
          style={{
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(15,23,42,0.75)",
            borderRadius: 18,
            padding: 14,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Search size={20} color="#94a3b8" />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade, código, e-mail ou ID..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 15,
            }}
          />
        </div>

        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 14 }}>
          {empresasFiltradas.length} empresa(s) encontrada(s)
        </p>

        {empresasFiltradas.length === 0 ? (
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.75)",
              borderRadius: 18,
              padding: 22,
              color: "#cbd5e1",
            }}
          >
            Nenhuma empresa encontrada.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {empresasFiltradas.map((empresa) => (
              <div
                key={empresa.id}
                style={{
                  border: "1px solid rgba(148,163,184,0.18)",
                  background:
                    "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95))",
                  borderRadius: 20,
                  padding: 18,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: "rgba(37,99,235,0.16)",
                    color: "#60a5fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                    border: "1px solid rgba(96,165,250,0.35)",
                  }}
                >
                  <Building2 size={24} />
                </div>

                <h2 style={{ margin: 0, fontSize: 19 }}>
                  {empresa.nome || empresa.id}
                </h2>

                <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 13 }}>
                  ID: {empresa.id}
                </p>

                {empresa.cnpj && (
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>
                    CNPJ: {empresa.cnpj}
                  </p>
                )}

                {empresa.cidade && (
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>
                    Cidade: {empresa.cidade}
                  </p>
                )}

                {empresa.codigoConvite && (
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 12 }}>
                    Convite: {empresa.codigoConvite}
                  </p>
                )}

                <button
                  onClick={() => entrarNaEmpresa(empresa.id)}
                  style={{
                    marginTop: 16,
                    width: "100%",
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  Entrar nesta empresa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}