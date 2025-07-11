'use client';
import MeetingCreateModal from '@/components/meeting/MeetingCreateModal';
import { useRouter } from 'next/navigation';

export default function MeetingCreatePage() {
    const router = useRouter();
    return (
    <MeetingCreateModal open={true} onClose={() => router.push('/team')} />
  );
}