# Budget Management UI

## Why
The current system has basic budget tracking with read-only display and API endpoints, but users cannot create, edit, or delete budgets through the UI. Users need a comprehensive budget management interface to set spending limits per category with flexible time periods (daily, weekly, monthly) and easily manage their budgets.

## What Changes
- Add budget creation UI with form validation
- Add budget editing/update UI
- Add budget deletion with confirmation
- Extend budget periods to support daily, weekly, and monthly ranges
- Add support for "All Categories" budgets (total spending limit across all transactions)
- Add constraint enforcement: one budget per category per time period; all-categories budgets require explicit date ranges
- Create dedicated Budget Dashboard page for comprehensive budget management
- Add budget widget customization to show/hide specific budgets
- Update backend API to support PATCH/DELETE operations and duplicate prevention
- Add date range picker for custom budget periods
- Make category_id optional in Budget model (null = all categories)

## Impact
- Affected specs: `budget-tracking`
- Breaking change: Budget.category_id becomes nullable (null = all categories)
- Affected code:
  - Backend: `backend/src/routes/budgets.ts` (add PATCH, DELETE endpoints, duplicate validation)
  - Backend: `backend/src/services/database.ts` (Budget type updates for daily/weekly)
  - Frontend: `frontend/src/components/Analytics/BudgetWidget.tsx` (add customization)
  - Frontend: New `frontend/src/components/Budgets/BudgetDashboard.tsx`
  - Frontend: New `frontend/src/components/Budgets/BudgetForm.tsx`
  - Frontend: New `frontend/src/components/Budgets/BudgetList.tsx`
  - Frontend: `frontend/src/App.tsx` (add Budget Dashboard route)
  - Frontend: `frontend/src/lib/api.ts` (add update/delete methods)

