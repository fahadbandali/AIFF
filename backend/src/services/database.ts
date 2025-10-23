import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { z } from "zod";

// Database schema types
interface Account {
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
}

interface Transaction {
  id: string;
  plaid_transaction_id: string;
  account_id: string;
  date: string;
  authorized_date: string | null;
  amount: number; // negative for credits, positive for debits
  name: string;
  merchant_name: string | null;
  category_id: string;
  is_tagged: boolean; // false until user confirms category
  is_pending: boolean;
  payment_channel: string; // 'online', 'in store', etc.
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  color: string; // hex color for charts
  icon: string; // icon name
  is_system: boolean; // true for default categories
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: string;
  category_id: string | null; // null = applies to all categories
  amount: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string; // ISO date
  end_date: string | null; // MUST NOT be null if category_id is null
  created_at: string;
  updated_at: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // ISO date
  created_at: string;
  updated_at: string;
}

interface PlaidItem {
  id: string;
  item_id: string;
  access_token: string;
  institution_id: string;
  institution_name: string;
  transactions_cursor: string | null; // for Plaid Transactions Sync API
  last_sync?: string | null; // ISO timestamp of last successful sync (optional for backward compatibility)
  created_at: string;
  updated_at: string;
}

interface Database {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  plaid_items: PlaidItem[];
}

