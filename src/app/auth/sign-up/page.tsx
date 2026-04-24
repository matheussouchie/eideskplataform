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
    <main className="mx-auto grid min-h-screen w-full max-w-6xl place-items-center px-4 py-10">
      <section className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-slate-950 p-10 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">EiDesk</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Crie um workspace com visual pronto para operação.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            A base de tickets, equipe e kanban fica disponível assim que a conta for criada.
          </p>
        </div>

        <div className="p-6 sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Cadastro</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Criar conta</h1>
            <p className="mt-2 text-sm text-slate-500">
              Ao concluir, você poderá criar seu primeiro workspace do EiDesk.
            </p>
          </div>

          {params.error ? (
            <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {params.error}
            </p>
          ) : null}

          <form className="mt-6 grid gap-4" action={signUpAction}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Nome completo</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
                name="fullName"
                type="text"
                placeholder="Nome e sobrenome"
                required
              />
            </label>
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
                placeholder="Crie uma senha forte"
                minLength={8}
                required
              />
            </label>
            <SubmitButton
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              pendingLabel="Criando conta..."
            >
              Criar conta
            </SubmitButton>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Já possui acesso?{" "}
            <Link href="/auth/sign-in" className="font-semibold text-sky-700">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
