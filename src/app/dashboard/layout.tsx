import MainLayout from '@/components/layout/MainLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <div className="px-12 pt-8 pb-6">{children}</div>
    </MainLayout>
  );
}
