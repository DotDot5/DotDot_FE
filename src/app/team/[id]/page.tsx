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

import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import WorkspaceMain from './WorkspaceMain';
import MeetingCreateModal from '@/components/meeting/MeetingCreateModal';

export default function TeamPage() {
  const searchParams = useSearchParams();
  const modal = searchParams.get('modal');
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;
  const queryClient = useQueryClient();

  // 회의 목록 갱신 함수
  const refreshMeetings = () => {
    queryClient.invalidateQueries({ queryKey: ['upcomingMeetings', teamId] });
    queryClient.invalidateQueries({ queryKey: ['pastMeetings', teamId] });
  };

  return (
    <>
      <MainLayout>
        <WorkspaceMain onRefreshMeetings={refreshMeetings} />
      </MainLayout>
      {modal === 'create' && (
        <MeetingCreateModal
          open={true}
          onClose={() => router.push(`/team/${teamId}`)}
          teamId={teamId}
          onSuccess={refreshMeetings}
        />
      )}
    </>
  );
}
