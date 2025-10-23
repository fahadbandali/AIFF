# Goal Management UI

## Why
The current system has basic goal tracking with read-only display and API endpoints (creation/update APIs exist but no UI), but users cannot create, edit, or delete goals through the UI. Users need a comprehensive goal management interface to set savings targets with deadlines and track progress toward their financial goals. The goal widget currently shows all goals but users need the ability to customize which goals are displayed.

## What Changes
- Add goal creation UI with form validation (title, target amount, deadline)
- Add goal editing/update UI for modifying goal details and current amount
- Add goal deletion with confirmation
- Create dedicated Goal Dashboard page for comprehensive goal management
- Add goal widget customization to show/hide specific goals
- Add support for manual contributions to update current_amount
- Update backend API to support DELETE operations
- Add date picker for setting goal deadlines
- Display goal list with filtering and sorting options

## Impact

### Affected Specs
- `goal-tracking` (existing): Add UI requirements for creation, editing, deletion, and widget customization

### Affected Code
- Backend:
  - `backend/src/routes/goals.ts` (add DELETE endpoint)
  - `backend/src/services/database.ts` (minimal changes if any)
- Frontend:
  - `frontend/src/components/Analytics/GoalWidget.tsx` (add customization controls)
  - New `frontend/src/components/Goals/GoalDashboard.tsx` (main dashboard view)
  - New `frontend/src/components/Goals/GoalForm.tsx` (create/edit form)
  - New `frontend/src/components/Goals/GoalList.tsx` (list display)
  - New `frontend/src/components/Goals/GoalCard.tsx` (individual goal display)
  - New `frontend/src/components/Goals/ContributionForm.tsx` (add contributions)
  - `frontend/src/App.tsx` (add Goal Dashboard route)
  - `frontend/src/lib/api.ts` (add delete method, ensure create/update are exposed)

### Breaking Changes
None - this change only adds UI capabilities for existing API functionality

