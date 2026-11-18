"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const initials = (name: string) => name.split(" ").filter(Boolean).slice(0,2).map(part => part[0]).join("").toUpperCase();
export const today = () => new Date().toLocaleDateString("en-CA");
export function Empty({ title, description, action, icon: Icon = Users }: { title: string; description: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return <div className="empty"><span className="empty-icon"><Icon size={26} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function RowActions({ edit, remove, label }: { edit: () => void; remove: () => void; label: string }) {
  return <div className="row-actions"><button className="icon-button" onClick={edit} aria-label={`Editar ${label}`}><Pencil size={16} /></button><button className="icon-button danger-text" onClick={remove} aria-label={`Excluir ${label}`}><Trash2 size={16} /></button></div>;
}
