import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function GoalWidget() {
  const [showSettings, setShowSettings] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number | null>(() => {
    const saved = localStorage.getItem("goalWidgetLimit");
    return saved ? parseInt(saved, 10) : null;
  });

  // Save display limit to localStorage - MUST be before any conditional returns
  useEffect(() => {
    if (displayLimit !== null) {
      localStorage.setItem("goalWidgetLimit", displayLimit.toString());
    } else {
      localStorage.removeItem("goalWidgetLimit");
    }
  }, [displayLimit]);

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.goals.getAll(),
  });

  // Fetch estimates for each goal
  const goalIds = goalsData?.goals.map((g) => g.id) || [];
  const estimatesQueries = useQuery({
    queryKey: ["goalEstimates", goalIds],
    queryFn: async () => {
      if (goalIds.length === 0) return [];
      return Promise.all(goalIds.map((id) => api.goals.getEstimate(id)));
    },
    enabled: goalIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Savings Goals</h2>
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  const allGoals = goalsData?.goals || [];
  const allEstimates = estimatesQueries.data || [];

  // Filter to active goals and apply display limit
  const activeGoals = allGoals.filter(
    (g) => g.current_amount < g.target_amount
  );
  const displayedGoals = displayLimit
    ? activeGoals.slice(0, displayLimit)
    : activeGoals;

  // Filter estimates to only include displayed goals
  const displayedGoalIds = new Set(displayedGoals.map((g) => g.id));
  const estimates = allEstimates.filter(
    (est) => est && displayedGoalIds.has(est.goal.id)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM dd, yyyy");
  };

  if (allGoals.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Savings Goals</h2>
          </div>
          <div className="alert alert-info">
            <span>No goals set up yet. Create your first goal!</span>
          </div>
          <div className="card-actions justify-end mt-4">
            <Link to="/goals" className="btn btn-sm btn-primary">
              Create Goal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-2">
          <h2 className="card-title">Savings Goals</h2>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-base-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-3">Widget Settings</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Display limit</span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={displayLimit || "all"}
                onChange={(e) => {
                  const value = e.target.value;
                  setDisplayLimit(value === "all" ? null : parseInt(value, 10));
                }}
              >
                <option value="all">Show all active goals</option>
                <option value="3">Show top 3 goals</option>
                <option value="5">Show top 5 goals</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  {displayLimit
                    ? `Showing ${Math.min(
                        displayLimit,
                        activeGoals.length
                      )} of ${activeGoals.length} active goals`
                    : `Showing all ${activeGoals.length} active goals`}
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {estimates.map((estimate) => {
            if (!estimate) return null;
            const goal = estimate.goal;
            const percentage = Math.min(estimate.percentage, 100);
            const isCompleted = estimate.completed;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">{goal.name}</p>
                    <p className="text-sm text-gray-500">
                      Target: {formatDate(goal.target_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        isCompleted ? "text-success" : "text-base-content"
                      }`}
                    >
                      {formatCurrency(goal.current_amount)} /{" "}
                      {formatCurrency(goal.target_amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(estimate.remaining)} to go
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      isCompleted ? "bg-success" : "bg-primary"
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm">
                  <span>{percentage.toFixed(1)}% complete</span>
                  {!isCompleted && estimate.estimated_completion_date && (
                    <span
                      className={
                        estimate.on_track ? "text-success" : "text-warning"
                      }
                    >
                      {estimate.on_track ? "✓ On track" : "⚠ Behind schedule"}
                      {" - Est: "}
                      {formatDate(estimate.estimated_completion_date)}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-success">✓ Goal achieved!</span>
                  )}
                </div>

                {!isCompleted &&
                  !estimate.on_track &&
                  estimate.days_to_completion && (
                    <div className="alert alert-warning py-2">
                      <span className="text-xs">
                        At current rate: {estimate.days_to_completion} days to
                        complete (
                        {estimate.days_to_completion -
                          estimate.days_until_target}{" "}
                        days past target)
                      </span>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
        <div className="card-actions justify-end mt-4">
          <Link to="/goals" className="btn btn-sm btn-primary">
            View All Goals
          </Link>
        </div>
      </div>
    </div>
  );
}
