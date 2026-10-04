import React from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'emerald' | 'warning';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white font-semibold shadow-xs hover:shadow-md hover:shadow-blue-500/20 hover:-translate-y-px border border-blue-500/40 focus:ring-blue-500/40',
  emerald:
    'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-semibold shadow-xs hover:shadow-md hover:shadow-emerald-500/20 hover:-translate-y-px border border-emerald-500/40 focus:ring-emerald-500/40',
  secondary:
    'bg-secondary/80 hover:bg-secondary active:bg-secondary/60 text-primary font-medium border border-primary/60 hover:border-primary hover:-translate-y-px focus:ring-slate-400/30',
  ghost:
    'bg-transparent hover:bg-secondary/60 text-secondary hover:text-primary font-medium border border-transparent focus:ring-slate-400/20',
  warning:
    'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30 hover:-translate-y-px focus:ring-amber-500/30',
  danger:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/30 hover:-translate-y-px focus:ring-rose-500/30',
};

const sizeClasses: Record<ButtonSize, { btn: string; icon: string }> = {
  xs: { btn: 'px-2 py-1 text-[11px] rounded-lg gap-1 min-h-[28px]', icon: 'w-3 h-3' },
  sm: { btn: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 min-h-[34px]', icon: 'w-3.5 h-3.5' },
  md: { btn: 'px-4 py-2 text-xs sm:text-sm rounded-xl gap-2 min-h-[38px]', icon: 'w-4 h-4' },
  lg: { btn: 'px-5 py-2.5 text-sm sm:text-base rounded-2xl gap-2.5 min-h-[44px]', icon: 'w-4 h-4' },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const { btn, icon: iconSize } = sizeClasses[size];

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none select-none ${variantClasses[variant]} ${btn} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin flex-shrink-0`} />
      ) : Icon ? (
        <Icon className={`${iconSize} flex-shrink-0`} />
      ) : null}
      {children && <span className="leading-none">{children}</span>}
      {!loading && IconRight && <IconRight className={`${iconSize} flex-shrink-0`} />}
    </button>
  );
};

export default Button;
