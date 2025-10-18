interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

export const Input = ({ className = '', error = false, success = false, ...props }: InputProps) => {
  const baseClasses =
    'w-full px-3 py-2 border rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1';

  const stateClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
    : success
      ? 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50'
      : 'border-gray-300 focus:border-primary focus:ring-primary hover:border-gray-400';

  return <input className={`${baseClasses} ${stateClasses} ${className}`} {...props} />;
};
