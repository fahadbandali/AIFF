# Implementation Tasks

## 1. Backend API Enhancements
- [x] 1.1 Update Budget type to support "daily" and "weekly" periods
- [x] 1.2 Make category_id nullable in Budget type (null = all categories)
- [x] 1.3 Add validation: if category_id is null, end_date must not be null
- [x] 1.4 Add PATCH /api/budgets/:id endpoint for updating budgets
- [x] 1.5 Add DELETE /api/budgets/:id endpoint for deleting budgets
- [x] 1.6 Add duplicate validation in POST /api/budgets to prevent multiple budgets per category per period
- [x] 1.7 Add overlap detection for all-categories budgets (prevent overlapping date ranges)
- [x] 1.8 Update budget progress calculation to handle daily and weekly periods
- [x] 1.9 Update budget progress calculation to handle all-categories budgets (sum all transactions)
- [x] 1.10 Add validation for date ranges based on period type

## 2. Budget Dashboard Page
- [x] 2.1 Create BudgetDashboard.tsx component with layout
- [x] 2.2 Add route /budgets to App.tsx
- [x] 2.3 Display all budgets in organized list/grid
- [x] 2.4 Add "Create Budget" button that opens creation modal/form
- [x] 2.5 Add search/filter functionality by category or period
- [x] 2.6 Add sort functionality (by spent amount, category, period)

## 3. Budget Form Component
- [x] 3.1 Create BudgetForm.tsx component with fields for category, amount, period, date range
- [x] 3.2 Add category selector dropdown with "All Categories" option at the top
- [x] 3.3 Filter category dropdown to show only categories without existing budgets for selected period (when not "All Categories")
- [x] 3.4 Add amount input with currency formatting
- [x] 3.5 Add period selector (daily, weekly, monthly)
- [x] 3.6 Add date range picker based on selected period
- [x] 3.7 Make date range required when "All Categories" is selected
- [x] 3.8 Auto-populate dates for category budgets, require manual entry for all-categories budgets
- [x] 3.9 Add form validation (required fields, positive amounts, valid dates)
- [x] 3.10 Add validation: if "All Categories" selected, end_date must be provided
- [x] 3.11 Display error messages for validation failures
- [x] 3.12 Add submit handler with API integration
- [x] 3.13 Add loading state during submission
- [x] 3.14 Add success/error notifications

## 4. Budget Editing
- [x] 4.1 Add edit button to each budget in BudgetDashboard
- [x] 4.2 Open BudgetForm in edit mode with pre-filled data
- [x] 4.3 Disable category field when editing (prevent category change)
- [x] 4.4 Call PATCH API endpoint on form submission
- [x] 4.5 Update budget list after successful edit

## 5. Budget Deletion
- [x] 5.1 Add delete button to each budget in BudgetDashboard
- [x] 5.2 Show confirmation modal before deletion
- [x] 5.3 Call DELETE API endpoint on confirmation
- [x] 5.4 Remove budget from list after successful deletion
- [x] 5.5 Show success notification

## 6. Budget Widget Customization
- [x] 6.1 Add settings icon/button to BudgetWidget
- [x] 6.2 Create budget selection modal showing all budgets
- [x] 6.3 Add checkboxes to show/hide individual budgets
- [x] 6.4 Store widget preferences in localStorage
- [x] 6.5 Filter displayed budgets based on preferences
- [x] 6.6 Add "View All" link that navigates to Budget Dashboard

## 7. Budget Constraints
- [x] 7.1 Update POST /api/budgets to check for existing budget with same category_id and period (when category_id is not null)
- [x] 7.2 Add overlap detection for all-categories budgets in POST /api/budgets
- [x] 7.3 Return 409 Conflict with helpful error message if duplicate exists (category budgets)
- [x] 7.4 Return 409 Conflict with date range info if overlap exists (all-categories budgets)
- [x] 7.5 Update BudgetForm to show categories that don't have budgets for selected period
- [x] 7.6 Display inline warning if user tries to create duplicate
- [x] 7.7 Display inline warning if all-categories budget date range overlaps existing

## 8. Frontend API Integration
- [x] 8.1 Add api.budgets.update(id, data) method in api.ts
- [x] 8.2 Add api.budgets.delete(id) method in api.ts
- [x] 8.3 Add React Query mutations for create, update, delete
- [x] 8.4 Implement optimistic updates for better UX
- [x] 8.5 Handle error states and display user-friendly messages

## 9. UI Polish
- [x] 9.1 Add responsive design for mobile/tablet views
- [x] 9.2 Add loading skeletons for budget list
- [x] 9.3 Add empty state illustrations for no budgets
- [x] 9.4 Add tooltips for period types explaining differences
- [x] 9.5 Add tooltip for "All Categories" option explaining it requires date range
- [x] 9.6 Add visual distinction for all-categories budgets (badge, icon, or different styling)
- [x] 9.7 Display "All Categories" label prominently for all-categories budgets in dashboard
- [x] 9.8 Add keyboard shortcuts (e.g., ESC to close modals)
- [x] 9.9 Ensure proper focus management in modals

## 10. Testing & Validation
- [x] 10.1 Test budget creation with all period types (daily, weekly, monthly, yearly)
- [x] 10.2 Test all-categories budget creation with date range
- [x] 10.3 Test all-categories budget validation (must have end_date)
- [x] 10.4 Test duplicate budget prevention for category budgets
- [x] 10.5 Test overlap detection for all-categories budgets
- [x] 10.6 Test that category and all-categories budgets can coexist
- [x] 10.7 Test budget editing flow (both category and all-categories)
- [x] 10.8 Test budget deletion with confirmation
- [x] 10.9 Test widget customization persistence
- [x] 10.10 Test date range validation
- [x] 10.11 Test navigation between Dashboard and widget
- [x] 10.12 Test error handling for API failures
- [x] 10.13 Test all-categories budget progress calculation (sums all transactions)

