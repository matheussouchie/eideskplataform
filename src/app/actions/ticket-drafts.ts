"use server";

import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireActiveWorkspace } from "@/lib/workspaces";
import type { Database } from "@/types/database";

type DraftPayload = {
  categoryId: string | null;
  description: string;
  priority: Database["public"]["Enums"]["ticket_priority"];
  productId: string | null;
  title: string;
};

export async function saveTicketDraftAction(payload: DraftPayload) {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();

  const cleanedTitle = payload.title.trim().slice(0, 180);
  const cleanedDescription = payload.description.trim().slice(0, 5000);
  const cleanedPriority = ["low", "medium", "high", "urgent"].includes(payload.priority)
    ? payload.priority
    : "medium";

  if (!cleanedTitle && !cleanedDescription && !payload.categoryId && !payload.productId) {
    await supabase
      .from("ticket_drafts")
      .delete()
    .eq("user_id", user.id)
    .eq("workspace_id", activeMembership.workspace!.id);

    return { success: true } as const;
  }

  const { error } = await supabase.from("ticket_drafts").upsert(
    {
      category_id: payload.categoryId,
      description: cleanedDescription || null,
      domain_id: activeMembership.workspace!.domain_id,
      priority: cleanedPriority,
      product_id: payload.productId,
      title: cleanedTitle || null,
      user_id: user.id,
      workspace_id: activeMembership.workspace!.id,
    },
    {
      onConflict: "user_id,workspace_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { success: true } as const;
}

export async function clearTicketDraftAction() {
  const user = await requireUser();
  const activeMembership = await requireActiveWorkspace();
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("ticket_drafts")
    .delete()
    .eq("user_id", user.id)
    .eq("workspace_id", activeMembership.workspace!.id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true } as const;
}
