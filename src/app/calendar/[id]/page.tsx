// src/app/calendar/[id]/page.tsx
'use client'; // 클라이언트 컴포넌트임을 명시

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
// Calendar와 TaskList 컴포넌트의 경로를 확인하고 정확하게 임포트합니다.
// 만약 이들이 src/components에 있다면 아래와 같이 임포트합니다.
import Calendar from './Calendar';
import TaskList, { Task } from './TaskList';
import { useParams } from 'next/navigation'; // Next.js App Router에서 동적 라우트 파라미터 가져오기

// 날짜 포맷 함수 (변경 없음)
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

// ⭐ 임시 전체 태스크 데이터 (실제 앱에서는 이 데이터를 API로 서버에서 가져와야 합니다.)
// 각 태스크에 teamId를 포함시켜 팀별 구분을 가능하게 합니다.
const allTasksData: Task[] = [
  {
    id: 1,
    teamId: 1,
    title: 'DotDot - 메인 페이지 디자인',
    description: '메인 페이지 디자인 작업',
    assignee: '고예린',
    status: '완료',
    priority: '보통',
    dueDate: '2025-07-10',
  },
  {
    id: 2,
    teamId: 1,
    title: 'DotDot - UI 작업',
    description: '추가 UI 요소 개발',
    assignee: '고예린',
    status: '대기',
    priority: '높음',
    dueDate: '2025-07-15',
  },
  {
    id: 3,
    teamId: 2,
    title: '소공전 - 백엔드 API 연동',
    description: '사용자 인증 API 연동',
    assignee: '김다은',
    status: '진행',
    priority: '낮음',
    dueDate: '2025-07-20',
  },
  {
    id: 4,
    teamId: 1,
    title: 'DotDot - 데이터베이스 설계',
    description: 'DB 스키마 정의',
    assignee: '김세현',
    status: '진행',
    priority: '낮음',
    dueDate: '2025-07-25',
  },
  {
    id: 5,
    teamId: 2,
    title: '소공전 - 일정 페이지 프론트',
    description: '캘린더 UI 구현',
    assignee: '정태윤',
    status: '대기',
    priority: '보통',
    dueDate: '2025-07-30',
  },
  {
    id: 6,
    teamId: 1,
    title: 'DotDot - 기능 테스트',
    description: '전체 기능 테스트 및 버그 수정',
    assignee: '이영희',
    status: '완료',
    priority: '높음',
    dueDate: '2025-08-05',
  },
  {
    id: 7,
    teamId: 2,
    title: '소공전 - 배포 준비',
    description: '서버 설정 및 배포 스크립트 작성',
    assignee: '정태윤',
    status: '진행',
    priority: '높음',
    dueDate: '2025-08-10',
  },
];

// 팀 ID에 따른 팀 이름 매핑 (실제로는 API 또는 별도 설정 파일에서 관리)
const teamNames: { [key: string]: string } = {
  // teamId가 string일 수 있으므로 key를 string으로 변경
  '1': 'DotDot',
  '2': '소공전',
  // 필요한 만큼 팀 ID와 이름을 추가하세요.
};

export default function TeamCalendarPage() {
  // 컴포넌트 이름 변경 (명확성을 위해)
  const params = useParams();
  // URL에서 동적으로 전달된 'id' 값을 가져옵니다. (params.id는 string 타입입니다)
  const teamId = params.id as string;
  // teamNames 맵에서 현재 팀 이름을 가져옵니다. 없으면 기본 메시지 표시.
  const currentTeamName = teamNames[teamId] || `알 수 없는 팀 (ID: ${teamId})`;

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterMode, setFilterMode] = useState<TaskFilterMode>('DATE');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  // 현재 teamId에 해당하는 태스크만 저장하는 상태
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState('전체 팀원');

  // ⭐ teamId가 변경될 때마다 해당 팀의 태스크를 필터링합니다.
  useEffect(() => {
    // teamId가 유효한 값일 때만 필터링을 수행합니다.
    if (teamId) {
      // allTasksData에서 현재 teamId에 해당하는 태스크만 필터링합니다.
      // Task.teamId는 number, teamId는 string이므로, 비교를 위해 String()으로 형변환합니다.
      const filteredTasks = allTasksData.filter((task) => String(task.teamId) === teamId);
      setTasks(filteredTasks);
      // 팀이 변경될 때마다 캘린더와 태스크 목록의 필터를 초기화합니다.
      setSelectedDate(new Date());
      setFilterMode('DATE');
      setSelectedMonth(null);
      setAssigneeFilter('전체 팀원');
    }
  }, [teamId]); // teamId가 의존성 배열에 있으므로, teamId가 변경될 때마다 이펙트가 다시 실행됩니다.

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setFilterMode('DATE');
  };

  const handleViewMonthTasks = (month: Date) => {
    setSelectedMonth(month);
    setFilterMode('MONTH');
  };

  const handleAssigneeFilterChange = (newFilter: string) => {
    setAssigneeFilter(newFilter);
  };

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'teamId'>) => {
    const newId = Math.max(...allTasksData.map((t) => t.id), 0) + 1;
    // 새 태스크에 현재 teamId를 할당합니다. teamId는 string이므로 parseInt로 변환.
    const newTaskWithTeamId: Task = { id: newId, teamId: parseInt(teamId), ...newTaskData };
    allTasksData.push(newTaskWithTeamId); // ⭐ 임시: 전체 데이터에 추가 (실제로는 API 호출)
    setTasks((prevTasks) => [...prevTasks, newTaskWithTeamId]); // 현재 화면에 보이는 태스크 목록 업데이트
  };

  const handleUpdateTask = (updatedTask: Task) => {
    // ⭐ 임시: 전체 데이터에서 업데이트 (실제로는 API 호출)
    const indexInAll = allTasksData.findIndex((task) => task.id === updatedTask.id);
    if (indexInAll !== -1) {
      allTasksData[indexInAll] = updatedTask;
    }
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleDeleteTask = (taskId: number) => {
    // ⭐ 임시: 전체 데이터에서도 삭제 (실제로는 API 호출)
    const indexInAll = allTasksData.findIndex((task) => task.id === taskId);
    if (indexInAll !== -1) {
      allTasksData.splice(indexInAll, 1);
    }
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleToggleTaskStatus = (taskId: number) => {
    // ⭐ 임시: 전체 데이터에서도 상태 업데이트 (실제로는 API 호출)
    const indexInAll = allTasksData.findIndex((task) => task.id === taskId);
    if (indexInAll !== -1) {
      allTasksData[indexInAll].status =
        allTasksData[indexInAll].status === '완료' ? '진행' : '완료';
    }
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
          tasks={tasks} // 이제 이 tasks는 현재 팀에 필터링된 태스크만 포함합니다.
          onViewMonthTasks={handleViewMonthTasks}
          currentAssigneeFilter={assigneeFilter}
          teamName={currentTeamName}
        />
        <TaskList
          selectedDate={selectedDate}
          filterMode={filterMode}
          filterMonth={selectedMonth}
          tasks={tasks} // 이제 이 tasks는 현재 팀에 필터링된 태스크만 포함합니다.
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onToggleTaskStatus={handleToggleTaskStatus}
          currentAssigneeFilter={assigneeFilter}
          onAssigneeFilterChange={handleAssigneeFilterChange}
        />
      </div>
    </MainLayout>
  );
}
