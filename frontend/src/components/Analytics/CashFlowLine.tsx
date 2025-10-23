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
          <h2 className="card-title">{title}</h2>
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
          <h2 className="card-title">{title}</h2>
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
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">{title}</h2>
          <div className="btn-group">
            <button
              className={`btn btn-sm ${
                dateRange === "30d" ? "btn-active" : ""
              }`}
              onClick={() => setDateRange("30d")}
            >
              30 Days
            </button>
            <button
              className={`btn btn-sm ${dateRange === "3m" ? "btn-active" : ""}`}
              onClick={() => setDateRange("3m")}
            >
              3 Months
            </button>
            <button
              className={`btn btn-sm ${dateRange === "6m" ? "btn-active" : ""}`}
              onClick={() => setDateRange("6m")}
            >
              6 Months
            </button>
            <button
              className={`btn btn-sm ${dateRange === "1y" ? "btn-active" : ""}`}
              onClick={() => setDateRange("1y")}
            >
              1 Year
            </button>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
              />
              <Legend />
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
