import styles from "../styles/styles.js";

export default function Acoes({ editar, excluir }) {
  function confirmarExclusao() {
    const confirmar = confirm("Deseja excluir este item?");

    if (!confirmar) return;

    excluir();
  }

  return (
    <div style={styles.acoes}>
      <button style={styles.editar} onClick={editar}>
        Editar
      </button>

      <button style={styles.excluir} onClick={confirmarExclusao}>
        Excluir
      </button>
    </div>
  );
}