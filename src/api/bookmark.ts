import axiosInstance from '@/lib/axiosInstance';

export interface BookmarkResponse {
  success: boolean;
  message?: string;
}

export interface BookmarksListResponse {
  data: number[];
  success: boolean;
}

// 북마크 추가/취소 API
export const toggleBookmark = async (speechLogId: number): Promise<BookmarkResponse> => {
  const response = await axiosInstance.post(`/api/v1/bookmarks/speech-logs/${speechLogId}`);
  return response.data;
};

// 미팅의 북마크 목록 조회 API
export const getMeetingBookmarks = async (meetingId: number): Promise<number[]> => {
  const response = await axiosInstance.get(`/api/v1/bookmarks/meetings/${meetingId}`);
  return response.data.data || [];
};
