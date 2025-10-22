import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";
import { getDb } from "./database";
import { encrypt, decrypt } from "./encryption";
import { randomUUID } from "crypto";
import type { PlaidItem, Account } from "./database";

let plaidClient: PlaidApi | null = null;

/**
 * Initialize Plaid client with credentials from environment
 */
export function initPlaidClient(): PlaidApi {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const env = process.env.PLAID_ENV || "sandbox";

  if (!clientId || !secret) {
    throw new Error(
      "PLAID_CLIENT_ID and PLAID_SECRET environment variables are required"
    );
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env as keyof typeof PlaidEnvironments],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  console.log(`✅ Plaid client initialized (${env} environment)`);

  return plaidClient;
}

/**
 * Get the Plaid client instance
 */
export function getPlaidClient(): PlaidApi {
  if (!plaidClient) {
    throw new Error(
      "Plaid client not initialized. Call initPlaidClient() first."
    );
  }
  return plaidClient;
}

/**
 * Create a link token for Plaid Link initialization
 */
export async function createLinkToken(
  userId: string = "user-1"
): Promise<string> {
  const client = getPlaidClient();

  const response = await client.linkTokenCreate({
    user: {
      client_user_id: userId,
    },
    client_name: "Personal Finance App",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us, CountryCode.Ca],
    language: "en",
  });

  return response.data.link_token;
}

/**
 * Exchange a public token for an access token and store it
 * @returns The stored PlaidItem
 */
export async function exchangePublicToken(
  publicToken: string
): Promise<PlaidItem> {
  const client = getPlaidClient();
  const db = getDb();

  // Exchange public token for access token
  const exchangeResponse = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = exchangeResponse.data.access_token;
  const itemId = exchangeResponse.data.item_id;

  // Get institution information
  const itemResponse = await client.itemGet({
    access_token: accessToken,
  });

  const institutionId = itemResponse.data.item.institution_id || "unknown";

  // Get institution name
  let institutionName = "Unknown Institution";
  if (institutionId !== "unknown") {
    try {
      const institutionResponse = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us, CountryCode.Ca],
      });
      institutionName = institutionResponse.data.institution.name;
    } catch (error) {
      console.warn("Failed to fetch institution name:", error);
    }
  }

  // Encrypt access token
  const encryptionKey = process.env.PLAID_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("PLAID_ENCRYPTION_KEY not configured");
  }

  const encryptedToken = encrypt(accessToken, encryptionKey);

  // Check if item already exists
  await db.read();
  const existingItem = db.data.plaid_items.find(
    (item) => item.item_id === itemId
  );

  if (existingItem) {
    // Update existing item
    existingItem.access_token = encryptedToken;
    existingItem.institution_id = institutionId;
    existingItem.institution_name = institutionName;
    existingItem.last_sync = new Date().toISOString();
    await db.write();
    return existingItem;
  }

  // Create new item
  const newItem: PlaidItem = {
    id: randomUUID(),
    item_id: itemId,
    access_token: encryptedToken,
    institution_id: institutionId,
    institution_name: institutionName,
    created_at: new Date().toISOString(),
    last_sync: new Date().toISOString(),
  };

  db.data.plaid_items.push(newItem);
  await db.write();

  return newItem;
}

/**
 * Fetch accounts from Plaid and store them in the database
 * @param plaidItemId - The ID of the PlaidItem in our database
 * @returns Array of stored accounts
 */
export async function syncAccounts(plaidItemId: string): Promise<Account[]> {
  const client = getPlaidClient();
  const db = getDb();

  await db.read();

  // Find the PlaidItem
  const plaidItem = db.data.plaid_items.find((item) => item.id === plaidItemId);
  if (!plaidItem) {
    throw new Error("PlaidItem not found");
  }

  // Decrypt access token
  const encryptionKey = process.env.PLAID_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("PLAID_ENCRYPTION_KEY not configured");
  }

  const accessToken = decrypt(plaidItem.access_token, encryptionKey);

  // Fetch accounts from Plaid
  const accountsResponse = await client.accountsGet({
    access_token: accessToken,
  });

  const plaidAccounts = accountsResponse.data.accounts;
  const storedAccounts: Account[] = [];

  for (const plaidAccount of plaidAccounts) {
    const existingAccount = db.data.accounts.find(
      (acc) => acc.plaid_account_id === plaidAccount.account_id
    );

    if (existingAccount) {
      // Update existing account
      existingAccount.name = plaidAccount.name;
      existingAccount.official_name = plaidAccount.official_name || null;
      existingAccount.type = plaidAccount.type;
      existingAccount.subtype = plaidAccount.subtype || "unknown";
      existingAccount.mask = plaidAccount.mask || "0000";
      existingAccount.current_balance = plaidAccount.balances.current || 0;
      existingAccount.available_balance =
        plaidAccount.balances.available || null;
      existingAccount.currency =
        plaidAccount.balances.iso_currency_code || "USD";
      existingAccount.updated_at = new Date().toISOString();
      storedAccounts.push(existingAccount);
    } else {
      // Create new account
      const newAccount: Account = {
        id: randomUUID(),
        plaid_item_id: plaidItem.id,
        plaid_account_id: plaidAccount.account_id,
        name: plaidAccount.name,
        official_name: plaidAccount.official_name || null,
        type: plaidAccount.type,
        subtype: plaidAccount.subtype || "unknown",
        mask: plaidAccount.mask || "0000",
        current_balance: plaidAccount.balances.current || 0,
        available_balance: plaidAccount.balances.available || null,
        currency: plaidAccount.balances.iso_currency_code || "USD",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.data.accounts.push(newAccount);
      storedAccounts.push(newAccount);
    }
  }

  // Update last_sync timestamp
  plaidItem.last_sync = new Date().toISOString();
  await db.write();

  return storedAccounts;
}

/**
 * Get all accounts from the database with institution information
 */
export async function getAllAccounts(): Promise<
  (Account & { institution_name: string })[]
> {
  const db = getDb();
  await db.read();

  return db.data.accounts.map((account) => {
    const plaidItem = db.data.plaid_items.find(
      (item) => item.id === account.plaid_item_id
    );
    return {
      ...account,
      institution_name: plaidItem?.institution_name || "Unknown",
    };
  });
}
