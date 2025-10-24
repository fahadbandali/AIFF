# Implementation Tasks

## 1. Frontend - Budget Widget Updates (PRIORITY: Do First)
- [x] 1.1 Add prop to BudgetWidget for display context (analytics vs dashboard)
- [x] 1.2 Update title logic to show "Budgets" when in dashboard context
- [x] 1.3 Ensure styling matches goal widget appearance for dashboard display

## 2. Frontend - Dashboard Budget Integration (PRIORITY: Do Second)
- [x] 2.1 Update budget button in quick actions to display budget overview on dashboard page
- [x] 2.2 Add state to track budget visibility on dashboard
- [x] 2.3 Update layout to show budget widget on dashboard when activated
- [x] 2.4 Ensure budget widget uses "Budgets" as title when displayed on dashboard

## 3. Frontend - Analytics View Budget Removal (PRIORITY: Do Third)
- [x] 3.1 Remove BudgetWidget import from AnalyticsDashboard.tsx
- [x] 3.2 Remove budget widget from analytics view grid layout
- [x] 3.3 Update grid spacing after budget widget removal

## 4. Testing - Compare Budget with Goal Widget (PRIORITY: Do Fourth - Before Removing Goals)
- [x] 4.1 Test budget display on dashboard matches goal widget style
- [x] 4.2 Verify budget button behavior matches how goal button worked
- [x] 4.3 Compare and confirm budget UX is satisfactory before proceeding with goal removal
- [x] 4.4 Get user approval to proceed with goal removal

## 5. Frontend - Remove Goal Widget from Dashboard (After Budget Comparison)
- [x] 5.1 Remove GoalWidget import and display from Dashboard.tsx
- [x] 5.2 Remove "Goals" button from quick actions section

## 6. Frontend - Remove Goal Widget from Analytics View
- [x] 6.1 Remove GoalWidget import from AnalyticsDashboard.tsx
- [x] 6.2 Remove goal widget from analytics view grid layout
- [x] 6.3 Update grid spacing after goal widget removal

## 7. Frontend - Remove Goal Components (After Budget Comparison Complete)
- [x] 7.1 Delete frontend/src/components/Goals/ directory
- [x] 7.2 Remove goal routes from App.tsx
- [x] 7.3 Remove goal-related API methods from lib/api.ts
- [x] 7.4 Remove any goal-related imports or references

## 8. Backend - Remove Goal Endpoints
- [x] 8.1 Delete backend/src/routes/goals.ts
- [x] 8.2 Remove goal routes registration from main server file
- [x] 8.3 Remove goal-related database methods from services/database.ts
- [x] 8.4 Update database types to remove Goal interface

## 9. Frontend - Cash Flow Enhancements
- [x] 9.1 Fix CashFlowCircle layout to prevent horizontal scrolling
- [x] 9.2 Reduce font sizes in CashFlowCircle for better balance
- [x] 9.3 Add toggle button to switch between "Summary" and "Categories" view
- [x] 9.4 Implement category breakdown mode showing individual expense categories
- [x] 9.5 Display amount spent per category when in category view
- [x] 9.6 Update legend to show categories when toggled
- [x] 9.7 Add percentage calculations and visual indicators to circle graph
- [x] 9.8 Improve CashFlowLine date range picker UI
- [x] 9.9 Add trend indicators and summary stats to line graph

## 10. Account Deletion - Cascade Delete
- [x] 10.1 Update backend/src/routes/accounts.ts DELETE endpoint to cascade delete transactions
- [x] 10.2 Update backend/src/services/database.ts to add cascade delete logic for transactions
- [x] 10.3 Update frontend/src/components/Dashboard/AccountList.tsx deletion confirmation message
- [x] 10.4 Ensure confirmation dialog warns about transaction deletion
- [x] 10.5 Remove any UI options that would allow keeping transactions

## 11. Color Scheme Updates
- [x] 11.1 Replace purple colors with blue in Dashboard.tsx
- [x] 11.2 Replace purple colors with blue in BudgetWidget.tsx
- [x] 11.3 Replace purple colors with blue in BudgetDashboard.tsx and BudgetForm.tsx
- [x] 11.4 Replace purple colors with blue in CashFlowCircle.tsx
- [x] 11.5 Replace purple colors with blue in CashFlowLine.tsx
- [x] 11.6 Update any other components using purple to use blue
- [x] 11.7 Verify color consistency across all widgets and components

## 12. Final Testing and Validation
- [x] 12.1 Test dashboard budget display toggle
- [x] 12.2 Verify analytics view shows only transaction lists and cash flow widgets
- [x] 12.3 Test cash flow circle graph has no horizontal scrolling
- [x] 12.4 Test cash flow circle category toggle switches between summary and category views
- [x] 12.5 Verify category amounts are displayed correctly in category view
- [x] 12.6 Test enhanced cash flow line graph visualizations
- [x] 12.7 Verify no broken references to goals after removal
- [x] 12.8 Test that existing budgets continue to work correctly
- [x] 12.9 Verify blue color scheme is applied consistently in dark mode
- [x] 12.10 Check that no purple colors remain in the UI
- [x] 12.11 Test account deletion cascade deletes all transactions
- [x] 12.12 Verify confirmation dialog shows correct warning about transaction deletion


