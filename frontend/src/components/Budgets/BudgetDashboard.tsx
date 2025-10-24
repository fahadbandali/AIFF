import { useState, useEffect } from "react";
import {
  api,
  type Budget,
  type BudgetProgress,
  type Category,
} from "../../lib/api";
import { BudgetForm } from "./BudgetForm";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export function BudgetDashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<
    Map<string, BudgetProgress>
  >(new Map());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.budgets.getAll(),
        api.categories.getAll(),
      ]);
      setBudgets(budgetsRes.budgets);
      setCategories(categoriesRes.categories);

      // Load progress for each budget
      const progressMap = new Map<string, BudgetProgress>();
      await Promise.all(
        budgetsRes.budgets.map(async (budget) => {
          try {
            const progress = await api.budgets.getProgress(budget.id);
            progressMap.set(budget.id, progress);
          } catch (err) {
            console.error(
              `Failed to load progress for budget ${budget.id}:`,
              err
            );
          }
        })
      );
      setBudgetProgress(progressMap);
    } catch (error) {
      console.error("Failed to load budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCategoryName = (categoryId: string | null) => {
    if (categoryId === null) return "All Categories";
    const category = categories.find((c) => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : "Unknown";
  };

  const handleCreateBudget = () => {
    setEditingBudget(undefined);
    setShowForm(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 5000);
  };

  const handleDeleteBudget = async (budget: Budget) => {
    try {
      await api.budgets.delete(budget.id);
      await loadData();
      setDeletingBudget(null);
      showSuccess("Budget deleted successfully");
    } catch (error) {
      console.error("Failed to delete budget:", error);
      showError("Failed to delete budget. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBudget(undefined);
    loadData();
    showSuccess(
      editingBudget
        ? "Budget updated successfully"
        : "Budget created successfully"
    );
  };

  const filteredBudgets = budgets.filter((budget) => {
    if (!searchTerm) return true;
    const categoryName = getCategoryName(budget.category_id).toLowerCase();
    return categoryName.includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDateRange = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!endDate) return `${start} - Ongoing`;
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-700";
    if (percentage >= 80) return "text-yellow-700";
    return "text-green-700";
  };

  const activeBudgets = budgets.filter((b) => {
    const progress = budgetProgress.get(b.id);
    return progress && !progress.over_budget;
  });
  const overBudgets = budgets.filter((b) => {
    const progress = budgetProgress.get(b.id);
    return progress && progress.over_budget;
  });
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = Array.from(budgetProgress.values()).reduce(
    (sum, p) => sum + p.spent,
    0
  );

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <p className="text-gray-600">
              Track your spending limits across categories
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateBudget}
          >
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
            Create New Budget
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
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Budgets */}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="stat-title">On Track</div>
                <div className="stat-value text-primary">
                  {activeBudgets.length}
                </div>
              </div>
            </div>

            {/* Over Budget */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-error">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="stat-title">Over Budget</div>
                <div className="stat-value text-error">
                  {overBudgets.length}
                </div>
              </div>
            </div>

            {/* Total Budget */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total Budget</div>
                <div className="stat-value text-2xl">
                  {formatCurrency(totalBudgetAmount)}
                </div>
                <div className="stat-desc">Across all budgets</div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Total Spent</div>
                <div className="stat-value text-2xl">
                  {formatCurrency(totalSpent)}
                </div>
                <div className="stat-desc">
                  {totalBudgetAmount > 0
                    ? `${((totalSpent / totalBudgetAmount) * 100).toFixed(1)}%`
                    : "0%"}{" "}
                  of budget
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {budgets.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center py-12">
              <TrendingUp className="w-16 h-16 text-base-content opacity-40 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                {searchTerm ? "No budgets found" : "No budgets yet"}
              </h3>
              <p className="text-base-content opacity-70 mb-6">
                {searchTerm
                  ? "Try adjusting your search term"
                  : "Create your first budget to start tracking spending"}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateBudget}
                  className="btn btn-primary btn-lg mx-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Budget
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.map((budget) => {
              const progress = budgetProgress.get(budget.id);
              const percentage = progress?.percentage || 0;
              const spent = progress?.spent || 0;
              const remaining = progress?.remaining || budget.amount;

              // Determine shadow color based on budget status (3px colored shadow)
              let shadowClass = "shadow-[0_0_0_3px_rgba(34,197,94,0.5)]"; // On track (green)
              if (percentage >= 100) {
                shadowClass = "shadow-[0_0_0_3px_rgba(239,68,68,0.5)]"; // Over budget (red)
              } else if (percentage >= 90) {
                shadowClass = "shadow-[0_0_0_3px_rgba(234,179,8,0.5)]"; // Close to limit (yellow)
              }

              return (
                <div
                  key={budget.id}
                  className={`card bg-base-200 p-6 ${shadowClass} hover:shadow-xl transition-all`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {getCategoryName(budget.category_id)}
                      </h3>
                      {budget.category_id === null && (
                        <span className="badge badge-primary badge-sm">
                          All Categories
                        </span>
                      )}
                      <p className="text-sm opacity-70 mt-1">
                        {budget.period.charAt(0).toUpperCase() +
                          budget.period.slice(1)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="btn btn-ghost btn-sm btn-circle"
                        title="Edit budget"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingBudget(budget)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Date Range */}
                  <p className="text-xs opacity-60 mb-4">
                    {formatDateRange(budget.start_date, budget.end_date)}
                  </p>

                  {/* Budget Amount */}
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-sm opacity-70">
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-base-300 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(
                          percentage
                        )}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span
                        className={`font-medium ${getProgressTextColor(
                          percentage
                        )}`}
                      >
                        {percentage.toFixed(0)}% used
                      </span>
                      <span className="opacity-70">
                        {formatCurrency(remaining)} remaining
                      </span>
                    </div>
                  </div>

                  {/* Over Budget Warning */}
                  {progress?.over_budget && (
                    <div className="alert alert-error py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">Over budget</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Budget Form Modal */}
        {showForm && (
          <BudgetForm
            budget={editingBudget}
            categories={categories}
            onClose={() => {
              setShowForm(false);
              setEditingBudget(undefined);
            }}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingBudget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Budget
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the{" "}
                <span className="font-semibold">
                  {getCategoryName(deletingBudget.category_id)}
                </span>{" "}
                <span className="font-semibold">{deletingBudget.period}</span>{" "}
                budget? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingBudget(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBudget(deletingBudget)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete Budget
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
