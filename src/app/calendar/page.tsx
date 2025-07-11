'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Calendar from './Calendar';
import TaskList, { Task } from './TaskList';

const formatDateWithoutFns = (date: Date | null): string => {
  if (!date) {
    return '날짜를 선택하세요';
  }
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}.${month}.${day}`;
};

type TaskFilterMode = 'DATE' | 'MONTH';

const initialTasksData: Task[] = [
  {
    id: 1,
    title: '바 작업',
    description: '메인 페이지 디자인 작업',
    assignee: '고예린',
    status: '완료',
    priority: '보통',
    dueDate: '2025-07-10',
  },
  {
    id: 2,
    title: 'UI 작업',
    description: '메인 페이지 디자인 작업',
    assignee: '고예린',
    status: '대기',
    priority: '높음',
    dueDate: '2025-07-15',
  },
  {
    id: 3,
    title: 'UI 작업',
    description: '메인 페이지 디자인 작업',
    assignee: '김다은',
    status: '진행',
    priority: '낮음',
    dueDate: '2025-07-20',
  },
  {
    id: 4,
    title: '메인 페이지 디자인 작업',
    description: '메인 페이지 디자인 작업',
    assignee: '김세현',
    status: '진행',
    priority: '낮음',
    dueDate: '2025-07-25',
  },
  {
    id: 5,
    title: '일정 페이지 프론트',
    description: '캘린더, 태스크리스트 구현',
    assignee: '정태윤',
    status: '대기',
    priority: '보통',
    dueDate: '2025-07-30',
  },
];

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterMode, setFilterMode] = useState<TaskFilterMode>('DATE');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasksData);

  const [assigneeFilter, setAssigneeFilter] = useState('전체 팀원');

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setFilterMode('DATE');
  };

  const handleViewMonthTasks = (month: Date) => {
    setSelectedMonth(month);
    setFilterMode('MONTH');
  };

  //TaskList로부터 담당자 필터 변경 요청을 처리하는 핸들러
  const handleAssigneeFilterChange = (newFilter: string) => {
    setAssigneeFilter(newFilter);
  };

  const handleAddTask = (newTaskData: Omit<Task, 'id'>) => {
    const newId = Math.max(...tasks.map((t) => t.id), 0) + 1;
    setTasks((prevTasks) => [...prevTasks, { id: newId, ...newTaskData }]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleToggleTaskStatus = (taskId: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: task.status === '완료' ? '진행' : '완료' } : task
      )
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-6 p-4 justify-center items-start">
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          tasks={tasks}
          onViewMonthTasks={handleViewMonthTasks}
          currentAssigneeFilter={assigneeFilter} //Calendar에 현재 담당자 필터 전달
        />
        <TaskList
          selectedDate={selectedDate}
          filterMode={filterMode}
          filterMonth={selectedMonth}
          tasks={tasks}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onToggleTaskStatus={handleToggleTaskStatus}
          // TaskList에 현재 담당자 필터와 변경 함수 전달
          currentAssigneeFilter={assigneeFilter}
          onAssigneeFilterChange={handleAssigneeFilterChange}
        />
      </div>
    </MainLayout>
  );
}
