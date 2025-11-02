import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "../../lib/api";

interface Transaction {
  id: string;
  plaid_transaction_id: string;
  account_id: string;
  date: string;
  authorized_date: string | null;
  amount: number;
  name: string;
  merchant_name: string | null;
  category_id: string;
  is_tagged: boolean;
  is_pending: boolean;
  payment_channel: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface TransactionsByCategoryData {
  category: string;
  spending: number;
  income: number;
  color?: string;
}

interface MonthlySpendingData {
  month: string;
  [key: string]: number | string; // Dynamic keys for each category
}

interface TransactionsByCategoryViewProps {
  categories: Category[];
}

const TransactionsByCategoryView: React.FC<TransactionsByCategoryViewProps> = ({
  categories,
}) => {
  const [data, setData] = useState<TransactionsByCategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySpendingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
    new Set()
  );
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"category" | "monthly">("category");

  useEffect(() => {
    const fetchSpendingData = async () => {
      try {
        setLoading(true);
        const spendingPromises = categories.map(async (category) => {
          const response = await api.categories.getTransactions(category.id);
          const transactions: Transaction[] = response.transactions;

          // Calculate total spending (positive amounts = debits) and income (negative amounts = credits)
          const totalSpending = transactions.reduce((sum, txn) => {
            return sum + (txn.amount > 0 ? txn.amount : 0);
          }, 0);

          const totalIncome = transactions.reduce((sum, txn) => {
            return sum + (txn.amount < 0 ? Math.abs(txn.amount) : 0);
          }, 0);

          return {
            category: category.name,
            spending: totalSpending,
            income: totalIncome,
            color: category.color,
            transactions, // Include transactions for monthly breakdown
          };
        });

        const spendingData = await Promise.all(spendingPromises);

        // Filter out "Income" category from the chart data
        const filteredData = spendingData.filter(
          (item) => item.category.toLowerCase() !== "income"
        );

        // Sort by spending amount in descending order
        filteredData.sort((a, b) => b.spending - a.spending);

        // Calculate monthly spending breakdown
        const monthlyMap = new Map<string, { [key: string]: number }>();

        filteredData.forEach((categoryData) => {
          categoryData.transactions.forEach((txn: Transaction) => {
            if (txn.amount > 0) {
              // Only spending, not income
              const date = new Date(txn.date);
              const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
              ).padStart(2, "0")}`;

              if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {});
              }

              const monthData = monthlyMap.get(monthKey)!;
              monthData[categoryData.category] =
                (monthData[categoryData.category] || 0) + txn.amount;
            }
          });
        });

        // Convert to array and sort by date
        const monthlyArray = Array.from(monthlyMap.entries())
          .map(([month, categories]) => ({
            month,
            ...categories,
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setMonthlyData(monthlyArray);
        setData(filteredData.map(({ transactions, ...rest }) => rest));
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load spending data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSpendingData();
  }, [categories]);

  const toggleCategory = (category: string) => {
    setHiddenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const visibleData = data.filter(
    (item) => !hiddenCategories.has(item.category)
  );
  const totalSpending = visibleData.reduce(
    (sum, item) => sum + item.spending,
    0
  );
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          {viewMode === "category"
            ? "Year to Date Spending by Category"
            : "Monthly Spending Breakdown"}
        </h2>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="join">
            <button
              onClick={() => setViewMode("category")}
              className={`btn btn-sm join-item ${
                viewMode === "category" ? "btn-active" : "btn-outline"
              }`}
            >
              By Category
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`btn btn-sm join-item ${
                viewMode === "monthly" ? "btn-active" : "btn-outline"
              }`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-sm btn-outline gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Filter Popout Card */}
      {showFilters && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-16 z-50 card w-80 bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="card-title">Filter Categories</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {data.map((item) => (
                  <label
                    key={item.category}
                    className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCategories.has(item.category)}
                      onChange={() => toggleCategory(item.category)}
                      className="checkbox checkbox-primary"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {item.color && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <span>{item.category}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === "category" && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={visibleData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--b1))",
                borderColor: "hsl(var(--bc) / 0.2)",
              }}
            />
            <Legend />
            <Bar dataKey="spending" name="Spending">
              {visibleData.map((item, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={item.color || "hsl(var(--p))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {viewMode === "monthly" && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={monthlyData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(value) => {
                const [year, month] = value.split("-");
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                });
              }}
            />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--b1))",
                borderColor: "hsl(var(--bc) / 0.2)",
              }}
            />
            <Legend />
            {data
              .filter((item) => !hiddenCategories.has(item.category))
              .map((item) => (
                <Bar
                  key={item.category}
                  dataKey={item.category}
                  stackId="spending"
                  fill={item.color || "hsl(var(--p))"}
                  name={item.category}
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TransactionsByCategoryView;
