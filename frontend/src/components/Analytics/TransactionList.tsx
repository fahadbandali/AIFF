import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { format, parseISO } from "date-fns";

export default function TransactionList() {
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [limit] = useState(100);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", "all", filterCategory, limit],
    queryFn: () =>
      api.transactions.getAll({
        category_id: filterCategory || undefined,
        is_tagged: true,
        limit,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.getAll(),
  });

  if (transactionsLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Recent Transactions</h2>
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  const transactions = transactionsData?.transactions || [];
  const categories = categoriesData?.categories || [];

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(absAmount);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM dd, yyyy");
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="card-title">Recent Transactions</h2>
            <button
              className="btn btn-ghost btn-circle btn-sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-5 h-5 transition-transform ${
                  isCollapsed ? "rotate-180" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>
          {!isCollapsed && (
            <select
              className="select select-bordered select-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {!isCollapsed && (
          <>
            {transactions.length === 0 ? (
              <div className="alert alert-info">
                <span>No transactions found</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="table table-zebra table-sm">
                  <thead className="sticky top-0 bg-base-100 z-10">
                    <tr>
                      <th className="text-xs">Date</th>
                      <th className="text-xs">Description</th>
                      <th className="text-xs">Category</th>
                      <th className="text-xs">Amount</th>
                      <th className="text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const category = getCategoryById(transaction.category_id);
                      return (
                        <tr key={transaction.id}>
                          <td className="text-xs whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </td>
                          <td>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {transaction.merchant_name || transaction.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.payment_channel}
                              </p>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span>{category?.icon}</span>
                              <span className="text-xs">{category?.name}</span>
                              {!transaction.is_tagged && (
                                <span className="badge badge-warning badge-xs">
                                  Unverified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap">
                            <span
                              className={`font-bold text-sm ${
                                transaction.amount < 0
                                  ? "text-success"
                                  : "text-error"
                              }`}
                            >
                              {transaction.amount < 0 ? "+" : "-"}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td>
                            {transaction.is_pending ? (
                              <span className="badge badge-warning badge-xs">
                                Pending
                              </span>
                            ) : (
                              <span className="badge badge-success badge-xs">
                                Posted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
