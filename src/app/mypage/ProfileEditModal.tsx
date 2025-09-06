'use client';

import { useState, useEffect } from 'react';

export default function ProfileEditModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [department, setDepartment] = useState(initialData?.department || '');

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPosition(initialData.position || '');
      setDepartment(initialData.department || '');
    } else if (!isOpen) {
      setEmail('');
      setPosition('');
      setDepartment('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, email, position, department });
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">⚙️ 계정 설정</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="modal-name" className="block text-gray-700 text-sm font-bold mb-2">
              이름
            </label>
            <input
              type="text"
              id="modal-name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="modal-email" className="block text-gray-700 text-sm font-bold mb-2">
              이메일
            </label>
            <input
              type="email"
              id="modal-email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="modal-department"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              부서
            </label>
            <input
              type="text"
              id="modal-department"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="mb-7">
            <label htmlFor="modal-position" className="block text-gray-700 text-sm font-bold mb-2">
              직책
            </label>
            <input
              type="text"
              id="modal-position"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
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
              type="submit"
              className="bg-[#FFD93D] hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