// Zod validation schemas
const AccountSchema = z.object({
  id: z.string(),
  plaid_item_id: z.string(),
  plaid_account_id: z.string(),
  name: z.string(),
  official_name: z.string().nullable(),
  type: z.string(),
  subtype: z.string(),
  mask: z.string(),
  current_balance: z.number(),
  available_balance: z.number().nullable(),
  currency: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const TransactionSchema = z.object({
  id: z.string(),
  plaid_transaction_id: z.string(),
  account_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  authorized_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  amount: z.number(),
  name: z.string(),
  merchant_name: z.string().nullable(),
  category_id: z.string(),
  is_tagged: z.boolean(),
  is_pending: z.boolean(),
  payment_channel: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parent_id: z.string().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/), // hex color
  icon: z.string(),
  is_system: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const BudgetSchema = z
  .object({
    id: z.string(),
    category_id: z.string().nullable(),
    amount: z.number().positive(),
    period: z.enum(["daily", "weekly", "monthly", "yearly"]),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .refine(
    (data) => {
      // If category_id is null, end_date MUST NOT be null
      if (data.category_id === null && data.end_date === null) {
        return false;
      }
      return true;
    },
    {
      message: "Budgets with null category_id must have a non-null end_date",
    }
  );

const GoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const PlaidItemSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  access_token: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  transactions_cursor: z.string().nullable(),
  last_sync: z.string().datetime().nullable().optional(), // Optional field that can be null
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const DatabaseSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  categories: z.array(CategorySchema),
  budgets: z.array(BudgetSchema),
  goals: z.array(GoalSchema),
  plaid_items: z.array(PlaidItemSchema),
});

// Default categories with colors and icons
const defaultCategories: Category[] = [
  {
    id: "cat-income",
    name: "Income",
    parent_id: null,
    color: "#10b981",
    icon: "💰",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-housing",
    name: "Housing",
    parent_id: null,
    color: "#8b5cf6",
    icon: "🏠",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-transportation",
    name: "Transportation",
    parent_id: null,
    color: "#3b82f6",
    icon: "🚗",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-food",
    name: "Food",
    parent_id: null,
    color: "#f59e0b",
    icon: "🍔",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-entertainment",
    name: "Entertainment",
    parent_id: null,
    color: "#ec4899",
    icon: "🎬",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-shopping",
    name: "Shopping",
    parent_id: null,
    color: "#06b6d4",
    icon: "🛍️",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-healthcare",
    name: "Healthcare",
    parent_id: null,
    color: "#ef4444",
    icon: "🏥",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-financial",
    name: "Financial",
    parent_id: null,
    color: "#6366f1",
    icon: "💳",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "cat-uncategorized",
    name: "Uncategorized",
    parent_id: null,
    color: "#6b7280",
    icon: "❓",
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Default database structure
const defaultData: Database = {
  accounts: [],
  transactions: [],
  categories: defaultCategories,
  budgets: [],
  goals: [],
  plaid_items: [],
};

let db: Low<Database>;

export async function initDatabase() {
  // Get database path from environment or use default
  const dbPath = process.env.DB_PATH || "./data/db.json";

  // Ensure data directory exists
  const dataDir = join(process.cwd(), dirname(dbPath));

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Initialize LowDB
  const adapter = new JSONFile<Database>(dbPath);
  db = new Low<Database>(adapter, defaultData);

  // Read data from disk
  await db.read();

  // Initialize with default data if empty
  if (!db.data.categories || db.data.categories.length === 0) {
    db.data.categories = defaultCategories;
    await db.write();
  }

  console.log("✅ Database initialized");

  return db;
}

export function getDb(): Low<Database> {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Export entire database in JSON format
 * @returns Complete database data
 */
export function exportDatabase(): Database {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return { ...db.data };
}

/**
 * Validate database structure and referential integrity
 * @param data - Database data to validate
 * @throws Error with all validation errors if validation fails
 */
export function validateDatabaseStructure(data: unknown): Database {
  const errors: string[] = [];

  // Validate schema structure using safeParse to collect all errors
  const result = DatabaseSchema.safeParse(data);

  if (!result.success) {
    // Collect all Zod validation errors
    result.error.errors.forEach((err) => {
      const path = err.path.join(".");
      errors.push(`${path}: ${err.message}`);
    });

    // If schema validation failed, throw early with all schema errors
    throw new Error(`Schema validation failed:\n${errors.join("\n")}`);
  }

  const validatedData = result.data;

  // Validate referential integrity - collect all errors
  const accountIds = new Set(validatedData.accounts.map((a) => a.id));
  const categoryIds = new Set(validatedData.categories.map((c) => c.id));
  const plaidItemIds = new Set(validatedData.plaid_items.map((p) => p.id));

  // Check transaction foreign keys
  for (const txn of validatedData.transactions) {
    if (!accountIds.has(txn.account_id)) {
      errors.push(
        `Transaction ${txn.id} references missing account ${txn.account_id}`
      );
    }
    if (!categoryIds.has(txn.category_id)) {
      errors.push(
        `Transaction ${txn.id} references missing category ${txn.category_id}`
      );
    }
  }

  // Check budget foreign keys
  for (const budget of validatedData.budgets) {
    if (budget.category_id && !categoryIds.has(budget.category_id)) {
      errors.push(
        `Budget ${budget.id} references missing category ${budget.category_id}`
      );
    }
  }

  // Check account foreign keys
  for (const account of validatedData.accounts) {
    if (!plaidItemIds.has(account.plaid_item_id)) {
      errors.push(
        `Account ${account.id} references missing plaid_item ${account.plaid_item_id}`
      );
    }
  }

  // Check category parent_id references
  for (const category of validatedData.categories) {
    if (category.parent_id && !categoryIds.has(category.parent_id)) {
      errors.push(
        `Category ${category.id} references missing parent category ${category.parent_id}`
      );
    }
  }

  // If there were any referential integrity errors, throw them all
  if (errors.length > 0) {
    throw new Error(
      `Validation failed with ${errors.length} error(s):\n${errors.join("\n")}`
    );
  }

  return validatedData;
}

export type ImportStrategy = "replace" | "merge" | "append";

/**
 * Import database with specified merge strategy
 * @param data - Database data to import
 * @param strategy - Import strategy (replace, merge, or append)
 * @throws Error if validation fails or database write fails
 */
export async function importDatabase(
  data: unknown,
  strategy: ImportStrategy = "replace"
): Promise<void> {
  if (!db) {
    throw new Error("Database not initialized");
  }

  // Validate imported data
  const validatedData = validateDatabaseStructure(data);

  // Keep backup for rollback
  const backup = { ...db.data };

  try {
    if (strategy === "replace") {
      // Replace entire database
      db.data = validatedData;
    } else if (strategy === "merge") {
      // Merge records: update existing, add new
      db.data.accounts = mergeArrayById(
        db.data.accounts,
        validatedData.accounts
      );
      db.data.transactions = mergeArrayById(
        db.data.transactions,
        validatedData.transactions
      );
      db.data.categories = mergeArrayById(
        db.data.categories,
        validatedData.categories
      );
      db.data.budgets = mergeArrayById(db.data.budgets, validatedData.budgets);
      db.data.goals = mergeArrayById(db.data.goals, validatedData.goals);
      db.data.plaid_items = mergeArrayById(
        db.data.plaid_items,
        validatedData.plaid_items
      );
    } else if (strategy === "append") {
      // Append only: add new records, skip existing
      db.data.accounts = appendArrayById(
        db.data.accounts,
        validatedData.accounts
      );
      db.data.transactions = appendArrayById(
        db.data.transactions,
        validatedData.transactions
      );
      db.data.categories = appendArrayById(
        db.data.categories,
        validatedData.categories
      );
      db.data.budgets = appendArrayById(db.data.budgets, validatedData.budgets);
      db.data.goals = appendArrayById(db.data.goals, validatedData.goals);
      db.data.plaid_items = appendArrayById(
        db.data.plaid_items,
        validatedData.plaid_items
      );
    }

    // Write to disk
    await db.write();
  } catch (error) {
    // Rollback on failure
    db.data = backup;
    throw error;
  }
}

/**
 * Merge arrays by ID: update existing records, add new ones
 */
function mergeArrayById<T extends { id: string }>(
  existing: T[],
  incoming: T[]
): T[] {
  const merged = new Map<string, T>();

  // Add existing records
  for (const item of existing) {
    merged.set(item.id, item);
  }

  // Update/add incoming records
  for (const item of incoming) {
    merged.set(item.id, item);
  }

  return Array.from(merged.values());
}

/**
 * Append arrays by ID: only add new records, skip existing
 */
function appendArrayById<T extends { id: string }>(
  existing: T[],
  incoming: T[]
): T[] {
  const existingIds = new Set(existing.map((item) => item.id));
  const newItems = incoming.filter((item) => !existingIds.has(item.id));
  return [...existing, ...newItems];
}

export type {
  Database,
  Account,
  Transaction,
  Category,
  Budget,
  Goal,
  PlaidItem,
};
