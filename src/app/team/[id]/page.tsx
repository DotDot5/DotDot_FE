// import MainLayout from '@/components/layout/MainLayout';
// import WorkspaceMain from './WorkspaceMain';

// export default function TeamPage() {
//   return (
//     <MainLayout>
//       <WorkspaceMain />
//     </MainLayout>
//   );
// }
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import WorkspaceMain from './WorkspaceMain';
import MeetingCreateModal from '@/components/meeting/MeetingCreateModal';

export default function TeamPage() {
  const searchParams = useSearchParams();
  const modal = searchParams.get('modal');
  const router = useRouter();

  return (
    <>
      <MainLayout>
        <WorkspaceMain />
      </MainLayout>
      {modal === 'create' && (
        <MeetingCreateModal open={true} onClose={() => router.push('/team/1')} />
      )}
    </>
  );
}
