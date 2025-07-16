'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyMeetingList, MeetingListResponse } from '@/api/meeting';

export default function DashboardPage() {
  const router = useRouter();
  const [pastMeetings, setPastMeetings] = useState<MeetingListResponse[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingListResponse[]>([]);

  useEffect(() => {
    // 로그인 상태 확인
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.log('토큰이 없습니다. 로그인 페이지로 이동합니다.');
      router.push('/auth/login');
      return;
    }

    const fetchMeetings = async () => {
      try {
        const past = await getMyMeetingList('finished', 'desc'); // 최근 순
        const upcoming = await getMyMeetingList('upcoming', 'asc'); // 가까운 순
        setPastMeetings(past);
        setUpcomingMeetings(upcoming);
      } catch (error: any) {
        console.error('회의 목록 조회 실패:', error);
        // 401 에러인 경우 토큰 만료로 간주하고 로그인 페이지로 이동
        if (error?.response?.status === 401) {
          console.log('토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/auth/login');
        }
      }
    };

    fetchMeetings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}/${day}(${dayOfWeek})`;
  };

  return (
    <div className="space-y-6">
      {/* 상단 말풍선 */}
      <div className="bg-yellow-50 rounded-xl h-32 flex items-center justify-center">
        <div className="flex space-x-6">{/* 여기에 사용자 인사 등 넣을 수 있음 */}</div>
      </div>

      {/* 최근 회의 목록 */}
      <div className="bg-gray-100 rounded-xl p-3 space-y-2">
        <div className="inline-block">
          <div className="bg-[#FFD93D] rounded-full px-2 py-0.5 w-32 text-center inline-block">
            <span className="text-lg font-bold text-white">최근 회의 목록</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 mt-3">
          {pastMeetings.length > 0 ? (
            <ul className="text-sm space-y-3">
              {pastMeetings.slice(0, 5).map((meeting) => (
                <li
                  key={meeting.meetingId}
                  className="font-semibold cursor-pointer p-2 rounded"
                  onClick={() => router.push(`/meeting/${meeting.meetingId}/view`)}
                >
                  [{meeting.teamName}] {formatDate(meeting.meetingAt)} {meeting.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">최근 회의가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 다가오는 회의 */}
      <div className="bg-gray-100 rounded-xl p-3 space-y-2">
        <div className="inline-block">
          <div className="bg-[#FFD93D] rounded-full px-2 py-0.5 w-32 text-center inline-block">
            <span className="text-lg font-bold text-white">다가오는 회의</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 mt-3">
          {upcomingMeetings.length > 0 ? (
            <ul className="text-sm space-y-3">
              {upcomingMeetings.slice(0, 5).map((meeting) => (
                <li
                  key={meeting.meetingId}
                  className="font-semibold cursor-pointer p-2 rounded"
                  onClick={() => router.push(`/meeting/${meeting.meetingId}/view`)}
                >
                  [{meeting.teamName}] {formatDate(meeting.meetingAt)} {meeting.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">예정된 회의가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
