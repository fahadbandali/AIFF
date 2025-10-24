# Financial Analytics Specification (Delta)

## MODIFIED Requirements

### Requirement: Cash Flow Circle Visualization
The system SHALL provide a yearly cash flow visualization using a circle/donut chart showing income versus expenses with category breakdown toggle, proper text sizing, and no horizontal scrolling.

#### Scenario: Fixed layout and typography
- **WHEN** user views the cash flow circle graph
- **THEN** all amounts are fully visible without horizontal scrolling
- **AND** font sizes are appropriately sized for readability without overwhelming the widget
- **AND** the layout properly contains all content within the widget boundaries

#### Scenario: Category breakdown toggle
- **WHEN** user views the cash flow circle graph in default mode
- **THEN** the graph displays total income and expenses as segments
- **AND** a toggle button is visible to switch between "Summary" and "Categories" view
- **WHEN** user toggles to "Categories" view
- **THEN** the circle graph displays individual expense categories as separate segments
- **AND** each category segment shows the amount spent in that category
- **AND** income remains as a single segment
- **AND** categories are visually distinct with different colors

#### Scenario: Enhanced visual presentation
- **WHEN** user views the cash flow circle graph
- **THEN** percentage values are shown for each segment
- **AND** the center displays net cash flow (income - expenses)
- **AND** visual indicators show whether cash flow is positive or negative
- **AND** a legend clearly identifies income and expense segments (or categories when toggled)

### Requirement: Cash Flow Line Graph
The system SHALL provide a time-based cash flow line graph with date range selection, showing income, expenses, and net cash flow trends over time with improved controls and insights.

#### Scenario: Enhanced date range controls
- **WHEN** user interacts with the cash flow line graph
- **THEN** intuitive date range picker allows selection of time periods
- **AND** common presets (last 30 days, last 90 days, year to date) are available
- **AND** custom date ranges can be selected
- **AND** trend indicators show increase/decrease compared to previous period

#### Scenario: Improved data presentation
- **WHEN** cash flow data is displayed
- **THEN** the graph shows separate lines for income, expenses, and net cash flow
- **AND** summary statistics (average, total, min, max) are displayed
- **AND** tooltips show detailed information on hover
- **AND** the graph handles missing data gracefully


