'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SummarySection from '@/components/SummarySection';
import RecommandSection from '@/components/RecommandSection';
import { Button } from '@/components/internal/ui/button';
import { Avatar, AvatarFallback } from '@/components/internal/ui/avatar';
import TodoItem from '@/components/internal/TodoItem';
import { ChevronDown, ChevronUp } from 'lucide-react';

function PDFSelectionModal({ isOpen, onClose, onDownload }) {
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    todos: true,
    recommendations: true,
  });

  const handleSectionChange = (section, checked) => {
    setSelectedSections((prev) => ({ ...prev, [section]: checked }));
  };

  const handleDownload = () => {
    onDownload(selectedSections);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">PDF 다운로드 옵션</h3>
        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedSections.summary}
              onChange={(e) => handleSectionChange('summary', e.target.checked)}
              className="w-4 h-4"
            />
            <span>회의 내용 자동 요약</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedSections.todos}
              onChange={(e) => handleSectionChange('todos', e.target.checked)}
              className="w-4 h-4"
            />
            <span>각 담당자별 할 일 보기</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedSections.recommendations}
              onChange={(e) => handleSectionChange('recommendations', e.target.checked)}
              className="w-4 h-4"
            />
            <span>추천 자료</span>
          </label>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="hover:bg-gray-100">
            취소
          </Button>
          <Button onClick={handleDownload} className="bg-[#FFD93D] text-white hover:bg-[#ffcf0a]">
            다운로드
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmailSelectionModal({ isOpen, onClose, onSend }) {
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    todos: true,
    recommendations: true,
  });

  const handleSectionChange = (section, checked) => {
    setSelectedSections((prev) => ({ ...prev, [section]: checked }));
  };

  const handleSend = () => {
    onSend(selectedSections);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">이메일 발송 옵션</h3>
        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedSections.summary}
              onChange={(e) => handleSectionChange('summary', e.target.checked)}
              className="w-4 h-4"
            />
            <span>회의 내용 자동 요약</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedSections.todos}
              onChange={(e) => handleSectionChange('todos', e.target.checked)}
              className="w-4 h-4"
            />
            <span>각 담당자별 할 일 보기</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedSections.recommendations}
              onChange={(e) => handleSectionChange('recommendations', e.target.checked)}
              className="w-4 h-4"
            />
            <span>추천 자료</span>
          </label>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="hover:bg-gray-100">
            취소
          </Button>
          <Button onClick={handleSend} className="bg-[#FFD93D] text-white hover:bg-[#ffcf0a]">
            발송
          </Button>
        </div>
      </div>
    </div>
  );
}

