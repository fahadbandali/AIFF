# Personal Finance Application - Development Prompt

## Project Overview
Build a full-stack personal finance application that connects to banks/credit cards via Plaid, allows transaction auditing, categorization, and budget management. The application should run locally with data import/export capabilities.

## Tech Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Package Manager**: pnpm
- **UI Library**: DaisyUI (Tailwind-based, no dependencies)
- **Data Fetching**: TanStack Query (React Query) for server state
- **State Management**: React hooks (useState/useContext) - keep it simple
- **Charting**: Recharts or Chart.js for budget visualizations
- **Date Handling**: date-fns
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: LowDB (JSON-based, file storage)
- **Plaid SDK**: plaid-node (official SDK)
- **Environment**: Plaid Sandbox mode initially

### Shared
- **Language**: TypeScript throughout (share types between frontend/backend)
- **Validation**: Zod for runtime validation

## Core Features

### 1. Plaid Integration
- **Plaid Link**: Frontend component to connect bank accounts
- **Supported Institutions**: EQ Bank, American Express, TD Bank (and others via Plaid)
- **Token Exchange**: Secure backend endpoint to exchange public_token for access_token
- **Transaction Sync**: Fetch transactions from connected accounts
- **Account Management**: List connected accounts, disconnect accounts

### 2. Transaction Management
- **Display**: Paginated transaction list with sorting/filtering
- **Search**: Search by merchant, amount, date range
- **Details**: View full transaction details (merchant, amount, date, account, category)
- **Manual Entry**: Add manual transactions for cash/offline purchases
- **Edit/Delete**: Modify or remove transactions
- **Bulk Actions**: Select multiple transactions for batch categorization

### 3. Categorization System
- **Default Categories**: 
  - Housing (Rent, Mortgage, Utilities)
  - Transportation (Gas, Transit, Car Payment)
  - Food (Groceries, Restaurants, Coffee)
  - Entertainment (Streaming, Events, Hobbies)
  - Shopping (Clothing, Electronics, General)
  - Healthcare (Insurance, Medical, Pharmacy)
  - Financial (Fees, Transfers, Investments)
  - Income (Salary, Freelance, Other)
  - Uncategorized
- **Auto-categorization**: Use Plaid's category data as initial suggestion
- **Manual Override**: Click to change category
- **Rules Engine**: Create rules (e.g., "Transactions from Starbucks → Coffee")
- **Custom Categories**: Users can create their own categories

### 4. Budget Management
- **Monthly Budgets**: Set spending limits per category per month
- **Budget Tracking**: Show spent vs. budgeted with progress bars
- **Alerts**: Visual warnings when approaching/exceeding budget
- **Budget Templates**: Save budget configurations for reuse
- **Rollover**: Option to rollover unused budget to next month

### 5. Dashboard & Analytics
- **Overview Cards**: Total income, expenses, net savings for current month
- **Spending by Category**: Pie chart or bar chart
- **Spending Trends**: Line chart showing spending over time
- **Budget Status**: All budgets with progress indicators
- **Recent Transactions**: Last 10 transactions

### 6. Data Management
- **Export**: Export all data (transactions, budgets, categories) to JSON
- **Import**: Import previously exported data
- **Backup**: One-click backup to file
- **Reset**: Clear all data and start fresh

## Project Structure

```
finance-app/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── Transactions/
│   │   │   │   ├── Budgets/
│   │   │   │   ├── PlaidLink/
│   │   │   │   └── Layout/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── db/
│   │   │   ├── types/
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/
│       ├── src/
│       │   └── types/
│       └── package.json
├── package.json (workspace root)
├── pnpm-workspace.yaml
└── README.md
```

## API Endpoints

### Plaid Integration
- `POST /api/plaid/create-link-token` - Generate Plaid Link token
- `POST /api/plaid/exchange-token` - Exchange public token for access token
- `GET /api/plaid/accounts` - List connected accounts
- `POST /api/plaid/sync-transactions` - Trigger transaction sync
- `DELETE /api/plaid/disconnect/:itemId` - Disconnect account

