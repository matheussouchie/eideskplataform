import type { Database } from "@/types/database";

const labels: Record<Database["public"]["Enums"]["ticket_status"], string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

export function TicketStatusBadge({
  status,
}: {
  status: Database["public"]["Enums"]["ticket_status"];
}) {
  return <span className={`status-badge ${status}`}>{labels[status]}</span>;
}
