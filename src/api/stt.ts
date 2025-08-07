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

  const audioChannelCountValue = '2';
  formData.append('audioChannelCount', audioChannelCountValue);

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `서버 오류: ${response.status} ${response.statusText}`);
    }

    const data: { sttResultId: string } = await response.json();
    return data.sttResultId;
  } catch (error) {
    throw new Error(`음성 분석 요청 중 오류가 발생: ${(error as Error).message}`);
  }
}
