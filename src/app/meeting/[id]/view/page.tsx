'use client';

import { Button } from '@/components/internal/ui/button';
import { CalendarIcon, Clock, Video, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getMeetingDetail,
  MeetingDetail,
  MeetingStatus,
  updateMeetingStatus,
  deleteMeeting,
} from '@/api/meeting';
import MeetingCreateModal from '@/components/meeting/MeetingCreateModal';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from '@/components/internal/ui/popover';
import ConfirmModal from '@/app/calendar/[id]/ConfirmModal';
import { toast } from 'sonner';

export default function MeetingInfoPage() {
  const [meetingDetail, setMeetingDetail] = useState<MeetingDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  // const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false); // 삭제 확인 모달 상태
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const [starting, setStarting] = useState(false);

  const handleStartMeeting = async () => {
    if (!meetingDetail) return;

    try {
      setStarting(true);

      setMeetingDetail((md) => (md ? { ...md, status: 'IN_PROGRESS' as MeetingStatus } : md));

      await updateMeetingStatus(Number(meetingId), 'IN_PROGRESS');

      router.push(`/meeting/${meetingId}`); // 진행 화면으로 이동
    } catch (e) {
      // 롤백
      setMeetingDetail((md) =>
        md && md.status === 'IN_PROGRESS' ? { ...md, status: 'SCHEDULED' as MeetingStatus } : md
      );
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  const fetchMeetingDetail = async () => {
    try {
      const data = await getMeetingDetail(Number(meetingId));
      setMeetingDetail(data);
    } catch (err) {
      console.error('회의 정보 조회 실패:', err);
    }
  };

  useEffect(() => {
    fetchMeetingDetail();
  }, [meetingId]);

  // 역할별 색깔 배정 함수
  const getRoleColor = (role: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-red-100 text-red-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
      'bg-orange-100 text-orange-600',
    ];

    if (!meetingDetail) return 'bg-gray-200 text-gray-500';

    const uniqueRoles = [...new Set(meetingDetail.participants.map((p) => p.part))];
    const roleIndex = uniqueRoles.indexOf(role);

    return roleIndex !== -1 && roleIndex < colors.length
      ? colors[roleIndex]
      : 'bg-gray-200 text-gray-500';
  };

  // 회의 삭제 처리 함수
  const handleDeleteMeeting = async () => {
    if (!meetingDetail) return;
    try {
      await deleteMeeting(meetingDetail.meetingId);
      toast.success('회의가 성공적으로 삭제되었습니다.');
      router.push(`/team/${meetingDetail.teamId}`); // 팀 페이지로 이동
    } catch (error) {
      console.error('회의 삭제 실패:', error);
      toast.error('회의 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!meetingDetail) return <div className="p-8">회의 정보를 불러오는 중입니다...</div>;

  return (
    <div className="px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-[#000000]">{meetingDetail.title}</h1>

        {/* 회의 삭제 버튼 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600"
              aria-label="회의 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">회의 삭제</h4>
                <p className="text-sm text-gray-600">
                  정말로 이 회의를 삭제하시겠습니까?
                  <br />이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <PopoverClose asChild>
                  <Button variant="ghost" size="sm">
                    취소
                  </Button>
                </PopoverClose>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDeleteMeeting}
                >
                  삭제
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {modalOpen && meetingDetail && (
          <MeetingCreateModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            mode="edit"
            teamId={meetingDetail.teamId.toString()}
            onSuccess={() => {
              fetchMeetingDetail(); // 수정 후 회의 정보 다시 불러오기
            }}
            existingMeeting={{
              teamId: meetingDetail.teamId.toString(),
              title: meetingDetail.title,
              date: new Date(meetingDetail.meetingAt),
              time: new Date(meetingDetail.meetingAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }),
              // recordType: meetingDetail.meetingMethod as 'RECORD' | 'REALTIME',
              recordType: meetingDetail.meetingMethod as 'RECORD' | 'REALTIME' | 'NONE',
              members: meetingDetail.participants.map((p) => ({
                userId: p.userId,
                name: p.userName,
                role: p.part,
              })),
              agendaItems: meetingDetail.agendas.map((a) => ({
                type: a.agenda,
                content: a.body,
              })),
            }}
          />
        )}
      </div>

      {/* <ConfirmModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        onConfirm={handleDeleteMeeting}
        title="회의 삭제"
        message="정말로 이 회의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      /> */}

      {/* 회의 정보 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#000000] mb-4">회의 정보</h2>
        <div className="grid grid-cols-3 gap-4 text-sm text-[#000000]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">날짜</span>
            </div>
            <span>{meetingDetail.meetingAt.slice(0, 10)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">시간</span>
            </div>
            <span>
              {new Date(meetingDetail.meetingAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#666666]" />
              <span className="text-[#999999]">기록 방식</span>
            </div>
            {/* <span className="font-medium">
              {meetingDetail.meetingMethod === 'RECORD' ? '파일 업로드' : '실시간 녹음'}
            </span> */}
            <span className="font-medium">
              {meetingDetail.meetingMethod === 'RECORD'
                ? '파일 업로드'
                : meetingDetail.meetingMethod === 'REALTIME'
                  ? '실시간 녹음'
                  : '녹음 없음'}
            </span>
          </div>
        </div>
      </section>

      {/* 참석자 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#000000] mb-4">
          참석자 ({meetingDetail.participants.length}명)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {meetingDetail.participants.map((member, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-full min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* 프로필 이미지 or 첫 글자 동그라미 */}
                {member.profileImageUrl &&
                member.profileImageUrl !== 'null' &&
                member.profileImageUrl !== 'undefined' &&
                member.profileImageUrl.trim() !== '' &&
                member.profileImageUrl !== 'basic' ? (
                  <img
                    src={member.profileImageUrl}
                    alt={member.userName}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: '#FFD93D', color: '#fff' }}
                  >
                    {member.userName?.[0] || ''}
                  </div>
                )}
                <span className="text-sm text-[#000000] truncate">{member.userName}</span>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getRoleColor(member.part)}`}
              >
                {member.part}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 회의 안건 */}
      <section className="mb-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[#000000]">회의 안건</h2>
        </div>
        {meetingDetail.agendas.map((agenda, i) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 border-2 border-[#666666] bg-[#666666] rounded-full mr-2"></div>
              <span className="text-sm text-[#000000]">{agenda.agenda}</span>
            </div>
            <textarea
              disabled
              value={agenda.body}
              className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm text-[#666666] bg-[#F9F9F9] resize-none"
              rows={2}
            />
          </div>
        ))}
      </section>

      {/* 하단 버튼 */}
      <div className="flex justify-center gap-4 mt-6">
        <Button
          variant="outline"
          className="px-6 py-2 text-sm font-medium text-[#000000] border border-gray-300"
          onClick={() => setModalOpen(true)}
        >
          수정하기
        </Button>
        <Button
          className="bg-[#FFD93D] hover:bg-yellow-400 text-white font-semibold px-6 py-2 text-sm"
          onClick={handleStartMeeting}
          disabled={
            starting ||
            meetingDetail?.status === 'IN_PROGRESS' ||
            meetingDetail?.status === 'FINISHED'
          }
        >
          {meetingDetail?.status === 'IN_PROGRESS'
            ? '진행 중'
            : meetingDetail?.status === 'FINISHED'
              ? '종료됨'
              : starting
                ? '시작 중...'
                : '회의 시작'}
        </Button>
      </div>
    </div>
  );
}
