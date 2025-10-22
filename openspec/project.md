# Project Context

## Purpose
A full-stack personal finance application that connects to banks/credit cards via Plaid, allowing transaction auditing, categorization, and budget management. The application runs locally with data import/export capabilities, keeping all financial data on the user's machine with no cloud dependencies.

## Tech Stack

### Frontend
- **Framework**: React 18+ with Vite
- **Package Manager**: pnpm
- **Language**: TypeScript
- **UI Library**: DaisyUI (Tailwind-based, no dependencies)
- **Data Fetching**: TanStack Query (React Query) for server state management
- **State Management**: React hooks (useState/useContext) - keeping it simple
- **Charting**: Recharts or Chart.js for budget visualizations
- **Date Handling**: date-fns
- **Routing**: React Router v6
- **Validation**: Zod for runtime validation

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: LowDB (JSON-based file storage for local-first architecture)
- **Plaid SDK**: plaid-node (official SDK)
- **Environment**: Plaid Sandbox mode initially (Development mode for real bank testing later)
- **Validation**: Zod for runtime validation

### Shared
- **Language**: TypeScript throughout (share types between frontend/backend)
- **Workspace**: pnpm workspaces for monorepo structure

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled, prefer explicit types over `any`
- **Naming Conventions**:
  - Components: PascalCase (e.g., `TransactionList.tsx`)
  - Files: kebab-case for utilities, PascalCase for components
  - Variables/functions: camelCase
  - Constants: UPPER_SNAKE_CASE for true constants
  - Database fields: snake_case (e.g., `plaid_account_id`)
  - API endpoints: kebab-case (e.g., `/api/transactions/bulk-categorize`)
- **Imports**: Prefer named exports, group imports (external → internal → relative)
- **Comments**: Document complex logic, API contracts, and business rules

### Architecture Patterns
- **Monorepo Structure**: Separate packages for frontend, backend, and shared types
- **Local-First**: All data stored locally in JSON files via LowDB
- **API Design**: RESTful endpoints with consistent patterns
- **Component Structure**:
  - Feature-based folders (Dashboard, Transactions, Budgets, PlaidLink, Layout)
  - Separate hooks directory for custom React hooks
  - Shared types in dedicated types directory
- **State Management**: 
  - TanStack Query for server state (caching, background refetching)
  - React hooks for local UI state
  - No complex state management (Redux, Zustand) unless proven necessary
- **Data Flow**:
  1. User connects bank via Plaid Link → Frontend receives public_token
  2. Frontend sends public_token to backend → Backend exchanges for access_token
  3. Backend stores access_token (encrypted) and fetches initial transactions
  4. Frontend displays transactions with categories
  5. User categorizes/creates budgets → Stored via LowDB
  6. Analytics computed on-demand from transaction data
- **Performance**:
  - TanStack Query for caching and background refetching
  - Virtual scrolling for long transaction lists
  - LowDB keeps data in memory with async file writes
  - Lazy load charts/analytics components

### Testing Strategy
- **Future Implementation**: Tests not required for MVP but follow these patterns:
  - Unit tests for business logic and utilities
  - Integration tests for API endpoints
  - Component tests for complex UI interactions
  - E2E tests for critical user flows (Plaid connection, transaction categorization)

### Git Workflow
- **Branching**: Feature branches from main
- **Commits**: Descriptive commit messages, atomic commits
- **Never**: Force push to main/master, skip hooks without explicit request

## Domain Context

### Financial Concepts
- **Accounts**: Bank accounts or credit cards connected via Plaid
  - Types: checking, credit, savings
  - Track: current balance, available balance, mask (last 4 digits)
- **Transactions**: Individual purchases, deposits, or transfers
  - Can be from Plaid API or manually entered (cash purchases)
  - States: pending vs. posted
  - Always associated with a category
- **Categories**: Hierarchical grouping of transactions
  - Default categories: Housing, Transportation, Food, Entertainment, Shopping, Healthcare, Financial, Income, Uncategorized
  - Users can create custom categories
  - Support parent-child relationships (subcategories)
- **Budgets**: Monthly spending limits per category
  - Track spent vs. budgeted amounts
  - Visual alerts when approaching/exceeding limits
  - Optional rollover of unused budget
- **Categorization Rules**: Pattern-based auto-categorization
  - Example: "Starbucks" → Coffee category
  - Applied automatically to new transactions

### User Workflows
1. **Account Connection**: Use Plaid Link to authenticate and connect bank accounts
2. **Transaction Review**: View, search, filter, and manually categorize transactions
3. **Budget Creation**: Set monthly spending limits per category
4. **Budget Tracking**: Monitor spending against budgets with visual indicators
5. **Analytics Review**: View spending trends, category breakdowns, and summaries
6. **Data Management**: Export, import, backup, and reset data

## Important Constraints

### Security
- **Plaid Tokens**: Access tokens MUST be encrypted in database
- **API Keys**: Use environment variables, never expose to frontend
- **Secrets**: Never commit Plaid client_id/secret to version control
- **Rate Limiting**: Implement on all API endpoints
- **Input Validation**: Validate all inputs with Zod on backend and frontend

### Technical
- **Local-Only**: All data stays on user's machine, no cloud storage
- **Plaid Sandbox**: Start with test credentials, move to Development environment for real testing
- **Database**: JSON-based storage with LowDB (consider SQLite for future scalability)
- **Performance**: Optimize for transaction lists up to 10,000+ items
- **Compatibility**: Support modern browsers (Chrome, Firefox, Safari, Edge)

### Business
- **Supported Institutions**: Focus on Canadian banks (EQ Bank, TD) and American Express initially
- **Currency**: Start with single currency (CAD or USD), multi-currency for later
- **Data Ownership**: User owns all data, easy export/import capabilities
- **Privacy**: No analytics, tracking, or data sharing

## External Dependencies

### Plaid API
- **Purpose**: Bank account connection and transaction sync
- **Environment**: Sandbox → Development → Production
- **Authentication**: Client ID + Secret
- **Key Endpoints**:
  - Link token creation (initiate connection flow)
  - Public token exchange (get access token)
  - Transactions sync
  - Accounts fetch
  - Institution metadata
- **Rate Limits**: Follow Plaid's sandbox/development limits
- **Credentials**: Stored in environment variables
- **Documentation**: https://plaid.com/docs/

### DaisyUI
- **Purpose**: Tailwind CSS component library for UI
- **Version**: Latest stable
- **Theme Support**: Light/dark mode built-in
- **No Dependencies**: Pure CSS components

### TanStack Query (React Query)
- **Purpose**: Server state management, caching, and data fetching
- **Benefits**: Automatic background refetching, cache invalidation, loading states
- **Usage**: Wrap all API calls in query/mutation hooks
