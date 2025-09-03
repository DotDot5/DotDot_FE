import { NextResponse, type NextRequest } from 'next/server';

// 실제 백엔드 API 주소 (환경 변수로 관리하는 것이 좋습니다)
const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';

/**
 * [GET] 특정 팀의 태스크 목록 조회
 * @param request - NextRequest 객체
 * @param params - { teamId: string }
 */
export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  const { teamId } = params;
  // 클라이언트가 보낸 쿼리 파라미터(예: ?date=2025-08-31)를 그대로 가져옵니다.
  const searchParams = request.nextUrl.search;

  try {
    // 클라이언트의 인증 토큰을 백엔드로 그대로 전달합니다.
    const authToken = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Next.js 서버가 Java 백엔드로 요청을 보냅니다.
    const apiRes = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks${searchParams}`, {
      method: 'GET',
      headers,
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      // 백엔드에서 받은 에러를 클라이언트로 전달합니다.
      return NextResponse.json(data, { status: apiRes.status });
    }

    // 백엔드 응답을 클라이언트로 전달합니다.
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API PROXY ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * [POST] 특정 팀에 새 태스크 생성
 * @param request - NextRequest 객체
 * @param params - { teamId: string }
 */
export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  const { teamId } = params;
  const body = await request.json(); // 클라이언트가 보낸 body 데이터

  try {
    const authToken = request.headers.get('Authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const apiRes = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    return NextResponse.json(data, { status: 201 }); // 생성 성공 상태 코드
  } catch (error) {
    console.error('[API PROXY ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
