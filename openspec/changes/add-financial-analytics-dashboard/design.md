# Design: Financial Analytics Dashboard

## Context
The application currently has basic Plaid integration for account connection but lacks transaction management and financial insights. Users need to understand their spending patterns, track budgets, and work toward financial goals. This design covers the data models, API contracts, and technical decisions for implementing a comprehensive analytics dashboard with multiple widget types.

Key constraints:
- Local-first architecture with LowDB (JSON file storage)
- All financial data must be encrypted at rest
- Support for 10,000+ transactions with acceptable performance
- Use existing Plaid integration for transaction sync
- Simple, maintainable code following project conventions

## Goals / Non-Goals

### Goals
- Enable users to visualize cash flow (in vs out) with circle and line charts
- Provide transaction categorization and tagging workflow
- Display budget tracking with progress indicators (viewing only in this phase)
- Show savings goal progress with estimated completion dates (viewing only in this phase)
- Store all financial data encrypted in LowDB
- Sync transactions from Plaid automatically
- Support date range filtering for time-series visualizations
- Handle pending vs posted transaction states
- Maintain good performance with thousands of transactions

### Non-Goals
- Budget creation UI (defer to future change)
- Goal creation UI (defer to future change)
- Transaction editing/deletion (read-only from Plaid in this phase)
- Multi-currency support (single currency for now)
- Transaction reconciliation with manual entries
- Advanced filtering/search (basic filtering only)
- Data export/import (defer to future change)
- Mobile responsive charts (desktop-first)

## Decisions

### Decision 1: Data Model Structure
**Choice**: Use normalized relational-style schema in LowDB with separate collections.

**Rationale**:
- Transactions, categories, budgets, and goals have clear relationships
- Normalized structure prevents data duplication
- Easier to query and update individual entities
- Follows SQL-like patterns that are well understood

**Schema**:
```typescript
// plaid_items collection (existing)
interface PlaidItem {
  id: string;
  access_token_encrypted: string;
  item_id: string;
  institution_id: string;
  institution_name: string;
  created_at: string;
  updated_at: string;
}

// accounts collection (existing)
interface Account {
  id: string;
  plaid_account_id: string;
  plaid_item_id: string;
  name: string;
  official_name: string;
  type: string; // 'depository' | 'credit' | 'loan' | 'investment'
  subtype: string;
  mask: string;
  current_balance: number;
  available_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// categories collection (NEW)
interface Category {
  id: string;
  name: string;
  parent_id: string | null; // for subcategories
  color: string; // hex color for charts
  icon: string; // icon name
  is_system: boolean; // true for default categories
  created_at: string;
  updated_at: string;
}

// transactions collection (NEW)
interface Transaction {
  id: string;
  plaid_transaction_id: string;
  account_id: string;
  date: string; // ISO date
  authorized_date: string | null;
  amount: number; // negative for credits, positive for debits
  name: string;
  merchant_name: string | null;
  category_id: string;
  is_tagged: boolean; // false until user confirms category
  is_pending: boolean;
  payment_channel: string; // 'online', 'in store', etc.
  created_at: string;
  updated_at: string;
}

// budgets collection (NEW)
interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'yearly';
  start_date: string; // ISO date
  end_date: string | null; // null for ongoing
  created_at: string;
  updated_at: string;
}

// goals collection (NEW)
interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // ISO date
  created_at: string;
  updated_at: string;
}
```

**Alternatives considered**:
- Embedded documents (denormalized): Would duplicate category data in every transaction, harder to update
- Single collection with all data: Would be messy and hard to query efficiently

### Decision 2: Transaction Sync Strategy
**Choice**: Use Plaid Transactions Sync API endpoint with cursor-based pagination.

**Rationale**:
- Transactions Sync API is Plaid's recommended approach (newer than Transactions Get)
- Cursor-based pagination handles large transaction sets efficiently
- Returns added, modified, and removed transactions
- Automatically handles pending → posted state transitions
- Supports incremental sync (only fetch new transactions)

**Implementation**:
```typescript
// Backend service method
async syncTransactions(itemId: string) {
  const item = await db.getPlaidItem(itemId);
  const accessToken = decrypt(item.access_token_encrypted);
  
  let cursor = item.transactions_cursor || null;
  let hasMore = true;
  
  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor,
    });
    
    // Process added transactions
    for (const tx of response.added) {
      await db.upsertTransaction(transformTransaction(tx));
    }
    
    // Process modified transactions
    for (const tx of response.modified) {
      await db.updateTransaction(transformTransaction(tx));
    }
    
    // Process removed transactions
    for (const txId of response.removed) {
      await db.deleteTransaction(txId);
    }
    
    hasMore = response.has_more;
    cursor = response.next_cursor;
  }
  
  // Save cursor for next sync
  await db.updatePlaidItem(itemId, { transactions_cursor: cursor });
}
```

