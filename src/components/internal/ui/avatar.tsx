export const Avatar = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center ${className}`}
    {...props}
  />
);

export const AvatarFallback = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <span className={`w-full h-full flex items-center justify-center text-sm font-bold ${className}`}>
    {children}
  </span>
);
