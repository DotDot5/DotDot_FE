import { Checkbox } from '@/components/ui/checkbox';

interface TodoItemProps {
  label: string;
  assignee: string;
  dueDate: string;
  important?: boolean;
}

export default function TodoItem({ label, assignee, dueDate, important }: TodoItemProps) {
  return (
    <div className="flex items-start justify-between p-3 border rounded-md bg-white shadow-sm">
      <div className="flex items-start gap-2">
        <Checkbox />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-gray-500">{assignee}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        {important && (
          <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-[10px]">높음</span>
        )}
        <span>{dueDate}</span>
      </div>
    </div>
  );
}