**Alternatives considered**:
- Transactions Get API: Older approach, requires date range management
- Polling interval: Would miss real-time updates, decided to trigger sync on dashboard load

### Decision 3: Chart Library Selection
**Choice**: Use Recharts for all visualizations.

**Rationale**:
- React-native component architecture fits project patterns
- Good TypeScript support
- Responsive out of the box
- Built on D3 but with simpler API
- No Canvas rendering issues
- Good documentation and examples
- Lightweight (~50kb gzipped)

**Chart Components**:
- Circle graph (PieChart): For yearly cash flow in vs out
- Line graph (LineChart): For monthly cash flow with date ranges
- Bar charts (BarChart): For budget progress
- Progress bars (custom): For goal tracking

**Alternatives considered**:
- Chart.js: Canvas-based, less React-friendly, requires wrappers
- Victory: Heavier bundle size, more complex API
- Nivo: Good but overkill for our needs

### Decision 4: Category Assignment & Tagging
**Choice**: Two-phase categorization with default categories and user confirmation.

**Rationale**:
- Plaid provides category hints but they're not always accurate
- Users need control over categorization for budgeting
- Untagged transactions provide a review workflow
- System starts with sensible defaults

**Flow**:
1. Transaction synced from Plaid with Plaid's category
2. Backend maps Plaid category to system category (best guess)
3. Transaction saved with `is_tagged: false`
4. User sees transaction in "Untagged Transactions" widget
5. User confirms or changes category
6. Transaction marked as `is_tagged: true`
7. Optional: Create categorization rule for similar transactions

**Default Categories**:
- Income (Paycheck, Interest, Refunds)
- Housing (Rent, Mortgage, Utilities, Maintenance)
- Transportation (Gas, Parking, Transit, Car Payment)
- Food (Groceries, Dining Out, Coffee)
- Shopping (Clothing, Electronics, General)
- Entertainment (Streaming, Events, Hobbies)
- Healthcare (Insurance, Medical, Pharmacy)
- Financial (Fees, Transfers, Investments)
- Uncategorized (fallback)

**Alternatives considered**:
- Fully automatic categorization: Reduces user control, less accurate
- Manual-only categorization: Too much work for users
- Machine learning: Overkill for MVP, adds complexity

### Decision 5: Data Encryption Approach
**Choice**: Reuse existing encryption service for all financial data.

**Rationale**:
- Consistent with Plaid token encryption
- Encryption key already managed via environment variable
- Simple API: `encrypt(data)` and `decrypt(data)`
- Transparent to LowDB queries (encrypt before write, decrypt after read)

**Scope**:
- Transactions: Encrypt entire transaction object
- Budgets: Encrypt entire budget object
- Goals: Encrypt entire goal object
- Categories: Not encrypted (system data, not sensitive)
- Accounts: Already encrypted in existing implementation

**Performance consideration**:
- Encryption adds ~1-2ms per operation
- Acceptable for < 10,000 records
- If performance becomes issue, consider selective field encryption

**Alternatives considered**:
- No encryption: Violates security requirements
- Selective field encryption: More complex, harder to maintain
- Database-level encryption: LowDB doesn't support this natively

### Decision 6: Budget and Goal Viewing (Creation Deferred)
**Choice**: Display budgets and goals in read-only mode; defer creation UI to future change.

**Rationale**:
- Budget and goal creation require complex forms and validation
- Viewing is simpler and provides immediate value
- Can pre-populate budgets via database seed for demo/testing
- Keeps this change focused on analytics and visualization
- Reduces scope and implementation time

**Approach**:
- Backend implements full CRUD APIs for budgets and goals
- Frontend only implements GET/list operations
- POST/PUT/DELETE endpoints tested but UI deferred
- Placeholder message: "Budget and goal creation coming soon"

**Alternatives considered**:
- Implement creation in this change: Too much scope, delays analytics value
- Don't implement budgets/goals at all: Would make analytics incomplete

## Risks / Trade-offs

### Risk 1: LowDB Performance with Large Transaction Sets
**Risk**: LowDB loads entire database into memory; 10,000+ transactions may cause slowness.

