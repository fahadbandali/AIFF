import { Goal, GoalEstimate } from "../../lib/api";
import { format, parseISO, differenceInDays } from "date-fns";
import { useState } from "react";

interface GoalCardProps {
  goal: Goal;
  estimate: GoalEstimate | null;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onAddContribution: (goal: Goal) => void;
}

export default function GoalCard({
  goal,
  estimate,
  onEdit,
  onDelete,
  onAddContribution,
}: GoalCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const percentage = estimate
    ? Math.min(estimate.percentage, 100)
    : (goal.current_amount / goal.target_amount) * 100;
  const isCompleted = goal.current_amount >= goal.target_amount;
  const daysRemaining = differenceInDays(
    parseISO(goal.target_date),
    new Date()
  );
  const isUrgent = daysRemaining <= 30 && daysRemaining > 0 && !isCompleted;

  const getStatusIndicator = () => {
    if (isCompleted) {
      return { text: "Completed", color: "badge-success" };
    }
    if (!estimate) {
      return { text: "Active", color: "badge-info" };
    }
    if (estimate.on_track) {
      return { text: "On Track", color: "badge-success" };
    }
    return { text: "Behind", color: "badge-warning" };
  };

  const status = getStatusIndicator();

  const handleDelete = () => {
    setShowDeleteModal(false);
    onDelete(goal);
  };

  return (
    <>
      <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
        <div className="card-body">
          {/* Header with title and status */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="card-title text-xl mb-1">{goal.name}</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`badge ${status.color}`}>{status.text}</span>
                {isUrgent && (
                  <span className="badge badge-error">Due Soon!</span>
                )}
              </div>
            </div>
          </div>

          {/* Amount and Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold">
                {formatCurrency(goal.current_amount)} /{" "}
                {formatCurrency(goal.target_amount)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  isCompleted
                    ? "bg-success"
                    : estimate?.on_track
                    ? "bg-primary"
                    : "bg-warning"
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>{percentage.toFixed(1)}% complete</span>
              <span>
                {formatCurrency(goal.target_amount - goal.current_amount)} to go
              </span>
            </div>
          </div>

          {/* Deadline Info */}
          <div className="mt-4 p-3 bg-base-200 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Target Date:</span>
              <span
                className={`font-semibold ${
                  isUrgent ? "text-error" : "text-base-content"
                }`}
              >
                {formatDate(goal.target_date)}
                {daysRemaining > 0 && !isCompleted && (
                  <span className="ml-2 text-xs">({daysRemaining} days)</span>
                )}
              </span>
            </div>

            {estimate && !isCompleted && estimate.estimated_completion_date && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Estimated:</span>
                <span
                  className={`text-xs ${
                    estimate.on_track ? "text-success" : "text-warning"
                  }`}
                >
                  {formatDate(estimate.estimated_completion_date)}
                </span>
              </div>
            )}
          </div>

          {/* Completion Message */}
          {isCompleted && (
            <div className="alert alert-success mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Goal Achieved! 🎉</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="card-actions justify-end mt-4 gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onEdit(goal)}
            >
              Edit
            </button>
            {!isCompleted && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onAddContribution(goal)}
              >
                Add Contribution
              </button>
            )}
            <button
              className="btn btn-sm btn-error btn-outline"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Goal</h3>
            <p className="py-4">
              Are you sure you want to delete "{goal.name}"?
            </p>
            {goal.current_amount > 0 && (
              <div className="alert alert-warning mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>
                  This goal has {formatCurrency(goal.current_amount)} in
                  contributions.
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
