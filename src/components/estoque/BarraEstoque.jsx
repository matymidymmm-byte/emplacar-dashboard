export default function BarraEstoque({ percentual = 0, status = "OK" }) {
  function corStatus() {
    if (status === "CRÍTICO") return "#ef4444";
    if (status === "BAIXO") return "#f59e0b";
    return "#22c55e";
  }

  const percentualSeguro = Math.max(
    Math.min(Number(percentual) || 0, 100),
    0
  );

  return (
    <div
      style={{
        width: "100%",
        height: 10,
        borderRadius: 999,
        background: "rgba(148, 163, 184, 0.18)",
        overflow: "hidden",
        marginTop: 10,
      }}
    >
      <div
        style={{
          width: `${percentualSeguro}%`,
          height: "100%",
          borderRadius: 999,
          background: corStatus(),
          transition: "width 0.25s ease",
        }}
      />
    </div>
  );
}