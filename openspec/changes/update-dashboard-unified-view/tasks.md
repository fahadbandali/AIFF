# Implementation Tasks

## 1. Backend: Account Deletion
- [ ] 1.1 Add DELETE `/api/accounts/:id` endpoint in `backend/src/routes/accounts.ts`
- [ ] 1.2 Implement account deletion logic in `backend/src/services/database.ts`
- [ ] 1.3 Add validation to ensure account exists before deletion
- [ ] 1.4 Add option to cascade delete related transactions (optional parameter)

## 2. Frontend API: Account Deletion
- [ ] 2.1 Add `deleteAccount` method to `frontend/src/lib/api.ts`
- [ ] 2.2 Create `useDeleteAccount` mutation hook (or add to existing hooks)
- [ ] 2.3 Handle cache invalidation after successful deletion

## 3. Dashboard: View Toggle Infrastructure
- [ ] 3.1 Add view state management in Dashboard component (useState: 'accounts' | 'analytics')
- [ ] 3.2 Update Quick Actions section to include view toggle button
- [ ] 3.3 Remove hardcoded navigation to `/analytics` route
- [ ] 3.4 Conditionally render accounts view or analytics view based on state

## 4. Dashboard: Analytics Integration
- [ ] 4.1 Import analytics widgets into Dashboard component
- [ ] 4.2 Move transaction sync logic from AnalyticsDashboard to Dashboard
- [ ] 4.3 Render analytics widgets when view is 'analytics'
- [ ] 4.4 Maintain existing widget layout (CashFlowCircle, CashFlowLine, BudgetWidget, GoalWidget, etc.)
- [ ] 4.5 Update header to show appropriate content for each view

## 5. Account List: Delete Functionality
- [ ] 5.1 Add delete button to each account in AccountList component
- [ ] 5.2 Add confirmation dialog before deletion (modal or confirm dialog)
- [ ] 5.3 Show loading state during deletion
- [ ] 5.4 Display success/error messages after deletion attempt
- [ ] 5.5 Handle edge case: prevent deletion of last account if applicable

## 6. List Widgets: Collapseable UI
- [ ] 6.1 Add collapse/expand state to TransactionList component
- [ ] 6.2 Add collapse/expand button in TransactionList header
- [ ] 6.3 Add collapse/expand state to UntaggedTransactions component
- [ ] 6.4 Add collapse/expand button in UntaggedTransactions header
- [ ] 6.5 Save collapse state to localStorage for persistence (optional)
- [ ] 6.6 Use smooth transitions for expand/collapse animations

## 7. Routing: Clean Up Analytics Route
- [ ] 7.1 Update `/analytics` route to redirect to `/dashboard` (or remove entirely)
- [ ] 7.2 Update any links pointing to `/analytics` to trigger view toggle instead
- [ ] 7.3 Optionally support query parameter (e.g., `/dashboard?view=analytics`) for deep linking

## 8. Budget Dashboard: Navigation Bar
- [ ] 8.1 Add navigation bar component to BudgetDashboard (copy pattern from GoalDashboard)
- [ ] 8.2 Add back button that navigates to `/dashboard`
- [ ] 8.3 Add analytics link that navigates to `/analytics`
- [ ] 8.4 Style navigation bar to match GoalDashboard pattern (bg-base-200, border-b)
- [ ] 8.5 Ensure responsive layout on mobile devices

## 9. Color Scheme Standardization: Purple to Blue
- [ ] 9.1 Update BudgetDashboard: Replace purple badge colors with blue
  - [ ] Change `bg-purple-100 text-purple-700` to `bg-blue-100 text-blue-700`
- [ ] 9.2 Update BudgetWidget: Replace purple badge colors with blue
  - [ ] Change `bg-purple-100 text-purple-700` to `bg-blue-100 text-blue-700`
- [ ] 9.3 Search entire codebase for any remaining purple colors
  - [ ] Use grep to find: `purple-\d+`
  - [ ] Replace all instances with appropriate blue equivalents
- [ ] 9.4 Verify all indigo colors remain consistent (primary action color)

## 10. Widget Styling Consistency
- [ ] 10.1 Audit all widget components for consistent card styling
- [ ] 10.2 Ensure all widgets use `card bg-base-100 shadow-xl`
- [ ] 10.3 Verify consistent spacing (padding, margins) across widgets
- [ ] 10.4 Check that all widgets have consistent header styling
- [ ] 10.5 Ensure action buttons use consistent indigo color scheme

## 11. Testing and Polish
- [ ] 11.1 Test account deletion flow end-to-end
- [ ] 11.2 Test view toggle with all widgets rendering correctly
- [ ] 11.3 Test collapseable widgets for smooth UX
- [ ] 11.4 Verify navigation flow from budget dashboard works correctly
- [ ] 11.5 Test responsive layout for both views and budget dashboard
- [ ] 11.6 Verify cache invalidation and data refresh after account deletion
- [ ] 11.7 Visual test: Verify all purple colors replaced with blue
- [ ] 11.8 Visual test: Verify navigation bar consistency across goal and budget dashboards
- [ ] 11.9 Visual test: Verify widget styling consistency across all components

