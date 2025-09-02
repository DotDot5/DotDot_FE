type Props = {
  summary?: string; // API에서 받은 요약 문자열
  loading?: boolean; // 로딩 표시 여부
};

export default function SummarySection({ summary = '', loading = false }: Props) {
  if (loading) {
    return (
      <section className="mb-4">
        <h3 className="text-lg font-bold mb-2">회의 내용 자동 요약</h3>
        <p className="bg-white border border-gray-200 rounded-md p-4 text-gray-500 text-sm">
          요약 불러오는 중...
        </p>
      </section>
    );
  }

  const text = summary?.trim();

  return (
    <section className="mb-4">
      <h3 className="text-lg font-bold mb-2">회의 내용 자동 요약</h3>
      <p className="bg-white border border-gray-200 rounded-md p-4 text-gray-700 text-sm leading-relaxed whitespace-pre-line break-words">
        {text && text.length > 0 ? text : '요약이 없습니다.'}
      </p>
    </section>
  );
}
