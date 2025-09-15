type Item = {
  title: string;
  url: string;
  description?: string;
};

export default function RecommendSection({
  items = [],
  loading = false,
}: {
  items?: Item[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="mt-4">
        <h3 className="text-lg font-bold mb-2">추천자료</h3>
        <div className="bg-white border border-gray-200 rounded-md p-4 text-gray-500 text-sm">
          불러오는 중...
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-4">
        <h3 className="text-lg font-bold mb-2">추천자료</h3>
        <div className="bg-white border border-gray-200 rounded-md p-4 text-gray-500 text-sm">
          추천 자료가 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <h3 className="text-lg font-bold mb-2">추천자료</h3>
      <div className="bg-white border border-gray-200 rounded-md p-4 text-gray-700 text-sm leading-relaxed">
        <ul className="pl-5 space-y-3">
          {items.map((r, i) => (
            <li key={`${r.url}-${i}`} className="list-item list-disc marker:text-blue-600">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline font-medium"
                title={r.description || ''}
              >
                {r.title}
              </a>
              {r.description && <p className="mt-1 text-gray-600 text-xs">{r.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
