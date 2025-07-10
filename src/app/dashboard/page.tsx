export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 상단 말풍선 */}
      <div className="bg-yellow-50 rounded-xl h-32 flex items-center justify-center">
        <div className="flex space-x-6"></div>
      </div>

      {/* 최근 회의 목록 */}
      <div className="bg-gray-100 rounded-xl p-3 space-y-2">
        <div className="inline-block">
          <div className="bg-[#FFD93D] rounded-full px-2 py-0.5 w-32 text-center inline-block">
            <span className="text-lg font-bold text-white">최근 회의 목록</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 mt-3">
          <ul className="text-sm space-y-3">
            <li className="font-semibold">[ DotDot ] 5/19(목) 3차 회의</li>
            <li className="font-semibold">[ 소공전 ] 5/18(수) 앱 개발 회의</li>
            <li className="font-semibold">[ DotDot ] 5/17(화) 2차 회의</li>
          </ul>
        </div>
      </div>

      {/* 다가오는 회의 */}
      <div className="bg-gray-100 rounded-xl p-3 space-y-2">
        <div className="inline-block">
          <div className="bg-[#FFD93D] rounded-full px-2 py-0.5 w-32 text-center inline-block">
            <span className="text-lg font-bold text-white">다가오는 회의</span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 mt-3">
          <ul className="text-sm space-y-3">
            <li className="font-semibold">[ DotDot ] 5/21(토) 4차 회의</li>
            <li className="font-semibold">[ 소공전 ] 5/30(수) 2차 회의</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
