import styles from "../styles/styles";

export default function Card({ titulo, children }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.cardTitulo}>{titulo}</h2>
      {children}
    </section>
  );
}