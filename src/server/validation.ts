import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).default("");
export const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(254);
export const passwordSchema = z.string().min(10, "Use uma senha de pelo menos 10 caracteres.").max(128);
const date = z.union([z.iso.date(), z.literal("")]).nullable().optional().transform(value => value || null);
const contactId = z.union([z.uuid(), z.literal("")]).nullable().optional().transform(value => value || null);

export const registerSchema = z.object({ name: text(100).min(2), company: text(150).min(2), email: emailSchema, password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const recoverSchema = z.object({ email: emailSchema, recoveryCode: z.string().trim().min(20).max(100), password: passwordSchema });
export const profileSchema = z.object({ name: text(100).min(2), company: text(150).min(2) });
export const contactSchema = z.object({
  name: text(150).min(2, "Informe o nome do contato."),
  email: z.union([emailSchema, z.literal("")]).default(""),
  phone: optionalText(40), company: optionalText(150),
  kind: z.enum(["person", "company"]).default("person"),
  status: z.enum(["lead", "active", "inactive"]).default("lead"),
  notes: optionalText(5000),
});
export const opportunitySchema = z.object({
  title: text(180).min(2), contact_id: contactId,
  value: z.number().int().min(0).max(99999999999).default(0),
  stage: z.enum(["new", "qualified", "proposal", "won", "lost"]).default("new"),
  expected_date: date, notes: optionalText(5000),
});
export const taskSchema = z.object({
  title: text(180).min(2), contact_id: contactId, due_date: date,
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  completed: z.boolean().default(false), notes: optionalText(5000),
});
