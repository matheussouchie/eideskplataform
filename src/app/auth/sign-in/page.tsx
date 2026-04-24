import Link from "next/link";

import { signInAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";

type SignInPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Acesso</p>
          <h1>Entrar no EiDesk</h1>
          <p className="muted">Use sua conta para acessar o workspace e operar os tickets.</p>
        </div>

        {params.error ? <p className="alert error">{params.error}</p> : null}
        {params.message ? <p className="alert success">{params.message}</p> : null}

        <form className="stack" action={signInAction}>
          <input type="hidden" name="next" value={params.next ?? ""} />
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" placeholder="voce@empresa.com" required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input name="password" type="password" placeholder="Sua senha" required />
          </label>
          <SubmitButton className="primary-button" pendingLabel="Entrando...">
            Entrar
          </SubmitButton>
        </form>

        <p className="muted">
          Ainda não tem conta? <Link href="/auth/sign-up">Criar agora</Link>
        </p>
      </section>
    </main>
  );
}
