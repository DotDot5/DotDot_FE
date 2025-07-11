// components/ui/badge.tsx

import React from 'react';
import { cn } from '@/lib/utils'; // className을 합치는 유틸 함수

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary'; // 지원할 배지 스타일
}

const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium',
        variant === 'secondary' ? 'bg-[#FFD93D] text-black' : 'bg-gray-100 text-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
