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
      <div className="modal-box max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {isEdit ? "Edit Budget" : "Create Budget"}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
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
              <span>{error}</span>
            </div>
          )}

          {/* Category Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                Category {categoryId === null && "(All Categories)"}
              </span>
            </label>
            <select
              value={categoryId || "all"}
              onChange={(e) =>
                setCategoryId(e.target.value === "all" ? null : e.target.value)
              }
              disabled={isEdit}
              className="select select-bordered w-full"
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
              <label className="label">
                <span className="label-text-alt opacity-70">
                  All-categories budgets require a specific date range
                </span>
              </label>
            )}
            {isEdit && (
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Category cannot be changed when editing
                </span>
              </label>
            )}
          </div>

          {/* Amount */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Budget Amount</span>
            </label>
            <label className="input-group">
              <span>$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered w-full"
                placeholder="0.00"
                step="0.01"
                min="0"
                max="10000000"
                required
              />
            </label>
          </div>

          {/* Period */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Period</span>
            </label>
            <select
              value={period}
              onChange={(e) =>
                setPeriod(
                  e.target.value as "daily" | "weekly" | "monthly" | "yearly"
                )
              }
              className="select select-bordered w-full"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* End Date */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">
                End Date{" "}
                {categoryId === null && <span className="text-error">*</span>}
              </span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered w-full"
              required={categoryId === null}
            />
            {categoryId !== null && (
              <label className="label">
                <span className="label-text-alt opacity-70">
                  Leave empty for ongoing budget
                </span>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : isEdit ? (
                "Update Budget"
              ) : (
                "Create Budget"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
