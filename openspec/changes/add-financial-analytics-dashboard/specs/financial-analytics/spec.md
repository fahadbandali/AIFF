# Financial Analytics Specification

## ADDED Requirements

### Requirement: Analytics Dashboard Page
The system SHALL provide a comprehensive analytics dashboard with multiple financial widgets.

#### Scenario: Navigate to analytics dashboard
- **WHEN** a user navigates to /dashboard/analytics
- **THEN** the system displays the analytics dashboard page
- **AND** loads all widget data in parallel
- **AND** displays widgets in a responsive grid layout
- **AND** shows loading states for widgets that are fetching data

#### Scenario: Analytics dashboard layout
- **WHEN** the analytics dashboard is displayed
- **THEN** the system arranges widgets in a multi-column grid
- **AND** places cash flow widgets at the top
- **AND** places transaction management widgets in the middle
- **AND** places budget and goal widgets at the bottom
- **AND** makes layout responsive (stacks on mobile, multi-column on desktop)

#### Scenario: Dashboard without connected accounts
- **WHEN** a user navigates to analytics without connected accounts
- **THEN** the system redirects to the Connect page
- **AND** displays "Connect a bank account to view analytics" message

#### Scenario: Dashboard with no transaction data
- **WHEN** a user has connected accounts but no transactions synced
- **THEN** the system displays empty states for all widgets
- **AND** shows "Sync your transactions to see analytics" message
- **AND** provides a "Sync Now" button

### Requirement: Cash Flow Circle Widget
The system SHALL display yearly cash flow as a circle/pie chart showing money in vs money out.

#### Scenario: Display yearly cash flow circle
- **WHEN** a user views the cash flow circle widget
- **THEN** the system displays a pie chart with two segments: "Income" and "Expenses"
- **AND** calculates total income (negative amounts from transactions) for current year
- **AND** calculates total expenses (positive amounts from transactions) for current year
- **AND** displays amounts in the chart legend
- **AND** uses distinct colors (green for income, red for expenses)

#### Scenario: Cash flow with net positive
- **WHEN** income exceeds expenses for the year
- **THEN** the system displays net cash flow as "+$X" in green
- **AND** shows "You saved $X this year" message
- **AND** displays savings rate percentage: (income - expenses) / income * 100

#### Scenario: Cash flow with net negative
- **WHEN** expenses exceed income for the year
- **THEN** the system displays net cash flow as "-$X" in red
- **AND** shows "You spent $X more than you earned" message
- **AND** provides warning indicator

#### Scenario: No transactions for current year
- **WHEN** no transactions exist for the current year
- **THEN** the system displays "No data for current year" message
- **AND** shows empty state illustration
- **AND** does not display the pie chart

#### Scenario: Chart interactivity
- **WHEN** a user hovers over a pie chart segment
- **THEN** the system displays a tooltip with exact amount and percentage
- **AND** highlights the segment
- **AND** shows transaction count for that category (income vs expense)

### Requirement: Cash Flow Line Widget
The system SHALL display cash flow over time as a line chart with configurable date ranges.

#### Scenario: Display monthly cash flow line chart
- **WHEN** a user views the cash flow line widget
- **THEN** the system displays a line chart with time on X-axis and amount on Y-axis
- **AND** shows two lines: "Income" (green) and "Expenses" (red)
- **AND** defaults to current month date range
- **AND** aggregates transactions by day for the selected period
- **AND** displays net cash flow for the period

#### Scenario: Date range selector
- **WHEN** a user interacts with the date range selector
- **THEN** the system provides quick filters: "30 Days", "3 Months", "6 Months", "1 Year", "All Time", "Custom"
- **AND** updates the chart when a filter is selected
- **AND** loads data asynchronously with loading indicator
- **AND** preserves selected range in URL query parameter

#### Scenario: Custom date range selection
- **WHEN** a user selects "Custom" date range
- **THEN** the system displays date pickers for start and end date
- **AND** validates end date is after start date
- **AND** limits range to maximum 2 years (performance consideration)
- **AND** updates chart when valid range is selected

#### Scenario: Line chart with daily granularity
- **WHEN** the selected date range is <= 60 days
- **THEN** the system displays daily data points
- **AND** formats X-axis labels as "Mon DD"
- **AND** shows all days in the range

#### Scenario: Line chart with weekly granularity
- **WHEN** the selected date range is 61-180 days
- **THEN** the system aggregates data by week
- **AND** formats X-axis labels as "Week of Mon DD"
- **AND** reduces data points for better readability

#### Scenario: Line chart with monthly granularity
- **WHEN** the selected date range is > 180 days
- **THEN** the system aggregates data by month
- **AND** formats X-axis labels as "Mon YYYY"
- **AND** displays monthly totals

