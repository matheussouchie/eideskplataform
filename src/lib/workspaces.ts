import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const ACTIVE_WORKSPACE_COOKIE = "eidesk-workspace";

export type MembershipRow = {
  role: Database["public"]["Enums"]["workspace_role"];
  workspace: {
    created_at: string;
    created_by: string;
    id: string;
    name: string;
    slug: string;
    updated_at: string;
  } | null;
};

export type WorkspaceMemberRow = {
  created_at: string;
  role: Database["public"]["Enums"]["workspace_role"];
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];

export async function getUserMemberships() {
  const user = await requireUser();
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("role, workspace:workspaces(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as MembershipRow[]).filter((item: MembershipRow) => item.workspace);
}

export async function getWorkspaceContext() {
  const memberships = await getUserMemberships();

  if (!memberships.length) {
    return {
      memberships,
      activeMembership: null,
    };
  }

  const cookieStore = await cookies();
  const activeWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  const activeMembership =
    memberships.find((item: MembershipRow) => item.workspace?.id === activeWorkspaceId) ?? memberships[0];

  return {
    memberships,
    activeMembership,
  };
}

export async function requireActiveWorkspace() {
  const context = await getWorkspaceContext();

  if (!context.activeMembership?.workspace) {
    redirect("/dashboard?setup=workspace");
  }

  return context.activeMembership;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from("workspace_memberships")
    .select("role, user_id, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const userIds = (memberships ?? []).map((membership: { user_id: string }) => membership.user_id);

  if (!userIds.length) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profilesMap = new Map(
    (profiles ?? []).map((profile: { id: string; full_name: string | null; avatar_url: string | null }) => [
      profile.id,
      {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
    ]),
  );

  return (memberships ?? []).map((membership: { created_at: string; role: Database["public"]["Enums"]["workspace_role"]; user_id: string }) => ({
    ...membership,
    profile: profilesMap.get(membership.user_id) ?? null,
  })) as WorkspaceMemberRow[];
}

export async function getWorkspaceTickets(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TicketRow[];
}
