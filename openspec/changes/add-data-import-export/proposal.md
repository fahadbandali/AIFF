# Add Data Import/Export

## Why
Users need the ability to back up their financial data and migrate it between different instances of the application. Since all data is stored locally, export/import capabilities are essential for data portability, backup, and recovery. This enables users to maintain full control over their financial information and prevents data loss scenarios.

## What Changes
- Add data export API endpoint that returns complete database in JSON format
- Add data import API endpoint that accepts JSON and updates the database
- Create frontend UI for exporting data (download as JSON file)
- Create frontend UI for importing data (file upload with validation)
- Implement data validation to ensure imported data matches database schema
- Add dashboard refresh mechanism to update all views after import
- Ensure exported format is fully compatible with LowDB structure
- Add user confirmations and warnings for destructive import operations
- Implement merge strategy options (replace all, merge, or append only)

## Impact

### Affected Specs
- `data-management` (new): Data export, import, validation, and backup capabilities

### Affected Code
- Backend:
  - `src/routes/data.ts`: New route file for data import/export endpoints
  - `src/services/database.ts`: Add export and import helper methods
  - Database validation utilities for import safety
  - Add Zod schemas for database structure validation
- Frontend:
  - `src/components/Settings/DataManagement.tsx`: New component for import/export UI
  - `src/lib/api.ts`: Add API client methods for export/import
  - Dashboard components: Add refresh mechanism after import
  - React Query cache invalidation after import
- Configuration:
  - Optional environment variable for backup directory path

### Security Considerations
- **CRITICAL**: Plaid access tokens must remain encrypted in export files
- File size limits to prevent DoS attacks on import
- Input validation with Zod to prevent malformed data corruption
- User confirmation required before replacing existing data
- Warning messages for irreversible operations

### Data Format
- Export format: Standard LowDB JSON structure (matches `db.json`)
- File extension: `.json`
- MIME type: `application/json`
- Structure includes all collections: accounts, transactions, categories, budgets, goals, plaid_items
- Timestamps preserved in ISO 8601 format
- Currency codes preserved
- IDs remain unchanged for data integrity

### Merge Strategies
1. **Replace All** (default): Overwrites entire database with imported data
2. **Merge**: Keeps existing records, adds new records, updates matching IDs
3. **Append Only**: Only adds new records, never updates or deletes existing data

### Breaking Changes
None. This is a new capability that doesn't modify existing behavior.

