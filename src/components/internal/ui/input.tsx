export const Input = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${className}`}
    {...props}
  />
);
