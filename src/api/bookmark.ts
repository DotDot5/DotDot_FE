export interface BookmarkResponse {
  success: boolean;
  message?: string;
}

export interface BookmarksListResponse {
  data: number[];
  success: boolean;
}
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// 북마크 추가/취소 API
export const toggleBookmark = async (speechLogId: number): Promise<BookmarkResponse> => {
  const response = await fetch(`${BASE_URL}/api/v1/bookmarks/speech-logs/${speechLogId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('북마크 토글에 실패했습니다.');
  }

  return response.json();
};

// 미팅의 북마크 목록 조회 API
export const getMeetingBookmarks = async (meetingId: number): Promise<number[]> => {
  const response = await fetch(`${BASE_URL}/api/v1/bookmarks/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('북마크 목록 조회에 실패했습니다.');
  }

  const data: BookmarksListResponse = await response.json();
  return data.data || [];
};
