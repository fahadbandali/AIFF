import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const handleDeleteBudget = async (budget: Budget) => {
    try {
      await api.budgets.delete(budget.id);
      await loadData();
      setDeletingBudget(null);
    } catch (error) {
      console.error("Failed to delete budget:", error);
      alert("Failed to delete budget. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBudget(undefined);
    loadData();
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Budget Management
          </h1>
          <p className="text-gray-600">
            Create and manage your spending budgets across categories and time
            periods
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleCreateBudget}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Create Budget
          </button>
        </div>

        {/* Budget List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "No budgets found" : "No budgets yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search term"
                : "Create your first budget to start tracking spending"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateBudget}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Create Budget
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.map((budget) => {
              const progress = budgetProgress.get(budget.id);
              const percentage = progress?.percentage || 0;
              const spent = progress?.spent || 0;
              const remaining = progress?.remaining || budget.amount;

              return (
                <div
                  key={budget.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {getCategoryName(budget.category_id)}
                      </h3>
                      {budget.category_id === null && (
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          All Categories
                        </span>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {budget.period.charAt(0).toUpperCase() +
                          budget.period.slice(1)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Edit budget"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingBudget(budget)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Date Range */}
                  <p className="text-xs text-gray-500 mb-4">
                    {formatDateRange(budget.start_date, budget.end_date)}
                  </p>

                  {/* Budget Amount */}
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(spent)}
                      </span>
                      <span className="text-sm text-gray-600">
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
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
                      <span className="text-gray-600">
                        {formatCurrency(remaining)} remaining
                      </span>
                    </div>
                  </div>

                  {/* Over Budget Warning */}
                  {progress?.over_budget && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Over budget</span>
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
