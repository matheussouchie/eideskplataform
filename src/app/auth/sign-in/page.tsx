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
    <main className="mx-auto grid min-h-screen w-full max-w-6xl place-items-center px-4 py-10">
      <section className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-slate-950 p-10 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">EiDesk</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Atendimento organizado para times que vivem de contexto.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            Dashboard limpo, kanban produtivo e navegação preparada para operação SaaS.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Acesso</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Entrar no EiDesk</h1>
            <p className="mt-2 text-sm text-slate-500">
              Use sua conta para acessar o workspace e operar os tickets.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {params.error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {params.error}
              </p>
            ) : null}
            {params.message ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {params.message}
              </p>
            ) : null}
          </div>

          <form className="mt-6 grid gap-4" action={signInAction}>
            <input type="hidden" name="next" value={params.next ?? ""} />
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                name="email"
                type="email"
                placeholder="voce@empresa.com"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                name="password"
                type="password"
                placeholder="Sua senha"
                required
              />
            </label>
            <SubmitButton
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              pendingLabel="Entrando..."
            >
              Entrar
            </SubmitButton>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Ainda não tem conta?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-sky-700">
              Criar agora
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