#### Scenario: Line chart interactivity
- **WHEN** a user hovers over a data point
- **THEN** the system displays a tooltip with date, income amount, expense amount, and net
- **AND** highlights both lines at that X position
- **AND** shows vertical line at cursor position

#### Scenario: No data for selected range
- **WHEN** no transactions exist in the selected date range
- **THEN** the system displays "No transactions in this date range" message
- **AND** shows empty state
- **AND** keeps date range selector visible for adjustment

### Requirement: Untagged Transactions Widget
The system SHALL display a list of untagged transactions with category assignment interface.

#### Scenario: Display untagged transactions list
- **WHEN** a user views the untagged transactions widget
- **THEN** the system displays all transactions with is_tagged: false
- **AND** shows transaction date, name, amount, and current category
- **AND** sorts by date descending (newest first)
- **AND** limits display to 10 transactions per page with pagination

#### Scenario: Category dropdown for transaction
- **WHEN** a user clicks on a transaction's category
- **THEN** the system displays a dropdown with all available categories
- **AND** groups categories by parent category
- **AND** highlights the currently selected category
- **AND** allows searching/filtering categories by name

#### Scenario: Confirm transaction category
- **WHEN** a user clicks "Confirm" button for a transaction
- **THEN** the system updates the transaction to is_tagged: true
- **AND** uses optimistic update (removes from list immediately)
- **AND** shows success toast notification
- **AND** reverts on error with error message

#### Scenario: Change and confirm category
- **WHEN** a user changes category and clicks "Confirm"
- **THEN** the system updates both category_id and is_tagged
- **AND** removes transaction from untagged list
- **AND** shows "Categorized as [Category Name]" toast

#### Scenario: Bulk categorization
- **WHEN** a user selects multiple transactions (checkboxes)
- **THEN** the system enables bulk actions toolbar
- **AND** shows "Confirm All" button
- **AND** shows "Categorize All As..." dropdown
- **AND** allows confirming all selected transactions at once

#### Scenario: All transactions tagged
- **WHEN** all transactions are tagged (none remaining)
- **THEN** the system displays "All caught up! No untagged transactions" message
- **AND** shows celebration icon
- **AND** displays last reviewed timestamp

#### Scenario: Untagged transaction pagination
- **WHEN** more than 10 untagged transactions exist
- **THEN** the system displays pagination controls
- **AND** shows "Showing 1-10 of X transactions"
- **AND** allows navigating to next/previous page

### Requirement: Budget Widgets Integration
The system SHALL integrate budget tracking widgets into the analytics dashboard.

#### Scenario: Display budget summary widget
- **WHEN** the analytics dashboard loads
- **THEN** the system displays the budget summary widget
- **AND** shows monthly budget progress for current month
- **AND** shows yearly budget overview
- **AND** shows category-level budget breakdowns
- **AND** uses progress bars and color coding per budget-tracking spec

#### Scenario: Budget widget empty state
- **WHEN** no budgets are configured
- **THEN** the system displays "Set up budgets to track spending" message
- **AND** shows "Budget creation coming soon" note
- **AND** provides link to learn about budgets

### Requirement: Goal Widgets Integration
The system SHALL integrate goal tracking widgets into the analytics dashboard.

#### Scenario: Display goals widget
- **WHEN** the analytics dashboard loads
- **THEN** the system displays the goals widget
- **AND** shows all active savings goals with progress bars
- **AND** displays estimated completion dates
- **AND** shows goal achievement status per goal-tracking spec

#### Scenario: Goal widget empty state
- **WHEN** no goals are configured
- **THEN** the system displays "Set savings goals to track progress" message
- **AND** shows "Goal creation coming soon" note
- **AND** provides link to learn about savings goals

### Requirement: Widget Loading States
All analytics widgets SHALL display appropriate loading states during data fetching.

#### Scenario: Initial dashboard load
- **WHEN** the analytics dashboard is first loaded
- **THEN** each widget displays a skeleton loading placeholder
- **AND** widgets load data independently (not blocking each other)
- **AND** widgets appear as data becomes available
- **AND** the page remains interactive during loading

#### Scenario: Widget refresh
- **WHEN** a user triggers data refresh for a widget
- **THEN** the system displays a loading overlay on that widget
- **AND** keeps existing data visible (stale-while-revalidate)
- **AND** updates the widget when new data arrives

### Requirement: Widget Error Handling
Analytics widgets SHALL handle errors gracefully and allow recovery.

#### Scenario: Widget data fetch error
- **WHEN** a widget fails to load data due to API error
- **THEN** the system displays an error message in that widget
- **AND** shows "Unable to load data" with error reason
- **AND** provides a "Retry" button
- **AND** logs the error for debugging
- **AND** does not affect other widgets

