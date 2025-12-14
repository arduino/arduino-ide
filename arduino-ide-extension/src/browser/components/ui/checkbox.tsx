import * as React from '@theia/core/shared/react';
import { cn } from '../../lib/utils';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
            // Use Theia CSS variables for proper theming
            'bg-[var(--theia-input-background)]',
            'border-[var(--theia-input-border)]',
            'focus-visible:ring-[var(--theia-focusBorder)]',
            // Checked state styling
            'checked:bg-[var(--theia-focusBorder)]',
            'checked:border-[var(--theia-focusBorder)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {/* Custom checkmark */}
        {checked && (
          <svg
            className="absolute left-0 top-0 h-4 w-4 pointer-events-none"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              color: 'var(--theia-button-foreground)',
            }}
          >
            <path
              d="M13.5 4.5L6 12L2.5 8.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };

