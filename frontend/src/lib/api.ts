const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
}

export interface ExchangeTokenRequest {
  public_token: string;
}

export interface ExchangeTokenResponse {
  item_id: string;
  plaid_item_id: string;
  institution_name: string;
  accounts_synced: number;
}

export interface Account {
  id: string;
  plaid_item_id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string;
  mask: string;
  current_balance: number;
  available_balance: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
  institution_name: string;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface Transaction {
  id: string;
  plaid_transaction_id: string;
  account_id: string;
  date: string;
  authorized_date: string | null;
  amount: number;
  name: string;
  merchant_name: string | null;
  category_id: string;
  is_tagged: boolean;
  is_pending: boolean;
  payment_channel: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  icon: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface Budget {
  id: string;
  category_id: string | null; // null = applies to all categories
  amount: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetsResponse {
  budgets: Budget[];
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  over_budget: boolean;
}

export interface CashFlowStats {
  income: number;
  expenses: number;
  net: number;
  transaction_count: number;
}

export interface SyncTransactionsRequest {
  plaid_item_id: string;
}

export interface SyncTransactionsResponse {
  success: boolean;
  transactions_added: number;
  transactions_modified: number;
  transactions_removed: number;
}

export interface Database {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  plaid_items: Array<{
    id: string;
    item_id: string;
    access_token: string;
    institution_id: string;
    institution_name: string;
    transactions_cursor: string | null;
    last_sync?: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

export type ImportStrategy = "replace" | "merge" | "append";

export interface ImportRequest {
  data: Database;
  strategy: ImportStrategy;
}

export interface ImportResponse {
  success: boolean;
  message: string;
}

export interface ValidateResponse {
  valid: boolean;
  message: string;
  counts?: {
    accounts: number;
    transactions: number;
    categories: number;
    budgets: number;
    plaid_items: number;
  };
  error?: string;
  details?: any[];
}

class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || errorData.error || "An error occurred",
      response.status,
      errorData
    );
  }

  return response.json();
}

export const api = {
  plaid: {
    createLinkToken: (): Promise<LinkTokenResponse> =>
      fetchApi("/api/plaid/link-token", { method: "POST" }),

    exchangeToken: (
      data: ExchangeTokenRequest
    ): Promise<ExchangeTokenResponse> =>
      fetchApi("/api/plaid/exchange-token", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    syncTransactions: (
      data: SyncTransactionsRequest
    ): Promise<SyncTransactionsResponse> =>
      fetchApi("/api/plaid/sync-transactions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  accounts: {
    getAll: (): Promise<AccountsResponse> => fetchApi("/api/accounts"),

    delete: (
      id: string,
      cascade: boolean = false
    ): Promise<{ success: boolean; message: string; cascadeDelete: boolean }> =>
      fetchApi(`/api/accounts/${id}?cascade=${cascade}`, {
        method: "DELETE",
      }),
  },

  transactions: {
    getAll: (params?: {
      account_id?: string;
      category_id?: string;
      is_tagged?: boolean;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    }): Promise<TransactionsResponse> => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return fetchApi(
        `/api/transactions${queryString ? `?${queryString}` : ""}`
      );
    },

    getById: (id: string): Promise<{ transaction: Transaction }> =>
      fetchApi(`/api/transactions/${id}`),

    tag: (
      id: string,
      category_id: string
    ): Promise<{ success: boolean; transaction: Transaction }> =>
      fetchApi(`/api/transactions/${id}/tag`, {
        method: "PATCH",
        body: JSON.stringify({ category_id }),
      }),

    getCashFlowStats: (params?: {
      start_date?: string;
      end_date?: string;
    }): Promise<CashFlowStats> => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return fetchApi(
        `/api/transactions/stats/cash-flow${
          queryString ? `?${queryString}` : ""
        }`
      );
    },
  },

  categories: {
    getAll: (): Promise<CategoriesResponse> => fetchApi("/api/categories"),

    getById: (id: string): Promise<{ category: Category }> =>
      fetchApi(`/api/categories/${id}`),

    create: (data: {
      name: string;
      parent_id?: string | null;
      color: string;
      icon: string;
    }): Promise<{ success: boolean; category: Category }> =>
      fetchApi("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  budgets: {
    getAll: (): Promise<BudgetsResponse> => fetchApi("/api/budgets"),

    getById: (id: string): Promise<{ budget: Budget }> =>
      fetchApi(`/api/budgets/${id}`),

    getProgress: (id: string): Promise<BudgetProgress> =>
      fetchApi(`/api/budgets/${id}/progress`),

    create: (data: {
      category_id: string | null;
      amount: number;
      period: "daily" | "weekly" | "monthly" | "yearly";
      start_date: string;
      end_date?: string | null;
    }): Promise<{ success: boolean; budget: Budget }> =>
      fetchApi("/api/budgets", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: {
        amount?: number;
        period?: "daily" | "weekly" | "monthly" | "yearly";
        start_date?: string;
        end_date?: string | null;
      }
    ): Promise<{ success: boolean; budget: Budget }> =>
      fetchApi(`/api/budgets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean; message: string }> =>
      fetchApi(`/api/budgets/${id}`, {
        method: "DELETE",
      }),
  },

  data: {
    /**
     * Export entire database as JSON
     * Downloads the file directly in the browser
     */
    export: async (): Promise<void> => {
      const url = `${API_BASE_URL}/api/data/export`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || errorData.error || "Export failed",
          response.status,
          errorData
        );
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "finance-backup.json";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    },

    /**
     * Import database from JSON
     */
    import: (data: ImportRequest): Promise<ImportResponse> =>
      fetchApi("/api/data/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    /**
     * Validate database structure without importing
     */
    validate: (data: Database): Promise<ValidateResponse> =>
      fetchApi("/api/data/validate", {
        method: "POST",
        body: JSON.stringify({ data }),
      }),
  },
};

export { ApiError };
