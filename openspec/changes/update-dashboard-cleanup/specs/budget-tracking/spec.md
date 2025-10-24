# Budget Tracking Specification (Delta)

## MODIFIED Requirements

### Requirement: Budget Widget Display
The budget widget SHALL display budget summaries with visual progress indicators and support multiple display contexts including analytics view and dashboard view.

#### Scenario: Dashboard display mode
- **WHEN** budget widget is displayed on the dashboard page (not in analytics view)
- **THEN** the widget title displays as "Budgets"
- **AND** the widget styling matches other dashboard sections
- **AND** the widget shows budget progress with visual indicators
- **AND** clicking on a budget navigates to the budget management page

#### Scenario: Analytics view exclusion
- **WHEN** user views the analytics view
- **THEN** the budget widget is not displayed
- **AND** only transaction lists and cash flow visualizations are shown


