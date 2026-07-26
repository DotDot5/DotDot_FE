# 트러블슈팅 기록 (DotDot Frontend)

프로젝트를 진행하며 마주친 주요 기술 이슈와 해결 과정을 정리한 문서입니다.
각 사례는 **증상 → 원인 분석 → 해결 → 회고(교훈)** 순으로 기록했습니다.

> 스택: Next.js (App Router) · TypeScript · Axios · Google Cloud (STT/Storage) · Vercel 배포

---

## 목차

1. [Next.js App Router 라우트 핸들러 타입 에러로 인한 빌드 실패](#1-nextjs-app-router-라우트-핸들러-타입-에러로-인한-빌드-실패)
2. [Vercel 배포 환경에서 Google Cloud 인증 실패](#2-vercel-배포-환경에서-google-cloud-인증-실패)
3. [Axios 인터셉터 토큰 재발급(reissue) 무한 루프](#3-axios-인터셉터-토큰-재발급reissue-무한-루프)
4. [종료된(FINISHED) 회의 URL 직접 접근 방어](#4-종료된finished-회의-url-직접-접근-방어)
5. [태스크 API·데이터 흐름 타입 불일치](#5-태스크-api데이터-흐름-타입-불일치)
6. [로컬/배포 환경 백엔드 URL 하드코딩 문제](#6-로컬배포-환경-백엔드-url-하드코딩-문제)
7. [녹음(STT) 없이 회의록을 관리하도록 흐름 재설계](#7-녹음stt-없이-회의록을-관리하도록-흐름-재설계)

---

## 1. Next.js App Router 라우트 핸들러 타입 에러로 인한 빌드 실패

**관련 커밋:** `9992014`, `90f04ef`, `ee2de7c`, `dd69660`, `938bb26`, `674915b`, `f03dfd3`, `3d47a93`

### 증상
- 로컬 개발 서버(`next dev`)에서는 정상 동작하나, `next build`(배포) 단계에서 API 라우트 핸들러의
  타입 에러로 빌드가 반복 실패했다. 특히 동적 세그먼트(`[teamId]`, `[id]`)를 가진 라우트에서 발생.

### 원인 분석
- App Router의 라우트 핸들러 두 번째 인자(`params`) 타입 시그니처가 Next.js 버전에 따라 검증이 엄격해졌다.
- 기존 코드는 두 번째 인자를 `{ params }: { params: { teamId: string } }` 형태로 **인라인 구조 분해**하고 있었는데,
  빌드 타입 체커가 이 시그니처를 기대한 형태와 다르게 판단해 타입 에러를 던졌다.

```ts
// Before — 인라인 구조 분해
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const { teamId } = params;
  // ...
}
```

### 해결
1. 두 번째 인자를 구조 분해하지 않고 `context`로 명시적으로 받은 뒤 내부에서 꺼내 쓰도록 통일했다.

```ts
// After — context로 명시적으로 수신
export async function GET(
  request: NextRequest,
  context: { params: { teamId: string } } // ← context로 명시
) {
  const { teamId } = context.params;
  const searchParams = request.nextUrl.search;
  // ...
}
```

2. 그럼에도 남는 빌드 차단 요소를 배포 우선순위에 맞춰 우회하도록 `next.config.ts`를 조정했다.

```ts
// next.config.ts
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // 배포 차단 완화
  },
};
```

### 회고
- `ignoreBuildErrors`는 **배포를 막지 않기 위한 임시방편**이다. 타입 안정성을 실제로 포기하는 설정이므로
  근본 해결은 시그니처 정합성 확보에 있다. 배포 마감과 타입 정합 사이에서 우선순위를 조율한 사례.
- App Router 라우트 핸들러 시그니처는 Next.js 버전 업그레이드 시 깨지기 쉬운 지점이므로,
  프로젝트 전역에서 `context` 방식으로 통일해 두면 재발을 줄일 수 있다.

---

## 2. Vercel 배포 환경에서 Google Cloud 인증 실패

**관련 커밋:** `3544819`

### 증상
- 로컬에서는 STT(음성→텍스트) 기능이 정상 동작했으나, Vercel 배포 환경에서
  `SpeechClient` / `Storage` 클라이언트 초기화 시 인증 실패가 발생했다.

### 원인 분석
- 로컬은 서비스 계정 **키 파일 경로**(`GOOGLE_APPLICATION_CREDENTIALS`)를 참조하는 방식이었다.
- Vercel 같은 서버리스/배포 환경에는 로컬 파일 시스템에 키 파일을 올릴 수 없어, 파일 경로 기반 인증이 불가능했다.
- 즉, **로컬과 배포 환경의 자격 증명 공급 방식이 달라야** 하는데 코드가 한 가지 방식만 가정하고 있었다.

### 해결
- 환경변수를 확인해 **배포 환경은 JSON 문자열을 파싱한 credentials**, **로컬은 keyFilename**을
  사용하도록 분기하는 헬퍼를 추가했다.

```ts
function getGoogleCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Vercel 배포 환경: 환경변수에 담긴 JSON을 파싱
    return {
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // 로컬 환경: 키 파일 경로
    return {
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };
  }
  throw new Error('Google Cloud credentials not configured');
}

// 사용
const googleCreds = getGoogleCredentials();
speechClient = new SpeechClient(googleCreds);
storageClient = new Storage(googleCreds);
```

### 회고
- "로컬에서 되는데 배포에서 안 되는" 전형적 사례. 원인은 대부분 **환경 간 차이**(파일 시스템, 환경변수, 네트워크)다.
- 클라우드 자격 증명은 파일이 아니라 **환경변수(JSON) 주입**을 기본으로 설계하면 로컬/배포 양쪽을 하나의 코드로 커버할 수 있다.
- 실패 시 조용히 넘어가지 않고 명시적으로 `throw` 하여 초기화 실패를 즉시 드러내도록 한 점이 디버깅에 유리했다.

---

## 3. Axios 인터셉터 토큰 재발급(reissue) 무한 루프

**관련 커밋:** `5f02039`

### 증상
- accessToken 만료 시 refreshToken으로 재발급(reissue)하도록 응답 인터셉터를 구성했는데,
  **재발급 요청 자체가 401**을 받는 경우 다시 재발급을 시도하며 요청이 반복될 위험이 있었다.
- 또한 SSR 컨텍스트에서 `window` 참조로 인한 문제 소지가 있었다.

### 원인 분석
- 응답 인터셉터가 `401 + 특정 에러코드`이면 무조건 reissue를 트리거했다.
- reissue 엔드포인트(`/auth/reissue`) 자체가 401을 반환하면, 그 실패 응답이 다시 인터셉터를 타면서
  재발급을 재시도하는 구조적 루프가 생긴다.
- 로그인 페이지 리다이렉트에 사용하는 `window.location.href`는 서버 환경에서 `window`가 없으면 문제가 된다.

### 해결
1. **요청 인터셉터**: reissue 요청에는 만료된 accessToken을 붙이지 않도록 예외 처리.

```ts
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    // reissue 요청이 아닐 경우에만 토큰을 헤더에 추가
    if (token && !config.url?.endsWith('/auth/reissue')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

2. **응답 인터셉터**: 실패한 요청이 재발급 요청이면 재시도하지 않도록 가드 추가 + SSR `window` 가드.

```ts
const isReissueRequest = originalRequest.url?.endsWith('/auth/reissue');

if (
  status === 401 &&
  (errorCode === 'USER-003' || errorCode === 'USER-006') &&
  !originalRequest._retry &&
  !isReissueRequest // ← 재발급 요청 실패 시엔 재시도하지 않음
) {
  originalRequest._retry = true;
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');
    const newAccessToken = await reissueAccessToken(refreshToken);
    localStorage.setItem('accessToken', newAccessToken);
    // 원 요청 재시도 ...
  } catch (reissueError) {
    // 재발급 실패 → 토큰 초기화 후 로그인 페이지로
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return Promise.reject(reissueError);
  }
}
```

### 회고
- 토큰 자동 재발급 인터셉터의 **가장 흔한 함정은 재발급 엔드포인트 자체의 실패 처리**다.
  `_retry` 플래그 + reissue 요청 식별 가드를 함께 두어야 루프를 확실히 끊을 수 있다.
- 브라우저 전역 객체(`window`, `localStorage`) 접근은 항상 SSR 실행 가능성을 염두에 두고 방어한다.

---

## 4. 종료된(FINISHED) 회의 URL 직접 접근 방어

**관련 커밋:** `a7b02b7`, PR #90 (`feature/#89-meeting-url-error`)

### 증상
- 이미 종료된 회의의 상세 페이지 URL(`/meeting/[id]`)을 직접 입력해 진입하면,
  진행 중 회의처럼 녹음/편집 UI가 노출되는 문제가 있었다.
- 또한 동적 라우트 파라미터 `params.id`가 문자열 또는 배열로 들어올 수 있어 `Number()` 변환이 불안정했다.

### 원인 분석
- 상세 페이지가 회의 상태(진행 중 / FINISHED)를 검증하지 않고 무조건 편집 화면을 렌더링했다.
- `useParams()`의 `id`는 `string | string[]` 타입이라 배열로 올 경우 숫자 변환에서 `NaN`이 될 수 있었다.

### 해결
1. 파라미터를 안전하게 숫자로 정규화.

```ts
const params = useParams();
const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
const meetingId = Number(rawId); // ✅ 숫자로 정규화
```

2. 진입 시 **가드**를 두어, "내 완료 회의 목록"에 포함되면 접근 차단 페이지로 리다이렉트.

```ts
const isFinished = async (id: number) => {
  try {
    const finished = await getMyMeetingList('finished');
    return finished.some((m) => m.meetingId === id);
  } catch (e) {
    console.error('finished 목록 조회 실패:', e);
    return false; // 실패 시 차단하지 않음 (사용자 흐름 우선)
  }
};

useEffect(() => {
  if (Number.isNaN(meetingId)) {
    router.replace('/meeting/forbidden');
    return;
  }
  let mounted = true;
  (async () => {
    const done = await isFinished(meetingId);
    if (!mounted) return;
    if (done) {
      router.replace('/meeting/forbidden');
      return;
    }
    // 상세 데이터 로딩 후, API가 status를 주면 2차 방어
    const data = await getMeetingDetailWithParticipantEmails(meetingId);
    if ((data as any)?.status === 'FINISHED') {
      router.replace('/meeting/forbidden');
      return;
    }
    // ... 화면 상태 세팅
  })();
  return () => { mounted = false; };
}, [meetingId]);
```

3. 전용 차단 페이지 추가.

```tsx
// src/app/meeting/forbidden/page.tsx
export default function ForbiddenPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">이 회의는 종료되었습니다</h1>
      <p className="mt-2 text-gray-600">더 이상 접근할 수 없는 회의입니다.</p>
    </main>
  );
}
```

### 회고
- URL 직접 접근은 **UI 숨김만으로는 막을 수 없다.** 페이지 진입 시점에 서버 데이터로 접근 권한을 검증해야 한다.
- 목록 API 조회 실패 시 **차단하지 않는 쪽(false)** 으로 두어 정상 사용자의 흐름을 우선하고,
  `status` 기반 2차 방어를 추가해 안전망을 이중화했다.
- 비동기 가드에는 `mounted` 플래그로 언마운트 후 상태 업데이트를 방지했다.

---

## 5. 태스크 API·데이터 흐름 타입 불일치

**관련 커밋:** `a8f724b`, `d25380f`, `142ddfa`, `98e4e81`, `9d0e836`, `3c39a85`, `6e98e6c`, `ddc7b14`, `f1a8a25`

### 증상
- 태스크(할 일) 데이터가 화면마다 다른 형태로 다뤄지면서 타입 불일치, 데이터 누락, 마감일(due) 오표시,
  캘린더 날짜 형식 불일치 등이 반복적으로 발생했다.

### 원인 분석
- 태스크 관련 API 호출 코드가 `api/task.ts`, `api/tasks.ts`, `services/taskApi.ts` 등에 분산되어
  **단일 소스가 없었고**, 화면(캘린더 / 리스트 / 회의 결과)마다 응답을 제각기 가공했다.
- 회의 결과에서 생성되는 태스크와 팀 태스크의 타입이 어긋나 있었다.

### 해결
- 태스크 API와 타입, 데이터 흐름을 리팩토링해 일원화했다.
  - `src/types/task.ts` / `src/types/team.ts` 타입 재정의
  - `services/taskApi.ts`를 중심으로 API 호출 정리, 중복된 `api/task.ts` 제거
  - `hooks/useTasks.ts`에서 소비 형태 통일, 캘린더/리스트가 동일 타입을 바라보도록 정리
  - 캘린더 태스크 **날짜 형식 통일**, "이번 달 작업목록" 필터링 로직 수정

### 회고
- 같은 도메인 데이터를 다루는 코드가 여러 파일에 흩어지면 **작은 응답 변경이 여러 곳에서 다르게 깨진다.**
- 타입(`types/`) → API(`services/`) → 소비(`hooks/`)로 레이어를 정리하고 단일 소스를 유지하는 것이
  반복 버그를 줄이는 근본 대책이었다. 이후 태스크 관련 산발적 수정이 크게 줄었다.

---

## 6. 로컬/배포 환경 백엔드 URL 하드코딩 문제

**관련 커밋:** `a839f81`, `0b13223`, `61112a7`, `2833ea9`, 다수의 `fix/redeploy*`

### 증상
- 배포 후 STT 결과 조회 등 일부 API 호출이 실패했다. 로컬에서는 정상.

### 원인 분석
- 서버 라우트 내부에서 백엔드 주소가 `http://localhost:8080`으로 **하드코딩**되어 있어,
  배포 환경에서 로컬호스트를 호출하니 실패했다.

### 해결
- 하드코딩된 로컬 주소를 실제 배포 백엔드 주소로 교체.

```ts
// Before
const backendUrl = `http://localhost:8080/api/v1/meetings/${meetingId}/stt-result`;
// After
const backendUrl = `https://api.dotdot.it.kr/api/v1/meetings/${meetingId}/stt-result`;
```

### 회고
- 재배포를 반복(`fix/redeploy`)하며 겪은 대표적 시행착오. 백엔드 주소는 반드시 **환경변수**로 관리해야
  로컬/스테이징/프로덕션 전환 시 코드 수정 없이 대응할 수 있다.
- 라우트 파일마다 상수가 흩어져 있으면 일부만 수정되어 재발한다 — 공통 상수/환경변수로 한 곳에서 관리하는 것이 안전하다.

---

## 7. 녹음(STT) 없이 회의록을 관리하도록 흐름 재설계

**관련 커밋:** `d3f2e74`, `0d55f54`, PR #80 / #86 (`refac/#79`, `#85-no-audio-meeting`), `1404de9`(`#81-AudioExtension`)

### 증상
- 초기 회의 흐름은 **녹음 → STT 변환**을 전제로 설계되어, 녹음 없이 회의 안건·메모만 관리하려는 경우
  화면/상태가 자연스럽게 이어지지 않았다.

### 원인 분석
- 회의 상세/결과/기록 페이지가 오디오 파일과 STT 결과 존재를 가정하고 상태를 구성하고 있었다.

### 해결
- 녹음 없이도 회의 안건·메모를 저장/조회할 수 있도록 회의 관련 페이지 흐름을 재구성했다.
  - `meeting/[id]` 상세, `result`, `view`, `team/records/[meetingId]` 페이지의 상태 로직 정리
  - `MeetingCreateModal`에서 녹음 유무에 따른 분기 처리
  - 오디오 확장자/포맷 처리(`#81-AudioExtension`) 보강

### 회고
- 특정 기능(녹음)을 **필수 전제로 깔고 설계하면**, 그 기능이 없는 사용 흐름을 나중에 끼워 넣기 어렵다.
- 핵심 데이터(안건·메모)와 부가 기능(녹음·STT)을 분리해 각각 독립적으로 동작하도록 두는 것이
  유연한 회의 흐름의 핵심이었다.

---

## 부록: 트러블슈팅에서 반복된 교훈

- **"로컬에서는 되는데 배포에서 안 된다"** → 대부분 환경 차이(자격 증명, URL, 파일 시스템). 환경변수로 통일하라.
- **App Router 라우트 핸들러 시그니처**는 버전 민감 → `context` 방식으로 프로젝트 전역 통일.
- **토큰 재발급 인터셉터**는 재발급 요청 자체의 실패 루프를 반드시 차단.
- **URL 직접 접근**은 UI 숨김이 아니라 진입 시 서버 데이터 검증으로 막는다.
- **도메인 데이터는 단일 소스**로 — 타입/서비스/훅 레이어를 정리하면 산발적 버그가 사라진다.

<!-- 작성: 커밋 히스토리 기반 정리 (2026-07) -->
