import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "urgent";
interface ToastState {
  message: string;
  kind: ToastKind;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<{ showToast: (message: string, kind?: ToastKind, action?: ToastState["action"]) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, kind: ToastKind = "success", action?: ToastState["action"]) => {
    setToast({ message, kind, action });
    window.setTimeout(() => setToast(null), kind === "urgent" ? 7000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status" aria-live="polite">
          <span className="toast-dot" />
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button className="toast-action" onClick={() => { toast.action?.onClick(); setToast(null); }}>
              {toast.action.label}
            </button>
          )}
          <button className="toast-close" aria-label="Dismiss notification" onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