#### Scenario: Chart rendering error
- **WHEN** a chart fails to render due to invalid data or library error
- **THEN** the system catches the error with error boundary
- **AND** displays "Unable to display chart" message
- **AND** provides fallback to tabular data view
- **AND** logs the error

### Requirement: Analytics Data Aggregation
The system SHALL provide efficient data aggregation for analytics calculations.

#### Scenario: Calculate cash flow summary
- **WHEN** computing cash flow for a date range
- **THEN** the system queries transactions filtered by date range
- **AND** separates income (negative amounts) and expenses (positive amounts)
- **AND** sums each category
- **AND** calculates net: income - expenses
- **AND** returns aggregated data to frontend

#### Scenario: Aggregate transactions by time period
- **WHEN** generating line chart data
- **THEN** the system groups transactions by day, week, or month based on range
- **AND** calculates income total and expense total for each period
- **AND** fills missing periods with zero values (for continuous line)
- **AND** returns array of data points sorted by date

#### Scenario: Performance optimization for large datasets
- **WHEN** aggregating > 1000 transactions
- **THEN** the system uses streaming/chunking approach
- **AND** limits result set to necessary fields only
- **AND** caches aggregation results for 5 minutes
- **AND** returns results within 2 seconds

### Requirement: Analytics Dashboard Navigation
The system SHALL provide navigation between the main dashboard and analytics dashboard.

#### Scenario: Navigate from main dashboard
- **WHEN** a user is on the main dashboard at /dashboard
- **THEN** the system displays a "View Analytics" button or link
- **AND** clicking it navigates to /analytics
- **AND** preserves user session and account state

#### Scenario: Navigate to main dashboard from analytics
- **WHEN** a user is on the analytics dashboard
- **THEN** the system provides a "Back to Dashboard" link or breadcrumb
- **AND** clicking it navigates to /dashboard
- **AND** preserves all data states

#### Scenario: Direct navigation to analytics
- **WHEN** a user navigates directly to /analytics via URL
- **THEN** the system loads the analytics dashboard if user has connected accounts
- **AND** redirects to /connect if no accounts connected
- **AND** redirects to / (landing) if not in an authenticated state (future enhancement)

### Requirement: Analytics Dashboard Refresh
The system SHALL provide manual refresh capability for analytics data.

#### Scenario: Global refresh button
- **WHEN** a user clicks "Refresh All" button on analytics dashboard
- **THEN** the system triggers transaction sync from Plaid
- **AND** invalidates all widget data caches
- **AND** reloads all widgets with fresh data
- **AND** displays global loading indicator during refresh
- **AND** shows "Last updated: just now" after completion

#### Scenario: Individual widget refresh
- **WHEN** a user clicks a widget's refresh icon
- **THEN** the system reloads data for that widget only
- **AND** displays loading state for that widget
- **AND** updates the widget when data is fetched

### Requirement: Chart Color Themes
All charts SHALL use consistent color theming aligned with application design.

#### Scenario: Income/expense color coding
- **WHEN** displaying income and expense data
- **THEN** the system uses green shades for income
- **AND** uses red/orange shades for expenses
- **AND** uses blue for neutral/informational data
- **AND** ensures colors meet WCAG AA contrast requirements

#### Scenario: Budget status color coding
- **WHEN** displaying budget progress
- **THEN** the system uses green for on_track status
- **AND** uses yellow for warning status
- **AND** uses red for exceeded status
- **AND** uses gray for no_budget/inactive

#### Scenario: Goal status color coding
- **WHEN** displaying goal progress
- **THEN** the system uses green for ahead and completed status
- **AND** uses blue for on_track status
- **AND** uses yellow/red for behind status

### Requirement: Responsive Widget Layout
The analytics dashboard SHALL be responsive across different screen sizes.

#### Scenario: Desktop layout (>= 1024px)
- **WHEN** the dashboard is viewed on desktop
- **THEN** the system displays widgets in a 2-3 column grid
- **AND** shows full-size charts
- **AND** displays all widgets simultaneously

#### Scenario: Tablet layout (768px - 1023px)
- **WHEN** the dashboard is viewed on tablet
- **THEN** the system displays widgets in 1-2 column grid
- **AND** adjusts chart sizes proportionally
- **AND** maintains interactivity

#### Scenario: Mobile layout (< 768px)
- **WHEN** the dashboard is viewed on mobile
- **THEN** the system stacks widgets in a single column
- **AND** shows simplified charts with touch-friendly controls
- **AND** allows horizontal scrolling for wide charts
- **AND** prioritizes most important widgets at top