async function generatePDF(meetingData, selectedSections) {
  const htmlContent = createPDFHTML(meetingData, selectedSections);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function createPDFHTML(meetingData, selectedSections) {
  let content = '';
  if (selectedSections.summary) {
    content += `
      <div class="section">
        <h2>회의 내용 요약</h2>
        <p>이번 회의에서는 프로젝트 2차 개발 일정과 각 기능 우선순위에 대해 심도 있게 논의했습니다...</p>
      </div>
    `;
  }
  if (selectedSections.todos) {
    content += `
      <div class="section">
        <h2>각 담당자별 할 일</h2>
        <div class="todo-item">
          <h3>1. [중요] 메인 페이지 디자인 작업</h3>
          <p><strong>담당자:</strong> 고예린</p>
          <p><strong>마감일:</strong> 2025.07.04</p>
        </div>
        <div class="todo-item">
          <h3>2. 백엔드 API 명세 검토</h3>
          <p><strong>담당자:</strong> 이승현</p>
          <p><strong>마감일:</strong> 2025.07.05</p>
        </div>
      </div>
    `;
  }
  if (selectedSections.recommendations) {
    content += `
      <div class="section">
        <h2>추천 자료</h2>
        <div class="recommendation-item">
          <h3> 2024 UI/UX 트렌드 리포트</h3>
          <p>URL : https://uxplanet.org/2024-uiux-trend-report</p>
        </div>
        <div class="recommendation-item">
          <h3> Google Material 3 디자인 가이드</h3>
          <p>URL : https://m3.material.io</p>
        </div>
        <div class="recommendation-item">
          <h3> Figma Auto Layout 사용법</h3>
          <p>URL : https://figma.com/auto-layout</p>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>회의록 - ${meetingData.title}</title>
      <style>
        @page {
          margin: 20mm;
          size: A4;
        }
        
        body {
          font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 18px;
          color: #666;
          margin-bottom: 15px;
        }
        
        .meeting-info {
          font-size: 14px;
          color: #888;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        h2 {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          border-left: 4px solid #FFD93D;
          padding-left: 10px;
          margin-bottom: 15px;
        }
        
        h3 {
          font-size: 14px;
          font-weight: bold;
          color: #555;
          margin-bottom: 5px;
        }
        
        p {
          font-size: 12px;
          margin-bottom: 8px;
          text-align: justify;
        }
        
        .todo-item, .recommendation-item {
          background-color: #f9f9f9;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
          border: 1px solid #e0e0e0;
        }
        
        .todo-item h3 {
          color: #333;
        }
        
        .recommendation-item h3 {
          color: #0066cc;
        }
        
        strong {
          font-weight: bold;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .section {
            page-break-inside: avoid;
          }
        }
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
      
      <div style="text-align: center; margin-top: 40px; font-size: 10px; color: #999;">
        생성일시: ${new Date().toLocaleString('ko-KR')}
      </div>
    </body>
    </html>
  `;
}

export default function MeetingPage() {
  const [showTodos, setShowTodos] = useState(true);
  const [openEmailIndex, setOpenEmailIndex] = useState<number | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [checkedParticipants, setCheckedParticipants] = useState<boolean[]>([]);

  const searchParams = useSearchParams();
  const meetingTitle = searchParams.get('title');
  const meetingDate = searchParams.get('date');
  const participantCount = searchParams.get('participants');
  const participantsData = searchParams.get('participantsData');

  let participants = [];
  try {
    if (participantsData) {
      participants = JSON.parse(decodeURIComponent(participantsData));
    }
  } catch (e) {
    console.error('참석자 데이터 파싱 실패:', e);
  }

  useState(() => {
    setCheckedParticipants(new Array(participants.length).fill(false));
  }, [participants.length]);

  const handleToggleEmail = (index: number) => {
    setOpenEmailIndex((prev) => (prev === index ? null : index));
  };

  const handleCheckboxChange = (index: number, isChecked: boolean) => {
    setCheckedParticipants((prev) => {
      const newChecked = [...prev];
      newChecked[index] = isChecked;
      return newChecked;
    });
  };

  const handlePDFDownload = async (selectedSections) => {
    const meetingData = {
      title: meetingTitle ? decodeURIComponent(meetingTitle) : '회의 제목',
      date: meetingDate ? decodeURIComponent(meetingDate) : '날짜 정보 없음',
      participantCount: participantCount || '0',
    };

    try {
      await generatePDF(meetingData, selectedSections);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  const handleEmailSend = async (selectedSections) => {
    const selectedParticipantsEmails = checkedParticipants
      .map((isChecked, index) => (isChecked ? participants[index].email : null))
      .filter((email) => email !== null);

    if (selectedParticipantsEmails.length === 0) {
      alert('수신자를 한 명 이상 선택해주세요.');
      return;
    }

    const meetingData = {
      title: meetingTitle ? decodeURIComponent(meetingTitle) : '회의 제목',
      date: meetingDate ? decodeURIComponent(meetingDate) : '날짜 정보 없음',
      participantCount: participantCount || '0',
    };

    try {
      const pdfHtmlContent = createPDFHTML(meetingData, selectedSections);

      const response = await fetch('/api/sendemail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedParticipantsEmails,
          subject: `[회의록] ${meetingData.title} 회의 결과`,
          htmlContent: pdfHtmlContent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
      } else {
        alert(`이메일 발송 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('이메일 전송 요청 실패:', error);
      alert('이메일 전송 중 오류가 발생했습니다.');
    }
  };

  const handleEmailButtonClick = () => {
    const selectedParticipantIndices = checkedParticipants
      .map((isChecked, index) => (isChecked ? index : null))
      .filter((index) => index !== null);
    if (selectedParticipantIndices.length === 0) {
      alert('수신자를 한 명 이상 선택해주세요.');
      return;
    }
    const selectedParticipantsEmails = selectedParticipantIndices.map(
      (index) => participants[index].email
    );

    console.log('선택된 수신자 이메일:', selectedParticipantsEmails);
    setShowEmailModal(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* 왼쪽 스크롤 영역 */}
      <div className="w-2/3 overflow-y-auto p-6">
        <h1 className="text-xl font-bold mb-5">
          {meetingTitle ? decodeURIComponent(meetingTitle) : '회의 제목'}
        </h1>
        <div className="flex gap-4 text-sm text-gray-600 mb-4">
          <span>{meetingDate ? decodeURIComponent(meetingDate) : '날짜 정보 없음'}</span>
          <span>👥 {participantCount ? participantCount : 0}명 참석</span>
        </div>

        <SummarySection />

        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🧑‍💻 각 담당자별 할 일 보기</h3>
            <button onClick={() => setShowTodos((prev) => !prev)}>
              {showTodos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          {showTodos && (
            <div className="space-y-4">
              <TodoItem
                label="메인 페이지 디자인 작업"
                assignee="고예린"
                dueDate="2025.07.04"
                important
              />
              <TodoItem label="백엔드 API 명세 검토" assignee="이승현" dueDate="2025.07.05" />
            </div>
          )}
        </section>

        <RecommandSection />

        <div className="flex justify-center mt-8">
          <Button className="bg-[#FFD93D] text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-[#ffcf0a]">
            저장
          </Button>
        </div>
      </div>

      {/* 오른쪽 스크롤 영역 */}
      <div className="w-1/3 border-l overflow-y-auto p-6 bg-white">
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2">📧 이메일 발송</h3>
          <div className="space-y-4">
            {participants.map((item, index) => (
              <div key={index} className="border p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checkedParticipants[index] || false}
                      onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                    />
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{item.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-800">
                      {item.name} <span className="text-gray-500">({item.email})</span>
                    </p>
                  </div>
                  <button onClick={() => handleToggleEmail(index)}>
                    {openEmailIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {openEmailIndex === index && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                    <p>회의 요약: 프로젝트 일정 및 우선순위 조정 사항...</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="text-sm px-4 py-1 hover:bg-gray-100">
              수정
            </Button>

            <Button
              onClick={handleEmailButtonClick}
              className="text-sm px-4 py-1 bg-[#FFD93D] text-white hover:bg-[#ffcf0a]"
            >
              이메일 전송
            </Button>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setShowPDFModal(true)}
              className="bg-[#3B82F6] text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-[#3174E6]"
            >
              회의 내용 PDF 다운로드
            </Button>
          </div>
        </section>
      </div>

      <PDFSelectionModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        onDownload={handlePDFDownload}
      />

      <EmailSelectionModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
      />
    </div>
  );
}
