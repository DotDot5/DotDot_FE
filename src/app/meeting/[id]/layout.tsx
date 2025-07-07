import Header from '@/components/layout/Header';
import React from 'react';

export default function MeetingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
