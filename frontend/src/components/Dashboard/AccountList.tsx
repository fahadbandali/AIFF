import { useState } from "react";
import type { Account } from "../../lib/api";
import { useDeleteAccount } from "../../hooks/usePlaid";

interface AccountListProps {
  accounts: Account[];
  accountsByInstitution: Record<string, Account[]>;
}

export function AccountList({
  accounts,
  accountsByInstitution,
}: AccountListProps) {
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const deleteAccountMutation = useDeleteAccount();

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      await deleteAccountMutation.mutateAsync({
        id: accountToDelete.id,
        cascade: true, // Always cascade delete
      });
      setShowConfirmModal(false);
      setAccountToDelete(null);
    } catch (error) {
      console.error("Failed to delete account:", error);
      // Error will be shown via mutation state
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setAccountToDelete(null);
  };
  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏦</div>
        <h3 className="text-xl font-semibold mb-2">No Accounts Connected</h3>
        <p className="text-base-content/60 mb-4">
          Connect your first bank account to get started
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "depository":
        return "🏦";
      case "credit":
        return "💳";
      case "loan":
        return "🏠";
      case "investment":
        return "📈";
      default:
        return "💰";
    }
  };

  const getAccountTypeLabel = (type: string, subtype: string) => {
    if (subtype && subtype !== "unknown") {
      return (
        subtype.charAt(0).toUpperCase() + subtype.slice(1).replace("_", " ")
      );
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {Object.entries(accountsByInstitution).map(
        ([institution, institutionAccounts]) => (
          <div key={institution}>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="text-2xl mr-2">🏛️</span>
              {institution}
              <span className="badge badge-ghost ml-2">
                {institutionAccounts.length}
              </span>
            </h3>

            <div className="space-y-3">
              {institutionAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-base-100 rounded-lg hover:bg-base-300 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getAccountIcon(account.type)}
                    </div>
                    <div>
                      <div className="font-semibold">{account.name}</div>
                      <div className="text-sm text-base-content/60">
                        {getAccountTypeLabel(account.type, account.subtype)}{" "}
                        •••• {account.mask}
                      </div>
                      {account.official_name &&
                        account.official_name !== account.name && (
                          <div className="text-xs text-base-content/50 mt-1">
                            {account.official_name}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(
                          account.current_balance,
                          account.currency
                        )}
                      </div>
                      {account.available_balance !== null &&
                        account.available_balance !==
                          account.current_balance && (
                          <div className="text-sm text-base-content/60">
                            Available:{" "}
                            {formatCurrency(
                              account.available_balance,
                              account.currency
                            )}
                          </div>
                        )}
                      <div className="text-xs text-base-content/50 mt-1">
                        Updated:{" "}
                        {new Date(account.updated_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      className="btn btn-sm btn-ghost btn-circle text-error"
                      onClick={() => handleDeleteClick(account)}
                      title="Delete account"
                    >
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && accountToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">⚠️ Delete Account</h3>
            <p className="py-4">
              Are you sure you want to delete{" "}
              <strong>{accountToDelete.name}</strong>?
            </p>
            <div className="alert alert-warning mb-4">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm">
                <strong>Warning:</strong> This will permanently delete this
                account and <strong>ALL associated transactions</strong>. This
                action cannot be undone.
              </span>
            </div>

            {deleteAccountMutation.isError && (
              <div className="alert alert-error mb-4">
                <span>Failed to delete account. Please try again.</span>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={handleCancelDelete}
                disabled={deleteAccountMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleConfirmDelete}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete Account & Transactions"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
