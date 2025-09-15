import MenuBar from '@/components/layout/MenuBar';

export default function MeetingViewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <div className="flex-shrink-0">
        <MenuBar />
      </div>
      <main className="flex-1 overflow-y-auto px-12 pt-8 pb-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
