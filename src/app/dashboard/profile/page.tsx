import { updateProfileAction } from "@/app/actions/profile";
import { SubmitButton } from "@/components/forms/submit-button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCurrentUserProfile } from "@/lib/workspaces";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const profile = await getCurrentUserProfile();

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Perfil</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Minha conta
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Atualize seus dados pessoais, senha, foto e a preferencia global de tema da interface.
        </p>
      </header>

      {params.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {params.error}
        </p>
      ) : null}
      {params.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {params.success}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <div className="flex flex-col items-start gap-4">
            <Avatar
              name={profile.full_name ?? user.email ?? "Usuario"}
              src={profile.avatar_signed_url}
              className="h-24 w-24 rounded-[28px] text-2xl"
            />
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {profile.full_name ?? "Usuario"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Tema atual:</span>{" "}
                {profile.theme_preference === "dark" ? "Noturno" : "Diurno"}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Status:</span>{" "}
                {profile.is_active ? "Ativo" : "Inativo"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <form action={updateProfileAction} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome</span>
                <input
                  name="fullName"
                  defaultValue={profile.full_name ?? ""}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email ?? ""}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nova senha</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Deixe em branco para manter"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema</span>
                <select
                  name="themePreference"
                  defaultValue={profile.theme_preference}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="light">Diurno</option>
                  <option value="dark">Noturno</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Foto do perfil</span>
              <input
                name="avatar"
                type="file"
                accept="image/*"
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Imagens de ate 50MB, armazenadas com seguranca no Supabase Storage.
              </span>
            </label>

            <SubmitButton
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
              pendingLabel="Salvando perfil..."
            >
              Salvar alteracoes
            </SubmitButton>
          </form>
        </Card>
      </div>
    </section>
  );
}
