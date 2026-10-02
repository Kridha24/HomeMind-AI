import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, HouseholdMember } from '../../../types';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getDueDateStatus } from '../utils/taskFormatters';
import { sortTasks, TaskPriority } from '../utils/taskStatus';

export type TaskTab = 'today' | 'upcoming' | 'all' | 'completed' | 'assigned-me';
export type TaskSortOption = 'dueDate' | 'priority' | 'created' | 'completed';

export function useTaskFilters(tasks: Task[], members: HouseholdMember[] = []) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  // Initialize state from URL params
  const initialTab = (searchParams.get('view') as TaskTab) || 
    (searchParams.get('status') === 'completed' ? 'completed' : 
     searchParams.get('status') === 'pending' ? 'all' : 'today');
  
  const [activeTab, setActiveTab] = useState<TaskTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>(
    searchParams.get('priority')?.toUpperCase() || 'ALL'
  );
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    searchParams.get('assignee') || 'ALL'
  );
  const [sortBy, setSortBy] = useState<TaskSortOption>(
    activeTab === 'completed' ? 'completed' : 'dueDate'
  );

  // Debounce search query 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync tab changes with URL parameters without reloading
  const handleTabChange = (tab: TaskTab) => {
    setActiveTab(tab);
    if (tab === 'completed' && sortBy !== 'completed') {
      setSortBy('completed');
    } else if (tab !== 'completed' && sortBy === 'completed') {
      setSortBy('dueDate');
    }

    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', tab);
    if (tab === 'completed') {
      newParams.set('status', 'completed');
    } else if (tab === 'all') {
      newParams.set('status', 'pending');
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Sync priority filter with URL
  const handlePriorityChange = (priority: string) => {
    setSelectedPriority(priority);
    const newParams = new URLSearchParams(searchParams);
    if (priority !== 'ALL') {
      newParams.set('priority', priority.toLowerCase());
    } else {
      newParams.delete('priority');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedPriority('ALL');
    setSelectedAssignee('ALL');
    const newParams = new URLSearchParams();
    newParams.set('view', activeTab);
    setSearchParams(newParams, { replace: true });
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedPriority !== 'ALL' || selectedAssignee !== 'ALL'
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();

    return tasks.filter((task) => {
      const isCompleted = task.status === 'COMPLETED';
      const dueStatus = getDueDateStatus(task.dueDate, now);

      // 1. Tab level filtering
      if (activeTab === 'completed') {
        if (!isCompleted) return false;
      } else if (activeTab === 'today') {
        if (isCompleted) return false;
        // Today view includes tasks due today OR overdue tasks
        if (!dueStatus.isToday && !dueStatus.isOverdue) return false;
      } else if (activeTab === 'upcoming') {
        if (isCompleted) return false;
        // Upcoming includes tomorrow, later, or future dates
        if (dueStatus.isOverdue || dueStatus.isToday) return false;
      } else if (activeTab === 'assigned-me') {
        if (isCompleted) return false;
        if (!currentUserId || task.assigneeId !== currentUserId) return false;
      } else if (activeTab === 'all') {
        // All active tasks (not completed)
        if (isCompleted) return false;
      }

      // 2. Priority filter
      if (selectedPriority !== 'ALL') {
        if (task.priority !== selectedPriority) return false;
      }

      // 3. Assignee filter
      if (selectedAssignee !== 'ALL') {
        if (selectedAssignee === 'UNASSIGNED') {
          if (task.assigneeId) return false;
        } else {
          if (task.assigneeId !== selectedAssignee) return false;
        }
      }

      // 4. Search query filter (title, description, assignee name)
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query) || false;
        
        // Find assignee name if any
        const member = members.find((m) => m.id === task.assigneeId);
        const matchesAssignee = member?.name.toLowerCase().includes(query) || false;

        if (!matchesTitle && !matchesDescription && !matchesAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, activeTab, selectedPriority, selectedAssignee, debouncedSearch, members, currentUserId]);

  // Sort filtered tasks
  const sortedTasks = useMemo(() => {
    return sortTasks(filteredTasks, sortBy);
  }, [filteredTasks, sortBy]);

  return {
    activeTab,
    setActiveTab: handleTabChange,
    searchQuery,
    setSearchQuery,
    selectedPriority,
    setSelectedPriority: handlePriorityChange,
    selectedAssignee,
    setSelectedAssignee,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters,
    filteredTasks: sortedTasks,
    totalCount: tasks.length,
    matchingCount: sortedTasks.length,
  };
}
