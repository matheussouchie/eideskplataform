import Link from "next/link";

import { signUpAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { APP_VERSION } from "@/lib/constants";

type SignUpPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0B0F1A,#1E293B)] px-4 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.28)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#0B0F1A,#172554_52%,#1E293B)] p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_32%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">EiDesk</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">Gestão inteligente de tickets</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Crie sua conta e entre em um ambiente pronto para operacao, filas e governanca de atendimento.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Onboarding rapido para novos workspaces",
                "Estrutura pronta para equipes e departamentos",
                "Visual profissional pensado para escala",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center bg-white p-6 sm:p-10">
          <div className="w-full">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Cadastro</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Criar conta</h1>
              <p className="mt-2 text-sm text-slate-500">
                Ao concluir, voce podera criar seu primeiro workspace do EiDesk.
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
              Ja possui acesso?{" "}
              <Link href="/auth/sign-in" className="font-semibold text-sky-700">
                Entrar
              </Link>
            </p>
            <p className="mt-6 text-center text-xs font-medium text-slate-400">{`Versão ${APP_VERSION}`}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
