'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import Calendar from './Calendar';
import TaskList from './TaskList';

import { useTasks } from '@/hooks/useTasks';
import { createTask, updateTask, deleteTask, updateTaskStatus } from '@/services/taskApi';
import { fetchTeamDetails } from '@/services/teamApi';
import { Task, TaskCreatePayload, TaskUpdatePayload } from '@/types/task';
import { TeamMemberResponse } from '@/types/team';

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TeamCalendarPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [activeMonth, setActiveMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'DATE' | 'MONTH'>('DATE');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('전체 팀원');

  const { data: teamDetails, error: teamError } = useSWR(
    teamId ? ['teamDetails', teamId] : null,
    () => fetchTeamDetails(teamId)
  );

  const { startDate, endDate } = useMemo(() => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    return {
      startDate: new Date(year, month, 1).toISOString().split('T')[0],
      endDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
    };
  }, [activeMonth]);

  const {
    data: tasksData,
    error: tasksError,
    isLoading: areTasksLoading,
    mutate: mutateTasks,
  } = useTasks(teamId, {
    startDate,
    endDate,
    size: 200,
    page: 0,
    sort: encodeURIComponent('status,asc'),
  });

  const teamMembers: TeamMemberResponse[] = teamDetails?.members || [];
  const allTasks: Task[] = tasksData?.items || [];
  const isInitialLoading = !teamDetails && !teamError && !tasksData && !tasksError;
  const error = teamError || tasksError;

  const handleAddTask = async (payload: TaskCreatePayload) => {
    try {
      await createTask(teamId, payload);
      toast.success('태스크가 추가되었습니다.');
      mutateTasks();
    } catch {
      toast.error('태스크 추가에 실패했습니다.');
    }
  };

  const handleUpdateTask = async (taskId: number, payload: TaskUpdatePayload) => {
    try {
      await updateTask(taskId, payload);
      toast.success('태스크가 수정되었습니다.');
      mutateTasks();
    } catch {
      toast.error('태스크 수정에 실패했습니다.');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      toast.success('태스크가 삭제되었습니다.');
      mutateTasks();
    } catch {
      toast.error('태스크 삭제에 실패했습니다.');
    }
  };

  const handleToggleTaskStatus = async (
    taskId: number,
    currentStatus: '완료' | '진행' | '대기'
  ) => {
    try {
      const nextStatus = currentStatus === '완료' ? 'PROCESSING' : 'DONE';
      await updateTaskStatus(taskId, nextStatus);
      mutateTasks();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const filteredTasks = useMemo(() => {
    if (assigneeFilter === '전체 팀원') {
      return allTasks;
    }
    return allTasks.filter((task) => task.assigneeName === assigneeFilter);
  }, [allTasks, assigneeFilter]);

  const tasksForList = useMemo(() => {
    if (filterMode === 'MONTH') {
      const year = activeMonth.getFullYear();
      const month = activeMonth.getMonth();

      return filteredTasks.filter((task) => {
        if (!task.due) return false;
        const taskDate = new Date(task.due);
        return taskDate.getFullYear() === year && taskDate.getMonth() === month;
      });
    }

    const selectedDateStr = formatDateToYYYYMMDD(selectedDate);
    return filteredTasks.filter((task) => task.due && task.due.startsWith(selectedDateStr));
  }, [filteredTasks, selectedDate, filterMode, activeMonth]);

  if (isInitialLoading)
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    );
  if (error)
    return (
      <MainLayout>
        <div>Error: 데이터를 불러오는 데 실패했습니다.</div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div
        className={`flex flex-col lg:flex-row gap-6 p-4 justify-center items-start transition-opacity duration-300 ${
          areTasksLoading ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <Calendar
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date as Date);
            setFilterMode('DATE');
          }}
          tasks={filteredTasks}
          teamName={teamDetails?.teamName || ''}
          onActiveStartDateChange={({ activeStartDate }) =>
            activeStartDate && setActiveMonth(activeStartDate)
          }
          activeStartDate={activeMonth}
          onViewMonthTasks={() => setFilterMode('MONTH')}
          currentAssigneeFilter={assigneeFilter}
        />
        <TaskList
          selectedDate={selectedDate}
          tasks={tasksForList}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onToggleTaskStatus={handleToggleTaskStatus}
          filterMode={filterMode}
          filterMonth={activeMonth}
          teamMembers={teamMembers}
          currentAssigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
        />
      </div>
    </MainLayout>
  );
}
