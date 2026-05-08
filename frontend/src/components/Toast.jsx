import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  info: <Info className="w-5 h-5 text-blue-400" />,
};
const borderColors = {
  success: 'border-emerald-500/30',
  warning: 'border-amber-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
};
export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${borderColors[type]} bg-[var(--color-bg-secondary)] shadow-2xl backdrop-blur-md transition-all duration-300 ${
        visible ? 'animate-fade-slide-up opacity-100' : 'opacity-0 translate-y-2'
      }`}
    >
      {icons[type]}
      <p className="text-sm text-[var(--color-text-primary)] flex-1">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 100); }}
        className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}