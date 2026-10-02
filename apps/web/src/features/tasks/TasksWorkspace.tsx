import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from './hooks/useTasks';
import { useTaskFilters, TaskTab } from './hooks/useTaskFilters';
import { useTaskSummary } from './hooks/useTaskSummary';
import { TasksHeader } from './components/TasksHeader';
import { TasksSummary } from './components/TasksSummary';
import { TasksTabs } from './components/TasksTabs';
import { TaskSearch } from './components/TaskSearch';
import { TasksFilters } from './components/TasksFilters';
import { TaskGroup } from './components/TaskGroup';
import { TaskRow } from './components/TaskRow';
import { TaskCard } from './components/TaskCard';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { AddEditTaskModal } from './components/AddEditTaskModal';
import { DeleteTaskModal } from './components/DeleteTaskModal';
import { TasksCalendar } from './components/TasksCalendar';
import { TasksProgress } from './components/TasksProgress';
import { MemberWorkload } from './components/MemberWorkload';
import { TasksSkeleton } from './components/TasksSkeleton';
import { TasksEmptyState } from './components/TasksEmptyState';
import { TasksErrorState } from './components/TasksErrorState';
import { Task } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { getDueDateStatus } from './utils/taskFormatters';

export const TasksWorkspace: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  // 1. Data hook
  const {
    tasks,
    members,
    isLoading,
    isError,
    error,
    refetch,
    toggleStatusMutation,
    addMutation,
    editMutation,
    deleteMutation,
  } = useTasks();

  // 2. Filters & View State
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedPriority,
    setSelectedPriority,
    selectedAssignee,
    setSelectedAssignee,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters,
    filteredTasks,
    totalCount,
  } = useTaskFilters(tasks, members);

  // 3. Summary & Workload Metrics
  const metrics = useTaskSummary(tasks, members);

  // 4. Local UI states
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check URL params for quick actions e.g. /tasks?action=add
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingTask(null);
      setAddEditModalOpen(true);
    }
  }, [searchParams]);

  // Keep selectedTask updated if tasks list changes
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks, selectedTask?.id]);

  // Android Back Button support (Capacitor & Browser history)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (addEditModalOpen) {
        e.preventDefault();
        setAddEditModalOpen(false);
        return;
      }
      if (deleteModalOpen) {
        e.preventDefault();
        setDeleteModalOpen(false);
        return;
      }
      if (drawerOpen) {
        e.preventDefault();
        setDrawerOpen(false);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [addEditModalOpen, deleteModalOpen, drawerOpen]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await toggleStatusMutation.mutateAsync({ taskId, nextStatus });
  };

  const handleQuickAdd = async (title: string) => {
    // Quick Add defaults: Due today, MEDIUM priority
    const today = new Date().toISOString();
    await addMutation.mutateAsync({
      title,
      priority: 'MEDIUM',
      dueDate: today,
      isRecurring: false,
    });
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setAddEditModalOpen(true);
  };

  const handleOpenDelete = (task: Task) => {
    setDeletingTask(task);
    setDeleteModalOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleSaveTask = async (taskData: {
    id?: string;
    title: string;
    description?: string;
    priority: any;
    dueDate: string;
    assigneeId?: string | null;
    isRecurring?: boolean;
  }) => {
    if (taskData.id) {
      await editMutation.mutateAsync({
        taskId: taskData.id,
        updates: taskData,
      });
    } else {
      await addMutation.mutateAsync({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        assigneeId: taskData.assigneeId,
        isRecurring: taskData.isRecurring,
      });
    }
  };

  const handleConfirmDelete = async (taskId: string) => {
    await deleteMutation.mutateAsync(taskId);
    setDeleteModalOpen(false);
    setDeletingTask(null);
    if (selectedTask?.id === taskId) {
      setDrawerOpen(false);
      setSelectedTask(null);
    }
  };

  // Grouping for Today View
  const todayGroups = useMemo(() => {
    if (activeTab !== 'today') return null;

    const overdue: Task[] = [];
    const dueToday: Task[] = [];

    filteredTasks.forEach((task) => {
      const status = getDueDateStatus(task.dueDate);
      if (status.isOverdue) {
        overdue.push(task);
      } else {
        dueToday.push(task);
      }
    });

    return { overdue, dueToday };
  }, [activeTab, filteredTasks]);

  // Grouping for Upcoming View
  const upcomingGroups = useMemo(() => {
    if (activeTab !== 'upcoming') return null;

    const tomorrow: Task[] = [];
    const thisWeek: Task[] = [];
    const later: Task[] = [];
    const noDate: Task[] = [];

    filteredTasks.forEach((task) => {
      const status = getDueDateStatus(task.dueDate);
      if (!task.dueDate) {
        noDate.push(task);
      } else if (status.isTomorrow) {
        tomorrow.push(task);
      } else if (status.isThisWeek) {
        thisWeek.push(task);
      } else {
        later.push(task);
      }
    });

    return { tomorrow, thisWeek, later, noDate };
  }, [activeTab, filteredTasks]);

  if (isLoading && tasks.length === 0) {
    return <TasksSkeleton />;
  }

  if (isError && tasks.length === 0) {
    return <TasksErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* 1. Header (Title, Subtitle, Quick Add, + Add Task, Calendar Toggle) */}
      <TasksHeader
        onAddTask={handleOpenAdd}
        onQuickAdd={handleQuickAdd}
        isQuickAdding={addMutation.isPending}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Summary Metric Strip */}
      <TasksSummary
        metrics={metrics}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 3. Progress / Completion Rate */}
      {metrics.todoCount + metrics.completedThisWeekCount > 0 && (
        <TasksProgress
          completedCount={metrics.completedThisWeekCount}
          totalCount={metrics.todoCount + metrics.completedThisWeekCount}
        />
      )}

      {/* 4. Household Workload Strip (Informational only) */}
      <MemberWorkload
        workload={metrics.memberWorkload}
        selectedAssignee={selectedAssignee}
        onSelectAssignee={setSelectedAssignee}
      />

      {/* 5. View Mode: Calendar vs List */}
      {viewMode === 'calendar' ? (
        <TasksCalendar
          tasks={tasks}
          members={members}
          onSelectTask={handleSelectTask}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <div className="space-y-4">
          {/* Main Task View Tabs */}
          <TasksTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            metrics={metrics}
            hasAssigneeSupport={members.length > 0}
          />

          {/* Search & Multi-Factor Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <TaskSearch value={searchQuery} onChange={setSearchQuery} />
            <TasksFilters
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
              selectedAssignee={selectedAssignee}
              onAssigneeChange={setSelectedAssignee}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              members={members}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              activeTab={activeTab}
            />
          </div>

          {/* Task Items List */}
          {filteredTasks.length === 0 ? (
            <TasksEmptyState
              activeTab={activeTab}
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onAddTask={handleOpenAdd}
            />
          ) : activeTab === 'today' && todayGroups ? (
            <div className="space-y-6">
              {todayGroups.overdue.length > 0 && (
                <TaskGroup
                  title="Overdue Tasks"
                  badge="Urgent Attention"
                  badgeColor="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                  tasks={todayGroups.overdue}
                  members={members}
                  currentUserId={currentUserId}
                  onToggleStatus={handleToggleStatus}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleOpenDelete}
                  isMutating={toggleStatusMutation.isPending}
                />
              )}

              {todayGroups.dueToday.length > 0 && (
                <TaskGroup
                  title="Due Today"
                  badge="Today"
                  badgeColor="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                  tasks={todayGroups.dueToday}
                  members={members}
                  currentUserId={currentUserId}
                  onToggleStatus={handleToggleStatus}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleOpenDelete}
                  isMutating={toggleStatusMutation.isPending}
                />
              )}
            </div>
          ) : activeTab === 'upcoming' && upcomingGroups ? (
            <div className="space-y-6">
              {upcomingGroups.tomorrow.length > 0 && (
                <TaskGroup
                  title="Tomorrow"
                  tasks={upcomingGroups.tomorrow}
                  members={members}
                  currentUserId={currentUserId}
                  onToggleStatus={handleToggleStatus}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleOpenDelete}
                  isMutating={toggleStatusMutation.isPending}
                />
              )}

              {upcomingGroups.thisWeek.length > 0 && (
                <TaskGroup
                  title="This Week"
                  tasks={upcomingGroups.thisWeek}
                  members={members}
                  currentUserId={currentUserId}
                  onToggleStatus={handleToggleStatus}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleOpenDelete}
                  isMutating={toggleStatusMutation.isPending}
                />
              )}

              {upcomingGroups.later.length > 0 && (
                <TaskGroup
                  title="Later"
                  tasks={upcomingGroups.later}
                  members={members}
                  currentUserId={currentUserId}
                  onToggleStatus={handleToggleStatus}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleOpenDelete}
                  isMutating={toggleStatusMutation.isPending}
                />
              )}

              {upcomingGroups.noDate.length > 0 && (
                <TaskGroup
                  title="No Due Date"
                  tasks={upcomingGroups.noDate}
                  members={members}
                  currentUserId={currentUserId}
                  onToggleStatus={handleToggleStatus}
                  onSelectTask={handleSelectTask}
                  onEditTask={handleOpenEdit}
                  onDeleteTask={handleOpenDelete}
                  isMutating={toggleStatusMutation.isPending}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Desktop List */}
              <div className="hidden sm:flex flex-col gap-2">
                {filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    members={members}
                    currentUserId={currentUserId}
                    onToggleStatus={handleToggleStatus}
                    onSelectTask={handleSelectTask}
                    onEditTask={handleOpenEdit}
                    onDeleteTask={handleOpenDelete}
                    isMutating={toggleStatusMutation.isPending}
                  />
                ))}
              </div>

              {/* Mobile Card Grid */}
              <div className="flex sm:hidden flex-col gap-2.5">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    currentUserId={currentUserId}
                    onToggleStatus={handleToggleStatus}
                    onSelectTask={handleSelectTask}
                    isMutating={toggleStatusMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        members={members}
        onToggleStatus={handleToggleStatus}
        onEdit={(task) => {
          setDrawerOpen(false);
          handleOpenEdit(task);
        }}
        onDelete={(task) => {
          setDrawerOpen(false);
          handleOpenDelete(task);
        }}
        isMutating={toggleStatusMutation.isPending}
      />

      {/* 7. Add / Edit Task Modal */}
      <AddEditTaskModal
        isOpen={addEditModalOpen}
        onClose={() => {
          setAddEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialData={editingTask}
        members={members}
      />

      {/* 8. Delete Task Modal */}
      <DeleteTaskModal
        task={deletingTask}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingTask(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default TasksWorkspace;
