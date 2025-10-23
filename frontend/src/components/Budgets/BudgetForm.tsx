import { useState, useEffect } from "react";
import { api, type Budget, type Category } from "../../lib/api";
import { X } from "lucide-react";

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BudgetForm({
  budget,
  categories,
  onClose,
  onSuccess,
}: BudgetFormProps) {
  const isEdit = !!budget;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [categoryId, setCategoryId] = useState<string | null>(
    budget?.category_id || null
  );
  const [amount, setAmount] = useState(budget?.amount?.toString() || "");
  const [period, setPeriod] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >(budget?.period || "monthly");
  const [startDate, setStartDate] = useState(
    budget?.start_date || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(budget?.end_date || "");

  // Auto-calculate dates based on period when category is selected
  useEffect(() => {
    if (categoryId && !isEdit) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();

      switch (period) {
        case "daily":
          setStartDate(today.toISOString().split("T")[0]);
          setEndDate(today.toISOString().split("T")[0]);
          break;
        case "weekly": {
          const dayOfWeek = today.getDay();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - dayOfWeek);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          setStartDate(startOfWeek.toISOString().split("T")[0]);
          setEndDate(endOfWeek.toISOString().split("T")[0]);
          break;
        }
        case "monthly": {
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          setStartDate(firstDay.toISOString().split("T")[0]);
          setEndDate(lastDay.toISOString().split("T")[0]);
          break;
        }
        case "yearly": {
          const firstDay = new Date(year, 0, 1);
          const lastDay = new Date(year, 11, 31);
          setStartDate(firstDay.toISOString().split("T")[0]);
          setEndDate(lastDay.toISOString().split("T")[0]);
          break;
        }
      }
    }
  }, [period, categoryId, isEdit]);

  // Get available categories (filter out those with existing budgets for selected period)
  const [existingBudgets, setExistingBudgets] = useState<Budget[]>([]);
  useEffect(() => {
    api.budgets.getAll().then((res) => setExistingBudgets(res.budgets));
  }, []);

  const availableCategories = categories.filter((cat) => {
    if (isEdit && cat.id === budget?.category_id) return true;
    return !existingBudgets.some(
      (b) => b.category_id === cat.id && b.period === period
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    if (amountNum > 10000000) {
      setError("Amount must be less than 10,000,000");
      return;
    }

    if (!startDate) {
      setError("Start date is required");
      return;
    }

    // Validate all-categories budget
    if (categoryId === null && !endDate) {
      setError("End date is required for all-categories budgets");
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      if (isEdit && budget) {
        await api.budgets.update(budget.id, {
          amount: amountNum,
          period,
          start_date: startDate,
          end_date: endDate || null,
        });
      } else {
        await api.budgets.create({
          category_id: categoryId,
          amount: amountNum,
          period,
          start_date: startDate,
          end_date: endDate || null,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.data?.message || err.message || "Failed to save budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Budget" : "Create Budget"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category {categoryId === null && "(All Categories)"}
            </label>
            <select
              value={categoryId || "all"}
              onChange={(e) =>
                setCategoryId(e.target.value === "all" ? null : e.target.value)
              }
              disabled={isEdit}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            {categoryId === null && (
              <p className="text-xs text-gray-500 mt-1">
                All-categories budgets require a specific date range
              </p>
            )}
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1">
                Category cannot be changed when editing
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                max="10000000"
                required
              />
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value as "daily" | "weekly" | "monthly" | "yearly"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date{" "}
              {categoryId === null && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required={categoryId === null}
            />
            {categoryId !== null && (
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for ongoing budget
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isEdit
                ? "Update Budget"
                : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
