# Budget Management UI Design

## Context
The current system has basic budget storage and display capabilities, but lacks user-facing CRUD operations. Users can view budgets in a read-only widget, but cannot create, edit, or delete them through the UI. This change adds comprehensive budget management with flexible time periods and widget customization.

## Goals / Non-Goals

### Goals
- Enable users to create, edit, and delete budgets through an intuitive UI
- Support daily, weekly, and monthly budget periods
- Enforce one budget per category per period to avoid conflicts
- Provide a dedicated dashboard for comprehensive budget management
- Allow widget customization to show only relevant budgets
- Maintain data consistency and prevent duplicate budgets

### Non-Goals
- Yearly budgets (already supported, not changing)
- Budget rollover functionality (deferred to future enhancement)
- Budget templates or presets
- Budget sharing or collaboration features
- Advanced budget rules (e.g., conditional budgets based on income)
- Budget forecasting or ML-based predictions

## Decisions

### 1. Budget Period Types
**Decision**: Support daily, weekly, and monthly periods in addition to existing yearly.

**Rationale**:
- Daily: Useful for strict spending control (e.g., $20/day eating out)
- Weekly: Aligns with paycheck cycles and shopping routines
- Monthly: Most common budgeting period, already supported
- Yearly: Already implemented for large recurring expenses

**Implementation**:
- Update `period` enum to include `"daily" | "weekly" | "monthly" | "yearly"`
- Calculate date ranges automatically based on period:
  - Daily: Single day (start_date = end_date)
  - Weekly: 7-day period from start_date
  - Monthly: First to last day of calendar month
  - Yearly: January 1 to December 31

**Alternatives considered**:
- Custom date ranges: Too complex for MVP, users can achieve similar results with multiple budgets
- Bi-weekly periods: Less common, can be approximated with weekly budgets

### 2. One Budget Per Category Constraint
**Decision**: Enforce one active budget per category per period type at the database level.

**Rationale**:
- Prevents confusion about which budget is "active"
- Simplifies budget progress calculations
- Clear user expectation: each category has one budget for each period
- Users can have multiple budgets for same category with different periods (e.g., monthly + yearly)

**Implementation**:
- Check for existing budget with same `category_id` and `period` in POST endpoint (when category_id is not null)
- Return 409 Conflict if duplicate exists
- Filter category dropdown in UI to show only categories without budgets for selected period
- Allow updating existing budget instead

**Alternatives considered**:
- Multiple overlapping budgets: Too confusing, unclear which budget to display
- Composite unique constraint: Considered but LowDB doesn't support database-level constraints
- Time-based constraints: Allow overlapping periods but prevent exact duplicates - too complex

### 2b. All-Categories Budget Support
**Decision**: Support budgets that apply to all transactions (not category-specific) but require explicit date ranges.

**Rationale**:
- Enables overall spending limits (e.g., "spend max $2000 during vacation Oct 1-15")
- Useful for time-bound spending goals independent of categories
- Requires date range to prevent ambiguous open-ended total budgets
- Complements category-specific budgets for comprehensive control

**Implementation**:
- Make `category_id` field nullable in Budget type
- When `category_id` is null:
  - Both `start_date` and `end_date` must be specified (no null end_date)
  - `period` field acts as a label/tag (e.g., "custom")
  - Calculate spending by summing ALL transactions in date range
- Allow multiple all-categories budgets as long as date ranges don't overlap
- Display with distinct visual styling (e.g., "All Categories" badge)

**Validation Rules**:
- If `category_id` is null, `end_date` MUST NOT be null
- If `category_id` is null, date range must be valid (start < end)
- Prevent overlapping date ranges for all-categories budgets
- Category budgets and all-categories budgets can coexist

**Alternatives considered**:
- Allow open-ended all-categories budgets: Too ambiguous, unclear semantics
- Use special "All" category ID: Cleaner to use null, avoids polluting category namespace
- Separate budget type field: Overengineering, nullable category_id is sufficient

### 3. Budget Dashboard vs Modal Flow
**Decision**: Create a dedicated `/budgets` dashboard page with modal-based create/edit forms.

**Rationale**:
- Dashboard provides comprehensive overview of all budgets
- Modals keep user in context without full page navigation
- Consistent with modern web app patterns
- Allows inline editing without losing place in budget list
- Easier to implement search/filter on dedicated page

**Implementation**:
- New route `/budgets` with BudgetDashboard component
- Modal dialog for create/edit operations
- Delete confirmation in separate modal
- "View All Budgets" link in widget navigates to dashboard

**Alternatives considered**:
- Full page forms: More jarring navigation experience
- Inline editing in widget: Too cramped for proper form
- Sidebar drawer: Less discoverable than modal

### 4. Widget Customization Storage
**Decision**: Store widget preferences (visible budgets) in localStorage.

