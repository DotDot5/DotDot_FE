// components/LogoutConfirmModal.jsx
'use client';

import React from 'react';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  const logoutContent = `
    로그아웃 하시겠습니까?
    현재 로그인된 계정에서 로그아웃됩니다.
  `;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">로그아웃</h3>

        <div className="text-gray-700 leading-relaxed mb-6">
          {logoutContent.split('\n').map((line, index) => (
            <p key={index} className="mb-2">
              {line}
            </p>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onConfirm}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            로그아웃
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
