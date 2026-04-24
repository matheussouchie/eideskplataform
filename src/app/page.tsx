import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
        <div className="grid gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">EiDesk</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-6xl">
              Service desk multi-tenant com visual moderno e fluxo pronto para operação.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
              Autenticação, workspaces isolados, dashboard produtivo, kanban inspirado em Zendesk e
              base preparada para crescer sprint a sprint com Next.js e Supabase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="/auth/sign-up"
              >
                Criar conta
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                href="/auth/sign-in"
              >
                Entrar
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-900">Dashboard operacional</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cards clicáveis, visão por responsabilidade e navegação rápida para o kanban.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-900">Kanban de tickets</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Colunas por etapa, tickets reais do banco e foco em produtividade.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-900">Arquitetura pronta</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Base integrada com Supabase, Vercel e RLS, pronta para as próximas sprints.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
