import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, Goal, ApiError } from "../../lib/api";
import GoalList from "./GoalList";
import GoalForm from "./GoalForm";
import ContributionForm from "./ContributionForm";

export default function GoalDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributionGoal, setContributionGoal] = useState<Goal | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Fetch goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.goals.getAll(),
  });

  const goals = goalsData?.goals || [];

  // Fetch estimates for all goals
  const { data: estimates = [] } = useQuery({
    queryKey: ["goalEstimates", goals.map((g) => g.id)],
    queryFn: async () => {
      if (goals.length === 0) return [];
      return Promise.all(goals.map((goal) => api.goals.getEstimate(goal.id)));
    },
    enabled: goals.length > 0,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.goals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goalEstimates"] });
      showSuccess("Goal deleted successfully");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        showError(error.message);
      } else {
        showError("Failed to delete goal");
      }
    },
  });

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalForm(true);
  };

  const handleDeleteGoal = async (goal: Goal) => {
    await deleteMutation.mutateAsync(goal.id);
  };

  const handleAddContribution = (goal: Goal) => {
    setContributionGoal(goal);
  };

  const handleFormClose = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
  };

  const handleFormSuccess = () => {
    setShowGoalForm(false);
    setEditingGoal(null);
    showSuccess(
      editingGoal ? "Goal updated successfully" : "Goal created successfully"
    );
  };

  const handleContributionClose = () => {
    setContributionGoal(null);
  };

  const handleContributionSuccess = () => {
    setContributionGoal(null);
    showSuccess("Contribution added successfully");
  };

  // Calculate summary statistics
  const activeGoals = goals.filter((g) => g.current_amount < g.target_amount);
  const completedGoals = goals.filter(
    (g) => g.current_amount >= g.target_amount
  );
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (goalsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Dashboard
            </button>
            <div className="text-gray-400">|</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/analytics")}
            >
              📊 Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Savings Goals</h1>
            <p className="text-gray-600">
              Track your progress toward your financial goals
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleCreateGoal}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Goal
          </button>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success mb-6">
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
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error mb-6">
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Summary Statistics */}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Goals */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block w-8 h-8 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                </div>
                <div className="stat-title">Active Goals</div>
                <div className="stat-value text-primary">
                  {activeGoals.length}
                </div>
              </div>
            </div>

            {/* Completed Goals */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block w-8 h-8 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div className="stat-title">Completed</div>
                <div className="stat-value text-success">
                  {completedGoals.length}
                </div>
              </div>
            </div>

            {/* Total Target */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total Target</div>
                <div className="stat-value text-2xl">
                  {formatCurrency(totalTarget)}
                </div>
                <div className="stat-desc">Across active goals</div>
              </div>
            </div>

            {/* Total Saved */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total Saved</div>
                <div className="stat-value text-2xl">
                  {formatCurrency(totalSaved)}
                </div>
                <div className="stat-desc">
                  {overallProgress.toFixed(1)}% of target
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goal List */}
        <GoalList
          goals={goals}
          estimates={estimates}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
          onAddContribution={handleAddContribution}
        />

        {/* Goal Form Modal */}
        {showGoalForm && (
          <GoalForm
            goal={editingGoal}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Contribution Form Modal */}
        {contributionGoal && (
          <ContributionForm
            goal={contributionGoal}
            onClose={handleContributionClose}
            onSuccess={handleContributionSuccess}
          />
        )}
      </div>
    </div>
  );
}
