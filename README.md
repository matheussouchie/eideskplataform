# EiDesk

SaaS multi-tenant de service desk com Next.js App Router, Supabase Auth/PostgreSQL/Storage e deploy pronto para Vercel.

## Stack

- Next.js 16 + React 19
- Supabase SSR
- PostgreSQL com RLS
- Vercel

## Variáveis

Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Banco

Execute o SQL em `supabase/migrations/20260423_initial.sql` no SQL Editor do Supabase.

## Rodando

```bash
npm install
npm run dev
```
