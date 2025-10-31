import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { format, subYears } from "date-fns";

interface CashFlowCircleProps {
  title?: string;
}

type ViewMode = "summary" | "categories";

export default function CashFlowCircle({
  title = "Yearly Cash Flow",
}: CashFlowCircleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("summary");

  // Get data for the last year
  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subYears(new Date(), 1), "yyyy-MM-dd");

  const {
    data: cashFlowData,
    isLoading: cashFlowLoading,
    error: cashFlowError,
  } = useQuery({
    queryKey: ["cashFlowStats", startDate, endDate],
    queryFn: () =>
      api.transactions.getCashFlowStats({
        start_date: startDate,
        end_date: endDate,
      }),
  });

  // Always fetch transactions and categories (not conditional)
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", "all", startDate, endDate, "is_tagged", true],
    queryFn: () =>
      api.transactions.getAll({
        start_date: startDate,
        end_date: endDate,
        is_tagged: true,
      }),
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.getAll(),
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const isLoading = cashFlowLoading || transactionsLoading || categoriesLoading;
  const error = cashFlowError;

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-lg">{title}</h2>
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-lg">{title}</h2>
          <div className="alert alert-error">
            <span>Failed to load cash flow data</span>
          </div>
        </div>
      </div>
    );
  }

  if (!cashFlowData) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Build chart data based on view mode
  let chartData: { name: string; value: number; color: string }[] = [];

  if (viewMode === "summary") {
    chartData = [
      { name: "Income", value: cashFlowData.income, color: "#10b981" },
      { name: "Expenses", value: cashFlowData.expenses, color: "#ef4444" },
    ];
  } else {
    // Categories view - show expense breakdown by category
    if (transactionsData && categoriesData) {
      const expensesByCategory = new Map<
        string,
        { name: string; amount: number; color: string; icon: string }
      >();

      // Process expense transactions (amount > 0)
      const transactions = transactionsData.transactions || [];
      const categories = categoriesData.categories || [];

      const expenseTransactions = transactions.filter((t) => t.amount > 0);

      expenseTransactions.forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        if (category && category.id !== "cat-income") {
          const existing = expensesByCategory.get(category.id);
          if (existing) {
            existing.amount += t.amount;
          } else {
            expensesByCategory.set(category.id, {
              name: `${category.icon} ${category.name}`,
              amount: t.amount,
              color: category.color,
              icon: category.icon,
            });
          }
        }
      });

      // Convert to chart data and sort by amount
      chartData = Array.from(expensesByCategory.values())
        .map((cat) => ({
          name: cat.name,
          value: cat.amount,
          color: cat.color,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Show top 10 categories

      console.log(`Category breakdown: ${chartData.length} categories found`);
    }
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  // Handle case where there's no data in categories view
  if (viewMode === "categories" && chartData.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
            <h2 className="card-title text-lg">{title}</h2>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-sm"
                onClick={() => setViewMode("summary")}
              >
                Summary
              </button>
              <button
                className="btn btn-sm btn-active"
                onClick={() => setViewMode("categories")}
              >
                Categories
              </button>
            </div>
          </div>
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <div className="font-bold">No expense data</div>
              <div className="text-xs">
                No expense transactions found in the last year, or all
                transactions are categorized as Income.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
          <h2 className="card-title text-lg">{title}</h2>
          <div className="btn-group btn-group-sm">
            <button
              className={`btn btn-sm ${
                viewMode === "summary" ? "btn-active" : ""
              }`}
              onClick={() => setViewMode("summary")}
            >
              Summary
            </button>
            <button
              className={`btn btn-sm ${
                viewMode === "categories" ? "btn-active" : ""
              }`}
              onClick={() => setViewMode("categories")}
            >
              Categories
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => {
                  const percent = ((value / totalValue) * 100).toFixed(0);
                  // Remove icon from label since it's already in the name
                  const nameWithoutIcon = name.replace(/^[^\s]+\s/, "");
                  return `${nameWithoutIcon}: ${percent}%`;
                }}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                style={{ fontSize: "10px" }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {viewMode === "summary" ? (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="stat p-2 bg-base-200 rounded">
              <div className="stat-title text-xs">Income</div>
              <div className="stat-value text-success text-sm">
                {formatCurrency(cashFlowData.income)}
              </div>
            </div>
            <div className="stat p-2 bg-base-200 rounded">
              <div className="stat-title text-xs">Expenses</div>
              <div className="stat-value text-error text-sm">
                {formatCurrency(cashFlowData.expenses)}
              </div>
            </div>
            <div className="stat p-2 bg-base-200 rounded">
              <div className="stat-title text-xs">Net</div>
              <div
                className={`stat-value text-sm ${
                  cashFlowData.net >= 0 ? "text-success" : "text-error"
                }`}
              >
                {cashFlowData.net >= 0 ? "+" : ""}
                {formatCurrency(cashFlowData.net)}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <div className="text-xs font-semibold mb-2">
              Total Expenses: {formatCurrency(totalValue)}
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {chartData.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs py-1 border-b border-base-300"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold">
                      {formatCurrency(cat.value)}
                    </span>
                    <span className="opacity-60">
                      ({((cat.value / totalValue) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
