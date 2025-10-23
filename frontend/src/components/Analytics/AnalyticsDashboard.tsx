import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import CashFlowCircle from "./CashFlowCircle";
import CashFlowLine from "./CashFlowLine";
import BudgetWidget from "./BudgetWidget";
import GoalWidget from "./GoalWidget";
import UntaggedTransactions from "./UntaggedTransactions";
import TransactionList from "./TransactionList";

export default function AnalyticsDashboard() {
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<string>("");

  // Get all accounts to find plaid items
  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.accounts.getAll(),
  });

  // Sync transactions mutation
  const syncMutation = useMutation({
    mutationFn: (plaid_item_id: string) =>
      api.plaid.syncTransactions({ plaid_item_id }),
    onSuccess: (data) => {
      setSyncStatus(
        `✓ Synced: ${data.transactions_added} added, ${data.transactions_modified} updated, ${data.transactions_removed} removed`
      );
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashFlowStats"] });
      setTimeout(() => setSyncStatus(""), 5000);
    },
    onError: () => {
      setSyncStatus("✗ Sync failed. Please try again.");
      setTimeout(() => setSyncStatus(""), 5000);
    },
  });

  const handleManualSync = () => {
    const accounts = accountsData?.accounts || [];
    const plaidItemIds = [...new Set(accounts.map((a) => a.plaid_item_id))];

    if (plaidItemIds.length > 0) {
      setSyncStatus("Syncing...");
      plaidItemIds.forEach((itemId) => {
        syncMutation.mutate(itemId);
      });
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Financial Analytics</h1>
              <p className="text-gray-600">
                Track your spending, budgets, and goals
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleManualSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Syncing...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  Refresh Transactions
                </>
              )}
            </button>
          </div>
          {syncStatus && (
            <div
              className={`alert ${
                syncStatus.startsWith("✓") ? "alert-success" : "alert-error"
              } mt-4`}
            >
              <span>{syncStatus}</span>
            </div>
          )}
        </div>

        {/* Transaction Management: Untagged and Full List Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Untagged Transactions - Left Column */}
          <div className="flex flex-col">
            <UntaggedTransactions />
          </div>

          {/* Full Transaction List - Right Column */}
          <div className="flex flex-col">
            <TransactionList />
          </div>
        </div>

        {/* Cash Flow Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <CashFlowCircle />
          <CashFlowLine />
        </div>

        {/* Budgets and Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <BudgetWidget />
          <GoalWidget />
        </div>
      </div>
    </div>
  );
}
