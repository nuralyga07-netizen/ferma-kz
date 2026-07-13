'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
        primary: 'bg-emerald-500 text-white',
        secondary:
          'bg-white/10 text-white/80 border border-white/10',
        success:
          'bg-green-500/15 text-green-400 border border-green-500/20',
        warning:
          'bg-amber-500/15 text-amber-400 border border-amber-500/20',
        danger:
          'bg-red-500/15 text-red-400 border border-red-500/20',
        info: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
        outline: 'border border-white/20 text-white/60',
        glass: 'bg-white/5 backdrop-blur-xl border border-white/10 text-white/80',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
