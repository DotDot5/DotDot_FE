'use client';

import React from 'react';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const privacyPolicyContent = `
    [회사 이름]은(는) 「개인정보보호법」 등 관련 법령을 준수하여 정보주체의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.

    1. 개인정보의 수집 및 이용 목적
    회사는 서비스 제공을 위해 최소한의 개인정보를 수집하며, 수집된 개인정보는 다음의 목적을 위해 활용됩니다.
    - 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산
    - 회원 관리 및 본인 확인, 불량 회원의 부정이용 방지
    - 마케팅 및 광고에 활용 (선택 동의 시)

    2. 수집하는 개인정보의 항목
    - 필수: 이름, 이메일 주소, 비밀번호
    - 선택: 전화번호, 부서, 직책 등

    3. 개인정보의 보유 및 이용 기간
    회원의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체없이 파기합니다.
    다만, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계 법령에서 정한 일정한 기간 동안 회원 정보를 보관합니다.

    4. 개인정보의 파기 절차 및 방법
    회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
    - 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.
    - 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.

    5. 개인정보 제공 (제3자 제공)
    회사는 회원의 개인정보를 "개인정보의 수집 및 이용 목적"에서 고지한 범위 내에서 이용하며, 동 범위를 초과하여 이용하거나 타인 또는 타 기업/기관에 제공하지 않습니다. 다만, 법령에 의하거나 회원의 동의가 있는 경우에는 예외로 합니다.

    6. 개인정보 처리 위탁
    회사는 서비스 향상을 위해 개인정보 처리 업무를 외부에 위탁할 수 있습니다. 위탁 계약 시 개인정보보호 관련 법규의 준수, 개인정보에 관한 비밀유지, 제3자 제공 금지 및 사고시의 책임부담 등을 명확히 규정하고 당해 계약 내용을 서면 또는 전자적으로 보관합니다.

    7. 정보주체 및 법정대리인의 권리 및 행사 방법
    회원은 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입 해지를 요청할 수도 있습니다.

    8. 개인정보 보호책임자 및 담당부서
    - 개인정보 보호책임자: [담당자 이름]
    - 소속부서: [담당 부서]
    - 이메일: [담당자 이메일]
    - 전화번호: [담당자 전화번호]

    본 개인정보처리방침은 [최초 시행일]부터 적용되며, 법령 및 정책 변경에 따라 내용이 추가, 삭제 및 수정될 경우 변경사항의 시행 7일 전부터 웹사이트 공지사항을 통하여 고지할 것입니다.
  `.trim();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">개인정보 처리방침</h3>{' '}
        {/* 고정된 제목 */}
        <div className="flex-grow overflow-y-auto text-gray-700 leading-relaxed pr-2">
          {privacyPolicyContent.split('\n').map((line, index) => (
            <p key={index} className="mb-2">
              {line}
            </p>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#FFD93D] hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
