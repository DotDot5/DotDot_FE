'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTeamDetail } from '@/api/team';
import { Button } from '@/components/internal/ui/button';
import { Card, CardContent } from '@/components/internal/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPastMeetings } from '@/api/meeting';

interface MeetingRecord {
  id: number;
  title: string;
  date: string;
  duration: string;
  participants: number;
}

export default function MeetingRecordsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const recordsPerPage = 5;
  const { id } = useParams<{ id: string }>();

  const { data: teamDetail } = useQuery({
    queryKey: ['teamDetail', id],
    queryFn: () => getTeamDetail(id),
    enabled: !!id, // id 있을 때만 요청
    staleTime: 0,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ['finishedMeetings', id],
    queryFn: () => getPastMeetings(id),
    enabled: !!id,
  });

  const totalPages = Math.max(1, Math.ceil(meetings.length / recordsPerPage));
  const currentRecords = meetings.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));


  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-white">
      {/* Yellow Header Section */}
      <div className="bg-[#FFD93D] px-8 py-12">
        <h1 className="text-white text-3xl font-bold">{teamDetail?.teamName} 팀의 회의록</h1>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8 bg-white rounded-t-3xl -mt-6 relative">
        {/* Records Count */}
        <div className="mb-6">
          <p className="text-[#333333] text-lg font-medium">총 {meetings.length}개의 회의록</p>
        </div>

        {/* Meeting Records List */}
        <div className="space-y-4 mb-8">
          {currentRecords.map((record) => (
            <Card
              key={record.meetingId}
              onClick={() => router.push(`/meeting/${record.meetingId}/result`)}
              className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#333333] mb-3">{record.title}</h3>
                    <div className="flex items-center gap-6 text-sm text-[#666666]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{record.meetingAt.slice(0, 10)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {/* <span>{record.duration}</span> */}
                        <span>
                          {Math.floor(record.duration / 60)}시간 {record.duration % 60}분
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#333333] border border-gray-300 rounded-full px-3 py-1">
                    <Users className="w-4 h-4" />
                    <span>{record.participantCount}명 참석</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm border-gray-300 text-[#333333] hover:bg-gray-50 bg-transparent"
          >
            이전
          </Button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
            const pageNumber = index + 1;
            const isActive = pageNumber === currentPage;
            return (
              <Button
                key={pageNumber}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                className={`w-10 h-10 p-0 text-sm ${
                  isActive
                    ? 'bg-[#FFD93D] hover:bg-yellow-500 text-black border-yellow-400'
                    : 'border-gray-300 text-[#333333] hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm border-gray-300 text-[#333333] hover:bg-gray-50 bg-transparent"
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
