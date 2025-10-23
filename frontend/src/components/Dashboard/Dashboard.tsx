import { useNavigate } from "react-router-dom";
import { useAccounts } from "../../hooks/usePlaid";
import { AccountList } from "./AccountList";

export function Dashboard() {
  const navigate = useNavigate();
  const { data: accountsData, isLoading, error } = useAccounts();

  const accounts = accountsData?.accounts || [];
  const hasAccounts = accounts.length > 0;

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
          <h1 className="text-4xl font-bold mb-2">Welcome</h1>
          <p className="text-lg opacity-90">
            Here's an overview of your financial accounts
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
                className="btn btn-sm btn-primary"
                onClick={() => navigate("/analytics")}
              >
                📊 Analytics
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => navigate("/goals")}
              >
                🎯 Goals
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate("/settings")}
              >
                ⚙️ Settings
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => navigate("/connect")}
              >
                + Connect
              </button>
            </div>
          </div>
        </div>

        {/* Accounts Section */}
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

        {/* Analytics Link */}
        <div className="mt-8 text-center">
          <button
            className="btn btn-lg btn-primary"
            onClick={() => navigate("/analytics")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            View Financial Analytics
          </button>
          <p className="text-sm text-base-content/60 mt-2">
            Track spending, budgets, goals, and cash flow
          </p>
        </div>
      </div>
    </div>
  );
}
