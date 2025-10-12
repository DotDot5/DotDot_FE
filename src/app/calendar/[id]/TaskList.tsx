'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Task, TaskCreatePayload, TaskUpdatePayload, TaskStatus, TaskPriority } from '@/types/task';
import { TeamMemberResponse } from '@/types/team';

const formatDateWithoutFns = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type TaskFilterMode = 'DATE' | 'MONTH';

interface TaskListProps {
  selectedDate: Date | null;
  filterMode: TaskFilterMode;
  filterMonth: Date | null;
  tasks: Task[];
  onAddTask: (newTaskData: TaskCreatePayload) => void;
  onUpdateTask: (taskId: number, updatedTaskData: TaskUpdatePayload) => void;
  onDeleteTask: (taskId: number) => void;
  onToggleTaskStatus: (taskId: number, currentStatus: '완료' | '진행' | '대기') => void;
  currentAssigneeFilter: string;
  onAssigneeFilterChange: (newFilter: string) => void;
  teamMembers: TeamMemberResponse[];
}

const statusLabelMap: Record<'완료' | '진행' | '대기', TaskStatus> = {
  완료: 'DONE',
  진행: 'PROCESSING',
  대기: 'TODO',
};
const priorityLabelMap: Record<'높음' | '보통' | '낮음', TaskPriority> = {
  높음: 'HIGH',
  보통: 'MEDIUM',
  낮음: 'LOW',
};

