import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { Settings, ExternalLink } from "lucide-react";

interface BudgetWidgetProps {
  displayContext?: "analytics" | "dashboard";
}

export default function BudgetWidget({
  displayContext = "analytics",
}: BudgetWidgetProps) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [visibleBudgets, setVisibleBudgets] = useState<string[]>([]);

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => api.budgets.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.getAll(),
  });

  // Load visible budgets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("widgetBudgets");
    if (stored) {
      setVisibleBudgets(JSON.parse(stored));
    } else if (budgetsData?.budgets) {
      // Default to all budgets visible
      setVisibleBudgets(budgetsData.budgets.map((b) => b.id));
    }
  }, [budgetsData]);

  // Save visible budgets to localStorage
  const toggleBudgetVisibility = (budgetId: string) => {
    const newVisible = visibleBudgets.includes(budgetId)
      ? visibleBudgets.filter((id) => id !== budgetId)
      : [...visibleBudgets, budgetId];
    setVisibleBudgets(newVisible);
    localStorage.setItem("widgetBudgets", JSON.stringify(newVisible));
  };

  // Fetch progress for each budget
  const budgetIds = budgetsData?.budgets.map((b) => b.id) || [];
  const progressQueries = useQuery({
    queryKey: ["budgetProgress", budgetIds],
    queryFn: async () => {
      if (budgetIds.length === 0) return [];
      return Promise.all(budgetIds.map((id) => api.budgets.getProgress(id)));
    },
    enabled: budgetIds.length > 0,
  });

  const widgetTitle = displayContext === "dashboard" ? "Budgets" : "Budgets";

  if (budgetsLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{widgetTitle}</h2>
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  const budgets = budgetsData?.budgets || [];
  const categories = categoriesData?.categories || [];
  const progressData = progressQueries.data || [];

  const getCategoryName = (categoryId: string | null) => {
    if (categoryId === null) return "All Categories";
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : "Unknown";
  };

  // Filter budgets to only show visible ones
  const displayedBudgets = budgets.filter((b) => visibleBudgets.includes(b.id));
  const displayedProgress = progressData.filter((_, i) => {
    const budget = budgets[i];
    return budget && visibleBudgets.includes(budget.id);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (budgets.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h2 className="card-title">{widgetTitle}</h2>
          </div>
          <div className="alert alert-info">
            <span>No budgets set up yet.</span>
          </div>
          <div className="card-actions justify-end mt-4">
            <button
              onClick={() => navigate("/budgets")}
              className="btn btn-sm btn-primary"
            >
              Create Budget
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">{widgetTitle}</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-ghost btn-sm btn-circle"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {displayedBudgets.length === 0 ? (
          <div className="alert alert-warning">
            <span>
              No budgets selected. Open settings to choose budgets to display.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProgress.map((progress, index) => {
              const budget = displayedBudgets[index];
              if (!budget || !progress) return null;

              const percentage = Math.min(progress.percentage, 100);
              const isOverBudget = progress.over_budget;

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        {getCategoryName(budget.category_id)}
                      </p>
                      {budget.category_id === null && (
                        <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded mr-2">
                          All Categories
                        </span>
                      )}
                      <p className="text-sm text-gray-500 capitalize">
                        {budget.period}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          isOverBudget ? "text-error" : "text-base-content"
                        }`}
                      >
                        {formatCurrency(progress.spent)} /{" "}
                        {formatCurrency(budget.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(progress.remaining)} remaining
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        isOverBudget ? "bg-error" : "bg-success"
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  {isOverBudget && (
                    <p className="text-sm text-error">
                      Over budget by{" "}
                      {formatCurrency(Math.abs(progress.remaining))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="card-actions justify-between mt-4">
          <button
            onClick={() => navigate("/budgets")}
            className="btn btn-sm btn-ghost gap-2"
          >
            View All Budgets
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/budgets")}
            className="btn btn-sm btn-primary"
          >
            Create Budget
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Budget Widget Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select which budgets to display in the widget
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {budgets.map((budget) => (
                <label
                  key={budget.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleBudgets.includes(budget.id)}
                    onChange={() => toggleBudgetVisibility(budget.id)}
                    className="checkbox checkbox-primary"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {getCategoryName(budget.category_id)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {budget.period}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="btn btn-primary btn-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
