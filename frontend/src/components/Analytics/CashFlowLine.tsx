import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api, type Transaction } from "../../lib/api";
import {
  format,
  subMonths,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";

type DateRange = "30d" | "3m" | "6m" | "1y";

interface CashFlowLineProps {
  title?: string;
}

export default function CashFlowLine({
  title = "Cash Flow Over Time",
}: CashFlowLineProps) {
  const [dateRange, setDateRange] = useState<DateRange>("3m");

  // Calculate date range
  const getDateRange = (range: DateRange) => {
    const end = new Date();
    let start: Date;

    switch (range) {
      case "30d":
        start = subDays(end, 30);
        break;
      case "3m":
        start = subMonths(end, 3);
        break;
      case "6m":
        start = subMonths(end, 6);
        break;
      case "1y":
        start = subMonths(end, 12);
        break;
    }

    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    };
  };

  const { start, end } = getDateRange(dateRange);

  const {
    data: transactionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions", "all", start, end],
    queryFn: () =>
      api.transactions.getAll({ start_date: start, end_date: end }),
  });

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-lg">{title}</h2>
          <div className="flex justify-center items-center h-96">
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
            <span>Failed to load transactions</span>
          </div>
        </div>
      </div>
    );
  }

  // Process transactions into daily/monthly aggregates
  const processTransactions = (transactions: Transaction[]) => {
    const groupBy = dateRange === "30d" ? "day" : "month";
    const intervals =
      groupBy === "day"
        ? eachDayOfInterval({ start: new Date(start), end: new Date(end) })
        : eachMonthOfInterval({ start: new Date(start), end: new Date(end) });

    return intervals.map((interval) => {
      const intervalStart =
        groupBy === "day" ? interval : startOfMonth(interval);
      const intervalEnd = groupBy === "day" ? interval : endOfMonth(interval);

      const intervalTransactions = transactions.filter((t) => {
        const txDate = new Date(t.date);
        return txDate >= intervalStart && txDate <= intervalEnd;
      });

      const income = intervalTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const expenses = intervalTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(interval, groupBy === "day" ? "MMM dd" : "MMM yyyy"),
        income,
        expenses,
        net: income - expenses,
      };
    });
  };

  const chartData = transactionsData
    ? processTransactions(transactionsData.transactions)
    : [];

  // Calculate summary statistics
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
  const totalNet = totalIncome - totalExpenses;
  const avgIncome = chartData.length > 0 ? totalIncome / chartData.length : 0;
  const avgExpenses = chartData.length > 0 ? totalExpenses / chartData.length : 0;

  // Calculate trends (compare first half to second half)
  const midpoint = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, midpoint);
  const secondHalf = chartData.slice(midpoint);

  const firstHalfAvgExpenses = firstHalf.length > 0
    ? firstHalf.reduce((sum, d) => sum + d.expenses, 0) / firstHalf.length
    : 0;
  const secondHalfAvgExpenses = secondHalf.length > 0
    ? secondHalf.reduce((sum, d) => sum + d.expenses, 0) / secondHalf.length
    : 0;

  const expensesTrend = secondHalfAvgExpenses - firstHalfAvgExpenses;
  const expensesTrendPercent = firstHalfAvgExpenses > 0
    ? (expensesTrend / firstHalfAvgExpenses) * 100
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
          <h2 className="card-title text-lg">{title}</h2>
          <div className="join">
            <button
              className={`join-item btn btn-xs ${
                dateRange === "30d" ? "btn-active" : ""
              }`}
              onClick={() => setDateRange("30d")}
            >
              30D
            </button>
            <button
              className={`join-item btn btn-xs ${dateRange === "3m" ? "btn-active" : ""}`}
              onClick={() => setDateRange("3m")}
            >
              3M
            </button>
            <button
              className={`join-item btn btn-xs ${dateRange === "6m" ? "btn-active" : ""}`}
              onClick={() => setDateRange("6m")}
            >
              6M
            </button>
            <button
              className={`join-item btn btn-xs ${dateRange === "1y" ? "btn-active" : ""}`}
              onClick={() => setDateRange("1y")}
            >
              1Y
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="stat p-2 bg-base-200 rounded">
            <div className="stat-title text-xs">Avg Income</div>
            <div className="stat-value text-success text-sm">
              {formatCurrency(avgIncome)}
            </div>
          </div>
          <div className="stat p-2 bg-base-200 rounded">
            <div className="stat-title text-xs">Avg Expenses</div>
            <div className="stat-value text-error text-sm">
              {formatCurrency(avgExpenses)}
            </div>
            {expensesTrend !== 0 && (
              <div className={`stat-desc text-xs ${expensesTrend > 0 ? "text-error" : "text-success"}`}>
                {expensesTrend > 0 ? "↑" : "↓"} {Math.abs(expensesTrendPercent).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="stat p-2 bg-base-200 rounded">
            <div className="stat-title text-xs">Total Net</div>
            <div
              className={`stat-value text-sm ${
                totalNet >= 0 ? "text-success" : "text-error"
              }`}
            >
              {totalNet >= 0 ? "+" : ""}
              {formatCurrency(totalNet)}
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={formatCurrency} 
                tick={{ fontSize: 10 }}
                width={60}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  fontSize: "12px"
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "11px" }}
                iconSize={10}
              />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                name="Income"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#6366f1"
                strokeWidth={2}
                name="Net"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