export default function TaskList({
  selectedDate,
  filterMode,
  filterMonth,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskStatus,
  currentAssigneeFilter,
  onAssigneeFilterChange,
  teamMembers,
}: TaskListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null);

  let displayDateText = '';
  if (filterMode === 'DATE') {
    displayDateText = selectedDate ? formatDateWithoutFns(selectedDate) : '날짜를 선택하세요';
  } else if (filterMode === 'MONTH' && filterMonth) {
    const year = filterMonth.getFullYear();
    const month = (filterMonth.getMonth() + 1).toString().padStart(2, '0');
    displayDateText = `${year}.${month}월`;
  }

  const completedTasksCount = tasks.filter((task) => task.statusLabel === '완료').length;
  const inProgressTasksCount = tasks.filter((task) => task.statusLabel === '진행').length;
  const pendingTasksCount = tasks.filter((task) => task.statusLabel === '대기').length;

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    openModal();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const title = formData.get('taskTitle') as string;
    const description = formData.get('taskDescription') as string;
    const assigneeName = formData.get('taskAssignee') as string;
    const priorityLabel = formData.get('taskPriority') as '높음' | '보통' | '낮음';
    const dueDate = formData.get('taskDueDate') as string;
    const due = dueDate ? `${dueDate}T09:00:00` : '';
    const statusLabel = formData.get('taskStatus') as '완료' | '진행' | '대기';

    const selectedMember = teamMembers.find((member) => member.name === assigneeName);

    const payload = {
      title,
      description,
      assigneeId: selectedMember ? selectedMember.userId : null,
      priority: priorityLabelMap[priorityLabel],
      status: statusLabelMap[statusLabel],
      due,
      meetingId: null,
    };

    if (editingTask) {
      onUpdateTask(editingTask.taskId, payload);
    } else {
      onAddTask(payload);
    }
    closeModal();
  };

  const handleDeleteClick = () => {
    if (editingTask) {
      setTaskIdToDelete(editingTask.taskId);
      setIsConfirmModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const confirmDeleteTask = () => {
    if (taskIdToDelete !== null) {
      onDeleteTask(taskIdToDelete);
      setIsConfirmModalOpen(false);
      setTaskIdToDelete(null);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTaskIdToDelete(null);
    if (editingTask) {
      setIsModalOpen(true);
    }
  };

  const handleTaskClick = (event: React.MouseEvent<HTMLDivElement>, task: Task) => {
    if ((event.target as HTMLElement).tagName === 'INPUT') return;
    openEditModal(task);
  };

  const getDefaultDueDate = () => {
    if (editingTask?.due) return editingTask.due;
    if (selectedDate && filterMode === 'DATE') return formatDateWithoutFns(selectedDate);
    return '';
  };

  return (
    <div className="w-full max-w-md bg-gray-50 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{displayDateText} 팀 작업</h2>
        <button
          onClick={() => {
            setEditingTask(null);
            openModal();
          }}
          className="bg-white text-gray-800 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          추가
        </button>
      </div>
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <span className="text-gray-500 mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
              />
            </svg>
          </span>
          <select
            className="flex-grow border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={currentAssigneeFilter}
            onChange={(e) => onAssigneeFilterChange(e.target.value)}
          >
            <option>전체 팀원</option>
            {teamMembers.map((member) => (
              <option key={member.userId} value={member.name}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 text-left">오늘의 진행상황</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-green-500 text-lg font-bold">{completedTasksCount}</p>
              <p className="text-gray-500 text-sm">완료</p>
            </div>
            <div>
              <p className="text-blue-500 text-lg font-bold">{inProgressTasksCount}</p>
              <p className="text-gray-500 text-sm">진행 중</p>
            </div>
            <div>
              <p className="text-gray-500 text-lg font-bold">{pendingTasksCount}</p>
              <p className="text-gray-500 text-sm">대기</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 pt-6 mt-6"></div>
      <div className="space-y-4 max-h-[calc(100vh-25rem)] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <div
            key={task.taskId}
            className="bg-white rounded-lg p-4 shadow-sm flex items-start space-x-3 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={(e) => handleTaskClick(e, task)}
          >
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
              checked={task.statusLabel === '완료'}
              onChange={(e) => {
                e.stopPropagation();
                onToggleTaskStatus(task.taskId, task.statusLabel);
              }}
            />
            <div className="flex-1">
              <h3
                className={`font-semibold text-gray-900 ${
                  task.statusLabel === '완료' ? 'line-through text-gray-400' : ''
                }`}
              >
                {task.title}
              </h3>
              <p className="text-gray-600 text-sm">{task.description}</p>
              {task.assigneeName && <p className="text-gray-500 text-xs">{task.assigneeName}</p>}
              {task.due && <p className="text-gray-500 text-xs mt-1">마감일: {task.due}</p>}
            </div>
            <div className="flex flex-col items-end space-y-1 min-w-[60px]">
              {task.priorityLabel === '높음' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  높음
                </span>
              )}
              {task.priorityLabel === '보통' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  보통
                </span>
              )}
              {task.priorityLabel === '낮음' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  낮음
                </span>
              )}
              {task.statusLabel === '완료' && (
                <span className="flex items-center text-green-600 text-xs font-semibold">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> 완료
                </span>
              )}
              {task.statusLabel === '진행' && (
                <span className="flex items-center text-blue-600 text-xs font-semibold">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span> 진행
                </span>
              )}
              {task.statusLabel === '대기' && (
                <span className="flex items-center text-gray-600 text-xs font-semibold">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span> 대기
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTask ? '작업 수정하기' : '작업 추가하기'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">
              작업 제목*
            </label>
            <input
              type="text"
              id="taskTitle"
              name="taskTitle"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
              required
              defaultValue={editingTask?.title || ''}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
              작업 설명*
            </label>
            <textarea
              id="taskDescription"
              name="taskDescription"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
              defaultValue={editingTask?.description || ''}
            ></textarea>
          </div>
          <div className="mb-4 flex space-x-4">
            <div className="flex-1">
              <label htmlFor="taskAssignee" className="block text-sm font-medium text-gray-700">
                담당자*
              </label>
              <select
                id="taskAssignee"
                name="taskAssignee"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
                required
                defaultValue={editingTask?.assigneeName || ''}
              >
                <option value="" disabled hidden>
                  담당자를 선택해주세요
                </option>
                {teamMembers.map((member) => (
                  <option key={member.userId} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700">
                우선순위
              </label>
              <select
                id="taskPriority"
                name="taskPriority"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
                defaultValue={editingTask?.priorityLabel || '보통'}
              >
                <option value="낮음">낮음</option>
                <option value="보통">보통</option>
                <option value="높음">높음</option>
              </select>
            </div>
          </div>
          <div className="mb-6 flex space-x-4">
            <div className="flex-1">
              <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700">
                마감일
              </label>
              <input
                type="date"
                id="taskDueDate"
                name="taskDueDate"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
                defaultValue={getDefaultDueDate()}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700">
                작업 상태
              </label>
              <select
                id="taskStatus"
                name="taskStatus"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 sm:text-sm"
                defaultValue={editingTask?.statusLabel || '대기'}
              >
                <option value="대기">대기</option>
                <option value="진행">진행</option>
                <option value="완료">완료</option>
              </select>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 mt-6"></div>
          <div className="flex justify-between items-center mt-6">
            <div className="flex space-x-3">
              {editingTask && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  삭제
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-yellow-400 text-white rounded-md hover:bg-yellow-500"
            >
              {editingTask ? '작업 수정' : '작업 추가'}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmDeleteTask}
        message="선택하신 작업을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        title="작업 삭제 확인"
      />
    </div>
  );
}
