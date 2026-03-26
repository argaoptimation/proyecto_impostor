import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-sora font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          {
            'bg-whapigen-cyan text-black clip-edges hover:bg-white hover:shadow-neon-cyan': variant === 'primary',
            'bg-whapigen-red text-white clip-edges hover:bg-white hover:text-whapigen-red hover:shadow-neon-red': variant === 'danger',
            'bg-transparent text-whapigen-cyan hover:bg-whapigen-panel': variant === 'ghost',
            'glass-panel text-white hover:border-whapigen-cyan hover:shadow-neon-cyan': variant === 'glass',
            'h-9 px-4 text-sm': size === 'sm',
            'h-12 px-8 text-base': size === 'md',
            'h-14 px-10 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
