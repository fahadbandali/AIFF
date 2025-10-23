# Update Dashboard: Unified View with View Toggle and Design Consistency

## Why
The current implementation has several UX inconsistencies:
1. Analytics on a separate page (`/analytics`) requiring back-and-forth navigation
2. Budget page lacks navigation consistency with goal page (no back button)
3. Inconsistent color scheme using both purple and indigo colors
4. Widget styling lacks visual consistency across the application

Users need a unified, visually consistent dashboard experience with proper navigation patterns.

## What Changes
- Add ability to delete connected accounts from the dashboard
- Consolidate analytics dashboard components into the main dashboard component
- Replace separate `/analytics` route with in-page view toggle
- Add view toggle button in the Quick Actions section to switch between "Accounts View" and "Analytics View"
- Make list-based widgets (Transaction List, Untagged Transactions) collapseable/expandable
- Update navigation flow to use toggle instead of route navigation
- **Apply goal dashboard navigation pattern to budget dashboard** (navigation bar with back button)
- **Standardize color scheme: replace purple with blue (indigo) throughout the application**
- **Ensure consistent widget styling and spacing across all components**

## Impact
- **Affected specs**: 
  - `dashboard` - Add view toggle, integrate analytics components, improve layout
  - `account-management` - Add account deletion capability
  - `budget-tracking` - Add navigation bar, update color scheme
  - `design-system` - Define consistent color scheme and widget patterns
- **Affected code**:
  - `frontend/src/components/Dashboard/Dashboard.tsx` - Main changes for view toggle and analytics integration
  - `frontend/src/components/Dashboard/AccountList.tsx` - Add delete functionality
  - `frontend/src/components/Analytics/AnalyticsDashboard.tsx` - Refactor for inline use
  - `frontend/src/components/Analytics/TransactionList.tsx` - Add collapse/expand
  - `frontend/src/components/Analytics/UntaggedTransactions.tsx` - Add collapse/expand
  - `frontend/src/components/Budgets/BudgetDashboard.tsx` - Add navigation bar, update colors to blue
  - `frontend/src/components/Budgets/BudgetForm.tsx` - Update colors to blue
  - `frontend/src/components/Analytics/BudgetWidget.tsx` - Replace purple with blue
  - All widget components - Ensure consistent card styling, spacing, and colors
  - `frontend/src/App.tsx` - Remove separate `/analytics` route (or make it redirect)
  - `backend/src/routes/accounts.ts` - Add DELETE endpoint for accounts
  - `backend/src/services/database.ts` - Add account deletion logic

