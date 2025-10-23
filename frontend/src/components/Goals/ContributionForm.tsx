import { useState } from "react";
import { Goal, api } from "../../lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ContributionFormProps {
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContributionForm({
  goal,
  onClose,
  onSuccess,
}: ContributionFormProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string>("");
  const [showExceedWarning, setShowExceedWarning] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const contributionMutation = useMutation({
    mutationFn: (newAmount: number) =>
      api.goals.updateProgress(goal.id, newAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({
        queryKey: ["goalEstimates"],
      });
      onSuccess();
    },
  });

  const validateAmount = (value: string): string | null => {
    const contributionAmount = parseFloat(value);

    if (!value || isNaN(contributionAmount)) {
      return "Amount is required";
    }

    if (contributionAmount <= 0) {
      return "Amount must be positive";
    }

    if (!/^\d+(\.\d{0,2})?$/.test(value)) {
      return "Amount can have at most 2 decimal places";
    }

    return null;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError("");

    const contributionAmount = parseFloat(value);
    if (!isNaN(contributionAmount)) {
      const newTotal = goal.current_amount + contributionAmount;
      if (newTotal > goal.target_amount) {
        setShowExceedWarning(true);
      } else {
        setShowExceedWarning(false);
      }
    } else {
      setShowExceedWarning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    const contributionAmount = parseFloat(amount);
    const newAmount = goal.current_amount + contributionAmount;

    try {
      await contributionMutation.mutateAsync(newAmount);
    } catch (err) {
      setError("Failed to add contribution. Please try again.");
    }
  };

  const contributionAmount = parseFloat(amount) || 0;
  const newTotal = goal.current_amount + contributionAmount;
  const willComplete = newTotal >= goal.target_amount;
  const exceedsBy = newTotal - goal.target_amount;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-2xl mb-6">Add Contribution</h3>

        {/* Goal Summary */}
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-lg mb-2">{goal.name}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Target:</span>
              <span className="font-semibold">
                {formatCurrency(goal.target_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current:</span>
              <span className="font-semibold">
                {formatCurrency(goal.current_amount)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-semibold">
                {formatCurrency(goal.target_amount - goal.current_amount)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contribution Amount Input */}
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text font-semibold">
                Contribution Amount *
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="100.00"
                className={`input input-bordered w-full pl-7 ${
                  error ? "input-error" : ""
                }`}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={contributionMutation.isPending}
                autoFocus
              />
            </div>
            {error && (
              <label className="label">
                <span className="label-text-alt text-error">{error}</span>
              </label>
            )}
          </div>

          {/* New Total Preview */}
          {amount && !error && (
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">New Total:</span>
                <span className="font-bold text-xl">
                  {formatCurrency(newTotal)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    willComplete ? "bg-success" : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(
                      (newTotal / goal.target_amount) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Completion Alert */}
          {willComplete && !showExceedWarning && (
            <div className="alert alert-success mb-4">
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
              <span>This contribution will complete your goal! 🎉</span>
            </div>
          )}

          {/* Exceed Warning */}
          {showExceedWarning && (
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
              <div>
                <div>
                  This will exceed your goal by {formatCurrency(exceedsBy)}
                </div>
                <div className="text-xs mt-1">
                  You can still proceed if you want.
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={contributionMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={contributionMutation.isPending || !amount}
            >
              {contributionMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                "Add Contribution"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </div>
  );
}
