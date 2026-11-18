import type { z } from "zod";
import type { contactSchema, opportunitySchema, taskSchema } from "../server/validation";

export type User = { id: string; name: string; email: string; company: string; provider?: "google" };
export type Contact = z.infer<typeof contactSchema> & { id: string; created_at: string };
export type Opportunity = z.infer<typeof opportunitySchema> & { id: string; created_at: string };
export type Task = z.infer<typeof taskSchema> & { id: string; created_at: string };
export type CRMData = { user: User; contacts: Contact[]; opportunities: Opportunity[]; tasks: Task[] };
export type Section = "dashboard" | "contacts" | "opportunities" | "tasks" | "reports" | "settings";
export const stages = { new: "Novas", qualified: "Qualificação", proposal: "Proposta", won: "Ganhas", lost: "Perdidas" };
export const priorities = { low: "Baixa", normal: "Normal", high: "Alta" };
export const contactStatuses = { lead: "Lead", active: "Cliente", inactive: "Inativo" };
export const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
export const dateLabel = (value: string | null | undefined) => value ? new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR") : "Sem data";
export function csv(rows: (string | number)[][]): string {
  return "\uFEFF" + rows.map(row => row.map(value => {
    let cell = String(value);
    if (/^[=+\-@\t\r]/.test(cell)) cell = "'" + cell;
    return '"' + cell.replaceAll('"', '""') + '"';
  }).join(";")).join("\r\n");
}