**Mitigation**:
- Implement pagination on transaction list endpoint
- Cache transaction aggregations (cash flow summaries) in memory
- Use date range filters to limit query scope
- Monitor performance; if issues arise, consider SQLite migration
- Virtual scrolling on transaction lists in frontend

**Trade-off**: Simplicity of LowDB vs. scalability of SQL database. Choosing simplicity for MVP.

### Risk 2: Plaid Transaction Sync Reliability
**Risk**: Plaid API may fail or return incomplete data.

**Mitigation**:
- Implement retry logic with exponential backoff
- Store sync errors in database for debugging
- Display sync status to user with last successful sync time
- Gracefully degrade (show old data) if sync fails
- Add manual "Refresh" button in UI

**Trade-off**: Real-time accuracy vs. reliability. Choosing eventual consistency with manual refresh option.

### Risk 3: Category Mapping Accuracy
**Risk**: Plaid category → system category mapping may be inaccurate.

**Mitigation**:
- Conservative mapping (prefer "Uncategorized" over wrong category)
- User review workflow for all transactions initially
- Learn from user corrections (future enhancement: categorization rules)
- Allow bulk categorization in UI

**Trade-off**: Automation vs. accuracy. Choosing accuracy with semi-manual workflow.

### Risk 4: Chart Performance with Large Datasets
**Risk**: Rendering 12 months of daily transactions may be slow.

**Mitigation**:
- Aggregate data on backend (daily/weekly/monthly rollups)
- Limit chart data points (max 365 for daily, 52 for weekly)
- Lazy load charts (render only visible widgets)
- Use React.memo and useMemo for chart components
- Implement data sampling for very large ranges

**Trade-off**: Data granularity vs. performance. Choosing aggregation with configurable granularity.

## Migration Plan

### Phase 1: Backend Foundation (Tasks 1.1-1.6)
1. Add database schemas for categories, transactions, budgets, goals
2. Seed default categories
3. Implement encryption for new entities
4. Create API endpoints for all CRUD operations
5. Implement Plaid transaction sync service
6. Add rate limiting and validation

**Validation**: Test APIs with Postman, verify encryption, test sync with Plaid sandbox

### Phase 2: Transaction Management (Tasks 2.1-2.4)
1. Create transaction list component
2. Implement untagged transactions widget
3. Add category assignment UI
4. Create transaction detail view

**Validation**: Verify transactions display correctly, test tagging workflow

### Phase 3: Analytics Widgets (Tasks 3.1-3.5)
1. Add Recharts library
2. Implement cash flow circle chart (yearly)
3. Implement cash flow line chart (monthly with date range)
4. Create budget progress widgets (read-only)
5. Create goal tracking widgets (read-only)

**Validation**: Verify charts render with sample data, test date range filtering

### Phase 4: Dashboard Integration (Tasks 4.1-4.3)
1. Create analytics dashboard layout
2. Add navigation from main dashboard
3. Implement widget grid/layout system
4. Add loading states and error handling

**Validation**: End-to-end test: connect bank → sync transactions → view analytics

### Rollback Plan
- All changes are additive (new routes, components, database collections)
- No breaking changes to existing code
- Rollback: Remove new routes from App.tsx, delete new collections
- Existing functionality (landing, connect, basic dashboard) unaffected

## Open Questions

1. **Chart date range defaults**: What should the default date range be for cash flow line chart? Last 30 days? Last 3 months? Current month?
   - **Proposal**: Default to current month, with quick filters (30 days, 3 months, 6 months, 1 year, All time)

2. **Category hierarchy depth**: Should we support multi-level subcategories or just parent-child?
   - **Proposal**: Two levels only (parent and child) to keep UI simple

3. **Budget period handling**: For monthly budgets, how do we handle different month lengths and overlapping periods?
   - **Proposal**: Budget period is calendar month (1st to last day), stored as start_date + period type

4. **Goal current_amount**: Should this be manually updated by user or automatically calculated from account balances?
   - **Proposal**: Manual for MVP, automatic calculation added in future change

5. **Transaction categorization rules**: Should we auto-create rules when user categorizes transactions?
   - **Proposal**: Not in this phase, defer to future "categorization rules" feature

## Summary

This design establishes a comprehensive financial analytics system with:
- Normalized data models for transactions, categories, budgets, and goals
- Plaid Transactions Sync for automatic transaction retrieval
- Recharts for visualization components
- Two-phase categorization with user confirmation
- Encryption for all financial data
- Read-only budget and goal viewing (creation deferred)

The approach prioritizes simplicity, security, and maintainability while providing immediate value through analytics visualizations. Performance considerations are addressed through aggregation, pagination, and caching strategies.

