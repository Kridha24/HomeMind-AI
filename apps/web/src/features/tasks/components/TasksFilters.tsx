import React from 'react';
import { Filter, X, ArrowUpDown, User as UserIcon } from 'lucide-react';
import { HouseholdMember } from '../../../types';
import { TaskSortOption } from '../hooks/useTaskFilters';

interface TasksFiltersProps {
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  selectedAssignee: string;
  onAssigneeChange: (assignee: string) => void;
  sortBy: TaskSortOption;
  onSortByChange: (sort: TaskSortOption) => void;
  members: HouseholdMember[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeTab: string;
}

export const TasksFilters: React.FC<TasksFiltersProps> = ({
  selectedPriority,
  onPriorityChange,
  selectedAssignee,
  onAssigneeChange,
  sortBy,
  onSortByChange,
  members,
  onClearFilters,
  hasActiveFilters,
  activeTab,
}) => {
  const getAssigneeLabel = (id: string) => {
    if (id === 'ALL') return 'All Assignees';
    if (id === 'UNASSIGNED') return 'Unassigned';
    const member = members.find((m) => m.id === id);
    return member ? member.name : id;
  };

  return (
    <div className="space-y-2.5">
      {/* Filters Row */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Priority Dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-secondary/70 border border-primary/80 text-primary text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500/80 transition-colors"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Assignee Dropdown */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedAssignee}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="bg-secondary/70 border border-primary/80 text-primary text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500/80 transition-colors"
          >
            <option value="ALL">All Assignees</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
            <option value="UNASSIGNED">Unassigned</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted font-medium hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as TaskSortOption)}
            className="bg-secondary/70 border border-primary/80 text-primary text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500/80 transition-colors"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="created">Recently Added</option>
            {activeTab === 'completed' && <option value="completed">Recently Completed</option>}
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-muted font-medium">Active filters:</span>

          {selectedPriority !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
              Priority: {selectedPriority}
              <button
                type="button"
                onClick={() => onPriorityChange('ALL')}
                className="hover:opacity-75 p-0.5"
                title="Remove priority filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedAssignee !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
              Assignee: {getAssigneeLabel(selectedAssignee)}
              <button
                type="button"
                onClick={() => onAssigneeChange('ALL')}
                className="hover:opacity-75 p-0.5"
                title="Remove assignee filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};
