import Link from "next/link";

import { signInAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { APP_VERSION } from "@/lib/constants";

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
    <main className="min-h-screen bg-[linear-gradient(135deg,#0B0F1A,#1E293B)] px-4 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.28)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#0B0F1A,#172554_52%,#1E293B)] p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_32%)]" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">EiDesk</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">Gestão inteligente de tickets</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Operacao SaaS preparada para filas complexas, contexto compartilhado e produtividade real de atendimento.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Kanban operacional com fluxo claro por status",
                "Triagem por equipe, departamento, produto e categoria",
                "Experiencia responsiva sem sacrificar o desktop",
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
              Ainda nao tem conta?{" "}
              <Link href="/auth/sign-up" className="font-semibold text-sky-700">
                Criar agora
              </Link>
            </p>
            <p className="mt-6 text-center text-xs font-medium text-slate-400">{`Versão ${APP_VERSION}`}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
