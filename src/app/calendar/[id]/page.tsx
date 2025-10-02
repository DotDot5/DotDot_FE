'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';

import MainLayout from '@/components/layout/MainLayout';
import Calendar from './Calendar';
import TaskList from './TaskList';

import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
} from '@/services/taskApi';

import { Task, TaskCreatePayload } from '@/types/task';
import { TeamMemberResponse } from '@/types/team';
import { fetchTeamDetails } from '@/services/teamApi';
import { toast } from 'sonner';

const mapResponseToTask = (res: Task): Task => ({
  id: res.taskId,
  title: res.title,
  description: res.description,
  assignee: res.assigneeName || '미지정',
  status: res.statusLabel,
  priority: res.priorityLabel,
  dueDate: res.due ? res.due.split('T')[0] : '',
});

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAssigneeId = (assigneeName: string, members: TeamMemberResponse[]): number => {
  const member = members.find((m) => m.name === assigneeName);
  return member ? member.userId : 1;
};

export default function TeamCalendarPage() {
  const params = useParams();
  const teamId = params.id as string;

  const [currentTeamName, setCurrentTeamName] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<TeamMemberResponse[]>([]);
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [tasksForMonth, setTasksForMonth] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'DATE' | 'MONTH'>('DATE');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('전체 팀원');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssigneeFilterChange = (newFilter: string) => {
    setAssigneeFilter(newFilter);
  };

  const loadDataForMonth = useCallback(async () => {
    if (!teamId) return;
    setIsFetching(true);
    setError(null);
    try {
      const year = activeMonth.getFullYear();
      const month = activeMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const [teamDetails, taskListResponse] = await Promise.all([
        fetchTeamDetails(teamId),
        fetchTasks(teamId, { startDate, endDate, size: 200 }),
      ]);

      setCurrentTeamName(teamDetails.teamName);
      setTeamMembers(teamDetails.members);
      setTasksForMonth(taskListResponse.items.map(mapResponseToTask));
    } catch (err) {
      setError('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
    }
  }, [teamId, activeMonth]);

  useEffect(() => {
    loadDataForMonth();
  }, [loadDataForMonth]);

  const handleCRUD = async (action: Promise<any>) => {
    try {
      await action;
      await loadDataForMonth();
    } catch (err) {
      toast.error('요청 처리에 실패했습니다.');
    }
  };

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'teamId'>) => {
    const requestData = {
      title: newTaskData.title,
      description: newTaskData.description,
      assigneeId: getAssigneeId(newTaskData.assignee, teamMembers),
      priority:
        newTaskData.priority === '높음'
          ? 'HIGH'
          : newTaskData.priority === '보통'
            ? 'MEDIUM'
            : 'LOW',
      status:
        newTaskData.status === '완료'
          ? 'DONE'
          : newTaskData.status === '진행'
            ? 'PROCESSING'
            : 'TODO',
      due: newTaskData.dueDate ? `${newTaskData.dueDate}T09:00:00` : null,
    };
    handleCRUD(createTask(teamId, requestData as TaskCreatePayload));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const requestData = {
      title: updatedTask.title,
      description: updatedTask.description,
      assigneeId: getAssigneeId(updatedTask.assignee, teamMembers),
      priority:
        updatedTask.priority === '높음'
          ? 'HIGH'
          : updatedTask.priority === '보통'
            ? 'MEDIUM'
            : 'LOW',
      status:
        updatedTask.status === '완료'
          ? 'DONE'
          : updatedTask.status === '진행'
            ? 'PROCESSING'
            : 'TODO',
      due: updatedTask.dueDate ? `${updatedTask.dueDate}T00:00:00` : null,
    };
    handleCRUD(updateTask(updatedTask.id, requestData as any));
  };

  const handleDeleteTask = (taskId: number) => handleCRUD(deleteTask(taskId));

  const handleToggleTaskStatus = (taskId: number) => {
    const task = tasksForMonth.find((t) => t.id === taskId);
    if (!task) return;
    const nextStatus = task.status === '완료' ? 'PROCESSING' : 'DONE';
    handleCRUD(changeTaskStatus(taskId, nextStatus));
  };

  const filteredTasks = useMemo(() => {
    if (assigneeFilter === '전체 팀원') {
      return tasksForMonth;
    }
    return tasksForMonth.filter((task) => task.assignee === assigneeFilter);
  }, [tasksForMonth, assigneeFilter]);

  const tasksForList = useMemo(() => {
    if (filterMode === 'MONTH') {
      return filteredTasks;
    }
    const selectedDateStr = formatDateToYYYYMMDD(selectedDate);
    return filteredTasks.filter((task) => task.dueDate === selectedDateStr);
  }, [filteredTasks, selectedDate, filterMode]);

  if (isInitialLoading) {
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    );
  }
  if (error)
    return (
      <MainLayout>
        <div>Error: {error}</div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div
        className={`flex flex-col lg:flex-row gap-6 p-4 justify-center items-start transition-opacity duration-300 ${
          isFetching ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <Calendar
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date as Date);
            setFilterMode('DATE');
          }}
          tasks={filteredTasks}
          teamName={currentTeamName}
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
          onAssigneeFilterChange={handleAssigneeFilterChange}
        />
      </div>
    </MainLayout>
  );
}
