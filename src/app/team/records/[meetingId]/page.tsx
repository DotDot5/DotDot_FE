import ChatSection from '@/components/ChatSection';
import SummarySection from '@/components/SummarySection';
import ResourcesSection from '@/components/RecommandSection';

export default function MeetingDetailPage() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* 회의 정보 및 음성 기록 */}
      <div className="w-2/3 p-6 overflow-y-auto bg-white border-r border-gray-200">
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-2">제품 출시 회의</h2>
            <p className="text-gray-500">2025-05-20</p>

            <div className="mt-4 space-y-3">
              <div className="bg-yellow-100 px-3 py-1 inline-block rounded text-sm font-semibold">
                회의 멤버
              </div>
              <p className="text-gray-700">고예린, 김세현, 김다은, 정태윤</p>

              <div className="bg-yellow-100 px-4 py-1 inline-block rounded- text-sm font-semibold">
                회의 안건
              </div>
              <ul className="list-disc list-inside text-gray-800 space-y-6">
                {/* 첫번째 안건 */}
                <li>
                  <span className="font-semibold">회의 첫번째 안건</span>
                  <div className="mt-2 ml-4 p-4 rounded-md border border-gray-200 bg-white shadow-sm text-sm leading-relaxed">
                    첫번째 안건에선 이런이런걸 했고~ 이런걸 할 예정입니다. 앞으로 ○○님은 뭘
                    해주세요.
                  </div>
                </li>

                {/* 두번째 안건 */}
                <li>
                  <span className="font-semibold">회의 두번째 안건</span>
                  <div className="mt-2 ml-4 p-4 rounded-md border border-gray-200 bg-white shadow-sm text-sm leading-relaxed space-y-2">
                    <p>
                      두번째 안건에선 이런이런걸 했고~ 이런걸 할 예정입니다. 앞으로 ○○님은 뭘
                      해주세요.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="bg-yellow-100 px-3 py-1 inline-block rounded text-sm font-semibold">
                회의 메모
              </div>
              <p className="text-gray-700">오늘 회의는...</p>
            </div>
          </section>
          <ChatSection />
        </div>
      </div>

      {/* 요약 및 자료 */}
      <div className="w-1/3 p-6 overflow-y-auto bg-[#f7f7f7]">
        <div className="space-y-6">
          <SummarySection />
          <ResourcesSection />
        </div>
      </div>
    </div>
  );
}
