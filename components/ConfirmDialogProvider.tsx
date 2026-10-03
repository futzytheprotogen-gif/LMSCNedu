"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "./ConfirmDialog.module.css";

type ConfirmTone = "danger" | "primary";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

type ConfirmAction = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmAction | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const finish = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setDialog(options);
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") finish(false);
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [dialog, finish]);

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton?.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton?.focus();
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) finish(false);
          }}
        >
          <div
            className={`${styles.dialog} ${dialog.tone === "primary" ? styles.primaryDialog : ""}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onKeyDown={handleDialogKeyDown}
          >
            <div className={`${styles.symbol} ${dialog.tone === "primary" ? styles.primarySymbol : ""}`} aria-hidden="true">
              {dialog.tone === "primary" ? "?" : "!"}
            </div>
            <h2 className={styles.title} id="confirm-dialog-title">{dialog.title}</h2>
            <p className={styles.message} id="confirm-dialog-message">{dialog.message}</p>
            <div className={styles.actions}>
              <button
                className={styles.cancelButton}
                onClick={() => finish(false)}
                ref={cancelButtonRef}
                type="button"
              >
                {dialog.cancelLabel ?? "Batal"}
              </button>
              <button
                className={`${styles.confirmButton} ${dialog.tone === "primary" ? styles.primaryButton : ""}`}
                onClick={() => finish(true)}
                type="button"
              >
                {dialog.confirmLabel ?? "Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useAppConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useAppConfirm harus digunakan di dalam ConfirmDialogProvider.");
  }
  return confirm;
}