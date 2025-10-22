import type { Account } from "../../lib/api";

interface AccountListProps {
  accounts: Account[];
  accountsByInstitution: Record<string, Account[]>;
}

export function AccountList({
  accounts,
  accountsByInstitution,
}: AccountListProps) {
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

                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(
                        account.current_balance,
                        account.currency
                      )}
                    </div>
                    {account.available_balance !== null &&
                      account.available_balance !== account.current_balance && (
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
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
