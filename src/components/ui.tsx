"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Contrast, X } from "lucide-react";

type FontScale = "sm" | "md" | "lg";

const STORAGE_FONT = "tr_a11y_font";
const STORAGE_CONTRAST = "tr_a11y_contrast";
const A11Y_EVENT = "tr:a11y-change";

function applyA11y(font: FontScale, highContrast: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (font === "md") root.removeAttribute("data-font");
  else root.setAttribute("data-font", font);
  if (highContrast) root.setAttribute("data-contrast", "high");
  else root.removeAttribute("data-contrast");
}

export function AccessibilityControls({ compact = false }: { compact?: boolean }) {
  const [font, setFont] = useState<FontScale>("md");
  const [contrast, setContrast] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const savedFont = localStorage.getItem(STORAGE_FONT);
        const nextFont: FontScale = savedFont === "sm" || savedFont === "lg" ? savedFont : "md";
        const nextContrast = localStorage.getItem(STORAGE_CONTRAST) === "1";
        setFont(nextFont);
        setContrast(nextContrast);
        applyA11y(nextFont, nextContrast);
      } catch {
        // Ignora bloqueio de armazenamento local.
      }
    };
    read();
    window.addEventListener(A11Y_EVENT, read);
    return () => window.removeEventListener(A11Y_EVENT, read);
  }, []);

  function updateFont(next: FontScale) {
    setFont(next);
    applyA11y(next, contrast);
    try {
      localStorage.setItem(STORAGE_FONT, next);
      window.dispatchEvent(new Event(A11Y_EVENT));
    } catch {}
  }

  function toggleContrast() {
    const next = !contrast;
    setContrast(next);
    applyA11y(font, next);
    try {
      localStorage.setItem(STORAGE_CONTRAST, next ? "1" : "0");
      window.dispatchEvent(new Event(A11Y_EVENT));
    } catch {}
  }

  return (
    <div className={`a11y-controls ${compact ? "a11y-compact" : ""}`} role="group" aria-label="Controles de acessibilidade">
      {!compact && <span className="a11y-label">Acessibilidade:</span>}
      <button
        type="button"
        id={compact ? "crm-a11y-font-sm" : "portal-a11y-font-sm"}
        className={`a11y-btn ${font === "sm" ? "active" : ""}`}
        onClick={() => updateFont("sm")}
        aria-pressed={font === "sm"}
        title="Diminuir tamanho da fonte"
      >
        A-
      </button>
      <button
        type="button"
        id={compact ? "crm-a11y-font-md" : "portal-a11y-font-md"}
        className={`a11y-btn ${font === "md" ? "active" : ""}`}
        onClick={() => updateFont("md")}
        aria-pressed={font === "md"}
        title="Tamanho padrão da fonte"
      >
        A
      </button>
      <button
        type="button"
        id={compact ? "crm-a11y-font-lg" : "portal-a11y-font-lg"}
        className={`a11y-btn ${font === "lg" ? "active" : ""}`}
        onClick={() => updateFont("lg")}
        aria-pressed={font === "lg"}
        title="Aumentar tamanho da fonte"
      >
        A+
      </button>
      <span className="a11y-sep" aria-hidden="true" />
      <button
        type="button"
        id={compact ? "crm-a11y-contrast" : "portal-a11y-contrast"}
        className={`a11y-btn a11y-contrast-btn ${contrast ? "active" : ""}`}
        onClick={toggleContrast}
        aria-pressed={contrast}
        title="Alternar alto contraste"
      >
        <Contrast size={13} />
        <span>{compact ? "Contraste" : "Alto Contraste"}</span>
      </button>
    </div>
  );
}

export function Brand({ light = false, subtitle = "PORTAL & GESTÃO DE OPORTUNIDADES" }: { light?: boolean; subtitle?: string }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <path d="M5 19.5C8.2 17.2 11.4 17.2 14 19.2C16.6 21.2 19.8 21.2 23 18.9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M6.5 23C9.4 21.3 12.1 21.4 14.5 22.8C16.9 24.2 19.6 24.1 22 22.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.72" />
          <circle cx="11" cy="10.5" r="3.2" stroke="currentColor" strokeWidth="2" />
          <path d="M14.5 14.5L21.5 7.5M21.5 7.5H16.2M21.5 7.5V12.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="brand-copy">
        <span className="brand-wordmark">
          Trabalho<span className="brand-amp">&amp;</span>Renda
        </span>
        <small>{subtitle}</small>
      </span>
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Fechar janela" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const getError = (error: unknown) => (error instanceof Error ? error.message : "Não foi possível concluir a operação.");
