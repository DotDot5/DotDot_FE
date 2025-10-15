import React from 'react';
import classNames from 'classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'notice';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';

  const variantClasses = {
    primary:
      'bg-[#FFD93D] text-black hover:bg-yellow-400 focus:ring-yellow-300 active:bg-yellow-500 shadow-sm hover:shadow-md',
    secondary:
      'bg-secondary text-white hover:bg-blue-600 focus:ring-secondary active:bg-blue-700 shadow-sm hover:shadow-md',
    outline:
      'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger:
      'bg-danger text-white hover:bg-red-600 focus:ring-danger active:bg-red-700 shadow-sm hover:shadow-md',
    notice:
      'bg-[#FFD93D] text-black shadow-sm font-medium rounded-full px-4 py-2 mb-4 cursor-default',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };

  return (
    <button
      className={classNames(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        variant === 'notice' && 'hover:bg-[#FFD93D] active:bg-[#FFD93D]', // hover/active 시 색상 유지
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};