**Rationale**:
- Simple client-side persistence without backend changes
- No need for user preferences API endpoints
- Fast access without network requests
- Scoped to browser/device (acceptable tradeoff for MVP)

**Implementation**:
- Store as JSON array of budget IDs to show: `widgetBudgets: string[]`
- Default to showing all budgets if preference doesn't exist
- Update preferences when user toggles budget visibility
- Clear preferences if budgets are deleted

**Alternatives considered**:
- Backend storage: Over-engineering for simple preference, adds API complexity
- Cookie storage: Less space, same limitations as localStorage
- IndexedDB: Unnecessary complexity for small preference object

### 5. Date Range Handling
**Decision**: Auto-calculate date ranges based on period type with manual override option.

**Rationale**:
- Most users want standard periods (this month, this week)
- Auto-calculation reduces input errors
- Manual override provides flexibility for edge cases
- Simpler UX for common case

**Implementation**:
- Period selector updates date fields automatically
- Daily: today's date
- Weekly: current week (Monday-Sunday or Sunday-Saturday based on locale)
- Monthly: current month (1st to last day)
- Users can manually adjust dates after auto-fill

**Alternatives considered**:
- Always require manual date entry: More tedious for standard periods
- Preset buttons (This Month, Next Month): Adds UI complexity
- Calendar-only picker: Less intuitive for typing dates

### 6. API Design for Updates
**Decision**: Use PATCH for partial updates, require ID in URL parameter.

**Rationale**:
- RESTful convention for partial updates
- Allows updating only changed fields (amount, dates)
- Prevents accidental category changes (exclude from PATCH schema)
- Clear endpoint structure: PATCH /api/budgets/:id

**Implementation**:
- PATCH endpoint accepts optional fields: amount, period, start_date, end_date
- Validate updated data with Zod schema
- Prevent category_id changes (return 400 if included)
- Update `updated_at` timestamp

**Alternatives considered**:
- PUT for full replacement: Requires sending all fields, more error-prone
- POST to /api/budgets/:id/update: Non-standard REST pattern
- DELETE + POST for updates: Loses audit trail, more complex

## Data Model Changes

### Budget Type Extension
```typescript
type Budget = {
  id: string;
  category_id: string | null; // null = applies to all categories (requires date range)
  amount: number;
  period: "daily" | "weekly" | "monthly" | "yearly"; // Added daily, weekly
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD, MUST NOT be null if category_id is null
  created_at: string;
  updated_at: string;
};
```

**Validation constraints**:
- If `category_id` is null, then `end_date` MUST be a valid date string (not null)
- If `category_id` is null, prevent overlapping date ranges with other all-categories budgets

### Widget Preferences (localStorage)
```typescript
type WidgetPreferences = {
  visibleBudgets: string[]; // Array of budget IDs to show
  sortBy?: "category" | "spent" | "remaining";
  sortOrder?: "asc" | "desc";
};
```

## Component Architecture

### New Components
```
frontend/src/components/Budgets/
├── BudgetDashboard.tsx          # Main dashboard page
├── BudgetList.tsx               # List/grid of all budgets
├── BudgetCard.tsx               # Individual budget display with actions
├── BudgetForm.tsx               # Create/edit form (modal)
├── BudgetDeleteConfirm.tsx      # Delete confirmation modal
└── BudgetWidgetSettings.tsx     # Widget customization modal
```

### Updated Components
- `BudgetWidget.tsx`: Add settings button, apply visibility preferences
- `App.tsx`: Add `/budgets` route

## API Endpoints

### New/Updated Endpoints
```
PATCH /api/budgets/:id
  Body: { amount?, period?, start_date?, end_date? }
  Returns: { success: true, budget: Budget }
  Errors: 400 (validation), 404 (not found), 409 (duplicate)

DELETE /api/budgets/:id
  Returns: { success: true }
  Errors: 404 (not found), 500 (server error)

POST /api/budgets (enhanced)
  Body: { category_id, amount, period, start_date, end_date? }
  Returns: { success: true, budget: Budget }
  Errors: 400 (validation), 404 (category not found), 409 (duplicate budget)
```

## Validation Rules

### Budget Creation/Update
- `amount`: Must be positive number, max 10,000,000
- `category_id`: Must reference existing category, or null for all-categories budget
- `period`: Must be one of: daily, weekly, monthly, yearly
- `start_date`: Must be valid date in YYYY-MM-DD format
- `end_date`: Must be valid date >= start_date, or null (but REQUIRED if category_id is null)
- Date range must align with period type (checked but not enforced strictly)
- **All-categories constraint**: If category_id is null, end_date MUST NOT be null

### Duplicate Prevention

**For category-specific budgets** (category_id is not null):
- Check for existing budget with same category_id AND period
- Allow if no match found
- Return 409 Conflict with message: "A {period} budget already exists for {category_name}"

