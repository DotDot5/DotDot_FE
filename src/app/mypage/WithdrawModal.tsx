// components/WithdrawalConfirmModal.jsx
'use client';

import React from 'react';

export default function WithdrawalConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  const withdrawalContent = `
    회원 탈퇴를 신청하시겠습니까?

    회원 탈퇴 시 모든 서비스 이용 기록 및 회원 정보가
    삭제되며, 복구가 불가능합니다.

    정말 탈퇴하시겠습니까?
  `;

  return (
    <div className="fixed inset-0 b flex items-center justify-center z-50  bg-gray-600 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 border-b pb-2 text-red-600">회원 탈퇴</h3>

        <div className="text-gray-700 leading-relaxed mb-6">
          {withdrawalContent.split('\n').map((line, index) => (
            <p key={index} className="mb-2">
              {line}
            </p>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
}
