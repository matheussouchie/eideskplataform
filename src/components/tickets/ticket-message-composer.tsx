"use client";

import { useEffect, useMemo, useState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

type TicketMessageComposerProps = {
  action: (formData: FormData) => void | Promise<void>;
  canUseInternalMessages: boolean;
  shouldClearDraft: boolean;
  ticketId: string;
};

type DraftState = {
  body: string;
  visibility: "public" | "internal";
};

export function TicketMessageComposer({
  action,
  canUseInternalMessages,
  shouldClearDraft,
  ticketId,
}: TicketMessageComposerProps) {
  const storageKey = useMemo(() => `eidesk-ticket-draft:${ticketId}`, [ticketId]);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"public" | "internal">("public");

  useEffect(() => {
    if (shouldClearDraft) {
      window.localStorage.removeItem(storageKey);
      setBody("");
      setVisibility("public");
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const draft = JSON.parse(stored) as DraftState;
      setBody(draft.body ?? "");
      setVisibility(
        draft.visibility === "internal" && canUseInternalMessages ? "internal" : "public",
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [canUseInternalMessages, shouldClearDraft, storageKey]);

  useEffect(() => {
    const payload: DraftState = {
      body,
      visibility: canUseInternalMessages ? visibility : "public",
    };

    if (!payload.body.trim()) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [body, canUseInternalMessages, storageKey, visibility]);

  return (
    <form className="mt-5 grid gap-3" action={action}>
      <input type="hidden" name="ticketId" value={ticketId} />
      <input type="hidden" name="redirectTo" value={`/dashboard/tickets/${ticketId}`} />

      {canUseInternalMessages ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Visibilidade</span>
          <select
            name="visibility"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as "public" | "internal")}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-sky-400 focus:bg-white"
          >
            <option value="public">Mensagem publica</option>
            <option value="internal">Mensagem interna</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="visibility" value="public" />
      )}

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Mensagem</span>
        <textarea
          name="body"
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escreva uma atualizacao clara para o ticket."
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
        />
        <span className="text-xs text-slate-500">
          Rascunho salvo automaticamente neste navegador.
        </span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Anexos</span>
        <input
          type="file"
          name="attachments"
          multiple
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        />
        <span className="text-xs text-slate-500">Cada arquivo pode ter ate 50MB.</span>
      </label>

      <SubmitButton
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        pendingLabel="Enviando..."
      >
        Enviar mensagem
      </SubmitButton>
    </form>
  );
}
