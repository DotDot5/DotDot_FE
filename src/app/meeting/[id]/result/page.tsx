'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import SummarySection from '@/components/SummarySection';
import { useMeetingDetail, useMeetingSummary, useMeetingRecommendations } from '@/hooks/useMeeting';
import { useTasks } from '@/hooks/useTasks';
import RecommandSection from '@/components/RecommandSection';
import { Button } from '@/components/internal/ui/button';
import { Avatar, AvatarFallback } from '@/components/internal/ui/avatar';
import TodoItem from '@/components/internal/TodoItem';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/* ===============================
 * Types
 * =============================== */
type SectionSelection = {
  summary: boolean;
  todos: boolean;
  recommendations: boolean;
};

type Participant = {
  name: string;
  email: string;
};

/* ===============================
 * Utils (순수 함수/유틸)
 * =============================== */
// const decodeQP = (v: string | null, fallback = '') => (v ? decodeURIComponent(v) : fallback);

// const safeParseParticipants = (raw: string | null): Participant[] => {
//   if (!raw) return [];
//   try {
//     const parsed = JSON.parse(decodeURIComponent(raw));
//     if (Array.isArray(parsed)) {
//       return parsed
//         .filter(
//           (p) =>
//             p &&
//             typeof p.name === 'string' &&
//             typeof p.email === 'string' &&
//             p.name.length > 0 &&
//             p.email.length > 0
//         )
//         .map((p) => ({ name: p.name, email: p.email })) as Participant[];
//     }
//   } catch (e) {
//     console.error('참석자 데이터 파싱 실패:', e);
//   }
//   return [];
// };

const defaultSections: SectionSelection = {
  summary: true,
  todos: true,
  recommendations: true,
};

// const generatePrint = (html: string) => {
//   const win = window.open('', '_blank');
//   if (!win) {
//     alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
//     return;
//   }
//   win.document.write(html);
//   win.document.close();
//   setTimeout(() => win.print(), 400);
// };


/* ===============================
 * Reusable Modal (PDF/Email 겸용)
 * =============================== */
