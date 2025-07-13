// components/ProfileEditModal.jsx
'use client'; // 클라이언트 컴포넌트임을 명시

import { useState, useEffect } from 'react';

export default function ProfileEditModal({
  isOpen,
  onClose,
  onSave,
  initialData, // initialData는 ProfileEditModal의 부모 컴포넌트에서 전달하는 초기값입니다.
}) {
  // initialData가 null/undefined일 경우를 대비해 빈 문자열로 초기화합니다.
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [department, setDepartment] = useState(initialData?.department || ''); // department 상태 추가

  // 모달이 열리거나 initialData가 변경될 때마다 폼 필드를 초기화합니다.
  useEffect(() => {
    // isOpen이 true이고 initialData가 유효한 객체일 때만 상태를 업데이트합니다.
    if (isOpen && initialData) {
      setName(initialData.name || ''); // null/undefined 방지
      setEmail(initialData.email || ''); // null/undefined 방지
      setPosition(initialData.position || ''); // null/undefined 방지
      setDepartment(initialData.department || ''); // department도 초기화
    } else if (!isOpen) {
      // 모달이 닫힐 때 상태를 초기화하여 다음 번 열릴 때 이전 값이 남지 않도록 합니다.
      // 또는 초기화 로직을 제거하고, initialData를 통해 항상 최신 값을 받도록 할 수도 있습니다.
      // 여기서는 초기화하는 것이 사용자 경험상 좋을 수 있습니다.
      setName('');
      setEmail('');
      setPosition('');
      setDepartment('');
    }
  }, [isOpen, initialData]); // isOpen과 initialData가 변경될 때마다 useEffect 실행

  // 모달이 닫혀있으면 아무것도 렌더링하지 않습니다.
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // onSave 호출 시 모든 필드 데이터를 전달합니다.
    onSave({ name, email, position, department }); // ⭐ department도 함께 전달
    onClose(); // 저장 후 모달 닫기
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
              readOnly // 이메일은 읽기 전용으로 설정되어 있네요.
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="modal-department" // ⭐ ID를 'modal-department'로 변경하여 고유하게 만듦
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              부서
            </label>
            <input
              type="text"
              id="modal-department" // ⭐ ID를 'modal-department'로 변경
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={department} // ⭐ 'department' 상태를 사용
              onChange={(e) => setDepartment(e.target.value)} // ⭐ 'setDepartment' 함수를 사용
            />
          </div>

          <div className="mb-7">
            <label
              htmlFor="modal-position" // ⭐ 이 ID는 이제 중복되지 않습니다.
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              직책
            </label>
            <input
              type="text"
              id="modal-position"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={position} // 'position' 상태를 사용
              onChange={(e) => setPosition(e.target.value)} // 'setPosition' 함수를 사용
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
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
