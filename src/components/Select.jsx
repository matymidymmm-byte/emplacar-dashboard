import styles from "../styles/styles.js";

export default function Select({
  label,
  valor,
  mudar,
  opcoes,
  placeholder,
}) {
  return (
    <label style={styles.label}>
      {label}

      <select
        value={valor}
        onChange={(e) => mudar(e.target.value)}
        style={styles.input}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {opcoes.map((opcao) => (
          <option
            key={opcao}
            value={opcao}
          >
            {opcao || placeholder}
          </option>
        ))}
      </select>
    </label>
  );
}