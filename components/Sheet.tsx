"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * A bottom-anchored modal sheet — the web counterpart of the native
 * BottomSheet / SwiftUI `.sheet`. Rounded 32px top corners, dimmed backdrop,
 * drag-indicator, scroll-locked body. Slides up on mount.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[fade_0.2s_ease]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-lg max-h-[92vh] flex flex-col bg-surface-low rounded-t-[32px] sm:rounded-[32px] shadow-2xl animate-[slideup_0.28s_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        <div className="flex items-center gap-3 px-5 pt-4 pb-2 shrink-0">
          <div className="absolute left-1/2 -translate-x-1/2 top-2 h-1 w-9 rounded-full bg-on-surface-variant/30" />
          <h2 className="text-lg font-semibold flex-1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center h-9 w-9 rounded-full text-on-surface-variant hover:bg-surface-container active:scale-95 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 flex-1">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-outline-variant/40 p-4">{footer}</div>
        )}
      </div>
      <style>{`
        @keyframes slideup { from { transform: translateY(100%);} to { transform: translateY(0);} }
        @keyframes fade { from { opacity: 0;} to { opacity: 1;} }
      `}</style>
    </div>,
    document.body,
  );
}
