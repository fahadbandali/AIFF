# Add Financial Analytics Dashboard

## Why
Users need powerful insights into their spending patterns, cash flow, and financial health. While the current dashboard shows basic account information, it lacks analytical capabilities to help users understand where their money is going, track budgets, and work toward savings goals. A widget-based analytics dashboard provides actionable insights through visualizations and interactive components.

## What Changes
- Add transaction synchronization from Plaid with encrypted storage in LowDB
- Implement transaction categorization system with tagging workflow
- Create cash flow visualization widgets (circle graph for yearly, line graph with date ranges for monthly)
- Build budget tracking system with monthly/yearly/category-level views
- Add savings goal tracking with progress visualization and estimated completion dates
- Create untagged transactions workflow for category assignment
- Implement data models for transactions, categories, budgets, and goals
- Add API endpoints for CRUD operations on all financial entities
- Create interactive dashboard with multiple widget components
- Use Recharts for all visualizations

## Impact

### Affected Specs
- `transaction-management` (new): Transaction sync, storage, categorization, and tagging
- `budget-tracking` (new): Budget creation, tracking, and visualization (viewing only - creation may be separate feature)
- `goal-tracking` (new): Savings goal tracking and visualization (viewing only - creation may be separate feature)
- `financial-analytics` (new): Widget-based analytics dashboard with charts and insights
- `dashboard` (existing): Add navigation to analytics dashboard

### Affected Code
- Frontend:
  - `src/components/Analytics/`: New directory for analytics widgets
    - `CashFlowCircle.tsx`: Yearly cash flow in/out circle graph
    - `CashFlowLine.tsx`: Monthly cash flow line graph with date range selector
    - `UntaggedTransactions.tsx`: Transaction tagging workflow
    - `BudgetWidgets.tsx`: Budget visualization components
    - `GoalWidgets.tsx`: Goal tracking components
  - `src/components/Transactions/`: New directory for transaction management
  - `src/hooks/`: New hooks for transactions, budgets, goals
  - `src/lib/api.ts`: Add API methods for new endpoints
  - Add Recharts library
  - Add date-fns for date manipulation
- Backend:
  - `src/routes/transactions.ts`: New route file for transaction endpoints
  - `src/routes/budgets.ts`: New route file for budget endpoints
  - `src/routes/goals.ts`: New route file for goal endpoints
  - `src/services/plaid.ts`: Extend with transaction sync methods
  - `src/services/database.ts`: Add collections for transactions, categories, budgets, goals
  - Database schema for:
    - Transactions (id, plaid_transaction_id, account_id, date, amount, name, category_id, is_tagged, created_at, updated_at)
    - Categories (id, name, parent_id, color, icon, created_at)
    - Budgets (id, category_id, amount, period, start_date, end_date, created_at)
    - Goals (id, name, target_amount, current_amount, target_date, created_at)
- Configuration:
  - No new environment variables required
  - Use existing Plaid credentials for transaction sync

### Security Considerations
- All transaction data encrypted at rest using existing encryption service
- Budget and goal data also encrypted
- Rate limiting on all new endpoints
- Input validation with Zod for all requests
- Plaid transaction sync respects existing token encryption

### Data Model Complexity
This change introduces significant data model relationships:
- Transactions → Accounts (foreign key)
- Transactions → Categories (foreign key)
- Budgets → Categories (foreign key)
- Categories support parent-child hierarchy
- All entities need created_at/updated_at timestamps
- Need to handle Plaid transaction updates (pending → posted)

### External Dependencies
- Recharts for visualization components
- date-fns for date range manipulation
- Plaid Transactions Sync API endpoint
- All data stored in LowDB as encrypted JSON

