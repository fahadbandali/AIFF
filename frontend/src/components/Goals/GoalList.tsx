import { useState, useMemo } from "react";
import { Goal, GoalEstimate } from "../../lib/api";
import GoalCard from "./GoalCard";

interface GoalListProps {
  goals: Goal[];
  estimates: GoalEstimate[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onAddContribution: (goal: Goal) => void;
}

type FilterType = "all" | "active" | "completed" | "behind";
type SortType = "deadline" | "progress" | "amount";

export default function GoalList({
  goals,
  estimates,
  onEdit,
  onDelete,
  onAddContribution,
}: GoalListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("deadline");

  // Create a map of goal ID to estimate for easy lookup
  const estimateMap = useMemo(() => {
    const map = new Map<string, GoalEstimate>();
    estimates.forEach((estimate) => {
      if (estimate) {
        map.set(estimate.goal.id, estimate);
      }
    });
    return map;
  }, [estimates]);

  // Filter goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const estimate = estimateMap.get(goal.id);
      const isCompleted = goal.current_amount >= goal.target_amount;

      switch (filter) {
        case "active":
          return !isCompleted;
        case "completed":
          return isCompleted;
        case "behind":
          return !isCompleted && estimate && !estimate.on_track;
        case "all":
        default:
          return true;
      }
    });
  }, [goals, filter, estimateMap]);

  // Sort goals
  const sortedGoals = useMemo(() => {
    const sorted = [...filteredGoals];

    switch (sort) {
      case "deadline":
        sorted.sort(
          (a, b) =>
            new Date(a.target_date).getTime() -
            new Date(b.target_date).getTime()
        );
        break;
      case "progress":
        sorted.sort((a, b) => {
          const progressA = (a.current_amount / a.target_amount) * 100;
          const progressB = (b.current_amount / b.target_amount) * 100;
          return progressB - progressA; // Descending order
        });
        break;
      case "amount":
        sorted.sort((a, b) => b.target_amount - a.target_amount); // Descending order
        break;
    }

    return sorted;
  }, [filteredGoals, sort]);

  if (goals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-2xl font-bold mb-2">No Goals Yet</h3>
        <p className="text-gray-600 mb-6">
          You haven't created any goals yet. Start by creating your first
          savings goal!
        </p>
        <div className="max-w-md mx-auto text-left bg-base-200 rounded-lg p-6">
          <h4 className="font-semibold mb-3">Why set savings goals?</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Track progress toward important financial targets</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Stay motivated with visual progress indicators</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>
                Get estimated completion dates based on your savings rate
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>See if you're on track to meet your deadlines</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${
              filter === "all" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilter("all")}
          >
            All ({goals.length})
          </button>
          <button
            className={`btn btn-sm ${
              filter === "active" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilter("active")}
          >
            Active (
            {goals.filter((g) => g.current_amount < g.target_amount).length})
          </button>
          <button
            className={`btn btn-sm ${
              filter === "completed" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilter("completed")}
          >
            Completed (
            {goals.filter((g) => g.current_amount >= g.target_amount).length})
          </button>
          <button
            className={`btn btn-sm ${
              filter === "behind" ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setFilter("behind")}
          >
            Behind Schedule (
            {
              goals.filter((g) => {
                const estimate = estimateMap.get(g.id);
                const isCompleted = g.current_amount >= g.target_amount;
                return !isCompleted && estimate && !estimate.on_track;
              }).length
            }
            )
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            className="select select-bordered select-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
          >
            <option value="deadline">Deadline</option>
            <option value="progress">Progress</option>
            <option value="amount">Target Amount</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {sortedGoals.length} goal{sortedGoals.length !== 1 ? "s" : ""}
      </div>

      {/* Goal Cards Grid */}
      {sortedGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              estimate={estimateMap.get(goal.id) || null}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddContribution={onAddContribution}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <p className="text-gray-600">
            No goals match the selected filter. Try a different filter.
          </p>
        </div>
      )}
    </div>
  );
}
