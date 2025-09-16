import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';

/**
 * [GET] 특정 팀의 태스크 목록 조회
 */
export async function GET(
  request: Request,
  { params }: { params: { teamId: string } } // 인자를 구조 분해해서 받습니다.
) {
  const { teamId } = params; // context.params 대신 바로 params를 사용합니다.
  const searchParams = new URL(request.url).search;

  try {
    const authToken = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    const apiRes = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks${searchParams}`, {
      method: 'GET',
      headers,
    });

    const data = await apiRes.json();
    if (!apiRes.ok) return NextResponse.json(data, { status: apiRes.status });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API PROXY ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * [POST] 특정 팀에 새 태스크 생성
 */
export async function POST(
  request: Request,
  { params }: { params: { teamId: string } } // 인자를 구조 분해해서 받습니다.
) {
  const { teamId } = params; // context.params 대신 바로 params를 사용합니다.
  const body = await request.json();

  try {
    const authToken = request.headers.get('Authorization');
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    const apiRes = await fetch(`${API_BASE_URL}/teams/${teamId}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();
    if (!apiRes.ok) return NextResponse.json(data, { status: apiRes.status });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[API PROXY ERROR]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
