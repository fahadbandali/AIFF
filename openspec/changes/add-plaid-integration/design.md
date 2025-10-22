# Plaid Integration Design

## Context
This change introduces bank account connectivity using Plaid, a third-party financial data aggregation service. Plaid provides OAuth-based authentication for 11,000+ financial institutions and standardized APIs for account data and transactions. This is a foundational feature for the personal finance app - users cannot access core functionality without connecting at least one bank account.

**Background:**
- Plaid operates in three environments: Sandbox (test data), Development (real bank, limited users), Production (full access)
- OAuth flow: Frontend receives link_token → Opens Plaid Link UI → User authenticates → Frontend receives public_token → Backend exchanges for access_token
- Access tokens must be stored securely as they provide ongoing access to user's financial data
- Rate limits in Sandbox: 100 requests/minute per endpoint

**Constraints:**
- Local-first architecture: All data stored in LowDB (JSON files)
- No cloud storage or external database
- Must work offline after initial sync
- Security critical: Access tokens enable full account access

**Stakeholders:**
- End users: Need secure, simple bank connection flow
- Developers: Need clear API contracts and error handling

## Goals / Non-Goals

**Goals:**
- Implement complete Plaid OAuth flow from landing page to dashboard
- Securely store Plaid access tokens with encryption at rest
- Fetch and persist account data (name, type, balance, mask)
- Create reusable Plaid service layer for future transaction syncing
- Provide clear user feedback during connection process
- Handle common error scenarios gracefully

**Non-Goals:**
- Transaction syncing implementation (separate change)
- Multi-account management UI (only basic list view)
- Account disconnection/reconnection (future feature)
- Webhook handling for real-time updates (future feature)
- Production Plaid environment setup (staying in Sandbox for now)

## Decisions

### Decision 1: Use Official Plaid SDKs
**Choice:** Use `plaid` (Node.js) and `react-plaid-link` (React) official libraries

**Why:**
- Maintained by Plaid, guaranteed compatibility with API changes
- Handle OAuth flow complexities automatically
- Include TypeScript definitions
- Well-documented with examples

**Alternatives considered:**
- Build custom Plaid API integration → Rejected: Too complex, error-prone, poor maintenance
- Use third-party Plaid wrappers → Rejected: No significant benefits over official SDKs

### Decision 2: Token Storage with Encryption
**Choice:** Store access tokens in LowDB with AES-256-GCM encryption

**Why:**
- Access tokens are sensitive credentials (full account access)
- Local storage means no cloud security, encryption is critical
- AES-256-GCM is industry standard, available in Node.js crypto module
- Decryption only happens in-memory when making Plaid API calls

**Implementation:**
```typescript
// Encryption key from environment variable
const ENCRYPTION_KEY = process.env.PLAID_ENCRYPTION_KEY; // 32-byte hex string

// Store encrypted
const encryptedToken = encrypt(accessToken, ENCRYPTION_KEY);
db.plaid_items.push({ item_id, access_token: encryptedToken });

// Retrieve and decrypt
const decryptedToken = decrypt(item.access_token, ENCRYPTION_KEY);
```

**Alternatives considered:**
- Plain text storage → Rejected: Security risk if database file exposed
- OS keychain (macOS Keychain, Windows Credential Manager) → Rejected: Cross-platform complexity, not aligned with simple JSON storage

### Decision 3: Database Schema
**Choice:** Two tables approach: `plaid_items` (Plaid connection metadata) and `accounts` (individual bank accounts)

**Schema:**
```typescript
// plaid_items
{
  id: string;                    // UUID
  item_id: string;               // Plaid item_id
  access_token: string;          // Encrypted access token
  institution_id: string;        // Plaid institution_id
  institution_name: string;      // "TD Bank", "Chase", etc.
  created_at: string;            // ISO timestamp
  last_sync: string;             // ISO timestamp
}

// accounts
{
  id: string;                    // UUID
  plaid_item_id: string;         // FK to plaid_items
  plaid_account_id: string;      // Plaid's account_id
  name: string;                  // "Plaid Checking"
  official_name: string | null;  // "Plaid Gold Standard 0% Interest Checking"
  type: string;                  // "depository", "credit", "loan"
  subtype: string;               // "checking", "savings", "credit card"
  mask: string;                  // Last 4 digits: "0000"
  current_balance: number;       // Current balance
  available_balance: number | null; // Available balance
  currency: string;              // "USD", "CAD"
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Why:**
- Follows Plaid's data model: One item (connection) → Multiple accounts
- Enables future multi-account management per institution
- Separates authentication data (access_token) from account data
- Normalized: Easier to update balances without touching access tokens

**Alternatives considered:**
- Single table with account data duplicating item metadata → Rejected: Denormalized, harder to update
- Store access token per account → Rejected: Misaligns with Plaid's model (one token → many accounts)

### Decision 4: API Endpoint Structure
**Choice:** Three backend endpoints for Plaid flow

```
POST /api/plaid/link-token        → Generate link token for Plaid Link
POST /api/plaid/exchange-token    → Exchange public token for access token
GET  /api/plaid/accounts          → Sync and return accounts for item
```

**Why:**
- Mirrors Plaid OAuth flow steps clearly
- Separates concerns: token generation, token exchange, data retrieval
- RESTful design, easy to understand and test
- Aligns with future transaction endpoints

**Alternatives considered:**
- Single `/api/plaid/connect` endpoint handling entire flow → Rejected: Too coarse, harder to debug, poor separation of concerns
- Include account fetching in token exchange → Rejected: Violates single responsibility, makes token exchange slow

### Decision 5: Frontend Flow Architecture
**Choice:** Step-based routing with React Query for state management

**Flow:**
1. Landing page → Click "Get Started" → Navigate to `/connect`
2. Connect page → Fetch link_token → Initialize Plaid Link
3. User authenticates → Plaid Link returns public_token
4. Exchange public_token via mutation → Store access_token
5. Fetch accounts via query
6. Navigate to `/dashboard`

**Why:**
- Clear user journey with explicit steps
- React Query handles loading/error states automatically
- Easy to add intermediate steps (e.g., "Syncing accounts...")
- Enables back button support and deep linking

**Alternatives considered:**
- Modal-based flow on landing page → Rejected: Harder to manage state, no URL-based navigation
- Single-page flow with steps → Rejected: Doesn't leverage React Router, worse UX for errors

### Decision 6: Error Handling Strategy
**Choice:** Three-tier error handling: User-facing messages, logging, graceful degradation

**Tiers:**
1. **User-facing:** Display friendly error messages with actionable next steps
   - "Connection failed. Please try again." with retry button
   - "Invalid credentials. Please check your login." (from Plaid error codes)
2. **Logging:** Console errors in development with full error details
3. **Graceful degradation:** Allow users to exit flow and return to landing page

**Implementation:**
```typescript
// Frontend mutation error handling
onError: (error) => {
  const message = mapPlaidError(error); // User-friendly message
  console.error('Plaid error:', error); // Dev logging
  setErrorMessage(message);
  setShowRetry(true);
}

