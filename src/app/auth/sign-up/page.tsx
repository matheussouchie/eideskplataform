import Link from "next/link";

import { signUpAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Cadastro</p>
          <h1>Criar conta</h1>
          <p className="muted">Ao concluir, você poderá criar seu primeiro workspace do EiDesk.</p>
        </div>

        {params.error ? <p className="alert error">{params.error}</p> : null}

        <form className="stack" action={signUpAction}>
          <label className="field">
            <span>Nome completo</span>
            <input name="fullName" type="text" placeholder="Nome e sobrenome" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" placeholder="voce@empresa.com" required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input name="password" type="password" placeholder="Crie uma senha forte" minLength={8} required />
          </label>
          <SubmitButton className="primary-button" pendingLabel="Criando conta...">
            Criar conta
          </SubmitButton>
        </form>

        <p className="muted">
          Já possui acesso? <Link href="/auth/sign-in">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
