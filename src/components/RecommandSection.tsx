export default function RecommendSection() {
  return (
    <section className="mt-4">
      <h3 className="text-lg font-bold mb-2">추천자료</h3>
      <div className="bg-white border border-gray-200 rounded-md p-4 text-gray-700 text-sm leading-relaxed">
        <ul className="list-disc list-inside text-sm text-blue-600">
          <li>
            <a href="https://uxplanet.org/2024-uiux-trend-report" target="_blank">
              2024 UI/UX 트렌드 리포트
            </a>
          </li>
          <li>
            <a href="https://m3.material.io" target="_blank">
              Google Material 3 디자인 가이드
            </a>
          </li>
          <li>
            <a href="https://figma.com/auto-layout" target="_blank">
              Figma Auto Layout 사용법
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