**For all-categories budgets** (category_id is null):
- Check for overlapping date ranges with other all-categories budgets
- Overlap occurs if: new_start <= existing_end AND new_end >= existing_start
- Return 409 Conflict with message: "An all-categories budget already exists for overlapping dates ({existing_start} to {existing_end})"
- Allow if no overlap found

## User Flows

### Create Budget Flow
1. User navigates to Budget Dashboard or clicks "Create Budget" in widget
2. Modal opens with empty BudgetForm
3. User selects category from dropdown OR selects "All Categories" option
   - If specific category: filtered to show only available categories for selected period
   - If "All Categories": category_id will be null, date range becomes required
4. User selects period type (daily/weekly/monthly/yearly)
5. Date fields auto-populate based on period (if specific category) or stay empty (if all categories)
6. If "All Categories" selected, user MUST manually enter start_date and end_date
7. User enters budget amount
8. User clicks "Create Budget"
9. Frontend validates input:
   - If all-categories budget: verify end_date is provided and valid
   - If category budget: standard validation
10. API call to POST /api/budgets
11. If successful: modal closes, budget list refreshes, success notification
12. If duplicate: show error "Budget already exists for this category and period"
13. If all-categories date overlap: show error "An all-categories budget already exists for this date range"
14. If error: show error notification with retry option

### Edit Budget Flow
1. User clicks "Edit" button on budget card in dashboard
2. Modal opens with BudgetForm pre-filled with current values
3. Category field is disabled (cannot change category)
4. User modifies amount, period, or dates
5. User clicks "Update Budget"
6. Frontend validates changes
7. API call to PATCH /api/budgets/:id
8. If successful: modal closes, budget updates in list, success notification
9. If error: show error notification

### Delete Budget Flow
1. User clicks "Delete" button on budget card
2. Confirmation modal appears: "Are you sure you want to delete the {category} {period} budget?"
3. User clicks "Confirm Delete"
4. API call to DELETE /api/budgets/:id
5. If successful: budget removed from list, success notification
6. If error: show error notification

### Widget Customization Flow
1. User clicks settings icon in BudgetWidget
2. Modal opens showing list of all budgets with checkboxes
3. User toggles visibility for specific budgets
4. Changes save automatically to localStorage
5. Widget updates to show only selected budgets
6. User clicks "Done" to close modal

## Risks / Trade-offs

### Risk: Period Type Complexity
- **Risk**: Users confused by daily/weekly/monthly differences
- **Mitigation**: Add tooltips explaining each period type with examples
- **Trade-off**: More period types = more flexibility but potentially more confusion

### Risk: localStorage Limitations
- **Risk**: Widget preferences lost if user clears browser data or switches devices
- **Mitigation**: Document this limitation, consider backend storage in future
- **Trade-off**: Simple implementation now vs cross-device sync later

### Risk: Duplicate Budget Edge Cases
- **Risk**: User creates budget, deletes it, recreates - might hit timing issues
- **Mitigation**: Proper cleanup on delete, clear validation errors
- **Trade-off**: Strict constraint prevents confusion but less flexibility

### Risk: Date Range Validation
- **Risk**: Users create illogical date ranges (e.g., daily budget spanning months)
- **Mitigation**: Show warnings for unusual ranges but allow for flexibility
- **Trade-off**: Strict validation prevents errors but limits legitimate use cases

## Migration Plan

### For Existing Data
- No migration needed - existing budgets continue to work
- Existing "monthly" and "yearly" budgets remain valid
- New periods (daily, weekly) only apply to new budgets

### For Users
- Existing users see new "Create Budget" button become active (no longer disabled)
- Widget continues to work as before with all budgets shown by default
- New "View All Budgets" link appears in widget

### Rollback Strategy
- If critical issues found, revert API changes and disable create/edit buttons
- Widget continues to show existing budgets in read-only mode
- No data loss - budgets remain in database

## Open Questions

1. **Budget Amount Limits**: Should we enforce maximum budget amounts? (e.g., $1M)
   - Proposed: Yes, max $10,000,000 for sanity check
   
2. **Weekly Period Start Day**: Should weeks start on Sunday or Monday?
   - Proposed: Use user's locale default (Sunday for US, Monday for most others)
   - Future: Make configurable in settings

3. **Budget Deletion**: Should we soft-delete (archive) or hard-delete budgets?
   - Proposed: Hard delete for MVP (simpler), add soft delete later for audit trail
   
4. **Budget History**: Should we track budget changes over time?
   - Proposed: Not for MVP, consider for future analytics feature

5. **Overlapping Periods**: Should we allow multiple budgets with overlapping date ranges for same category?
   - Proposed: No for MVP - enforce one budget per period type per category

