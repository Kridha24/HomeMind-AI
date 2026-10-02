// Lightweight accessible toast utility
type ToastType = 'success' | 'error' | 'info';

let toastContainer: HTMLDivElement | null = null;

function getOrCreateContainer(): HTMLDivElement {
  if (toastContainer && document.body.contains(toastContainer)) {
    return toastContainer;
  }
  toastContainer = document.createElement('div');
  toastContainer.className =
    'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none transition-all';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('role', 'status');
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showToast(message: string, type: ToastType = 'info') {
  if (typeof document === 'undefined') return;

  const container = getOrCreateContainer();
  const el = document.createElement('div');

  const bgStyles = {
    success: 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20',
    error: 'bg-rose-600 text-white border-rose-700 shadow-rose-500/20',
    info: 'bg-slate-900 dark:bg-card text-white dark:text-foreground border-border shadow-black/20',
  }[type];

  el.className = `pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg border transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2 ${bgStyles}`;
  el.textContent = message;

  container.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => {
    el.classList.remove('translate-y-2', 'opacity-0');
    el.classList.add('translate-y-0', 'opacity-100');
  });

  // Auto remove after 3s
  setTimeout(() => {
    el.classList.remove('translate-y-0', 'opacity-100');
    el.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => {
      if (container.contains(el)) {
        container.removeChild(el);
      }
    }, 300);
  }, 3000);
}

export const toast = {
  success: (msg: string) => showToast(msg, 'success'),
  error: (msg: string) => showToast(msg, 'error'),
  info: (msg: string) => showToast(msg, 'info'),
};

export default toast;
