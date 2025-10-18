import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className = '',
  ...props
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 animate-pulse';

  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  const style = {
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      {...props}
    />
  );
};

// 미리 정의된 스켈레톤 컴포넌트들
export const SkeletonText = ({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" width={i === lines - 1 ? '75%' : '100%'} className="h-4" />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`p-4 border rounded-lg bg-white ${className}`}>
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  </div>
);

export const SkeletonButton = ({ className = '' }: { className?: string }) => (
  <Skeleton variant="rectangular" width={100} height={36} className={className} />
);

export const SkeletonAvatar = ({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) => <Skeleton variant="circular" width={size} height={size} className={className} />;
