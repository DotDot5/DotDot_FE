// src/components/Modal.tsx
'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string; // 팝업 제목 (선택 사항)
}

export default function Modal({ isOpen, onClose, children, title = '새 항목 추가' }: ModalProps) {
  if (!isOpen) return null; // isOpen이 false면 아무것도 렌더링하지 않음

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative transform transition-all sm:my-8 sm:w-full sm:max-w-md">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 모달 본문 */}
        <div>{children}</div>

        {/* 모달 푸터 (옵션: 버튼 등을 여기에 추가) */}
        {/* <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            취소
          </button>
          <button
            type="submit" // 폼 안에 있다면
            className="px-4 py-2 bg-yellow-400 text-white rounded-md hover:bg-yellow-500"
          >
            저장
          </button>
        </div> */}
      </div>
    </div>
  );
}
