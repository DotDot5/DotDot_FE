// src/components/MyCalendar.tsx
'use client';

import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarStyles.css';

import { Task } from './TaskList'; // Task 인터페이스만 임포트

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface CalendarProps {
  value: Value;
  onChange: (date: Value) => void;
  tasks: Task[];
  onViewMonthTasks: (month: Date) => void;
  currentAssigneeFilter: string;
  // ⭐ 새로운 prop: 팀 이름 추가
  teamName: string;
}

const formatDateForDot = (date: Date): string => {
  return date.toDateString();
};

export default function MyCalendar({
  value,
  onChange,
  tasks,
  onViewMonthTasks,
  currentAssigneeFilter,
  teamName, // ⭐ props로 teamName 받기
}: CalendarProps) {
  const filteredTasksForDots = tasks.filter((task) => {
    return currentAssigneeFilter === '전체 팀원' || task.assignee === currentAssigneeFilter;
  });

  const datesWithDots = filteredTasksForDots
    .filter((task) => task.dueDate)
    .map((task) => formatDateForDot(new Date(task.dueDate!)));

  const currentMonth =
    (value instanceof Date ? value : Array.isArray(value) ? value[0] : new Date()) || new Date();

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-yellow-400 rounded-t-lg p-4 text-left">
          {/* ⭐ 여기를 teamName prop으로 변경 */}
          <h1 className="text-white text-lg font-bold">{teamName} 팀의 워크스페이스</h1>
        </div>
        <div className="bg-gray-50 rounded-b-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">팀 작업 캘린더</h2>
            <button
              onClick={() => onViewMonthTasks(currentMonth)}
              className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              이번 달 작업 보기
            </button>
          </div>
          <Calendar
            onChange={onChange}
            value={value}
            className="my-custom-calendar"
            locale="ko-KR"
            next2Label={null}
            prev2Label={null}
            tileContent={({ date, view }) => {
              if (view === 'month' && datesWithDots.includes(formatDateForDot(date))) {
                return <div className="dot-indicator"></div>;
              }
              return null;
            }}
          />
        </div>
      </div>
    </div>
  );
}
