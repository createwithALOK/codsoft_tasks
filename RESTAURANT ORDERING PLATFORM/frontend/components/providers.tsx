'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

// ─── Toast types ────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

// ─── Module-level reference so `toast()` can be called outside React ────────

let _addToast: ((message: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = 'info'): void {
  if (_addToast) {
    _addToast(message, type);
  } else {
    // Queue until provider mounts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dinedesk:toast', { detail: { message, type } })
      );
    }
  }
}

// ─── Color map ───────────────────────────────────────────────────────────────

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-600 text-white',
};

// ─── Toaster UI ──────────────────────────────────────────────────────────────

function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Register the module-level reference
  useEffect(() => {
    _addToast = addToast;

    // Drain any queued events
    function handleEvent(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      addToast(message, type);
    }
    window.addEventListener('dinedesk:toast', handleEvent);

    return () => {
      _addToast = null;
      window.removeEventListener('dinedesk:toast', handleEvent);
    };
  }, [addToast]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs ${typeClasses[t.type]}`}
          role="alert"
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="ml-auto shrink-0 opacity-80 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Providers ───────────────────────────────────────────────────────────────

export default function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    _addToast = addToast;

    function handleEvent(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      addToast(message, type);
    }
    window.addEventListener('dinedesk:toast', handleEvent);

    return () => {
      _addToast = null;
      window.removeEventListener('dinedesk:toast', handleEvent);
    };
  }, [addToast]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Inline Toaster */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs ${typeClasses[t.type]}`}
              role="alert"
            >
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-auto shrink-0 opacity-80 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
