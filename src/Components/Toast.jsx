import React from 'react';

const typeStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const typeIcons = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i',
};

export default function Toast({ toast, onClose }) {
  React.useEffect(() => {
    if (!toast) return undefined;

    const timeout = window.setTimeout(() => {
      onClose?.();
    }, toast.duration || 6000);

    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'info';

  return (
    <div className="fixed right-5 bottom-5 z-[1000] max-w-[420px]">
      <div className={`border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3 ${typeStyles[type] || typeStyles.info}`}>
        <div className="h-5 w-5 rounded-full bg-white/70 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          {typeIcons[type] || typeIcons.info}
        </div>
        <div className="min-w-0 flex-1">
          {toast.title && <div className="text-sm font-semibold leading-5">{toast.title}</div>}
          {toast.message && <div className="text-xs leading-5 whitespace-pre-line break-words">{toast.message}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-current/60 hover:text-current text-sm leading-none shrink-0"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
