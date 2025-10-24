# Dashboard Cleanup: Streamlined Layout and Enhanced Visualizations

## Why
The current dashboard has redundant sections and less useful features that clutter the UI. The budget widget appears in both the analytics view and as a separate page, creating confusion. The goal section requires manual contribution tracking which is not intuitive for users. Users would benefit from a cleaner, more focused dashboard that emphasizes cash flow visualizations over manual data entry.

## What Changes
- Remove budget widget from analytics view (keep it only accessible via quick actions button)
- Convert budget quick action to display budget overview directly on dashboard (similar to goals section)
- Change budget section title from "Budget Widget" to "Budgets" when displayed on dashboard
- Remove goal section entirely from the application (goal widget, goal dashboard, goal routes, goal API endpoints)
- Enhance the yearly cash flow circle graph with: fixed layout (no horizontal scroll), smaller fonts, toggle between summary and category breakdown views, display amounts per category
- Enhance the time-based cash flow line graph with better date range controls and data presentation
- Update quick actions section to remove "Goals" button and update "Budget" button behavior
- Replace purple color scheme with blue (indigo) throughout the application in dark mode
- Update account deletion to always cascade delete associated transactions (remove option to delete account only)

## Impact
- **Affected specs**: 
  - `dashboard` - Update analytics view layout, modify quick actions section, remove goal widget integration, update color scheme
  - `budget-tracking` - Update budget widget display requirements for dashboard integration, update color scheme
  - `financial-analytics` - Enhance cash flow visualizations, update color scheme
  - `account-management` - Update account deletion to cascade delete transactions
  - `goal-tracking` - Mark entire spec for removal/archival

- **Affected code**:
  - `frontend/src/components/Dashboard/Dashboard.tsx` - Remove goal button from quick actions, update budget button behavior, remove goal widget import and display
  - `frontend/src/components/Analytics/AnalyticsDashboard.tsx` - Remove budget and goal widgets from analytics view
  - `frontend/src/components/Analytics/BudgetWidget.tsx` - Update to support dashboard display mode with "Budgets" title, replace purple with blue
  - `frontend/src/components/Analytics/CashFlowCircle.tsx` - Enhance visualizations and add insights, replace purple with blue
  - `frontend/src/components/Analytics/CashFlowLine.tsx` - Improve date range controls and data presentation, replace purple with blue
  - `frontend/src/components/Goals/` - Delete entire directory (all goal components)
  - `frontend/src/App.tsx` - Remove goal routes
  - `frontend/src/lib/api.ts` - Remove goal API methods
  - `frontend/src/components/Dashboard/AccountList.tsx` - Simplify account deletion (no option UI)
  - `backend/src/routes/accounts.ts` - Update DELETE endpoint to always cascade delete transactions
  - `backend/src/services/database.ts` - Update account deletion logic to cascade delete transactions
  - `backend/src/routes/goals.ts` - Delete file
  - Database cleanup - Remove goals collection from database schema


