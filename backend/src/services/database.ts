import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Database schema types
interface Account {
  id: string
  plaid_account_id: string
  name: string
  type: string
  mask: string
  current_balance: number
  available_balance: number | null
  created_at: string
  updated_at: string
}

interface Transaction {
  id: string
  plaid_transaction_id: string | null
  account_id: string
  amount: number
  date: string
  name: string
  category_id: string
  pending: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  parent_id: string | null
  created_at: string
}

interface Budget {
  id: string
  category_id: string
  amount: number
  period: string
  start_date: string
  created_at: string
  updated_at: string
}

interface PlaidToken {
  id: string
  access_token: string
  item_id: string
  created_at: string
}

interface Database {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  plaid_tokens: PlaidToken[]
}

// Default categories
const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Income', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Housing', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Transportation', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Food', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Entertainment', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Shopping', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Healthcare', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Financial', parent_id: null, created_at: new Date().toISOString() },
  { id: 'cat-9', name: 'Uncategorized', parent_id: null, created_at: new Date().toISOString() },
]

// Default database structure
const defaultData: Database = {
  accounts: [],
  transactions: [],
  categories: defaultCategories,
  budgets: [],
  plaid_tokens: [],
}

let db: Low<Database>

export async function initDatabase() {
  // Get database path from environment or use default
  const dbPath = process.env.DB_PATH || './data/db.json'
  
  // Ensure data directory exists
  const dataDir = join(process.cwd(), dirname(dbPath))
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  // Initialize LowDB
  const adapter = new JSONFile<Database>(dbPath)
  db = new Low<Database>(adapter, defaultData)
  
  // Read data from disk
  await db.read()

  // Initialize with default data if empty
  if (!db.data.categories || db.data.categories.length === 0) {
    db.data.categories = defaultCategories
    await db.write()
  }

  console.log('✅ Database initialized')
  
  return db
}

export function getDb(): Low<Database> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export type { Database, Account, Transaction, Category, Budget, PlaidToken }