function SectionSelectionModal({
  isOpen,
  mode, // 'pdf' | 'email'
  onClose,
  onConfirm,
  initial = defaultSections,
}: {
  isOpen: boolean;
  mode: 'pdf' | 'email';
  onClose: () => void;
  onConfirm: (sections: SectionSelection) => void;
  initial?: SectionSelection;
}) {
  const [sections, setSections] = useState<SectionSelection>(initial);

  useEffect(() => setSections(initial), [initial, isOpen]);

  if (!isOpen) return null;

  const labels = {
    title: mode === 'pdf' ? 'PDF 다운로드 옵션' : '이메일 발송 옵션',
    confirm: mode === 'pdf' ? '다운로드' : '발송',
  };

  const onToggle = (k: keyof SectionSelection, checked: boolean) =>
    setSections((prev) => ({ ...prev, [k]: checked }));

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{labels.title}</h3>
        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={sections.summary}
              onChange={(e) => onToggle('summary', e.target.checked)}
              className="w-4 h-4"
            />
            <span>회의 내용 자동 요약</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={sections.todos}
              onChange={(e) => onToggle('todos', e.target.checked)}
              className="w-4 h-4"
            />
            <span>각 담당자별 할 일 보기</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={sections.recommendations}
              onChange={(e) => onToggle('recommendations', e.target.checked)}
              className="w-4 h-4"
            />
            <span>추천 자료</span>
          </label>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="hover:bg-gray-100">
            취소
          </Button>
          <Button
            onClick={() => {
              onConfirm(sections);
              onClose();
            }}
            className="bg-[#FFD93D] text-white hover:bg-[#ffcf0a]"
          >
            {labels.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
 * API Stub (연동 포인트만 정의)
 * =============================== */
// TODO: 실제 엔드포인트로 교체
async function sendEmail({ to, subject, html }: { to: string[]; subject: string; html: string }) {
  const res = await fetch('/api/sendemail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, htmlContent: html }),
  });
  return res.json();
}

/* ===============================
 * Page
 * =============================== */
export default function MeetingPage() {
  const [showTodos, setShowTodos] = useState(true);
  const [openEmailIndex, setOpenEmailIndex] = useState<number | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const router = useRouter();

  const toggleAccordion = (idx: number) => setOpenEmailIndex((prev) => (prev === idx ? null : idx));

  const toggleCheck = (idx: number, isChecked: boolean) =>
    setChecked((prev) => {
      const next = [...prev];
      next[idx] = isChecked;
      return next;
    });

  const sp = useSearchParams();
  const params = useParams<{ id?: string; meetingId?: string }>();

  console.log('[dbg] params=', params, 'search=', sp.toString());

  const qp = sp.get('meetingId') ?? undefined;
  const pp = params?.id ?? params?.meetingId;
  const meetingId =
    (qp && /^\d+$/.test(qp) ? Number(qp) : undefined) ??
    (pp && /^\d+$/.test(String(pp)) ? Number(pp) : undefined);
  console.log('[dbg] meetingId=', meetingId);

  const { data: detail } = useMeetingDetail(meetingId);
  const { data: summary, isLoading: loadingSummary } = useMeetingSummary(meetingId);
  const { data: recs, isLoading: loadingRecs } = useMeetingRecommendations(meetingId);

  const teamIdQP = sp.get('teamId') ?? undefined;
  const teamId = teamIdQP ?? (detail ? String(detail.teamId) : undefined);

  const meetingDateYMD = detail?.meetingAt ? detail.meetingAt.slice(0, 10) : undefined;
  const {
    items: taskItems = [],
    summary: taskSummary,
    isLoading: loadingTasks,
  } = useTasks(teamId, { meetingId, page: 0, size: 10, sort: 'status,asc' });

  useEffect(() => {
    console.log('[dbg] summary=', summary);
    console.log('[dbg] recs=', recs);
  }, [summary, recs]);

  const participants = detail?.participants ?? [];
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    setChecked(new Array(participants.length).fill(false));
  }, [participants.length]);

  const selectedEmails = useMemo(
    () => checked.map((v, i) => (v ? participants[i]?.email : null)).filter(Boolean) as string[],
    [checked, participants]
  );
  const router = useRouter();

  const goToRecords = () => {
    if (!meetingId) {
      toast.error('meetingId가 없습니다.');
      return;
    }
    router.push(`/team/records/${meetingId}`);
  };


  const meetingData = useMemo(
    () => ({
      title: detail?.title ?? '회의 제목',
      date: detail?.meetingAt ?? '-',
      participantCount: String(detail?.participantCount ?? participants.length ?? 0),
    }),
    [detail, participants.length]
  );

  const recList = useMemo(() => {
    if (Array.isArray(recs)) return recs;
    if (recs && Array.isArray((recs as any).data)) return (recs as any).data;
    if (recs && !Array.isArray(recs)) return [recs as any]; // 요소 1개만 객체로 오는 경우
    return [];
  }, [recs]);

  const summaryText = useMemo(() => {
    return (summary as any)?.summary ?? (summary as any)?.data?.summary ?? '';
  }, [summary]);

  // PDF/이메일 HTML 생성
  const createPDFHtml = (selectedSections: SectionSelection) => {
    const summaryHtml = summaryText ? `<p>${summaryText}</p>` : '';

    const todosHtml =
      taskItems
        .map(
          (t, idx) => `
        <div class="todo-item">
          <h3>${idx + 1}. ${
            ['높음', '보통', '낮음'].includes(t.priorityLabel ?? '') ? '[중요] ' : ''
          }${t.title}</h3>
       <p><strong>담당자:</strong> ${t.assigneeName ?? '-'}</p>
       ${t.due ? `<p><strong>마감일:</strong> ${t.due.slice(0, 10)}</p>` : ''}
        </div>
      `
        )
        .join('') || '<p>등록된 작업이 없습니다.</p>';

    const toAbsUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

    const recsHtml = recList?.length
      ? recList
          .map(
            (r) => `
              <div class="recommendation-item">
                <h3>
                  <a href="${toAbsUrl(r.url)}" target="_blank" rel="noopener noreferrer">
                    ${r.title}
                  </a>
                </h3>
                ${r.description ? `<p>${r.description}</p>` : ''}
              </div>
            `
          )
          .join('')
      : '<p>추천 자료가 없습니다.</p>';

    const section = (title: string, inner: string) => `
      <div class="section">
        <h2>${title}</h2>
        ${inner}
      </div>`;

    let content = '';
    if (selectedSections.summary) content += section('회의 내용 요약', summaryHtml || '<p>-</p>');
    if (selectedSections.todos) content += section('각 담당자별 할 일', todosHtml);
    if (selectedSections.recommendations) content += section('추천 자료', recsHtml);

    // 기존 style/template는 그대로 사용 가능
    return `<!DOCTYPE html><html lang="ko">
      <head>
      <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
        <title>회의록 - ${meetingData.title}</title>
        <style>
          @page { margin: 20mm; size: A4; }
          body { font-family: 'Malgun Gothic','맑은 고딕',Arial,sans-serif; line-height:1.6; color:#333; max-width:800px; margin:0 auto; padding:20px; }
          .header { text-align:center; margin-bottom:30px; border-bottom:2px solid #333; padding-bottom:20px; }
          .title { font-size:24px; font-weight:bold; margin-bottom:10px; }
          .subtitle { font-size:18px; color:#666; margin-bottom:15px; }
          .meeting-info { font-size:14px; color:#888; }
          .section { margin-bottom:30px; page-break-inside: avoid; }
          h2 { font-size:18px; font-weight:bold; color:#333; border-left:4px solid #FFD93D; padding-left:10px; margin-bottom:15px; }
          h3 { font-size:14px; font-weight:bold; color:#555; margin-bottom:5px; }
          p { font-size:12px; margin-bottom:8px; text-align:justify; }
          .todo-item, .recommendation-item { background:#f9f9f9; padding:15px; margin-bottom:10px; border-radius:5px; border:1px solid #e0e0e0; }
          .todo-item h3 { color:#333; }
          .recommendation-item h3 { color:#0066cc; }
          strong { font-weight:bold; }
          @media print { body { padding:0; } .section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${meetingData.title}</div>
          <div class="subtitle">회의록</div>
          <div class="meeting-info">
            <div>날짜: ${meetingData.date}</div>
            <div>참석자: ${meetingData.participantCount}명</div>
          </div>
        </div>
        ${content}
        <div style="text-align:center; margin-top:40px; font-size:10px; color:#999;">
          생성일시: ${new Date().toLocaleString('ko-KR')}
        </div>
      </body></html>`;
  };

  // 이메일 전송/프린트 로직에서 createPDFHtml만 교체
  const onSendEmail = async (sections: SectionSelection) => {
    if (selectedEmails.length === 0) {
      toast.error('수신자를 한 명 이상 선택해주세요.');
      return;
    }
    const html = createPDFHtml(sections);
    const res = await fetch('/api/sendemail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: selectedEmails,
        subject: `[회의록] ${meetingData.title} 회의 결과`,
        htmlContent: html,
      }),
    });
    const result = await res.json();
    if (result?.success) {
      toast.success(result.message ?? '이메일 발송 완료');
    } else {
      const errorMessage = `이메일 발송 실패: ${result?.message ?? ''}`;
      toast.error(errorMessage);
    }
  };

  const onDownloadPdf = (sections: SectionSelection) => {
    const html = createPDFHtml(sections);
    const win = window.open('', '_blank');
    if (!win) return toast.error('팝업이 차단됐습니다.');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const onClickEmailButton = () => {
    if (selectedEmails.length === 0) {
      toast.error('수신자를 한 명 이상 선택해주세요.');
      return;
    }
    setShowEmailModal(true);
  };

  /* ===== Render ===== */
  return (
    <div className="flex h-screen bg-background">
      {/* 왼쪽 스크롤 영역 */}
      <div className="w-2/3 overflow-y-auto p-6">
        <h1 className="text-xl font-bold mb-5">{meetingData.title}</h1>
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <span>{meetingData.date}</span>
          <span>👥 {meetingData.participantCount}명 참석</span>
        </div>

        <SummarySection summary={summaryText} loading={loadingSummary} />

        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🧑‍💻 각 담당자별 할 일 보기</h3>
            <button onClick={() => setShowTodos((prev) => !prev)}>
              {showTodos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          {showTodos && (
            <div className="space-y-4">
              {loadingTasks && <div className="text-sm text-gray-500">할 일 불러오는 중...</div>}
              {!loadingTasks && taskItems.length === 0 && (
                <div className="text-sm text-gray-500">등록된 작업이 없습니다.</div>
              )}
              {!loadingTasks &&
                taskItems.map((t, idx) => (
                  <TodoItem
                    key={String(t.taskId ?? idx)}
                    label={t.title}
                    assignee={t.assigneeName ?? '-'}
                    dueDate={t.due ? t.due.slice(0, 10) : undefined}
                    important={['높음', '보통', '낮음'].includes(t.priorityLabel ?? '')}
                  />
                ))}
            </div>
          )}
        </section>
        <RecommandSection items={recList} loading={loadingRecs} />

        <div className="flex justify-center mt-8">
          <Button
            onClick={goToRecords}
            className="bg-[#FFD93D] text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-[#ffcf0a]"
          >
            저장
          </Button>
        </div>
      </div>

      {/* 오른쪽 스크롤 영역 */}
      <div className="w-1/3 border-l overflow-y-auto p-6 bg-white">
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2">📧 이메일 발송</h3>
          <div className="space-y-4">
            {participants.map((p, i) => (
              <div key={`${p.email}-${i}`} className="border p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!checked[i]}
                      onChange={(e) => toggleCheck(i, e.target.checked)}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{p.name?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-800">
                      {p.name} <span className="text-gray-500">({p.email})</span>
                    </p>
                  </div>
                  <button onClick={() => toggleAccordion(i)}>
                    {openEmailIndex === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {openEmailIndex === i && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                    <p>회의 요약: 프로젝트 일정 및 우선순위 조정 사항...</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={onClickEmailButton}
              className="text-sm px-4 py-1 bg-[#FFD93D] text-white hover:bg-[#ffcf0a]"
            >
              이메일 전송
            </Button>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setShowPdfModal(true)}
              className="bg-[#3B82F6] text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-[#3174E6]"
            >
              회의 내용 PDF 다운로드
            </Button>
          </div>
        </section>
      </div>

      {/* 공용 모달 */}
      <SectionSelectionModal
        isOpen={showPdfModal}
        mode="pdf"
        onClose={() => setShowPdfModal(false)}
        onConfirm={onDownloadPdf}
      />
      <SectionSelectionModal
        isOpen={showEmailModal}
        mode="email"
        onClose={() => setShowEmailModal(false)}
        onConfirm={onSendEmail}
      />
    </div>
  );
}
