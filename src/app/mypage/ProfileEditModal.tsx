'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProfileEditModal({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  const isValidImageUrl = (url: string | undefined | null): boolean => {
    return !!(url && url !== 'basic' && (url.startsWith('http') || url.startsWith('/')));
  };

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '');
      setPosition(initialData.position || '');
      setDepartment(initialData.department || '');
      setImagePreview(
        isValidImageUrl(initialData.profileImageUrl) ? initialData.profileImageUrl : null
      );
      setSelectedFile(null);
      setIsImageDeleted(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsImageDeleted(false);
    }
  };

  const handleDeleteImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setIsImageDeleted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, position, department }, { file: selectedFile, delete: isImageDeleted });
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h3 className="text-xl font-bold mb-6">⚙️ 계정 설정</h3>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-6">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Profile Preview"
                width={100}
                height={100}
                className="rounded-full w-24 h-24 object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="rounded-full w-24 h-24 bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                <span className="text-5xl text-gray-500">👤</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              {/* 변경 버튼 */}
              <label
                htmlFor="profile-image-upload"
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full cursor-pointer transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                변경
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={handleDeleteImage}
                className="flex items-center gap-2 px-4 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-full transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                삭제
              </button>
            </div>
          </div>

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
              type="submit"
              className="bg-[#FFD93D] hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              저장
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
