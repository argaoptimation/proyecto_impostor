import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-12 w-full glass-panel bg-whapigen-panel/50 px-4 py-2 text-base text-white',
          'placeholder:text-gray-500 font-jetbrains tracking-wide',
          'focus:outline-none focus:border-whapigen-cyan focus:shadow-neon-cyan transition-all duration-300',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
