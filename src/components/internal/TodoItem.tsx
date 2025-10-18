import { Checkbox } from '@/components/ui/checkbox';
import clsx from 'clsx';
import { Pencil, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';

interface TodoItemProps {
  label: string;
  assignee: string;
  dueDate: string;
  priority?: Task['priorityLabel'];
  completed?: boolean;
  onToggle?: (completed: boolean) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TodoItem({
  label,
  assignee,
  dueDate,
  priority,
  completed = false,
  onToggle,
  onClick,
  onEdit,
  onDelete,
}: TodoItemProps) {
  const getPriorityStyles = () => {
    switch (priority) {
      case '높음':
        return 'bg-red-100 text-red-800 animate-pulse';
      case '보통':
        return 'bg-yellow-100 text-yellow-800';
      case '낮음':
        return 'bg-green-100 text-green-800';
      default:
        return '';
    }
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg bg-white shadow-sm transition-all duration-200 cursor-pointer',
        {
          'opacity-60 bg-gray-50': completed,
          'hover:shadow-md hover:border-gray-300 hover:scale-[1.02]': !completed,
        }
      )}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-1">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked: boolean) => onToggle?.(checked)}
            onClick={(e) => e.stopPropagation()}
            className="transition-transform duration-150 group-hover:scale-110"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={clsx('text-sm font-medium transition-colors duration-200 truncate', {
              'line-through text-gray-500': completed,
              'text-gray-900': !completed,
            })}
          >
            {label}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{assignee}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
        {priority && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityStyles()}`}
          >
            {priority}
          </span>
        )}
        <span
          className={clsx('text-xs transition-colors duration-200 whitespace-nowrap', {
            'text-gray-400': completed,
            'text-gray-500 group-hover:text-gray-700': !completed,
          })}
        >
          {dueDate}
        </span>

        <div
          className={clsx(
            'flex items-center gap-1 transition-all duration-200',
            {
              'opacity-100 translate-x-0': !completed,
              'opacity-0 translate-x-2': true,
            },
            'group-hover:opacity-100 group-hover:translate-x-0'
          )}
        >
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            aria-label="작업 편집"
            className="p-1 rounded-full hover:bg-gray-200 transition-colors duration-150"
          >
            <Pencil className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            aria-label="작업 삭제"
            className="p-1 rounded-full hover:bg-red-100 transition-colors duration-150"
          >
            <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-600" />
          </button> */}
        </div>
      </div>
    </div>
  );
}