// Backend error mapping
function mapPlaidError(plaidError: PlaidError): string {
  switch (plaidError.error_code) {
    case 'INVALID_CREDENTIALS': return 'Invalid bank credentials...';
    case 'ITEM_LOGIN_REQUIRED': return 'Please log in to your bank...';
    default: return 'Connection failed. Please try again.';
  }
}
```

**Why:**
- Reduces user frustration with clear error messages
- Enables debugging in development
- Prevents users from getting stuck in error states

**Alternatives considered:**
- Generic error messages only → Rejected: Poor UX, users don't know what went wrong
- No error mapping → Rejected: Exposes Plaid internals, confusing for users

## Risks / Trade-offs

### Risk 1: Plaid Sandbox Limitations
**Risk:** Sandbox provides fake data, doesn't test real bank integrations

**Mitigation:**
- Clearly document Sandbox limitations in README
- Plan transition to Development environment for real bank testing
- Test error scenarios explicitly in Sandbox
- Validate OAuth flow logic independent of data quality

**Trade-off:** Sandbox is free and sufficient for initial development; production-like testing comes later

### Risk 2: Access Token Security
**Risk:** Encrypted tokens in JSON files less secure than dedicated secrets management

**Mitigation:**
- Use AES-256-GCM encryption (industry standard)
- Require 32-byte encryption key in environment variable
- Document key management in README (user responsible for securing .env)
- Never log decrypted tokens
- Consider OS keychain integration in future for enhanced security

**Trade-off:** Balances security with local-first architecture; enhanced security possible later without breaking changes

### Risk 3: Link Token Expiration
**Risk:** Link tokens expire after 30 minutes, causing errors if user delays

**Mitigation:**
- Fetch link token on-demand when Connect page loads (not proactively)
- Implement automatic retry on expiration error
- Show clear error message if token expires mid-flow
- Regenerate token automatically in error handler

**Trade-off:** Slight UX delay for token generation vs. complex token lifecycle management

### Risk 4: Rate Limiting
**Risk:** Sandbox has 100 req/min limit; development/testing could hit limits

**Mitigation:**
- Implement exponential backoff for Plaid API calls
- Add rate limiting middleware to backend endpoints
- Cache link tokens for 20 minutes if possible (avoid regeneration)
- Log rate limit errors clearly

**Trade-off:** Added complexity for rate limit handling vs. risk of blocking users during testing

## Migration Plan

**N/A** - This is a new feature with no existing data to migrate.

**Rollout Steps:**
1. Merge and deploy backend endpoints
2. Merge and deploy frontend components
3. Test end-to-end in Sandbox environment
4. Document Plaid account setup in README
5. (Future) Apply for Plaid Development environment
6. (Future) Test with real bank accounts

**Rollback Plan:**
- Remove Plaid routes from frontend (revert to landing page only)
- Remove backend endpoints (non-breaking, no dependencies yet)
- No database migration needed (new tables only)

## Open Questions

1. **How should we handle multiple bank accounts from the same institution?**
   - Current plan: Display all in simple list
   - Future: Group by institution in UI

2. **What happens if user exits Plaid Link without connecting?**
   - Current plan: Return to connect page with "Try again" option
   - Future: Add "Skip for now" option with manual data entry

3. **Should we sync transactions immediately after connection?**
   - Current plan: Yes, fetch last 30 days of transactions during account sync
   - Rationale: Provides immediate value, user sees data on dashboard
   - Deferred: Full transaction management UI is separate change

4. **How do we handle Plaid API downtime?**
   - Current plan: Show error message, allow retry
   - Future: Add status page check, show Plaid service status

5. **Should we store institution logos/branding?**
   - Current plan: No, use generic icons for MVP
   - Future: Fetch from Plaid's institution metadata API

