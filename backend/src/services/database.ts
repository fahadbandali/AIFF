import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

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
  last_sync: string | null; // ISO timestamp of last successful sync
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

export type {
  Database,
  Account,
  Transaction,
  Category,
  Budget,
  Goal,
  PlaidItem,
};
