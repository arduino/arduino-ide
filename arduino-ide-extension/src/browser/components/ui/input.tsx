import * as React from '@theia/core/shared/react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Use Theia CSS variables for proper theming
          'bg-[var(--theia-input-background)]',
          'border-[var(--theia-input-border)]',
          'text-[var(--theia-input-foreground)]',
          'placeholder:text-[var(--theia-input-placeholderForeground)]',
          'focus-visible:border-[var(--theia-focusBorder)]',
          'focus-visible:ring-[var(--theia-focusBorder)]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };

