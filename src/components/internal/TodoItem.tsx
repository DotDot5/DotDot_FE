import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

interface TodoItemProps {
  label: string;
  assignee: string;
  dueDate: string;
  important?: boolean;
  completed?: boolean;
  onToggle?: (completed: boolean) => void;
  onClick?: () => void;
}

export default function TodoItem({
  label,
  assignee,
  dueDate,
  important = false,
  completed = false,
  onToggle,
  onClick,
}: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`flex items-start justify-between p-3 border rounded-lg bg-white shadow-sm transition-all duration-200 cursor-pointer group ${
        completed ? 'opacity-60 bg-gray-50' : 'hover:shadow-md hover:border-gray-300'
      } ${isHovered ? 'transform scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5">
          <Checkbox
            checked={completed}
            onChange={(e) => onToggle?.(e.target.checked)}
            className="transition-transform duration-150 group-hover:scale-110"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-medium transition-colors duration-200 ${
              completed ? 'line-through text-gray-500' : 'text-gray-900 group-hover:text-gray-700'
            }`}
          >
            {label}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors duration-200"></div>
              {assignee}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {important && (
          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-medium animate-pulse">
            높음
          </span>
        )}
        <span
          className={`text-xs transition-colors duration-200 ${
            completed ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-700'
          }`}
        >
          {dueDate}
        </span>

        {/* Hover 시 나타나는 액션 버튼들 */}
        <div
          className={`flex items-center gap-1 transition-all duration-200 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              // 편집 액션
            }}
            title="편집"
          >
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            className="p-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation();
              // 삭제 액션
            }}
            title="삭제"
          >
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
