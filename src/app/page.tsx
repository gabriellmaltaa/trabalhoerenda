import Link from "next/link";

const modules = [
  ["01", "Contatos", "Organizar pessoas, empresas e histórico de relacionamento."],
  ["02", "Oportunidades", "Acompanhar negociações e etapas do funil."],
  ["03", "Atividades", "Planejar tarefas, retornos e próximos passos."],
  ["04", "Indicadores", "Visualizar resultados e evolução do atendimento."],
];

export default function Home() {
  return (
    <main>
      <header><Link href="/" className="brand">Trabalho<span>&</span>Renda</Link><span className="badge">Base de desenvolvimento</span></header>
      <section className="hero">
        <p className="eyebrow">TRABALHOERENDA.COM / CRM</p>
        <h1>Relacionamentos que<br />abrem oportunidades.</h1>
        <p className="intro">O ponto de partida para organizar contatos, acompanhar oportunidades e transformar trabalho em resultados.</p>
        <a className="button" href="#modulos">Conhecer a estrutura <span aria-hidden="true">↗</span></a>
      </section>
      <section id="modulos" aria-labelledby="modules-title">
        <div className="section-heading"><h2 id="modules-title">Módulos planejados</h2><p>Uma base para construir o seu CRM.</p></div>
        <div className="grid">{modules.map(([number, title, description]) => (
          <article key={number}><span className="number">{number}</span><h3>{title}</h3><p>{description}</p><small>Planejado</small></article>
        ))}</div>
      </section>
      <footer><span>Trabalho e Renda</span><p>Estrutura inicial. Login, banco de dados e operações do CRM serão implementados nas próximas etapas.</p></footer>
    </main>
  );
}
