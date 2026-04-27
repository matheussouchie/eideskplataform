"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { clearTicketDraftAction, saveTicketDraftAction } from "@/app/actions/ticket-drafts";
import { createTicketAction } from "@/app/actions/tickets";
import { SubmitButton } from "@/components/forms/submit-button";
import { TicketDescriptionEditor } from "@/components/tickets/ticket-description-editor";
import type { ProductTreeNode } from "@/lib/workspaces";
import type { Database } from "@/types/database";

type DraftSnapshot = {
  categoryId: string;
  description: string;
  priority: Database["public"]["Enums"]["ticket_priority"];
  productId: string;
  title: string;
};

type NewTicketFormProps = {
  categories: Array<{ id: string; name: string }>;
  defaultCategoryId: string;
  defaultProductId: string;
  defaultValues?: Partial<DraftSnapshot>;
  departmentId: string;
  products: ProductTreeNode[];
  teamId: string;
  userId: string;
  workspaceId: string;
};

function flattenProducts(nodes: ProductTreeNode[], depth = 0): Array<{ id: string; label: string }> {
  return nodes.flatMap((node) => [
    {
      id: node.id,
      label: `${"  ".repeat(depth)}${depth ? "-> " : ""}${node.name}`,
    },
    ...flattenProducts(node.children, depth + 1),
  ]);
}

export function NewTicketForm({
  categories,
  defaultCategoryId,
  defaultProductId,
  defaultValues,
  departmentId,
  products,
  teamId,
  userId,
  workspaceId,
}: NewTicketFormProps) {
  const productOptions = useMemo(() => flattenProducts(products), [products]);
  const storageKey = useMemo(() => `eidesk-create-ticket-draft:${workspaceId}:${userId}`, [userId, workspaceId]);
  const submitFlagKey = `${storageKey}:submitted`;
  const initialSnapshot = useMemo<DraftSnapshot>(
    () => ({
      categoryId: defaultValues?.categoryId ?? defaultCategoryId,
      description: defaultValues?.description ?? "",
      priority: defaultValues?.priority ?? "medium",
      productId: defaultValues?.productId ?? defaultProductId,
      title: defaultValues?.title ?? "",
    }),
    [defaultCategoryId, defaultProductId, defaultValues],
  );

  const [title, setTitle] = useState(initialSnapshot.title);
  const [description, setDescription] = useState(initialSnapshot.description);
  const [productId, setProductId] = useState(initialSnapshot.productId);
  const [categoryId, setCategoryId] = useState(initialSnapshot.categoryId);
  const [priority, setPriority] = useState<Database["public"]["Enums"]["ticket_priority"]>(initialSnapshot.priority);
  const hydratedRef = useRef(false);

  const isDirty =
    title !== initialSnapshot.title ||
    description !== initialSnapshot.description ||
    productId !== initialSnapshot.productId ||
    categoryId !== initialSnapshot.categoryId ||
    priority !== initialSnapshot.priority;

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    const submittedFlag = window.sessionStorage.getItem(submitFlagKey);

    if (submittedFlag && !defaultValues?.title && !defaultValues?.description) {
      window.localStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(submitFlagKey);
    }

    if (!stored) {
      hydratedRef.current = true;
      return;
    }

    try {
      const draft = JSON.parse(stored) as Partial<DraftSnapshot>;
      setTitle(typeof draft.title === "string" ? draft.title : initialSnapshot.title);
      setDescription(typeof draft.description === "string" ? draft.description : initialSnapshot.description);
      setProductId(typeof draft.productId === "string" ? draft.productId : initialSnapshot.productId);
      setCategoryId(typeof draft.categoryId === "string" ? draft.categoryId : initialSnapshot.categoryId);
      setPriority(
        draft.priority && ["low", "medium", "high", "urgent"].includes(draft.priority)
          ? draft.priority
          : initialSnapshot.priority,
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      hydratedRef.current = true;
    }
  }, [defaultValues, initialSnapshot, storageKey, submitFlagKey]);

  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }

    const snapshot: DraftSnapshot = {
      categoryId,
      description,
      priority,
      productId,
      title,
    };
    const matchesInitial =
      snapshot.title === initialSnapshot.title &&
      snapshot.description === initialSnapshot.description &&
      snapshot.productId === initialSnapshot.productId &&
      snapshot.categoryId === initialSnapshot.categoryId &&
      snapshot.priority === initialSnapshot.priority;

    const timeoutId = window.setTimeout(() => {
      if (matchesInitial) {
        window.localStorage.removeItem(storageKey);
        void clearTicketDraftAction();
        return;
      }

      window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
      void saveTicketDraftAction({
        categoryId: snapshot.categoryId || null,
        description: snapshot.description,
        priority: snapshot.priority,
        productId: snapshot.productId || null,
        title: snapshot.title,
      });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [categoryId, description, initialSnapshot, priority, productId, storageKey, title]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "Deseja sair da pagina? As informacoes do ticket podem ser perdidas.";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDirty) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor || anchor.target === "_blank" || anchor.href === window.location.href) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const confirmLeave = window.confirm(
        "Deseja sair da pagina? As informacoes do ticket podem ser perdidas.",
      );

      if (!confirmLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty]);

  return (
    <form
      action={createTicketAction}
      className="grid gap-6"
      onSubmit={() => {
        window.sessionStorage.setItem(submitFlagKey, "1");
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="departmentId" value={departmentId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="redirectTo" value="/dashboard/tickets/new" />
      <input type="hidden" name="successRedirectTo" value="/dashboard/tickets" />
      <input type="hidden" name="teamId" value={teamId} />

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="space-y-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Titulo</span>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Usuario nao consegue anexar comprovante no ticket"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-950"
              required
            />
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Descricao</span>
            <TicketDescriptionEditor
              name="description"
              value={description}
              onChange={setDescription}
              placeholder="Descreva o problema, impacto, contexto, o que ja foi tentado e qualquer evidencia util."
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              O rascunho fica salvo automaticamente neste navegador e no seu workspace.
            </span>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Imagens e anexos</span>
            <input
              type="file"
              name="attachments"
              multiple
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Cada arquivo pode ter ate 50MB e sera anexado junto com a abertura do ticket.
            </span>
          </label>
        </section>

        <section className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Classificacao</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Produto, categoria e prioridade orientam a fila operacional do atendimento.
            </p>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Produto</span>
                <select
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Categoria</span>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Prioridade</span>
                <select
                  name="priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as Database["public"]["Enums"]["ticket_priority"])
                  }
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="low">Baixo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                  <option value="urgent">Critico</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/70">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Destino operacional</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              O ticket entra na esteira do seu time atual e segue o fluxo do tenant.
            </p>

            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Departamento:</span> vinculado ao seu time ativo
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Time:</span> distribuicao automatica respeita os agentes ativos desse time
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950/70">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Rascunho persistido automaticamente enquanto voce digita.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              setTitle("");
              setDescription("");
              setProductId(defaultProductId);
              setCategoryId(defaultCategoryId);
              setPriority("medium");
              window.localStorage.removeItem(storageKey);
              window.sessionStorage.removeItem(submitFlagKey);
              await clearTicketDraftAction();
            }}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
          >
            Limpar rascunho
          </button>
          <SubmitButton
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
            pendingLabel="Criando ticket..."
          >
            Criar ticket
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
