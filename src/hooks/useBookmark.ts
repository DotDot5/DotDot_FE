import { useState, useEffect } from 'react';
import { toggleBookmark, getMeetingBookmarks } from '@/api/bookmark';

export const useBookmark = (meetingId: number) => {
  const [bookmarkedSpeechLogs, setBookmarkedSpeechLogs] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // 미팅의 북마크 목록 불러오기
  const fetchBookmarks = async () => {
    if (!meetingId) return;

    setIsLoading(true);
    try {
      const bookmarks = await getMeetingBookmarks(meetingId);
      setBookmarkedSpeechLogs(new Set(bookmarks));
    } catch (error) {
      console.error('북마크 목록 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async (speechLogId: number) => {
    try {
      await toggleBookmark(speechLogId);

      setBookmarkedSpeechLogs((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(speechLogId)) {
          newSet.delete(speechLogId);
        } else {
          newSet.add(speechLogId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    }
  };

  // 특정 speechLog가 북마크되어 있는지 확인
  const isBookmarked = (speechLogId: number): boolean => {
    return bookmarkedSpeechLogs.has(speechLogId);
  };

  useEffect(() => {
    fetchBookmarks();
  }, [meetingId]);

  return {
    bookmarkedSpeechLogs,
    isLoading,
    handleToggleBookmark,
    isBookmarked,
    refetchBookmarks: fetchBookmarks,
  };
};
