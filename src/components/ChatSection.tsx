export default function ChatSection() {
  return (
    <section className="mt-6">
      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <div>
          <p className="text-sm font-semibold text-purple-700">사용자1</p>
          <p className="text-sm text-gray-800">안녕하세요. 오늘 회의 시작하겠습니다.</p>
          <p className="text-xs text-gray-400">14:37</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-700">사용자1</p>
          <p className="text-sm text-gray-800">안녕하세요. 오늘 회의 시작하겠습니다.</p>
          <p className="text-xs text-gray-400">14:37</p>
        </div>

        {/* ...채팅 반복 */}
      </div>
    </section>
  );
}
