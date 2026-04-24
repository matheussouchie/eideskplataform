import Link from "next/link";

export default function HomePage() {
  return (
    <main className="marketing-shell">
      <section className="hero-card">
        <p className="eyebrow">EiDesk</p>
        <h1>Service desk multi-tenant para equipes que precisam operar com contexto.</h1>
        <p className="hero-copy">
          Autenticação, workspaces isolados, tickets, equipe e políticas de acesso preparadas
          para produção com Next.js App Router, Supabase e deploy na Vercel.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" href="/auth/sign-up">
            Criar conta
          </Link>
          <Link className="secondary-button" href="/auth/sign-in">
            Entrar
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        <article className="info-card">
          <h2>Arquitetura SaaS</h2>
          <p>Separação por workspace, memberships com papéis e contexto ativo persistido em cookie seguro.</p>
        </article>
        <article className="info-card">
          <h2>Segurança real</h2>
          <p>RLS por tenant, políticas por papel, sessão Supabase no middleware e validações server-side.</p>
        </article>
        <article className="info-card">
          <h2>Base pronta para Vercel</h2>
          <p>Projeto App Router enxuto, pronto para configurar variáveis e publicar sem ajustes estruturais.</p>
        </article>
      </section>
    </main>
  );
}
