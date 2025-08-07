// src/components/SummarySection.tsx

interface SummarySectionProps {
  text: string; // STT 결과 텍스트를 prop으로 받습니다.
}

export default function SummarySection({ text }: SummarySectionProps) {
  return (
    <section className="mb-4">
      <h3 className="text-lg font-bold mb-2">회의 내용 자동 요약</h3>
      <p className="bg-white border border-gray-200 rounded-md p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    </section>
  );
}
