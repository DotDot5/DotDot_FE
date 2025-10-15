interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  clickable?: boolean;
}

export const Card = ({
  className = '',
  hoverable = false,
  clickable = false,
  ...props
}: CardProps) => (
  <div
    className={`rounded-lg shadow-sm border border-gray-200 bg-white transition-all duration-200 ${
      hoverable ? 'hover:shadow-md hover:border-gray-300' : ''
    } ${clickable ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
    {...props}
  />
);

export const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 pb-2 ${className}`} {...props} />
);

export const CardTitle = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={`text-lg font-semibold text-gray-900 ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 pt-2 ${className}`} {...props} />
);

export const CardFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 pt-2 border-t border-gray-100 ${className}`} {...props} />
);
