import Card from "../components/Card.jsx";
import styles from "../styles/styles.js";

export default function Atualizacoes() {
  const atualizacoes = [
    {
      versao: "1.9.0",
      data: "19/05/2026",
      hora: "Atualização atual",
      titulo: "Separação de injeções",
      itens: [
        "Sistema agora separa Injeção Caixa",
        "Sistema agora separa Injeção Loja",
        "Sistema agora separa Injeção Sócios",
        "Criado indicador Aporte Total",
        "Aportes entram no caixa/banco, mas não entram no faturamento",
      ],
    },
    {
      versao: "1.8.0",
      data: "19/05/2026",
      hora: "Anterior",
      titulo: "WhatsApp e cobranças",
      itens: [
        "WhatsApp em Clientes",
        "WhatsApp em Pendências",
        "Mensagem de cobrança automática",
        "Cobrança abre direto no WhatsApp Web",
      ],
    },
    {
      versao: "1.7.0",
      data: "19/05/2026",
      hora: "Anterior",
      titulo: "Níveis de acesso",
      itens: [
        "Administrador",
        "Lojista",
        "Sócio",
        "Tela Gerenciar Acessos",
        "Botão sair",
        "Bloqueio de backup e limpeza para não-admin",
      ],
    },
    {
      versao: "1.6.0",
      data: "19/05/2026",
      hora: "Anterior",
      titulo: "Mobile",
      itens: [
        "Menu hambúrguer",
        "Sidebar mobile",
        "Layout responsivo",
        "Tabelas com scroll",
      ],
    },
  ];

  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Atualizações do Sistema</h1>
          <p style={styles.subtitulo}>
            Histórico das melhorias aplicadas no ERP Emplacar.
          </p>
        </div>
      </div>

      {atualizacoes.map((att) => (
        <Card key={att.versao} titulo={`${att.versao} — ${att.titulo}`}>
          <p style={{ color: "#94a3b8", marginTop: 0 }}>
            {att.data} — {att.hora}
          </p>

          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {att.itens.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}