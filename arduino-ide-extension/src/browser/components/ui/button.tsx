import * as React from '@theia/core/shared/react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--theia-button-background)] text-[var(--theia-button-foreground)] hover:opacity-90',
        destructive:
          'bg-[var(--theia-errorBackground)] text-[var(--theia-errorForeground)] hover:opacity-90',
        outline:
          'border border-[var(--theia-button-border)] bg-transparent text-[var(--theia-foreground)] hover:bg-[var(--theia-list-hoverBackground)]',
        secondary:
          'bg-[var(--theia-list-inactiveSelectionBackground)] text-[var(--theia-foreground)] hover:opacity-80',
        ghost: 'hover:bg-[var(--theia-list-hoverBackground)]',
        link: 'text-[var(--theia-textLink-foreground)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

