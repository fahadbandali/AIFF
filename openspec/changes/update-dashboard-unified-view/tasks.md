# Implementation Tasks

## 1. Backend: Account Deletion
- [x] 1.1 Add DELETE `/api/accounts/:id` endpoint in `backend/src/routes/accounts.ts`
- [x] 1.2 Implement account deletion logic in `backend/src/services/database.ts`
- [x] 1.3 Add validation to ensure account exists before deletion
- [x] 1.4 Add option to cascade delete related transactions (optional parameter)

## 2. Frontend API: Account Deletion
- [x] 2.1 Add `deleteAccount` method to `frontend/src/lib/api.ts`
- [x] 2.2 Create `useDeleteAccount` mutation hook (or add to existing hooks)
- [x] 2.3 Handle cache invalidation after successful deletion

## 3. Dashboard: View Toggle Infrastructure
- [x] 3.1 Add view state management in Dashboard component (useState: 'accounts' | 'analytics')
- [x] 3.2 Update Quick Actions section to include view toggle button
- [x] 3.3 Remove hardcoded navigation to `/analytics` route
- [x] 3.4 Conditionally render accounts view or analytics view based on state

## 4. Dashboard: Analytics Integration
- [x] 4.1 Import analytics widgets into Dashboard component
- [x] 4.2 Move transaction sync logic from AnalyticsDashboard to Dashboard
- [x] 4.3 Render analytics widgets when view is 'analytics'
- [x] 4.4 Maintain existing widget layout (CashFlowCircle, CashFlowLine, BudgetWidget, GoalWidget, etc.)
- [x] 4.5 Update header to show appropriate content for each view

## 5. Account List: Delete Functionality
- [x] 5.1 Add delete button to each account in AccountList component
- [x] 5.2 Add confirmation dialog before deletion (modal or confirm dialog)
- [x] 5.3 Show loading state during deletion
- [x] 5.4 Display success/error messages after deletion attempt
- [x] 5.5 Handle edge case: prevent deletion of last account if applicable

## 6. List Widgets: Collapseable UI
- [x] 6.1 Add collapse/expand state to TransactionList component
- [x] 6.2 Add collapse/expand button in TransactionList header
- [x] 6.3 Add collapse/expand state to UntaggedTransactions component
- [x] 6.4 Add collapse/expand button in UntaggedTransactions header
- [x] 6.5 Save collapse state to localStorage for persistence (optional)
- [x] 6.6 Use smooth transitions for expand/collapse animations

## 7. Routing: Clean Up Analytics Route
- [x] 7.1 Update `/analytics` route to redirect to `/dashboard` (or remove entirely)
- [x] 7.2 Update any links pointing to `/analytics` to trigger view toggle instead
- [x] 7.3 Optionally support query parameter (e.g., `/dashboard?view=analytics`) for deep linking

## 8. Budget Dashboard: Navigation Bar
- [x] 8.1 Add navigation bar component to BudgetDashboard (copy pattern from GoalDashboard)
- [x] 8.2 Add back button that navigates to `/dashboard`
- [x] 8.3 Add analytics link that navigates to `/analytics`
- [x] 8.4 Style navigation bar to match GoalDashboard pattern (bg-base-200, border-b)
- [x] 8.5 Ensure responsive layout on mobile devices

## 9. Color Scheme Standardization: Purple to Blue
- [x] 9.1 Update BudgetDashboard: Replace purple badge colors with blue
  - [x] Change `bg-purple-100 text-purple-700` to `bg-blue-100 text-blue-700`
- [x] 9.2 Update BudgetWidget: Replace purple badge colors with blue
  - [x] Change `bg-purple-100 text-purple-700` to `bg-blue-100 text-blue-700`
- [x] 9.3 Search entire codebase for any remaining purple colors
  - [x] Use grep to find: `purple-\d+`
  - [x] Replace all instances with appropriate blue equivalents
- [x] 9.4 Verify all indigo colors remain consistent (primary action color)

## 10. Widget Styling Consistency
- [x] 10.1 Audit all widget components for consistent card styling
- [x] 10.2 Ensure all widgets use `card bg-base-100 shadow-xl`
- [x] 10.3 Verify consistent spacing (padding, margins) across widgets
- [x] 10.4 Check that all widgets have consistent header styling
- [x] 10.5 Ensure action buttons use consistent indigo color scheme

## 11. Testing and Polish
- [x] 11.1 Test account deletion flow end-to-end
- [x] 11.2 Test view toggle with all widgets rendering correctly
- [x] 11.3 Test collapseable widgets for smooth UX
- [x] 11.4 Verify navigation flow from budget dashboard works correctly
- [x] 11.5 Test responsive layout for both views and budget dashboard
- [x] 11.6 Verify cache invalidation and data refresh after account deletion
- [x] 11.7 Visual test: Verify all purple colors replaced with blue
- [x] 11.8 Visual test: Verify navigation bar consistency across goal and budget dashboards
- [x] 11.9 Visual test: Verify widget styling consistency across all components

