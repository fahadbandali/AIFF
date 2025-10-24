import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { format, parseISO } from "date-fns";

export default function UntaggedTransactions() {
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", "untagged"],
    queryFn: () => api.transactions.getAll({ is_tagged: false, limit: 50 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.getAll(),
  });

  const tagMutation = useMutation({
    mutationFn: ({ id, category_id }: { id: string; category_id: string }) =>
      api.transactions.tag(id, category_id),
    onSuccess: async () => {
      // Only invalidate transaction and cash flow related queries
      await queryClient.invalidateQueries({
        queryKey: ["transactions"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["cashFlowStats"],
        exact: false,
      });

      setSelectedTransaction(null);
      setSelectedCategory("");
    },
  });

  if (transactionsLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Untagged Transactions</h2>
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  const transactions = transactionsData?.transactions || [];
  const categories = categoriesData?.categories || [];

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

  const handleTag = (transactionId: string) => {
    if (selectedCategory) {
      tagMutation.mutate({ id: transactionId, category_id: selectedCategory });
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Untagged Transactions</h2>
          <div className="alert alert-success">
            <span>All transactions are tagged! 🎉</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="card-title">Untagged Transactions</h2>
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
          <>
            <p className="text-sm text-gray-500 mb-4">
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} need
              {transactions.length === 1 ? "s" : ""} review
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">
                        {transaction.merchant_name || transaction.name}
                      </p>
                      {transaction.is_pending && (
                        <span className="badge badge-warning badge-xs">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date)} •{" "}
                        {transaction.payment_channel}
                      </p>
                      <p
                        className={`font-bold text-sm sm:hidden ${
                          transaction.amount < 0 ? "text-success" : "text-error"
                        }`}
                      >
                        {transaction.amount < 0 ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <p
                      className={`font-bold hidden sm:block ${
                        transaction.amount < 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {transaction.amount < 0 ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>

                    {selectedTransaction === transaction.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          className="select select-sm select-bordered min-w-[140px]"
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                          <option value="">Select category...</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleTag(transaction.id)}
                          disabled={!selectedCategory || tagMutation.isPending}
                        >
                          {tagMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => {
                            setSelectedTransaction(null);
                            setSelectedCategory("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setSelectedTransaction(transaction.id);
                          setSelectedCategory(transaction.category_id);
                        }}
                      >
                        Tag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
