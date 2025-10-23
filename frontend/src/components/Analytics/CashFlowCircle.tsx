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

export default function CashFlowCircle({
  title = "Yearly Cash Flow",
}: CashFlowCircleProps) {
  // Get data for the last year
  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subYears(new Date(), 1), "yyyy-MM-dd");

  const { data, isLoading, error } = useQuery({
    queryKey: ["cashFlowStats", startDate, endDate],
    queryFn: () =>
      api.transactions.getCashFlowStats({
        start_date: startDate,
        end_date: endDate,
      }),
  });

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{title}</h2>
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
          <h2 className="card-title">{title}</h2>
          <div className="alert alert-error">
            <span>Failed to load cash flow data</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const chartData = [
    { name: "Income", value: data.income, color: "#10b981" },
    { name: "Expenses", value: data.expenses, color: "#ef4444" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="stats stats-vertical lg:stats-horizontal shadow mt-4">
          <div className="stat">
            <div className="stat-title">Income</div>
            <div className="stat-value text-success">
              {formatCurrency(data.income)}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Expenses</div>
            <div className="stat-value text-error">
              {formatCurrency(data.expenses)}
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Net</div>
            <div
              className={`stat-value ${
                data.net >= 0 ? "text-success" : "text-error"
              }`}
            >
              {formatCurrency(data.net)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
