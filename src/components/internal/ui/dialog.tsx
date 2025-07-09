import React from 'react';

export const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow relative z-50">{children}</div>
      <div className="absolute inset-0" onClick={() => onOpenChange(false)} />
    </div>
  );
};

export const DialogContent = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={className}>{children}</div>;

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>;