### Transactions
- `GET /api/transactions` - List transactions (with pagination, filters)
- `POST /api/transactions` - Create manual transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `PATCH /api/transactions/:id/category` - Update category
- `POST /api/transactions/bulk-categorize` - Bulk categorize

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create custom category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/status` - Get current month budget status

### Analytics
- `GET /api/analytics/spending-by-category` - Category breakdown
- `GET /api/analytics/spending-trends` - Time-based trends
- `GET /api/analytics/summary` - Dashboard summary

### Data Management
- `GET /api/data/export` - Export all data as JSON
- `POST /api/data/import` - Import data from JSON
- `POST /api/data/reset` - Reset all data

## Database Schema (JSON Structure)

### db.json Structure
```json
{
  "accounts": [
    {
      "id": "uuid",
      "plaid_account_id": "string",
      "plaid_item_id": "string",
      "name": "string",
      "official_name": "string",
      "type": "checking|credit|savings",
      "subtype": "string",
      "mask": "string",
      "current_balance": "number",
      "available_balance": "number",
      "currency": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "transactions": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "plaid_transaction_id": "string",
      "amount": "number",
      "date": "date string",
      "merchant_name": "string",
      "description": "string",
      "category_id": "uuid",
      "pending": "boolean",
      "is_manual": "boolean",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "categories": [
    {
      "id": "uuid",
      "name": "string",
      "color": "string",
      "icon": "string",
      "parent_category_id": "uuid|null",
      "is_custom": "boolean",
      "created_at": "timestamp"
    }
  ],
  "budgets": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "amount": "number",
      "period_start": "date string",
      "period_end": "date string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "categorization_rules": [
    {
      "id": "uuid",
      "pattern": "string",
      "category_id": "uuid",
      "created_at": "timestamp"
    }
  ],
  "plaid_items": [
    {
      "item_id": "string",
      "access_token": "string (encrypted)",
      "institution_id": "string",
      "institution_name": "string",
      "created_at": "timestamp"
    }
  ]
}
```

## Implementation Guidelines

### Security
- Store Plaid access tokens encrypted in database
- Use environment variables for Plaid API keys
- Never expose Plaid secrets to frontend
- Implement rate limiting on API endpoints
- Validate all inputs with Zod

### Data Flow
1. User connects bank via Plaid Link → Frontend receives public_token
2. Frontend sends public_token to backend → Backend exchanges for access_token
3. Backend stores access_token (encrypted) in db.json and fetches initial transactions
4. Frontend displays transactions with categories
5. User categorizes/creates budgets → Stored in db.json via LowDB
6. Analytics computed on-demand from transaction data

### Performance
- Use TanStack Query for caching and background refetching
- Implement virtual scrolling for long transaction lists
- LowDB keeps data in memory with async file writes for fast reads
- Use lodash chains for efficient filtering/grouping
- Lazy load charts/analytics

### User Experience
- Loading states for all async operations
- Error boundaries for graceful error handling
- Toast notifications for actions (success/error)
- Keyboard shortcuts for power users
- Responsive design (mobile-friendly)
- Dark mode support via DaisyUI

## Setup Instructions for Agent

1. **Initialize monorepo with pnpm workspaces**
2. **Setup frontend**: React + Vite + TypeScript + DaisyUI
3. **Setup backend**: Express + TypeScript + LowDB
4. **Configure Plaid**: Sandbox environment with placeholder credentials
5. **Initialize LowDB** with default schema (empty arrays for each collection)
6. **Implement core API endpoints** with proper TypeScript types
7. **Build Plaid Link integration** component
8. **Create transaction list** with categorization UI
9. **Implement budget management** interface
10. **Build dashboard** with charts and summary

## Environment Variables

```env
# Backend (.env)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
PORT=3001
DB_PATH=./data/db.json

# Frontend (.env)
VITE_API_URL=http://localhost:3001
```

## Success Criteria

- ✅ Successfully connect to Plaid Sandbox accounts
- ✅ Fetch and display transactions
- ✅ Categorize transactions (manual and auto)
- ✅ Create and track budgets
- ✅ View spending analytics
- ✅ Export/import data
- ✅ Responsive UI with DaisyUI
- ✅ Type-safe throughout with TypeScript

## Next Steps After MVP

- Add transaction splitting (split one transaction into multiple categories)
- Recurring transaction detection
- Bill reminders
- Savings goals
- Multi-currency support
- PDF statement uploads with OCR
- Move to Plaid Development environment for real bank testing

## Notes

- Start with Plaid Sandbox using test credentials
- Focus on core features first, analytics can be enhanced later
- Keep UI simple and functional - optimize later
- Use SQLite for easy local development and portability
- All data stays local - no cloud dependencies