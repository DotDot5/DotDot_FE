/**
 * @param audioBlob 녹음된 오디오 Blob
 * @param fileName 저장될 파일 이름
 * @param meetingId 연결된 회의 ID
 * @param durationSeconds 오디오의 재생 시간 (초 단위)
 * @returns {Promise<string>} STT 결과물의 ID (서버에서 생성)
 */
export async function transcribeAudio(
  audioBlob: Blob,
  fileName: string,
  meetingId: number,
  durationSeconds: number
): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, fileName);
  formData.append('meetingId', meetingId.toString());
  formData.append('duration', durationSeconds.toString());

  // 👈 이 부분을 추가합니다.
  const audioChannelCountValue = '2';
  formData.append('audioChannelCount', audioChannelCountValue);

  // 👈 FormData에 값이 잘 담겼는지 콘솔에 출력합니다.
  console.log(
    '[DEBUG] Client-side: Appending audioChannelCount to FormData:',
    audioChannelCountValue
  );

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      // 서버에서 반환한 상세 에러 메시지를 포함하도록 수정
      throw new Error(errorData.error || `서버 오류: ${response.status} ${response.statusText}`);
    }

    const data: { sttResultId: string } = await response.json();
    return data.sttResultId;
  } catch (error) {
    console.error('STT 백엔드 호출 중 오류 발생:', error);
    throw new Error(`음성 분석 요청 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
}
