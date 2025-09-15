import React from 'react';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={classNames(
        'px-4 py-2 rounded',
        variant === 'outline' && 'border',
        variant === 'ghost' && 'bg-transparent',
        size === 'sm' && 'text-sm px-2 py-1',
        className
      )}
      {...props}
    />
  );
};
