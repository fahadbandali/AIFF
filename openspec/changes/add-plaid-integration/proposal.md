# Add Plaid Integration

## Why
Users need to connect their bank accounts to import transactions automatically. Plaid provides secure OAuth-based bank account authentication and transaction sync capabilities. This is a core feature of the personal finance application that enables users to move from the landing page to actively managing their finances.

## What Changes
- Add Plaid Link integration to frontend (OAuth flow)
- Create backend API endpoints for link token creation and public token exchange
- Implement secure storage of Plaid access tokens (encrypted)
- Create "Get Started" flow routing from landing page
- Add bank account connection page with Plaid Link UI component
- Implement dashboard with welcome message after successful connection
- Add account management capability to view connected accounts
- Store account and initial transaction data from Plaid API
- Add routing: Landing → Connect Bank → Dashboard

## Impact

### Affected Specs
- `plaid-connection` (new): Bank account connection via Plaid Link
- `dashboard` (new): Welcome dashboard after account connection
- `account-management` (new): Viewing and managing connected bank accounts

### Affected Code
- Frontend:
  - `src/App.tsx`: Add routes for connect and dashboard pages
  - `src/components/PlaidLink/`: New component directory for Plaid Link UI
  - `src/components/Dashboard/`: New component directory for dashboard
  - New React Query hooks for Plaid API calls
  - Add `react-plaid-link` package dependency
- Backend:
  - `src/routes/plaid.ts`: New route file for Plaid endpoints
  - `src/services/plaid.ts`: Plaid SDK service layer
  - `src/services/encryption.ts`: Token encryption utilities
  - Database schema updates for accounts and access tokens
  - Add `plaid` SDK package dependency
- Configuration:
  - Environment variables for Plaid credentials (PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV)
  - Add encryption key for access token storage

### Security Considerations
- **CRITICAL**: Access tokens MUST be encrypted at rest
- Plaid credentials stored in environment variables only
- Rate limiting on token exchange endpoints
- Input validation with Zod for all API requests

### External Dependencies
- `plaid` (Node.js SDK): Official Plaid client library
- `react-plaid-link` (React): Official Plaid Link component
- Plaid Sandbox environment initially (free tier)

