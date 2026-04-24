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
    domain_id: string;
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
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    team_id: string | null;
  } | null;
};

export type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
export type TicketCommentRow = Database["public"]["Tables"]["ticket_comments"]["Row"];
export type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
export type TeamRow = Database["public"]["Tables"]["teams"]["Row"];
export type TicketStatusRow = Database["public"]["Tables"]["ticket_statuses"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type DepartmentWithTeams = DepartmentRow & {
  teams: TeamRow[];
};

export type TicketStatusWithMeta = TicketStatusRow;
export type ProductTreeNode = ProductRow & {
  children: ProductTreeNode[];
};

export type TicketWithRelations = TicketRow & {
  category: {
    id: string;
    name: string;
  } | null;
  product: {
    id: string;
    name: string;
    parent_id: string | null;
  } | null;
  status_info: {
    id: string;
    name: string;
    order: number;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
    department_id: string;
  } | null;
  requester: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    team_id: string | null;
  } | null;
  assignee: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    team_id: string | null;
  } | null;
};

export type TicketCommentWithAuthor = TicketCommentRow & {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    team_id: string | null;
  } | null;
};

type ProfileLookupRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  team_id: string | null;
};

type MembershipLookupRow = {
  created_at: string;
  role: Database["public"]["Enums"]["workspace_role"];
  user_id: string;
};

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

  const membershipRows = (memberships ?? []) as MembershipLookupRow[];
  const userIds = membershipRows.map((membership: MembershipLookupRow) => membership.user_id);

  if (!userIds.length) {
    return [] as WorkspaceMemberRow[];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, team_id")
    .in("id", userIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profilesMap = new Map(
    ((profiles ?? []) as ProfileLookupRow[]).map((profile: ProfileLookupRow) => [
      profile.id,
      {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        team_id: profile.team_id,
      },
    ]),
  );

  return membershipRows.map((membership: MembershipLookupRow) => ({
    ...membership,
    profile: profilesMap.get(membership.user_id) ?? null,
  })) as WorkspaceMemberRow[];
}

export async function getWorkspaceDepartments(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DepartmentRow[];
}

export async function getWorkspaceTeams(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamRow[];
}

export async function getDomainProducts(domainId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("domain_id", domainId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProductRow[];
}

export async function getDomainCategories(domainId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("domain_id", domainId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}

export function buildProductTree(products: ProductRow[], parentId: string | null = null): ProductTreeNode[] {
  return products
    .filter((product: ProductRow) => product.parent_id === parentId)
    .sort((a: ProductRow, b: ProductRow) => a.name.localeCompare(b.name))
    .map((product: ProductRow) => ({
      ...product,
      children: buildProductTree(products, product.id),
    }));
}

export async function getWorkspaceTicketStatuses(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ticket_statuses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TicketStatusRow[];
}

export async function getWorkspaceDepartmentsWithTeams(workspaceId: string) {
  const [departments, teams] = await Promise.all([
    getWorkspaceDepartments(workspaceId),
    getWorkspaceTeams(workspaceId),
  ]);

  return departments.map((department: DepartmentRow) => ({
    ...department,
    teams: teams.filter((team: TeamRow) => team.department_id === department.id),
  })) as DepartmentWithTeams[];
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

export async function getWorkspaceTicketsDetailed(workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const [tickets, departments, teams, statuses] = await Promise.all([
    getWorkspaceTickets(workspaceId),
    getWorkspaceDepartments(workspaceId),
    getWorkspaceTeams(workspaceId),
    getWorkspaceTicketStatuses(workspaceId),
  ]);

  const domainId = departments[0]?.domain_id ?? teams[0]?.domain_id ?? tickets[0]?.domain_id;
  const [products, categories] = domainId
    ? await Promise.all([getDomainProducts(domainId), getDomainCategories(domainId)])
    : [[], []];

  const relatedUserIds = Array.from(
    new Set(
      tickets
        .flatMap((ticket: TicketRow) =>
          [ticket.requester_id, ticket.assigned_to ?? ticket.assignee_id].filter(Boolean),
        )
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  let profilesMap = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null; team_id: string | null }
  >();

  if (relatedUserIds.length) {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, team_id")
      .in("id", relatedUserIds);

    if (error) {
      throw new Error(error.message);
    }

    profilesMap = new Map(
      ((profiles ?? []) as ProfileLookupRow[]).map((profile: ProfileLookupRow) => [
        profile.id,
        {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          team_id: profile.team_id,
        },
      ]),
    );
  }

  const departmentsMap = new Map(
    departments.map((department: DepartmentRow) => [
      department.id,
      {
        id: department.id,
        name: department.name,
      },
    ]),
  );

  const teamsMap = new Map(
    teams.map((team: TeamRow) => [
      team.id,
      {
        id: team.id,
        name: team.name,
        department_id: team.department_id,
      },
    ]),
  );

  const statusesMap = new Map(
    statuses.map((status: TicketStatusRow) => [
      status.id,
      {
        id: status.id,
        name: status.name,
        order: status.order,
      },
    ]),
  );

  const productsMap = new Map(
    products.map((product: ProductRow) => [
      product.id,
      {
        id: product.id,
        name: product.name,
        parent_id: product.parent_id,
      },
    ]),
  );

  const categoriesMap = new Map(
    categories.map((category: CategoryRow) => [
      category.id,
      {
        id: category.id,
        name: category.name,
      },
    ]),
  );

  return tickets.map((ticket: TicketRow) => ({
    ...ticket,
    category: categoriesMap.get(ticket.category_id) ?? null,
    product: productsMap.get(ticket.product_id) ?? null,
    status_info: statusesMap.get(ticket.status_id) ?? null,
    department: departmentsMap.get(ticket.department_id) ?? null,
    team: teamsMap.get(ticket.team_id) ?? null,
    requester: profilesMap.get(ticket.requester_id) ?? null,
    assignee: ticket.assigned_to
      ? profilesMap.get(ticket.assigned_to) ?? null
      : ticket.assignee_id
        ? profilesMap.get(ticket.assignee_id) ?? null
        : null,
  })) as TicketWithRelations[];
}

export async function getTicketById(workspaceId: string, ticketId: string) {
  const tickets = await getWorkspaceTicketsDetailed(workspaceId);
  return tickets.find((ticket: TicketWithRelations) => ticket.id === ticketId) ?? null;
}

export async function getTicketComments(ticketId: string, workspaceId: string) {
  const supabase = await getSupabaseServerClient();
  const { data: comments, error } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .eq("workspace_id", workspaceId)
    .eq("internal", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const commentRows = (comments ?? []) as TicketCommentRow[];
  const authorIds = Array.from(
    new Set(
      commentRows
        .map((comment: TicketCommentRow) => comment.author_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let profilesMap = new Map<
    string,
    { id: string; full_name: string | null; avatar_url: string | null; team_id: string | null }
  >();

  if (authorIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, team_id")
      .in("id", authorIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    profilesMap = new Map(
      ((profiles ?? []) as ProfileLookupRow[]).map((profile: ProfileLookupRow) => [
        profile.id,
        {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          team_id: profile.team_id,
        },
      ]),
    );
  }

  return commentRows.map((comment: TicketCommentRow) => ({
    ...comment,
    author: profilesMap.get(comment.author_id) ?? null,
  })) as TicketCommentWithAuthor[];
}

export function getTicketsForUser(tickets: TicketWithRelations[], userId: string) {
  return tickets.filter(
    (ticket: TicketWithRelations) =>
      ticket.assigned_to === userId || ticket.assignee_id === userId || ticket.requester_id === userId,
  );
}

export function getTicketsForTeam(tickets: TicketWithRelations[], teamId: string | null | undefined) {
  if (!teamId) {
    return [] as TicketWithRelations[];
  }

  return tickets.filter((ticket: TicketWithRelations) => ticket.team_id === teamId);
}

export function getTicketsForDepartment(
  tickets: TicketWithRelations[],
  departmentId: string | null | undefined,
) {
  if (!departmentId) {
    return [] as TicketWithRelations[];
  }

  return tickets.filter((ticket: TicketWithRelations) => ticket.department_id === departmentId);
}

export function buildDashboardWorkflowMetrics(
  tickets: TicketWithRelations[],
  members: WorkspaceMemberRow[],
  statuses: TicketStatusRow[],
) {
  const byStatus = statuses.map((status: TicketStatusRow) => ({
    id: status.id,
    label: status.name,
    total: tickets.filter((ticket: TicketWithRelations) => ticket.status_id === status.id).length,
  }));

  const byAgent = members
    .filter((member: WorkspaceMemberRow) => member.role === "agent")
    .map((member: WorkspaceMemberRow) => ({
      id: member.user_id,
      label: member.profile?.full_name ?? member.user_id,
      total: tickets.filter((ticket: TicketWithRelations) => ticket.assigned_to === member.user_id).length,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

  const byTeam = Array.from(
    tickets.reduce((map, ticket) => {
      const key = ticket.team?.id ?? "no-team";
      const current = map.get(key) ?? {
        id: key,
        label: ticket.team?.name ?? "Sem time",
        total: 0,
      };
      current.total += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { id: string; label: string; total: number }>()),
  )
    .map(([, value]) => value)
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

  return {
    byStatus,
    byAgent,
    byTeam,
  };
}
