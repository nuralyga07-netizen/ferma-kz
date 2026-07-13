'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/components/layout/theme-provider';

type ToastProviderProps = React.ComponentProps<typeof SonnerToaster>;

export function ToastProvider({ ...props }: ToastProviderProps) {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group"
      position="top-right"
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white/10 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/20 group-[.toaster]:text-white group-[.toaster]:rounded-2xl',
          title: 'text-sm font-medium text-white',
          description: 'text-xs text-white/60',
          actionButton:
            'bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors',
          cancelButton:
            'bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors',
          success:
            'group-[.toaster]:border-green-500/20 group-[.toaster]:bg-green-500/10',
          error:
            'group-[.toaster]:border-red-500/20 group-[.toaster]:bg-red-500/10',
          warning:
            'group-[.toaster]:border-amber-500/20 group-[.toaster]:bg-amber-500/10',
          info: 'group-[.toaster]:border-sky-500/20 group-[.toaster]:bg-sky-500/10',
          loading:
            'group-[.toaster]:border-white/10 group-[.toaster]:bg-white/5',
          closeButton:
            'group-[.toaster]:text-white/40 group-[.toaster]:hover:text-white',
        },
      }}
      {...props}
    />
  );
}
