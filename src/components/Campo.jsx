import styles from "../styles/styles.js";

export default function Campo({ label, tipo = "text", valor, mudar }) {
  return (
    <label style={styles.label}>
      {label}

      <input
        type={tipo}
        value={valor}
        onChange={(e) => mudar(e.target.value)}
        style={styles.input}
      />
    </label>
  );
}