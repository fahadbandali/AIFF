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
  },

  accounts: {
    getAll: (): Promise<AccountsResponse> => fetchApi("/api/accounts"),
  },
};

export { ApiError };
