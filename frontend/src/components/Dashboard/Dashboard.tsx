import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "../../hooks/usePlaid";
import { api } from "../../lib/api";
import { AccountList } from "./AccountList";
import CashFlowCircle from "../Analytics/CashFlowCircle";
import CashFlowLine from "../Analytics/CashFlowLine";
import UntaggedTransactions from "../Analytics/UntaggedTransactions";
import TransactionList from "../Analytics/TransactionList";
import { BudgetDashboard } from "../Budgets/BudgetDashboard";
import DataManagement from "../Settings/DataManagement";
import CategoriesDashboard from "../Categories/CategoriesDashboard";

type ViewMode =
  | "accounts"
  | "analytics"
  | "budgets"
  | "settings"
  | "categories";

export function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("accounts");
  const [syncStatus, setSyncStatus] = useState<string>("");
  const { data: accountsData, isLoading, error } = useAccounts();

  const accounts = accountsData?.accounts || [];
  const hasAccounts = accounts.length > 0;

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
    const plaidItemIds = [...new Set(accounts.map((a) => a.plaid_item_id))];

    if (plaidItemIds.length > 0) {
      setSyncStatus("Syncing...");
      plaidItemIds.forEach((itemId) => {
        syncMutation.mutate(itemId);
      });
    }
  };

  // Redirect to connect if no accounts
  if (!isLoading && !hasAccounts && !error) {
    navigate("/connect");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="card bg-base-200 shadow-xl max-w-md w-full">
          <div className="card-body">
            <h2 className="card-title text-error">Error Loading Accounts</h2>
            <p>Unable to load your accounts. Please try again.</p>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.current_balance || 0),
    0
  );

  // Group accounts by institution
  const accountsByInstitution = accounts.reduce((acc, account) => {
    const institution = account.institution_name;
    if (!acc[institution]) {
      acc[institution] = [];
    }
    acc[institution].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-primary text-primary-content">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">
            {view === "accounts"
              ? "Welcome"
              : view === "analytics"
              ? "Financial Analytics"
              : view === "budgets"
              ? "Budget Management"
              : view === "categories"
              ? "Category Management"
              : "Settings"}
          </h1>
          <p className="text-lg opacity-90">
            {view === "accounts"
              ? "Here's an overview of your financial accounts"
              : view === "analytics"
              ? "Track spending, budgets, goals, and cash flow"
              : view === "budgets"
              ? "Create and manage your spending budgets"
              : view === "categories"
              ? "Create and manage your categories"
              : "Export and import your financial data"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Total Balance</div>
            <div className="stat-value text-primary">
              $
              {totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="stat-desc">Across all accounts</div>
          </div>

          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Connected Accounts</div>
            <div className="stat-value">{accounts.length}</div>
            <div className="stat-desc">
              {Object.keys(accountsByInstitution).length} institution(s)
            </div>
          </div>

          <div className="stat bg-base-200 rounded-lg shadow">
            <div className="stat-title">Quick Actions</div>
            <div className="stat-actions flex flex-wrap gap-2">
              <button
                className={`btn btn-sm ${
                  view === "accounts" ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => setView("accounts")}
              >
                📁 Accounts
              </button>
              <button
                className={`btn btn-sm ${
                  view === "analytics" ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => setView("analytics")}
              >
                📊 Analytics
              </button>
              <button
                className={`btn btn-sm ${
                  view === "budgets" ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => setView("budgets")}
              >
                💰 Budgets
              </button>
              <button
                className={`btn btn-sm ${
                  view === "settings" ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => setView("settings")}
              >
                ⚙️ Settings
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate("/connect")}
              >
                + Connect
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setView("categories")}
              >
                📚 Categories
              </button>
            </div>
          </div>
        </div>

        {/* View Content */}
        {view === "accounts" ? (
          /* Accounts View */
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-2xl">Your Accounts</h2>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => window.location.reload()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>

              <AccountList
                accounts={accounts}
                accountsByInstitution={accountsByInstitution}
              />
            </div>
          </div>
        ) : view === "analytics" ? (
          /* Analytics View */
          <div className="space-y-8">
            {/* Sync Status Alert */}
            {syncStatus && (
              <div
                className={`alert ${
                  syncStatus.startsWith("✓") ? "alert-success" : "alert-error"
                }`}
              >
                <span>{syncStatus}</span>
              </div>
            )}

            {/* Sync Button */}
            <div className="flex justify-end">
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

            {/* Transaction Management: Untagged and Full List Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UntaggedTransactions />
              <TransactionList />
            </div>

            {/* Cash Flow Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CashFlowCircle />
              <CashFlowLine />
            </div>
          </div>
        ) : view === "budgets" ? (
          /* Budget View */
          <BudgetDashboard />
        ) : view === "categories" ? (
          /* Categories View */
          <CategoriesDashboard />
        ) : (
          /* Settings View */
          <DataManagement />
        )}
      </div>
    </div>
  );
}
