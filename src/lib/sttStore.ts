// src/lib/sttStore.ts

const sttResults = new Map<string, string>(); // string 대신 JSON 문자열을 저장

/**
 * STT 결과를 메모리에 저장합니다.
 * @param id STT 결과의 고유 ID
 * @param text 변환된 텍스트 (이제는 JSON 문자열 형태의 복합 데이터)
 */
export function setSttResult(id: string, text: string) {
  sttResults.set(id, text);
  console.log(`STT 결과 ID: ${id} 저장됨`);
  // 실제 프로덕션에서는 데이터베이스에 저장하는 로직을 여기에 구현합니다.
}

/**
 * ID를 사용하여 저장된 STT 결과를 조회합니다.
 * @param id 조회할 STT 결과의 고유 ID
 * @returns 변환된 텍스트 (JSON 문자열 형태) 또는 undefined
 */
export function getSttResult(id: string): string | undefined {
  const result = sttResults.get(id);
  console.log(`STT 결과 ID: ${id} 조회됨. 결과: ${result ? '있음' : '없음'}`);
  return result;
}
